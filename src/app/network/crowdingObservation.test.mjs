import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CROWDING_AGGREGATES_ENDPOINT,
  CROWDING_PRESENCE_ENDPOINT,
  CrowdingApiError,
  getCrowdingAggregates,
  postCrowdingPresence,
} from './crowding.ts'
import { subscribeCrowdingRequests } from './crowdingObservation.ts'

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
const presenceResponse = {
  accepted: true,
  aggregate: { bucket: '0-2', status: 'insufficient' },
  expiresInSeconds: 180,
  schemaVersion: 1,
}
const aggregateRequest = {
  scheduledTripIds: [
    request.scheduledTripId,
    '2026-08-15|shuttlecoke_o|09:10|C|1',
  ],
  stopId: request.stopId,
}
const aggregateResponse = {
  aggregates: aggregateRequest.scheduledTripIds.map((scheduledTripId) => ({
    aggregate: { bucket: '0-2', status: 'insufficient' },
    scheduledTripId,
  })),
  expiresInSeconds: 180,
  schemaVersion: 1,
}

const jsonResponse = (body, status = 200) => Response.json(body, { status })

const collectObservations = () => {
  const observations = []
  const unsubscribe = subscribeCrowdingRequests((observation) => {
    observations.push(observation)
  })
  return { observations, unsubscribe }
}

test('presence observation follows the actual request and exposes only coarse inputs and validated output', async () => {
  const { observations, unsubscribe } = collectObservations()
  let fetchCalls = 0
  try {
    const enrichedRequest = { ...request, privateExtra: 'not for observers' }
    const result = await postCrowdingPresence(enrichedRequest, {
      fetchImpl: async (endpoint, init) => {
        fetchCalls += 1
        assert.equal(endpoint, CROWDING_PRESENCE_ENDPOINT)
        assert.equal(init.credentials, 'include')
        assert.deepEqual(JSON.parse(init.body), enrichedRequest)
        assert.equal(observations.length, 1)
        assert.equal(observations[0].phase, 'started')
        return jsonResponse(
          {
            ...presenceResponse,
            privateExtra: 'not for observers',
            aggregate: {
              ...presenceResponse.aggregate,
              privateExtra: 'not for observers',
            },
          },
          201,
        )
      },
    })
    assert.equal(fetchCalls, 1)
    assert.deepEqual(result, presenceResponse)
    const [started, succeeded] = observations
    assert.equal(observations.length, 2)
    assert.equal(started.operation, 'presence')
    assert.equal(started.status, null)
    assert.equal(started.error, null)
    assert.equal(started.retryAfterMilliseconds, null)
    assert.equal(started.observedAt, started.startedAt)
    assert.equal(started.endpoint, CROWDING_PRESENCE_ENDPOINT)
    assert.equal(started.stopId, request.stopId)
    assert.deepEqual(started.scheduledTripIds, [request.scheduledTripId])
    assert.deepEqual(started.presenceRequest, request)
    assert.equal('response' in started, false)
    assert.equal(succeeded.requestId, started.requestId)
    assert.equal(succeeded.startedAt, started.startedAt)
    assert.ok(succeeded.observedAt >= started.startedAt)
    assert.equal(succeeded.phase, 'succeeded')
    assert.equal(succeeded.status, 201)
    assert.deepEqual(succeeded.response, presenceResponse)
  } finally {
    unsubscribe()
  }
})

test('aggregate observations preserve validated wire order without query or headers', async () => {
  const { observations, unsubscribe } = collectObservations()
  try {
    const result = await getCrowdingAggregates(aggregateRequest, {
      fetchImpl: async (url, init) => {
        assert.deepEqual(
          url.searchParams.getAll('scheduledTripId'),
          aggregateRequest.scheduledTripIds,
        )
        assert.equal(init.credentials, 'omit')
        return jsonResponse(aggregateResponse)
      },
    })
    assert.deepEqual(result, aggregateResponse)
    assert.deepEqual(
      observations.map(({ phase }) => phase),
      ['started', 'succeeded'],
    )
    for (const observation of observations) {
      assert.equal(observation.operation, 'aggregates')
      assert.equal(observation.endpoint, CROWDING_AGGREGATES_ENDPOINT)
      assert.equal(new URL(observation.endpoint).search, '')
      assert.equal('headers' in observation, false)
      assert.equal(Object.hasOwn(observation, 'presenceRequest'), false)
      assert.deepEqual(JSON.parse(JSON.stringify(observation)), observation)
      assert.deepEqual(
        observation.scheduledTripIds,
        aggregateRequest.scheduledTripIds,
      )
    }
    assert.deepEqual(observations[1].response, aggregateResponse)
  } finally {
    unsubscribe()
  }
})

