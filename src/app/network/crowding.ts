import type { CrowdingStopId } from '../data/crowding/stopGeometry'
import { getCrowdingApiBase } from './crowdingEndpoints.ts'
import {
  publishCrowdingRequest,
  startCrowdingRequest,
} from './crowdingObservation.ts'

const crowdingApiBase = getCrowdingApiBase(
  typeof window === 'undefined' ? undefined : window.location.origin,
)
export const CROWDING_PRESENCE_ENDPOINT = `${crowdingApiBase}/presence`
export const CROWDING_AGGREGATES_ENDPOINT = `${crowdingApiBase}/aggregates`

type CrowdingAggregateStatus = 'high' | 'insufficient' | 'low' | 'medium'

type CrowdingAggregate = {
  bucket: string
  status: CrowdingAggregateStatus
}

export type CrowdingPresencePayload = {
  accuracyBucket: '0-15m' | '16-30m' | '31-60m'
  confidence: 'high' | 'medium'
  dwellBucket: '120s+' | '30-59s' | '60-119s'
  observedAtMinute: number
  sampleCount: number
  schemaVersion: 1
  state: 'waiting'
  stopId: CrowdingStopId
}

export type CrowdingPresenceRequest = CrowdingPresencePayload & {
  scheduledTripId: string
}

type CrowdingAggregatesRequest = {
  scheduledTripIds: ReadonlyArray<string>
  stopId: CrowdingStopId
}

export type CrowdingPresenceResponse = {
  accepted: true
  aggregate: CrowdingAggregate
  expiresInSeconds: number
  schemaVersion: 1
}

type CrowdingAggregateEntry = {
  aggregate: CrowdingAggregate
  scheduledTripId: string
}

export type CrowdingAggregatesResponse = {
  aggregates: Array<CrowdingAggregateEntry>
  expiresInSeconds: number
  schemaVersion: 1
}

const crowdingLevelByAggregateStatus = {
  high: 'busy',
  insufficient: 'insufficient',
  low: 'relaxed',
  medium: 'normal',
} as const satisfies Record<CrowdingAggregateStatus, string>

type CrowdingMappedLevel =
  (typeof crowdingLevelByAggregateStatus)[CrowdingAggregateStatus]

const aggregateStatuses: ReadonlySet<string> = new Set(
  Object.keys(crowdingLevelByAggregateStatus),
)
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

const parseCrowdingPresenceResponse = (
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
): CrowdingMappedLevel => crowdingLevelByAggregateStatus[status]

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

export const isRetryableCrowdingRequestError = (error: unknown): boolean => {
  if (!(error instanceof CrowdingApiError)) return true
  if (error.message === 'network_error') return true
  if (
    error.message === 'invalid_request' ||
    error.message === 'invalid_response'
  ) {
    return false
  }

  return (
    error.status === 429 ||
    (error.status !== null && error.status >= 500 && error.status <= 599)
  )
}

const parseRetryAfterMilliseconds = (value: string | null): number | null => {
  if (value === null || !/^\d+$/.test(value)) return null

  const seconds = Number(value)
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds * 1_000 : null
}

type CrowdingFetchOptions = {
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

type CrowdingTransportResult = {
  retryAfterMilliseconds: number | null
  status: number | null
}

const getObservedError = (error: unknown): string => {
  if (isAbortError(error)) return 'aborted'
  if (error instanceof CrowdingApiError) return error.message
  return 'request_failed'
}

const fetchCrowdingJson = async (
  input: RequestInfo | URL,
  init: RequestInit,
  options: CrowdingFetchOptions,
  transport: CrowdingTransportResult,
): Promise<unknown> => {
  let response: Response

  try {
    response = await (options.fetchImpl ?? fetch)(input, {
      ...init,
      signal: options.signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new CrowdingApiError('network_error')
  }

  transport.status = response.status ?? null
  if (!response.ok) {
    transport.retryAfterMilliseconds = parseRetryAfterMilliseconds(
      response.headers.get('Retry-After'),
    )
    throw new CrowdingApiError('http_error', {
      retryAfterMilliseconds: transport.retryAfterMilliseconds,
      status: response.status,
    })
  }

  try {
    return await response.json()
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new CrowdingApiError('invalid_response')
  }
}

export const postCrowdingPresence = async (
  request: CrowdingPresenceRequest,
  options: CrowdingFetchOptions = {},
): Promise<CrowdingPresenceResponse> => {
  const requestBody = JSON.stringify(request)
  const presenceRequest: CrowdingPresenceRequest = {
    accuracyBucket: request.accuracyBucket,
    confidence: request.confidence,
    dwellBucket: request.dwellBucket,
    observedAtMinute: request.observedAtMinute,
    sampleCount: request.sampleCount,
    scheduledTripId: request.scheduledTripId,
    schemaVersion: request.schemaVersion,
    state: request.state,
    stopId: request.stopId,
  }
  const observation = startCrowdingRequest({
    endpoint: CROWDING_PRESENCE_ENDPOINT,
    operation: 'presence',
    presenceRequest,
    scheduledTripIds: [request.scheduledTripId],
    stopId: request.stopId,
  })
  const transport: CrowdingTransportResult = {
    retryAfterMilliseconds: null,
    status: null,
  }

  try {
    const body = await fetchCrowdingJson(
      CROWDING_PRESENCE_ENDPOINT,
      {
        body: requestBody,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
      options,
      transport,
    )

    const parsed = parseCrowdingPresenceResponse(body)
    if (parsed === null) throw new CrowdingApiError('invalid_response')

    publishCrowdingRequest({
      ...observation,
      ...transport,
      error: null,
      observedAt: Date.now(),
      operation: 'presence',
      phase: 'succeeded',
      presenceRequest,
      response: parsed,
    })
    return parsed
  } catch (error) {
    publishCrowdingRequest({
      ...observation,
      ...transport,
      error: getObservedError(error),
      observedAt: Date.now(),
      phase: 'failed',
    })
    throw error
  }
}

export const getCrowdingAggregates = async (
  request: CrowdingAggregatesRequest,
  options: CrowdingFetchOptions = {},
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

  const observation = startCrowdingRequest({
    endpoint: CROWDING_AGGREGATES_ENDPOINT,
    operation: 'aggregates',
    scheduledTripIds,
    stopId: request.stopId,
  })
  const transport: CrowdingTransportResult = {
    retryAfterMilliseconds: null,
    status: null,
  }

  try {
    const body = await fetchCrowdingJson(
      url,
      {
        credentials: 'omit',
        method: 'GET',
      },
      options,
      transport,
    )

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

    publishCrowdingRequest({
      ...observation,
      ...transport,
      error: null,
      observedAt: Date.now(),
      operation: 'aggregates',
      phase: 'succeeded',
      response: parsed,
    })
    return parsed
  } catch (error) {
    publishCrowdingRequest({
      ...observation,
      ...transport,
      error: getObservedError(error),
      observedAt: Date.now(),
      phase: 'failed',
    })
    throw error
  }
}
