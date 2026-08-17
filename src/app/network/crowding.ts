import type { CrowdingStopId } from '../data/crowding/stopGeometry'

export const CROWDING_PRESENCE_ENDPOINT =
  'https://api.hybus.app/v1/crowding/presence'
export const CROWDING_AGGREGATES_ENDPOINT =
  'https://api.hybus.app/v1/crowding/aggregates'

export type CrowdingAggregateStatus = 'high' | 'insufficient' | 'low' | 'medium'

export type CrowdingAggregate = {
  bucket: string
  status: CrowdingAggregateStatus
}

export type CrowdingPresenceRequest = {
  accuracyBucket: '0-15m' | '16-30m' | '31-60m'
  confidence: 'high' | 'medium'
  dwellBucket: '120s+' | '30-59s' | '60-119s'
  observedAtMinute: number
  sampleCount: number
  scheduledTripId: string
  schemaVersion: 1
  state: 'waiting'
  stopId: CrowdingStopId
}

export type CrowdingPresenceResponse = {
  accepted: true
  aggregate: CrowdingAggregate
  expiresInSeconds: number
  schemaVersion: 1
}

export type CrowdingAggregatesRequest = {
  scheduledTripIds: ReadonlyArray<string>
  stopId: CrowdingStopId
}

export type CrowdingAggregateEntry = {
  aggregate: CrowdingAggregate
  scheduledTripId: string
}

export type CrowdingAggregatesResponse = {
  aggregates: Array<CrowdingAggregateEntry>
  expiresInSeconds: number
  schemaVersion: 1
}

export type CrowdingMappedLevel = 'busy' | 'insufficient' | 'normal' | 'relaxed'

const aggregateStatuses: ReadonlySet<string> = new Set([
  'high',
  'insufficient',
  'low',
  'medium',
])
const BUCKET_RANGE_PATTERN = /^(0|[1-9]\d*)-(0|[1-9]\d*)$/
const BUCKET_OPEN_ENDED_PATTERN = /^([1-9]\d*)\+$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isValidBucket = (value: string): boolean => {
  const range = BUCKET_RANGE_PATTERN.exec(value)
  if (range !== null) {
    const lower = Number(range[1])
    const upper = Number(range[2])
    return (
      Number.isSafeInteger(lower) &&
      Number.isSafeInteger(upper) &&
      lower <= upper
    )
  }

  const openEnded = BUCKET_OPEN_ENDED_PATTERN.exec(value)
  return openEnded !== null && Number.isSafeInteger(Number(openEnded[1]))
}

const parseCrowdingAggregate = (value: unknown): CrowdingAggregate | null => {
  if (!isRecord(value)) return null

  const { bucket, status } = value
  if (
    typeof bucket !== 'string' ||
    !isValidBucket(bucket) ||
    typeof status !== 'string' ||
    !aggregateStatuses.has(status)
  ) {
    return null
  }

  return {
    bucket,
    status: status as CrowdingAggregateStatus,
  }
}

export const parseCrowdingPresenceResponse = (
  value: unknown,
): CrowdingPresenceResponse | null => {
  if (
    !isRecord(value) ||
    value.accepted !== true ||
    value.schemaVersion !== 1 ||
    !Number.isSafeInteger(value.expiresInSeconds) ||
    Number(value.expiresInSeconds) <= 0 ||
    !isRecord(value.aggregate)
  ) {
    return null
  }

  const aggregate = parseCrowdingAggregate(value.aggregate)
  if (aggregate === null) return null

  return {
    accepted: true,
    aggregate,
    expiresInSeconds: Number(value.expiresInSeconds),
    schemaVersion: 1,
  }
}

export const parseCrowdingAggregatesResponse = (
  value: unknown,
): CrowdingAggregatesResponse | null => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Number.isSafeInteger(value.expiresInSeconds) ||
    Number(value.expiresInSeconds) <= 0 ||
    !Array.isArray(value.aggregates) ||
    value.aggregates.length < 1 ||
    value.aggregates.length > 5
  ) {
    return null
  }

  const seenScheduledTripIds = new Set<string>()
  const aggregates: Array<CrowdingAggregateEntry> = []

  for (const entry of value.aggregates) {
    if (
      !isRecord(entry) ||
      typeof entry.scheduledTripId !== 'string' ||
      entry.scheduledTripId.length === 0 ||
      seenScheduledTripIds.has(entry.scheduledTripId)
    ) {
      return null
    }

    const aggregate = parseCrowdingAggregate(entry.aggregate)
    if (aggregate === null) return null

    seenScheduledTripIds.add(entry.scheduledTripId)
    aggregates.push({
      aggregate,
      scheduledTripId: entry.scheduledTripId,
    })
  }

  return {
    aggregates,
    expiresInSeconds: Number(value.expiresInSeconds),
    schemaVersion: 1,
  }
}

