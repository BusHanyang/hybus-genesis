import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CROWDING_PRESENCE_ENDPOINT,
  mapCrowdingAggregateStatus,
  parseCrowdingPresenceResponse,
  postCrowdingPresence,
} from './crowding.ts'
import { crowdingStopIds } from '../data/crowding/stopGeometry.ts'

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

test('presence POST uses the exact endpoint, credentials and coarse JSON keys', async () => {
  let capturedUrl = ''
  let capturedInit
  const fetchImpl = async (url, init) => {
    capturedUrl = String(url)
    capturedInit = init
    return new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  await postCrowdingPresence(request, { fetchImpl })

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

test('all six stop IDs keep the same presence wire shape', async () => {
  const postedBodies = []
  const fetchImpl = async (_url, init) => {
    postedBodies.push(JSON.parse(init.body))
    return new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  for (const stopId of crowdingStopIds) {
    await postCrowdingPresence(
      {
        ...request,
        scheduledTripId: `2026-08-15|${stopId}|09:00|C|1`,
        stopId,
      },
      { fetchImpl },
    )
  }

  assert.deepEqual(
    postedBodies.map(({ stopId }) => stopId),
    crowdingStopIds,
  )
  assert.ok(
    postedBodies.every(
      (body) => Object.keys(body).length === Object.keys(request).length,
    ),
  )
})

test('response validation accepts the backend shape and rejects malformed data', () => {
  assert.deepEqual(parseCrowdingPresenceResponse(responseBody), responseBody)
  assert.equal(
    parseCrowdingPresenceResponse({
      ...responseBody,
      aggregate: { bucket: 'about five', status: 'low' },
    }),
    null,
  )
  assert.equal(
    parseCrowdingPresenceResponse({
      ...responseBody,
      aggregate: { bucket: '5-3', status: 'low' },
    }),
    null,
  )
  assert.equal(
    parseCrowdingPresenceResponse({
      ...responseBody,
      aggregate: { bucket: '3-5', status: 'unknown' },
    }),
    null,
  )
  assert.equal(
    parseCrowdingPresenceResponse({ ...responseBody, accepted: false }),
    null,
  )
})

test('aggregate statuses map to the user-facing level contract', () => {
  assert.deepEqual(
    ['insufficient', 'low', 'medium', 'high'].map(mapCrowdingAggregateStatus),
    ['insufficient', 'relaxed', 'normal', 'busy'],
  )
})

test('invalid successful JSON is rejected instead of reaching the UI', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ accepted: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  await assert.rejects(
    postCrowdingPresence(request, { fetchImpl }),
    /invalid_response/,
  )
})
