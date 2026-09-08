import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appendFieldTestRecord,
  createFieldTestRecording,
  FIELD_TEST_MAX_ENTRIES,
  FIELD_TEST_MAX_SERIALIZED_BYTES,
  parseFieldTestRecording,
  serializeFieldTestRecording,
} from './fieldTestRecording.ts'

const createEntry = (overrides = {}) => ({
  at: 2000,
  kind: 'state',
  standingLocation: '셔틀콕 일반',
  data: { permission: 'granted', distanceMeters: 12.5, lastAcceptedAt: null },
  ...overrides,
})

test('recording round-trip preserves exact observed entries and their order', () => {
  const empty = createFieldTestRecording(1000)
  const first = appendFieldTestRecord(empty, createEntry())
  assert.equal(first.accepted, true)
  const second = appendFieldTestRecord(
    first.record,
    createEntry({ at: 1500, kind: 'network', data: { status: 202 } }),
  )
  assert.equal(second.accepted, true)
  assert.deepEqual(
    parseFieldTestRecording(serializeFieldTestRecording(second.record)),
    second.record,
  )
  assert.deepEqual(
    second.record.entries.map((entry) => entry.at),
    [2000, 1500],
  )
  assert.equal(second.record.updatedAt, 1500)
  assert.equal(empty.entries.length, 0)
  assert.equal(first.record.entries.length, 1)
})

test('appending snapshots nested source data and freezes persisted observations', () => {
  const source = createEntry({ data: { samples: [{ distanceMeters: 8 }] } })
  const result = appendFieldTestRecord(createFieldTestRecording(1000), source)
  assert.equal(result.accepted, true)
  source.data.samples[0].distanceMeters = 99
  source.standingLocation = '건너편'
  assert.equal(result.record.entries[0].data.samples[0].distanceMeters, 8)
  assert.equal(result.record.entries[0].standingLocation, '셔틀콕 일반')
  assert.throws(() => {
    result.record.entries[0].data.samples[0].distanceMeters = 10
  }, TypeError)
  const restored = parseFieldTestRecording(
    serializeFieldTestRecording(result.record),
  )
  assert.throws(() => restored.entries.pop(), TypeError)
})

test('entry limit refuses the new observation without removing old observations', () => {
  const full = parseFieldTestRecording(
    JSON.stringify({
      ...createFieldTestRecording(1000),
      entries: Array.from({ length: FIELD_TEST_MAX_ENTRIES }, (_, index) =>
        createEntry({ at: 2000 + index }),
      ),
    }),
  )
  assert.notEqual(full, null)
  const result = appendFieldTestRecord(full, createEntry({ kind: 'stop' }))
  assert.equal(result.accepted, false)
  assert.equal(result.reason, 'entry-limit')
  assert.equal(result.record, full)
  assert.equal(result.record.entries[0].at, 2000)
  assert.equal(result.record.entries.length, FIELD_TEST_MAX_ENTRIES)
})

test('UTF-8 size limit refuses appending and parsing without truncating data', () => {
  const original = createFieldTestRecording(1000)
  const oversized = createEntry({
    data: { note: '가'.repeat(Math.ceil(FIELD_TEST_MAX_SERIALIZED_BYTES / 3)) },
  })
  const result = appendFieldTestRecord(original, oversized)
  assert.equal(result.accepted, false)
  assert.equal(result.reason, 'size-limit')
  assert.equal(result.record, original)
  const raw = JSON.stringify({ ...original, entries: [oversized] })
  assert.equal(parseFieldTestRecording(raw), null)
  assert.throws(
    () => serializeFieldTestRecording({ ...original, entries: [oversized] }),
    RangeError,
  )
})

test('corrupted storage and invalid schema or timestamp shapes are rejected', () => {
  const valid = { ...createFieldTestRecording(1000), entries: [createEntry()] }
  for (const raw of [null, '', '{', 'null', '[]', 'false']) {
    assert.equal(parseFieldTestRecording(raw), null)
  }
  for (const malformed of [
    { ...valid, schemaVersion: 2 },
    { ...valid, unexpected: true },
    { ...valid, startedAt: -1 },
    { ...valid, updatedAt: 1.5 },
    { ...valid, startedAt: 8_640_000_000_000_001 },
    { ...valid, entries: 'not an array' },
    { ...valid, entries: [createEntry({ at: null })] },
    { ...valid, entries: [createEntry({ kind: 'other' })] },
    { ...valid, entries: [createEntry({ standingLocation: null })] },
    { ...valid, entries: [createEntry({ data: [] })] },
    { ...valid, entries: [createEntry({ unexpected: true })] },
    {
      ...valid,
      entries: Array(FIELD_TEST_MAX_ENTRIES + 1).fill(createEntry()),
    },
  ]) {
    assert.equal(parseFieldTestRecording(JSON.stringify(malformed)), null)
  }
  assert.equal(
    parseFieldTestRecording(
      JSON.stringify(valid).replace('"at":2000', '"at":1e400'),
    ),
    null,
  )
})

test('non-JSON data is refused instead of being silently changed on serialization', () => {
  const record = createFieldTestRecording(1000)
  const cyclic = {}
  cyclic.self = cyclic
  let deep = {}
  for (let index = 0; index < 20; index += 1) deep = { child: deep }
  for (const data of [
    { value: NaN },
    { value: Infinity },
    { value: undefined },
    { value: () => true },
    { value: BigInt(1) },
    { value: new Date() },
    { value: Array(1) },
    cyclic,
    deep,
  ]) {
    const result = appendFieldTestRecord(record, createEntry({ data }))
    assert.equal(result.accepted, false)
    assert.equal(result.reason, 'invalid-entry')
    assert.equal(result.record, record)
  }
  assert.equal(
    parseFieldTestRecording(
      JSON.stringify({
        ...record,
        entries: [createEntry({ data: deep })],
      }),
    ),
    null,
  )
  for (const at of [NaN, Infinity, -1, 1.5]) {
    assert.throws(() => createFieldTestRecording(at), RangeError)
  }
})
