import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyStopPresence,
  distanceBetweenPointsMeters,
  getSampleAnchorLikelihood,
} from './classifyStopPresence.ts'
import { crowdingPresencePolicy } from './crowdingConfig.ts'
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

test('classification probabilities omit separately-computed anchor distances', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: outbound }),
    crowdingStopAnchors,
  )

  assert.ok(result.probabilities.length > 0)
  assert.equal('distanceMeters' in result.probabilities[0], false)
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

test('coordinates outside the WGS84 latitude and longitude ranges are rejected', () => {
  for (const point of [
    { latitude: outbound.latitude + 360, longitude: outbound.longitude },
    { latitude: outbound.latitude, longitude: outbound.longitude + 360 },
  ]) {
    const result = classifyStopPresence(
      stationarySeries({ point }),
      crowdingStopAnchors,
    )

    assert.equal(result.status, 'insufficient')
    assert.equal(result.stopId, null)
    assert.equal(result.sampleCount, 0)
  }
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

test('the latest usable sample outside invalidates earlier waiting evidence', () => {
  const result = classifyStopPresence(
    [
      ...stationarySeries({ point: outbound }),
      ...stationarySeries({
        point: { latitude: 37, longitude: 126 },
        timestamps: [45_000],
      }),
    ],
    crowdingStopAnchors,
    { selectedStopId: 'shuttlecoke_o' },
  )

  assert.equal(result.status, 'outside')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'outside_geofence')
})

test('leaving and returning starts a new continuous dwell segment', () => {
  const result = classifyStopPresence(
    [
      ...stationarySeries({ point: outbound }),
      ...stationarySeries({
        point: { latitude: 37, longitude: 126 },
        timestamps: [45_000],
      }),
      ...stationarySeries({
        point: outbound,
        timestamps: [60_000, 70_000, 80_000],
      }),
    ],
    crowdingStopAnchors,
    { selectedStopId: 'shuttlecoke_o' },
  )

  assert.equal(result.status, 'candidate')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'dwell_too_short')
  assert.equal(result.sampleCount, 3)
  assert.equal(result.dwellMilliseconds, 20_000)
})

test('near-zero absolute likelihood cannot become waiting by normalization', () => {
  const residence = crowdingStopAnchors.find(
    (anchor) => anchor.id === 'residence',
  )
  assert.ok(residence)
  const pointAboutEightyMetersNorth = {
    latitude: residence.latitude + 80 / 111_320,
    longitude: residence.longitude,
  }
  const distance = distanceBetweenPointsMeters(
    residence,
    pointAboutEightyMetersNorth,
  )
  assert.ok(distance > 79)
  assert.ok(distance < 81)

  const result = classifyStopPresence(
    stationarySeries({ point: pointAboutEightyMetersNorth }),
    crowdingStopAnchors,
    { selectedStopId: 'residence' },
  )

  assert.equal(result.status, 'outside')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'likelihood_too_low')
})

test('the absolute evidence threshold is the reported 95% accuracy radius', () => {
  const residence = crowdingStopAnchors.find(
    (anchor) => anchor.id === 'residence',
  )
  assert.ok(residence)
  const pointAboutSixtyMetersNorth = {
    latitude: residence.latitude + 60 / 111_320,
    longitude: residence.longitude,
  }
  const sample = stationarySeries({
    accuracyMeters: 60,
    point: pointAboutSixtyMetersNorth,
    timestamps: [0],
  })[0]
  const likelihood = getSampleAnchorLikelihood(sample, residence)

  assert.ok(
    Math.abs(likelihood - crowdingPresencePolicy.minAnchorLikelihood) < 0.001,
  )
})

test('duplicate timestamps cannot satisfy the dwell requirement', () => {
  const result = classifyStopPresence(
    stationarySeries({ point: inbound, timestamps: [10_000, 10_000, 10_000] }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'insufficient')
  assert.equal(result.stopId, null)
  assert.equal(result.sampleCount, 1)
  assert.equal(result.dwellMilliseconds, 0)
})

test('duplicate callbacks at the latest timestamp count as one sample', () => {
  const result = classifyStopPresence(
    stationarySeries({
      point: outbound,
      timestamps: [0, 30_000, 30_000],
    }),
    crowdingStopAnchors,
  )

  assert.equal(result.status, 'insufficient')
  assert.equal(result.stopId, null)
  assert.equal(result.sampleCount, 2)
})

test('switching to the close inbound anchor starts a new dwell segment', () => {
  const result = classifyStopPresence(
    [
      ...stationarySeries({ point: outbound }),
      ...stationarySeries({ point: inbound, timestamps: [45_000] }),
    ],
    crowdingStopAnchors,
    { selectedStopId: 'shuttlecoke_i' },
  )

  assert.equal(result.status, 'candidate')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'not_enough_nearby_samples')
  assert.equal(result.sampleCount, 1)
  assert.equal(result.dwellMilliseconds, 0)
})

test('returning across the close pair cannot reuse the earlier outbound dwell', () => {
  const result = classifyStopPresence(
    [
      ...stationarySeries({ point: outbound }),
      ...stationarySeries({ point: inbound, timestamps: [45_000] }),
      ...stationarySeries({ point: outbound, timestamps: [60_000] }),
    ],
    crowdingStopAnchors,
    { selectedStopId: 'shuttlecoke_o' },
  )

  assert.equal(result.status, 'candidate')
  assert.equal(result.stopId, null)
  assert.equal(result.reason, 'not_enough_nearby_samples')
  assert.equal(result.sampleCount, 1)
  assert.equal(result.dwellMilliseconds, 0)
})
