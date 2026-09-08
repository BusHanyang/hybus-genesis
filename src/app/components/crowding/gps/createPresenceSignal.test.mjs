import assert from 'node:assert/strict'
import test from 'node:test'

import { createPresenceSignal } from './createPresenceSignal.ts'
import {
  crowdingStopAnchors,
  crowdingStopIds,
} from '../../../data/crowding/stopGeometry.ts'

const sampleTimestamp = Date.parse('2026-08-15T00:00:00.000Z')
const signalOptions = { now: sampleTimestamp }

const waitingClassification = (stopId = 'shuttlecoke_o', overrides = {}) => ({
  dwellMilliseconds: 30_000,
  latestSampleTimestamp: sampleTimestamp,
  probabilities: [
    {
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

const latestSample = (overrides = {}, stopId = 'shuttlecoke_o') => {
  const anchor = crowdingStopAnchors.find(
    (candidate) => candidate.id === stopId,
  )
  assert.ok(anchor)

  return {
    accuracyMeters: 12,
    latitude: anchor.latitude,
    longitude: anchor.longitude,
    speedMetersPerSecond: 0,
    timestamp: sampleTimestamp,
    ...overrides,
  }
}

test('a valid waiting classification becomes only coarse signal fields', () => {
  const signal = createPresenceSignal(
    waitingClassification(),
    latestSample(),
    signalOptions,
  )

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
      latestSample({}, stopId),
      signalOptions,
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
      signalOptions,
    ),
    null,
  )
  assert.equal(
    createPresenceSignal(
      waitingClassification('shuttlecoke_o', { dwellMilliseconds: 29_999 }),
      latestSample(),
      signalOptions,
    ),
    null,
  )
  assert.equal(
    createPresenceSignal(
      waitingClassification(),
      latestSample({ accuracyMeters: 61 }),
      signalOptions,
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
      signalOptions,
    ),
    null,
  )
  assert.equal(
    createPresenceSignal(
      waitingClassification(),
      latestSample({ latitude: Number.NaN }),
      signalOptions,
    ),
    null,
  )
})

test('coordinates outside the WGS84 ranges cannot produce a signal', () => {
  const anchor = crowdingStopAnchors.find(
    (candidate) => candidate.id === 'shuttlecoke_o',
  )
  assert.ok(anchor)

  for (const sample of [
    latestSample({ latitude: anchor.latitude + 360 }),
    latestSample({ longitude: anchor.longitude + 360 }),
  ]) {
    assert.equal(
      createPresenceSignal(waitingClassification(), sample, signalOptions),
      null,
    )
  }
})

test('a sample 150 seconds stale or future-dated cannot produce a signal', () => {
  assert.equal(
    createPresenceSignal(waitingClassification(), latestSample(), {
      now: sampleTimestamp + 150_000,
    }),
    null,
  )
  assert.equal(
    createPresenceSignal(waitingClassification(), latestSample(), {
      now: sampleTimestamp - 150_000,
    }),
    null,
  )
})

test('a newer sample cannot reuse an older waiting classification', () => {
  assert.equal(
    createPresenceSignal(
      waitingClassification(),
      latestSample({
        latitude: 37,
        longitude: 126,
        timestamp: sampleTimestamp + 45_000,
      }),
      signalOptions,
    ),
    null,
  )
})

test('a latest sample outside the classified stop fails even at a matching timestamp', () => {
  const outsideTimestamp = sampleTimestamp + 45_000

  assert.equal(
    createPresenceSignal(
      waitingClassification('shuttlecoke_o', {
        latestSampleTimestamp: outsideTimestamp,
      }),
      latestSample({
        latitude: 37,
        longitude: 126,
        timestamp: outsideTimestamp,
      }),
      { now: outsideTimestamp },
    ),
    null,
  )
})
