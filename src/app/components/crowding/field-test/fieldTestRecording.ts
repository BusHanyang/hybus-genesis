export const FIELD_TEST_STORAGE_KEY = 'hybus:crowding-field-test:v1'
export const FIELD_TEST_MAX_ENTRIES = 1500
export const FIELD_TEST_MAX_SERIALIZED_BYTES = 2_000_000

export type FieldTestRecordEntry = {
  readonly at: number
  readonly kind: 'state' | 'network' | 'location' | 'start' | 'stop'
  readonly standingLocation: string
  readonly data: Record<string, unknown>
}

export type FieldTestRecording = {
  readonly schemaVersion: 1
  readonly startedAt: number
  readonly updatedAt: number
  readonly entries: ReadonlyArray<FieldTestRecordEntry>
}

export type FieldTestRecordAppendResult =
  | { accepted: true; record: FieldTestRecording }
  | {
      accepted: false
      record: FieldTestRecording
      reason: 'entry-limit' | 'size-limit' | 'invalid-entry'
    }

const entryKinds = new Set(['state', 'network', 'location', 'start', 'stop'])
const encoder = new TextEncoder()

const isTimestamp = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 8_640_000_000_000_000

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null)

const hasKeys = (value: Record<string, unknown>, keys: string[]): boolean =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

// Limit nesting before recursing into corrupted storage or a cyclic input.
const isJsonValue = (value: unknown, depth = 0): boolean => {
  if (depth > 12) return false
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return true
  }
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) {
    return Array.from(value).every((child) => isJsonValue(child, depth + 1))
  }
  return (
    isObject(value) &&
    Object.getOwnPropertySymbols(value).length === 0 &&
    Object.values(value).every((child) => isJsonValue(child, depth + 1))
  )
}

const isEntry = (value: unknown): value is FieldTestRecordEntry =>
  isObject(value) &&
  hasKeys(value, ['at', 'kind', 'standingLocation', 'data']) &&
  isTimestamp(value.at) &&
  typeof value.kind === 'string' &&
  entryKinds.has(value.kind) &&
  typeof value.standingLocation === 'string' &&
  isObject(value.data) &&
  isJsonValue(value.data)

const isRecording = (value: unknown): value is FieldTestRecording =>
  isObject(value) &&
  hasKeys(value, ['schemaVersion', 'startedAt', 'updatedAt', 'entries']) &&
  value.schemaVersion === 1 &&
  isTimestamp(value.startedAt) &&
  isTimestamp(value.updatedAt) &&
  Array.isArray(value.entries) &&
  value.entries.length <= FIELD_TEST_MAX_ENTRIES &&
  value.entries.every(isEntry)

const fitsStorageLimit = (raw: string): boolean =>
  raw.length <= FIELD_TEST_MAX_SERIALIZED_BYTES &&
  encoder.encode(raw).byteLength <= FIELD_TEST_MAX_SERIALIZED_BYTES

const freezeJson = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(freezeJson)
    Object.freeze(value)
  }
  return value
}

export const createFieldTestRecording = (at: number): FieldTestRecording => {
  if (!isTimestamp(at)) throw new RangeError('Invalid recording timestamp')
  return freezeJson({
    schemaVersion: 1,
    startedAt: at,
    updatedAt: at,
    entries: [],
  } satisfies FieldTestRecording)
}

export const appendFieldTestRecord = (
  record: FieldTestRecording,
  entry: FieldTestRecordEntry,
): FieldTestRecordAppendResult => {
  if (record.entries.length >= FIELD_TEST_MAX_ENTRIES) {
    return { accepted: false, record, reason: 'entry-limit' }
  }

  try {
    if (!isEntry(entry)) {
      return { accepted: false, record, reason: 'invalid-entry' }
    }

    // Snapshot the input so later changes to an observed payload cannot alter it.
    const snapshot = JSON.parse(JSON.stringify(entry)) as FieldTestRecordEntry
    const next: FieldTestRecording = {
      ...record,
      updatedAt: entry.at,
      entries: [...record.entries, snapshot],
    }
    if (!fitsStorageLimit(JSON.stringify(next))) {
      return { accepted: false, record, reason: 'size-limit' }
    }
    return { accepted: true, record: freezeJson(next) }
  } catch {
    return { accepted: false, record, reason: 'invalid-entry' }
  }
}

export const parseFieldTestRecording = (
  raw: string | null,
): FieldTestRecording | null => {
  if (raw === null || !fitsStorageLimit(raw)) return null
  try {
    const value: unknown = JSON.parse(raw)
    return isRecording(value) ? freezeJson(value) : null
  } catch {
    return null
  }
}

export const serializeFieldTestRecording = (
  record: FieldTestRecording,
): string => {
  if (!isRecording(record)) throw new TypeError('Invalid field test recording')
  const raw = JSON.stringify(record)
  if (!fitsStorageLimit(raw)) {
    throw new RangeError('Field test recording exceeds storage limit')
  }
  return raw
}
