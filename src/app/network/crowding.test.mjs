import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CROWDING_AGGREGATES_ENDPOINT,
  CROWDING_PRESENCE_ENDPOINT,
  CrowdingApiError,
  getCrowdingAggregates,
  isRetryableCrowdingRequestError,
  mapCrowdingAggregateStatus,
  parseCrowdingAggregatesResponse,
  postCrowdingPresence,
} from './crowding.ts'

const request = {
  accuracyBucket: '16-30m',
  confidence: 'medium',
  dwellBucket: '30-59s',
  observedAtMinute: 29_782_800,
  sampleCount: 3,
  scheduledTripId: '2026-08-15|shuttlecoke_o|09:00|C|1',
  schemaVersion: 1,
  state: 'waiting',
  stopId: 'shuttlecoke_o',
}

const responseBody = {
  accepted: true,
  aggregate: { bucket: '3-5', status: 'low' },
  expiresInSeconds: 180,
  schemaVersion: 1,
}

const jsonResponse = (body) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })

const aggregateTripIds = [
  '2026-08-15|shuttlecoke_o|09:00|C|1',
  '2026-08-15|shuttlecoke_o|09:10|DHJ|2',
  '2026-08-15|shuttlecoke_o|09:20|DY|1',
  '2026-08-15|shuttlecoke_o|09:30|R|1',
  '2026-08-15|shuttlecoke_o|09:40|NA|1',
]

const aggregateResponse = (scheduledTripIds = aggregateTripIds) => ({
  aggregates: scheduledTripIds.map((scheduledTripId, index) => ({
    aggregate: {
      bucket: index === 0 ? '0-2' : '3-5',
      status: index === 0 ? 'insufficient' : 'low',
    },
    scheduledTripId,
  })),
  expiresInSeconds: 180,
  schemaVersion: 1,
})

test('presence POST uses the exact endpoint, credentials and coarse JSON keys', async () => {
  let capturedUrl = ''
  let capturedInit
  const fetchImpl = async (url, init) => {
    capturedUrl = String(url)
    capturedInit = init
    return jsonResponse(responseBody)
  }

  const result = await postCrowdingPresence(request, { fetchImpl })

  assert.deepEqual(result, responseBody)
  assert.equal(capturedUrl, CROWDING_PRESENCE_ENDPOINT)
  assert.equal(capturedInit.credentials, 'include')
  assert.equal(capturedInit.method, 'POST')
  assert.deepEqual(JSON.parse(capturedInit.body), request)
  assert.deepEqual(Object.keys(JSON.parse(capturedInit.body)).sort(), [
    'accuracyBucket',
    'confidence',
    'dwellBucket',
    'observedAtMinute',
    'sampleCount',
    'scheduledTripId',
    'schemaVersion',
    'state',
    'stopId',
  ])
})

test('presence POST rejects malformed successful response bodies', async () => {
  const malformedResponseBodies = [
    { ...responseBody, accepted: false },
    { ...responseBody, schemaVersion: 2 },
    { ...responseBody, expiresInSeconds: 0 },
    { ...responseBody, aggregate: null },
    {
      ...responseBody,
      aggregate: { bucket: 'about five', status: 'low' },
    },
    {
      ...responseBody,
      aggregate: { bucket: '5-3', status: 'low' },
    },
    {
      ...responseBody,
      aggregate: { bucket: '3-5', status: 'unknown' },
    },
  ]

  for (const body of malformedResponseBodies) {
    await assert.rejects(
      postCrowdingPresence(request, {
        fetchImpl: async () => jsonResponse(body),
      }),
      (error) =>
        error instanceof CrowdingApiError &&
        error.message === 'invalid_response',
    )
  }
})

test('aggregate statuses map to the user-facing level contract', () => {
  assert.deepEqual(
    ['insufficient', 'low', 'medium', 'high'].map(mapCrowdingAggregateStatus),
    ['insufficient', 'relaxed', 'normal', 'busy'],
  )
})