export const mapCrowdingAggregateStatus = (
  status: CrowdingAggregateStatus,
): CrowdingMappedLevel => {
  switch (status) {
    case 'high':
      return 'busy'
    case 'insufficient':
      return 'insufficient'
    case 'low':
      return 'relaxed'
    case 'medium':
      return 'normal'
  }
}

export class CrowdingApiError extends Error {
  readonly retryAfterMilliseconds: number | null
  readonly status: number | null

  constructor(
    message: string,
    options: {
      retryAfterMilliseconds?: number | null
      status?: number | null
    } = {},
  ) {
    super(message)
    this.name = 'CrowdingApiError'
    this.retryAfterMilliseconds = options.retryAfterMilliseconds ?? null
    this.status = options.status ?? null
  }
}

const parseRetryAfterMilliseconds = (value: string | null): number | null => {
  if (value === null || !/^\d+$/.test(value)) return null

  const seconds = Number(value)
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds * 1_000 : null
}

export const postCrowdingPresence = async (
  request: CrowdingPresenceRequest,
  options: {
    fetchImpl?: typeof fetch
    signal?: AbortSignal
  } = {},
): Promise<CrowdingPresenceResponse> => {
  const fetchImpl = options.fetchImpl ?? fetch
  let response: Response

  try {
    response = await fetchImpl(CROWDING_PRESENCE_ENDPOINT, {
      body: JSON.stringify(request),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new CrowdingApiError('network_error')
  }

  if (!response.ok) {
    throw new CrowdingApiError('http_error', {
      retryAfterMilliseconds: parseRetryAfterMilliseconds(
        response.headers.get('Retry-After'),
      ),
      status: response.status,
    })
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new CrowdingApiError('invalid_response')
  }

  const parsed = parseCrowdingPresenceResponse(body)
  if (parsed === null) throw new CrowdingApiError('invalid_response')

  return parsed
}

export const getCrowdingAggregates = async (
  request: CrowdingAggregatesRequest,
  options: {
    fetchImpl?: typeof fetch
    signal?: AbortSignal
  } = {},
): Promise<CrowdingAggregatesResponse> => {
  const scheduledTripIds = [...request.scheduledTripIds]
  if (
    scheduledTripIds.length < 1 ||
    scheduledTripIds.length > 5 ||
    scheduledTripIds.some(
      (scheduledTripId) =>
        typeof scheduledTripId !== 'string' || scheduledTripId.length === 0,
    ) ||
    new Set(scheduledTripIds).size !== scheduledTripIds.length
  ) {
    throw new CrowdingApiError('invalid_request', { status: 422 })
  }

  const url = new URL(CROWDING_AGGREGATES_ENDPOINT)
  url.searchParams.set('stopId', request.stopId)
  scheduledTripIds.forEach((scheduledTripId) => {
    url.searchParams.append('scheduledTripId', scheduledTripId)
  })

  const fetchImpl = options.fetchImpl ?? fetch
  let response: Response

  try {
    response = await fetchImpl(url, {
      credentials: 'include',
      method: 'GET',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new CrowdingApiError('network_error')
  }

  if (!response.ok) {
    throw new CrowdingApiError('http_error', {
      retryAfterMilliseconds: parseRetryAfterMilliseconds(
        response.headers.get('Retry-After'),
      ),
      status: response.status,
    })
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new CrowdingApiError('invalid_response')
  }

  const parsed = parseCrowdingAggregatesResponse(body)
  if (
    parsed === null ||
    parsed.aggregates.length !== scheduledTripIds.length ||
    parsed.aggregates.some(
      (aggregate, index) =>
        aggregate.scheduledTripId !== scheduledTripIds[index],
    )
  ) {
    throw new CrowdingApiError('invalid_response')
  }

  return parsed
}