test('HTTP failure keeps status and Retry-After without exposing the server body', async () => {
  const { observations, unsubscribe } = collectObservations()
  try {
    await assert.rejects(
      postCrowdingPresence(request, {
        fetchImpl: async () =>
          new Response('private diagnostic detail', {
            headers: { 'Retry-After': '15' },
            status: 429,
          }),
      }),
      (error) =>
        error instanceof CrowdingApiError &&
        error.message === 'http_error' &&
        error.status === 429 &&
        error.retryAfterMilliseconds === 15_000,
    )
    assert.equal(observations.length, 2)
    const failure = observations[1]
    assert.equal(failure.phase, 'failed')
    assert.equal(failure.status, 429)
    assert.equal(failure.error, 'http_error')
    assert.equal(failure.retryAfterMilliseconds, 15_000)
    assert.equal('response' in failure, false)
    assert.equal(JSON.stringify(failure).includes('private diagnostic'), false)
  } finally {
    unsubscribe()
  }
})

test('aborted fetch and body reads remain failed observations and preserve the original abort', async () => {
  const { observations, unsubscribe } = collectObservations()
  try {
    for (const abortDuringBody of [false, true]) {
      const abort = new DOMException('private abort detail', 'AbortError')
      await assert.rejects(
        postCrowdingPresence(request, {
          fetchImpl: async () => {
            if (!abortDuringBody) throw abort
            return {
              json: async () => {
                throw abort
              },
              ok: true,
              status: 200,
            }
          },
        }),
        (error) => error === abort,
      )
      const failure = observations.at(-1)
      assert.equal(failure.phase, 'failed')
      assert.equal(failure.error, 'aborted')
      assert.equal(failure.status, abortDuringBody ? 200 : null)
      assert.equal('response' in failure, false)
    }
    assert.equal(observations.length, 4)
    assert.notEqual(observations[0].requestId, observations[2].requestId)
  } finally {
    unsubscribe()
  }
})

test('malformed JSON, invalid bodies and response order drift cannot become successful observations', async () => {
  const { observations, unsubscribe } = collectObservations()
  try {
    const operations = [
      () =>
        postCrowdingPresence(request, {
          fetchImpl: async () => new Response('not JSON', { status: 200 }),
        }),
      () =>
        postCrowdingPresence(request, {
          fetchImpl: async () =>
            jsonResponse({ ...presenceResponse, accepted: false }),
        }),
      () =>
        getCrowdingAggregates(aggregateRequest, {
          fetchImpl: async () =>
            jsonResponse({
              ...aggregateResponse,
              aggregates: aggregateResponse.aggregates.toReversed(),
            }),
        }),
      () =>
        getCrowdingAggregates(aggregateRequest, {
          fetchImpl: async () =>
            jsonResponse({
              ...aggregateResponse,
              aggregates: aggregateResponse.aggregates.slice(0, 1),
            }),
        }),
    ]
    for (const operation of operations) {
      await assert.rejects(operation, /invalid_response/)
      const failure = observations.at(-1)
      assert.equal(failure.phase, 'failed')
      assert.equal(failure.error, 'invalid_response')
      assert.equal(failure.status, 200)
      assert.equal('response' in failure, false)
    }
    assert.equal(observations.length, operations.length * 2)
    assert.equal(
      observations.some(({ phase }) => phase === 'succeeded'),
      false,
    )
  } finally {
    unsubscribe()
  }
})

test('subscription and invalid local requests never initiate or pretend to execute requests', async () => {
  const { observations, unsubscribe } = collectObservations()
  let fetchCalls = 0
  const fetchImpl = async () => {
    fetchCalls += 1
    return jsonResponse(aggregateResponse)
  }
  try {
    assert.equal(observations.length, 0)
    assert.equal(fetchCalls, 0)
    await assert.rejects(
      getCrowdingAggregates(
        { ...aggregateRequest, scheduledTripIds: [] },
        { fetchImpl },
      ),
      /invalid_request/,
    )
    assert.equal(fetchCalls, 0)
    assert.equal(observations.length, 0)
    unsubscribe()
    await getCrowdingAggregates(aggregateRequest, { fetchImpl })
    assert.equal(fetchCalls, 1)
    assert.equal(observations.length, 0)
  } finally {
    unsubscribe()
  }
})

test('observer mutations and exceptions cannot affect another observer, requests or returned responses', async () => {
  const removeMutating = subscribeCrowdingRequests((observation) => {
    observation.scheduledTripIds[0] = 'mutated'
    observation.presenceRequest.stopId = 'mutated'
    if (observation.phase === 'succeeded') {
      observation.response.aggregate.bucket = 'mutated'
    }
    throw new Error('observer failure')
  })
  const { observations, unsubscribe } = collectObservations()
  try {
    const result = await postCrowdingPresence(request, {
      fetchImpl: async (url, init) => {
        assert.deepEqual(JSON.parse(init.body), request)
        return jsonResponse(presenceResponse)
      },
    })
    assert.deepEqual(result, presenceResponse)
    assert.equal(observations.length, 2)
    for (const observation of observations) {
      assert.deepEqual(observation.presenceRequest, request)
      assert.deepEqual(observation.scheduledTripIds, [request.scheduledTripId])
    }
    assert.deepEqual(observations[1].response, presenceResponse)
    observations[1].response.aggregate.bucket = 'another mutation'
    assert.deepEqual(result, presenceResponse)
  } finally {
    removeMutating()
    unsubscribe()
  }
})