test('crowding request retry policy separates transient transport failures from terminal protocol failures', () => {
  for (const error of [
    new Error('heartbeat_request_timeout'),
    new Error('unknown_failure'),
    new CrowdingApiError('network_error'),
    new CrowdingApiError('http_error', { status: 429 }),
    new CrowdingApiError('http_error', { status: 500 }),
    new CrowdingApiError('http_error', { status: 599 }),
  ]) {
    assert.equal(isRetryableCrowdingRequestError(error), true)
  }

  for (const error of [
    new CrowdingApiError('invalid_response'),
    new CrowdingApiError('invalid_response', { status: 503 }),
    new CrowdingApiError('invalid_request', { status: 422 }),
    new CrowdingApiError('invalid_request', { status: 503 }),
    new CrowdingApiError('http_error', { status: 400 }),
    new CrowdingApiError('http_error', { status: 404 }),
    new CrowdingApiError('http_error', { status: 499 }),
  ]) {
    assert.equal(isRetryableCrowdingRequestError(error), false)
  }
})

test('aggregate batch parser accepts zero through five entries in wire order', () => {
  const emptyResponse = aggregateResponse([])
  const fullResponse = aggregateResponse()

  assert.deepEqual(
    parseCrowdingAggregatesResponse(emptyResponse),
    emptyResponse,
  )
  assert.deepEqual(parseCrowdingAggregatesResponse(fullResponse), fullResponse)
  assert.deepEqual(
    parseCrowdingAggregatesResponse({
      ...fullResponse,
      aggregates: fullResponse.aggregates.toReversed(),
    }),
    {
      ...fullResponse,
      aggregates: fullResponse.aggregates.toReversed(),
    },
  )
  assert.equal(
    parseCrowdingAggregatesResponse(
      aggregateResponse([...aggregateTripIds, `${aggregateTripIds[4]}|extra`]),
    ),
    null,
  )
})

test('aggregate batch parser rejects duplicates and malformed entries', () => {
  const validResponse = aggregateResponse(aggregateTripIds.slice(0, 2))

  assert.equal(
    parseCrowdingAggregatesResponse({
      ...validResponse,
      aggregates: [
        validResponse.aggregates[0],
        {
          ...validResponse.aggregates[1],
          scheduledTripId: validResponse.aggregates[0].scheduledTripId,
        },
      ],
    }),
    null,
  )
  assert.equal(
    parseCrowdingAggregatesResponse({
      ...validResponse,
      aggregates: [
        {
          ...validResponse.aggregates[0],
          aggregate: { bucket: 'many', status: 'low' },
        },
      ],
    }),
    null,
  )
  assert.equal(
    parseCrowdingAggregatesResponse({
      ...validResponse,
      expiresInSeconds: 0,
    }),
    null,
  )
})

test('aggregate GET omits credentials, encodes repeated trips and forwards AbortSignal', async () => {
  const scheduledTripIds = aggregateTripIds.slice(0, 2)
  const controller = new AbortController()
  let capturedUrl = ''
  let capturedInit
  const fetchImpl = async (url, init) => {
    capturedUrl = String(url)
    capturedInit = init
    return jsonResponse(aggregateResponse(scheduledTripIds))
  }

  const parsed = await getCrowdingAggregates(
    { scheduledTripIds, stopId: 'shuttlecoke_o' },
    { fetchImpl, signal: controller.signal },
  )

  const url = new URL(capturedUrl)
  assert.equal(`${url.origin}${url.pathname}`, CROWDING_AGGREGATES_ENDPOINT)
  assert.equal(url.searchParams.get('stopId'), 'shuttlecoke_o')
  assert.deepEqual(url.searchParams.getAll('scheduledTripId'), scheduledTripIds)
  assert.match(
    capturedUrl,
    /scheduledTripId=2026-08-15%7Cshuttlecoke_o%7C09%3A00/,
  )
  assert.equal(capturedInit.method, 'GET')
  assert.equal(capturedInit.credentials, 'omit')
  assert.equal(capturedInit.signal, controller.signal)
  assert.deepEqual(parsed, aggregateResponse(scheduledTripIds))
})

