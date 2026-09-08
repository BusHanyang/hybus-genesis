import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createFieldTestSnapshot,
  getFieldTransmissionBlock,
  isCurrentFieldResponse,
} from './fieldTestModel.ts'

const sampleAt = Date.UTC(2026, 8, 8, 1, 0, 0)
const tripId = '2026-09-08|shuttlecoke_o|10:10|C|1'
const context = () => ({
  canSend: true,
  departure: {
    status: 'ready',
    location: 'shuttlecoke_o',
    trip: {
      stopId: 'shuttlecoke_o',
      departureTime: '10:10',
      routeType: 'C',
      ordinal: 1,
    },
  },
  hasTerminalHeartbeatError: false,
  isParticipating: true,
  isSummaryVisible: true,
  presence: {
    hasFreshPosition: true,
    isPageVisible: true,
    permission: 'granted',
    status: 'collecting',
    errorCode: null,
    source: 'navigator',
    sampleCount: 3,
    latestSample: {
      latitude: 37.29876545135686,
      longitude: 126.83788812731039,
      timestamp: sampleAt,
      accuracyMeters: 12,
      speedMetersPerSecond: null,
    },
    classification: {
      stopId: 'shuttlecoke_o',
      status: 'waiting',
      reason: 'classified',
      probabilities: [{ stopId: 'shuttlecoke_o', probability: 0.95 }],
      sampleCount: 3,
      dwellMilliseconds: 31_000,
    },
  },
  scheduledTripId: tripId,
  selectedStopId: 'shuttlecoke_o',
  signal: {
    schemaVersion: 1,
    stopId: 'shuttlecoke_o',
    state: 'waiting',
    accuracyBucket: '0-15m',
    confidence: 'high',
    dwellBucket: '30-59s',
    observedAtMinute: Math.floor(sampleAt / 60_000),
    sampleCount: 3,
  },
})

test('diagnostic snapshots observe the existing decision without exporting coordinates', () => {
  const original = context()
  const baseline = structuredClone(original)
  const snapshot = createFieldTestSnapshot(original)
  assert.equal(snapshot.sample.boardingReferenceDistancesMeters.general, 0)
  assert.ok(snapshot.sample.boardingReferenceDistancesMeters.artist > 12)
  assert.ok(snapshot.sample.boardingReferenceDistancesMeters.artist < 13)
  assert.equal(snapshot.classifiedStopId, 'shuttlecoke_o')
  assert.equal(snapshot.scheduledTripId, tripId)
  assert.equal(snapshot.transmissionBlock, null)
  assert.doesNotMatch(
    JSON.stringify(snapshot),
    /latitude|longitude|37\.298|126\.837|cookie/i,
  )
  assert.deepEqual(original, baseline)
})

test('transmission reasons distinguish opt-in, permission, timetable, classifier and stop mismatch', () => {
  const value = context()
  assert.match(
    getFieldTransmissionBlock({ ...value, isParticipating: false }),
    /테스트 시작/,
  )
  assert.match(
    getFieldTransmissionBlock({
      ...value,
      presence: { ...value.presence, permission: 'denied' },
    }),
    /차단/,
  )
  assert.match(
    getFieldTransmissionBlock({
      ...value,
      departure: { status: 'unavailable' },
    }),
    /출발편이 없/,
  )
  assert.match(
    getFieldTransmissionBlock({
      ...value,
      signal: null,
      presence: {
        ...value.presence,
        classification: {
          ...value.presence.classification,
          reason: 'probability_too_close',
        },
      },
    }),
    /보류/,
  )
  assert.match(
    getFieldTransmissionBlock({ ...value, selectedStopId: 'shuttlecoke_i' }),
    /달라/,
  )
  assert.match(
    getFieldTransmissionBlock({ ...value, hasTerminalHeartbeatError: true }),
    /전송이 중단/,
  )
})

test('accepted or aggregate observations count only for the current trip and valid response age', () => {
  const event = {
    phase: 'succeeded',
    scheduledTripIds: [tripId],
    observedAt: sampleAt,
    response: { expiresInSeconds: 180 },
  }
  assert.equal(isCurrentFieldResponse(event, tripId, sampleAt), true)
  assert.equal(isCurrentFieldResponse(event, tripId, sampleAt + 179_999), true)
  assert.equal(isCurrentFieldResponse(event, tripId, sampleAt + 180_000), false)
  assert.equal(isCurrentFieldResponse(event, tripId, sampleAt - 1), false)
  assert.equal(
    isCurrentFieldResponse(event, `${tripId}-other`, sampleAt),
    false,
  )
  assert.equal(
    isCurrentFieldResponse({ ...event, phase: 'failed' }, tripId, sampleAt),
    false,
  )
  assert.equal(isCurrentFieldResponse(null, tripId, sampleAt), false)
  assert.equal(isCurrentFieldResponse(event, null, sampleAt), false)
})
