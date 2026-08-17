import assert from 'node:assert/strict'
import test from 'node:test'

import { createPresenceSignal } from './createPresenceSignal.ts'
import { crowdingStopIds } from '../../data/crowding/stopGeometry.ts'

const waitingClassification = (stopId = 'shuttlecoke_o', overrides = {}) => ({
  dwellMilliseconds: 30_000,
  probabilities: [
    {
      distanceMeters: 4,
      probability: 0.95,
      stopId,
    },
  ],
  reason: 'classified',
  sampleCount: 3,
  selectedStopId: stopId,
  status: 'waiting',
  stopId,
  ...overrides,
})

const latestSample = (overrides = {}) => ({
  accuracyMeters: 12,
  latitude: 37.3,
  longitude: 126.8,
  speedMetersPerSecond: 0,
  timestamp: Date.parse('2026-08-15T00:00:00.000Z'),
  ...overrides,
})

test('a valid waiting classification becomes only coarse signal fields', () => {
  const signal = createPresenceSignal(waitingClassification(), latestSample())

  assert.deepEqual(signal, {
    accuracyBucket: '0-15m',
    confidence: 'high',
    dwellBucket: '30-59s',
    observedAtMinute: Math.floor(
      Date.parse('2026-08-15T00:00:00.000Z') / 60_000,
    ),
    sampleCount: 3,
    schemaVersion: 1,
    state: 'waiting',
    stopId: 'shuttlecoke_o',
  })
  assert.equal('latitude' in signal, false)
  assert.equal('longitude' in signal, false)
  assert.equal('speedMetersPerSecond' in signal, false)
})

test('all six shuttle stops produce a stop-matched coarse signal', () => {
  for (const stopId of crowdingStopIds) {
    const signal = createPresenceSignal(
      waitingClassification(stopId),
      latestSample(),
    )

    assert.ok(signal)
    assert.equal(signal?.stopId, stopId)
    assert.equal(Object.keys(signal).length, 8)
  }
})

test('sample, dwell, accuracy and classification gates reject weak signals', () => {
  assert.equal(
    createPresenceSignal(
      waitingClassification('shuttlecoke_o', { sampleCount: 2 }),
      latestSample(),
    ),
    null,
  )
  assert.equal(
    createPresenceSignal(
      waitingClassification('shuttlecoke_o', { dwellMilliseconds: 29_999 }),
      latestSample(),
    ),
    null,
  )
  assert.equal(
    createPresenceSignal(
      waitingClassification(),
      latestSample({ accuracyMeters: 61 }),
    ),
    null,
  )
  assert.equal(
    createPresenceSignal(
      waitingClassification('shuttlecoke_o', {
        status: 'outside',
        stopId: null,
      }),
      latestSample(),
    ),
    null,
  )
})