test('aggregate GET preserves AbortError raised while reading the response body', async () => {
  const abortError = new DOMException('body read aborted', 'AbortError')

  await assert.rejects(
    getCrowdingAggregates(
      {
        scheduledTripIds: aggregateTripIds.slice(0, 1),
        stopId: 'shuttlecoke_o',
      },
      {
        fetchImpl: async () => ({
          json: async () => {
            throw abortError
          },
          ok: true,
        }),
      },
    ),
    (error) => error === abortError,
  )
})

test('aggregate GET preserves AbortError raised by fetch', async () => {
  const abortError = new DOMException('fetch aborted', 'AbortError')

  await assert.rejects(
    getCrowdingAggregates(
      {
        scheduledTripIds: aggregateTripIds.slice(0, 1),
        stopId: 'shuttlecoke_o',
      },
      {
        fetchImpl: async () => {
          throw abortError
        },
      },
    ),
    (error) => error === abortError,
  )
})

test('aggregate GET keeps non-abort body parsing failures as invalid responses', async () => {
  await assert.rejects(
    getCrowdingAggregates(
      {
        scheduledTripIds: aggregateTripIds.slice(0, 1),
        stopId: 'shuttlecoke_o',
      },
      {
        fetchImpl: async () => ({
          json: async () => {
            throw new SyntaxError('malformed JSON')
          },
          ok: true,
        }),
      },
    ),
    (error) =>
      error instanceof CrowdingApiError && error.message === 'invalid_response',
  )
})

test('aggregate GET rejects response order or cardinality drift', async () => {
  const scheduledTripIds = aggregateTripIds.slice(0, 2)
  const fetchImpl = async () =>
    jsonResponse(aggregateResponse(scheduledTripIds.toReversed()))

  await assert.rejects(
    getCrowdingAggregates(
      { scheduledTripIds, stopId: 'shuttlecoke_o' },
      { fetchImpl },
    ),
    /invalid_response/,
  )

  await assert.rejects(
    getCrowdingAggregates(
      { scheduledTripIds, stopId: 'shuttlecoke_o' },
      {
        fetchImpl: async () =>
          jsonResponse(aggregateResponse(scheduledTripIds.slice(0, 1))),
      },
    ),
    /invalid_response/,
  )
})

test('aggregate GET enforces one through five unique trips before fetching', async () => {
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    return jsonResponse(aggregateResponse())
  }

  for (const scheduledTripIds of [
    [],
    [...aggregateTripIds, `${aggregateTripIds[4]}|extra`],
    [aggregateTripIds[0], aggregateTripIds[0]],
  ]) {
    await assert.rejects(
      getCrowdingAggregates(
        { scheduledTripIds, stopId: 'shuttlecoke_o' },
        { fetchImpl },
      ),
      (error) =>
        error instanceof CrowdingApiError &&
        error.message === 'invalid_request' &&
        error.status === 422,
    )
  }

  assert.equal(fetchCalls, 0)
})

test('aggregate GET exposes HTTP status and rejects malformed success bodies', async () => {
  const aggregateRequest = {
    scheduledTripIds: aggregateTripIds.slice(0, 1),
    stopId: 'shuttlecoke_o',
  }

  await assert.rejects(
    getCrowdingAggregates(aggregateRequest, {
      fetchImpl: async () =>
        new Response('unavailable', {
          headers: { 'Retry-After': '7' },
          status: 503,
        }),
    }),
    (error) =>
      error instanceof CrowdingApiError &&
      error.message === 'http_error' &&
      error.status === 503 &&
      error.retryAfterMilliseconds === 7_000,
  )

  await assert.rejects(
    getCrowdingAggregates(aggregateRequest, {
      fetchImpl: async () => jsonResponse({ aggregates: 'invalid' }),
    }),
    /invalid_response/,
  )
})
