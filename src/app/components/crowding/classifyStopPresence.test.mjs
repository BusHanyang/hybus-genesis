import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyStopPresence,
  distanceBetweenPointsMeters,
} from './classifyStopPresence.ts'
import {
  crowdingStopAnchors,
  crowdingStopIds,
} from '../../data/crowding/stopGeometry.ts'

const outbound = crowdingStopAnchors.find(
  (anchor) => anchor.id === 'shuttlecoke_o',
)
const inbound = crowdingStopAnchors.find(
  (anchor) => anchor.id === 'shuttlecoke_i',
)

assert.ok(outbound)
assert.ok(inbound)

const stationarySeries = ({
  accuracyMeters = 12,
  point,
  speedMetersPerSecond = 0,
  timestamps = [0, 15_000, 30_000],
}) =>
  timestamps.map((timestamp) => ({
    accuracyMeters,
    latitude: point.latitude,
    longitude: point.longitude,
    speedMetersPerSecond,
    timestamp,
  }))

const probabilityFor = (classification, stopId) =>
  classification.probabilities.find(
    (probability) => probability.stopId === stopId,
  )?.probability ?? 0

test('all six public shuttle stops are classifier anchors', () => {
  assert.deepEqual(
    crowdingStopAnchors.map(({ id }) => id),
    crowdingStopIds,
  )
})

test('the close ShuttleCoke anchors remain about 78.6 m apart', () => {
  const distance = distanceBetweenPointsMeters(outbound, inbound)

  assert.ok(distance > 78)
  assert.ok(distance < 79)
})

for (const anchor of crowdingStopAnchors) {
  test(`stable accurate samples classify as ${anchor.id}`, () => {
    const result = classifyStopPresence(
      stationarySeries({ point: anchor }),
      crowdingStopAnchors,
      { selectedStopId: anchor.id },
    )

    assert.equal(result.status, 'waiting')
    assert.equal(result.stopId, anchor.id)
    assert.ok(probabilityFor(result, anchor.id) > 0.99)
  })
}

test('a stale selected-stop prior cannot override strong GPS evidence', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: outbound }),
    crowdingStopAnchors,
    { selectedStopId: 'residence' },
  )

  assert.equal(result.status, 'waiting')
  assert.equal(result.stopId, 'shuttlecoke_o')
})

test('the close-pair midpoint with broad accuracy remains ambiguous', () => {
  const midpoint = {
    latitude: (outbound.latitude + inbound.latitude) / 2,
    longitude: (outbound.longitude + inbound.longitude) / 2,
  }
  const result = classifyStopPresence(
    stationarySeries({ accuracyMeters: 45, point: midpoint }),
    crowdingStopAnchors,
    { selectedStopId: 'shuttlecoke_o' },
  )

  assert.equal(result.status, 'ambiguous')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'probability_too_close')
})

test('a short stay remains a candidate', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: outbound, timestamps: [0, 5_000, 10_000] }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'candidate')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'dwell_too_short')
})

test('fast pass-through samples are not counted as waiting', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: outbound, speedMetersPerSecond: 2.5 }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'transient')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'moving_too_fast')
})

test('samples worse than the maximum accuracy are rejected', () => {
  const result = classifyStopPresence(
    stationarySeries({ accuracyMeters: 80, point: outbound }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'insufficient')
  assert.equal(result.stopId, null)
  assert.equal(result.sampleCount, 0)
})

test('stable samples far from all stops remain outside', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: { latitude: 37, longitude: 126 } }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'outside')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'outside_geofence')
})

test('duplicate timestamps cannot satisfy the dwell requirement', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: inbound, timestamps: [10_000, 10_000, 10_000] }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'candidate')
  assert.equal(result.stopId, null)
  assert.equal(result.dwellMilliseconds, 0)
})
