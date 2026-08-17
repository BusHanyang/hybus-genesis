import assert from 'node:assert/strict'
import test from 'node:test'

import { isFreshUsableGpsSample } from './classifyStopPresence.ts'
import {
  appendCrowdingSample,
  canSendCrowdingHeartbeatRequest,
  canSendCrowdingPresence,
  createCrowdingHeartbeatRevisionKey,
  deriveCrowdingPresenceUiStatus,
  getCrowdingLocationReady,
  getCrowdingPreviewMode,
  getNativeUsabilityFallbackAction,
  getRetryPresenceSource,
  hasTerminalHeartbeatFailure,
  initialCrowdingHeartbeatState,
  reduceCrowdingHeartbeatState,
} from './crowdingState.ts'

const sendableState = {
  hasFreshPosition: true,
  hasScheduledTrip: true,
  isEnabled: true,
  isPageVisible: true,
  isSummaryVisible: true,
  permission: 'granted',
  presenceStatus: 'collecting',
}

test('presence can be sent only while current granted collection is active', () => {
  assert.equal(canSendCrowdingPresence(sendableState), true)

  for (const override of [
    { permission: 'denied' },
    { presenceStatus: 'error' },
    { presenceStatus: 'requesting' },
    { isPageVisible: false },
    { isEnabled: false },
    { isSummaryVisible: false },
    { hasScheduledTrip: false },
    { hasFreshPosition: false },
  ]) {
    assert.equal(
      canSendCrowdingPresence({ ...sendableState, ...override }),
      false,
    )
  }
})

test('heartbeat request revalidates coordinate freshness at send time', () => {
  const now = 1_000_000
  const requestContext = {
    canSend: true,
    latestSample: {
      accuracyMeters: 12,
      latitude: 37.3,
      longitude: 126.8,
      speedMetersPerSecond: null,
      timestamp: now - 1_000,
    },
    now,
  }

  assert.equal(canSendCrowdingHeartbeatRequest(requestContext), true)
  assert.equal(
    canSendCrowdingHeartbeatRequest({
      ...requestContext,
      latestSample: {
        ...requestContext.latestSample,
        timestamp: now - 120_001,
      },
    }),
    false,
  )
  assert.equal(
    canSendCrowdingHeartbeatRequest({
      ...requestContext,
      canSend: false,
    }),
    false,
  )
})

test('sample append deduplicates timestamps and preserves chronological order', () => {
  const samples = appendCrowdingSample(
    [
      { label: 'newest', timestamp: 30 },
      { label: 'expired', timestamp: 5 },
      { label: 'duplicate-old', timestamp: 20 },
      { label: 'oldest', timestamp: 10 },
    ],
    { label: 'duplicate-replacement', timestamp: 20 },
    { cutoffTimestamp: 10, maxSampleCount: 3 },
  )

  assert.deepEqual(samples, [
    { label: 'oldest', timestamp: 10 },
    { label: 'duplicate-replacement', timestamp: 20 },
    { label: 'newest', timestamp: 30 },
  ])
})

test('granted location always uses the stable active legend during retries', () => {
  assert.equal(
    getCrowdingPreviewMode({
      isEnabled: true,
      isLocationReady: true,
      nativeRecoverySupported: false,
      status: 'requesting',
    }),
    'active',
  )
})

test('row crowding requires a fresh usable coordinate in addition to permission', () => {
  const readyState = {
    hasFreshPosition: true,
    hasSelectedStop: true,
    isEnabled: true,
    permission: 'granted',
  }

  assert.equal(getCrowdingLocationReady(readyState), true)
  assert.equal(
    getCrowdingLocationReady({ ...readyState, hasFreshPosition: false }),
    false,
  )
  assert.equal(
    getCrowdingLocationReady({ ...readyState, permission: 'prompt' }),
    false,
  )
})

test('fresh position rejects stale, inaccurate, and invalid coordinates', () => {
  const now = 1_000_000
  const sample = {
    accuracyMeters: 12,
    latitude: 37.3,
    longitude: 126.8,
    timestamp: now - 1_000,
  }
  assert.equal(isFreshUsableGpsSample(sample, now), true)
  assert.equal(
    isFreshUsableGpsSample({ ...sample, timestamp: now - 120_001 }, now),
    false,
  )
  assert.equal(
    isFreshUsableGpsSample({ ...sample, timestamp: now + 1 }, now),
    false,
  )
  assert.equal(
    isFreshUsableGpsSample({ ...sample, accuracyMeters: 61 }, now),
    false,
  )
  assert.equal(
    isFreshUsableGpsSample({ ...sample, latitude: Number.NaN }, now),
    false,
  )
  assert.equal(
    isFreshUsableGpsSample(
      { ...sample, longitude: sample.longitude + 360 },
      now,
    ),
    false,
  )
})

test('native fallback retry releases native ownership', () => {
  assert.equal(getRetryPresenceSource('native'), null)
  assert.equal(getRetryPresenceSource('navigator'), 'navigator')
  assert.equal(getRetryPresenceSource(null), null)
})

test('native usability loss continues collection only after a successful sample', () => {
  assert.equal(
    getNativeUsabilityFallbackAction({
      isUsable: false,
      source: 'native',
      status: 'collecting',
    }),
    'retryNavigator',
  )
  assert.equal(
    getNativeUsabilityFallbackAction({
      isUsable: false,
      source: 'native',
      status: 'denied',
    }),
    'release',
  )
  assert.equal(
    getNativeUsabilityFallbackAction({
      isUsable: true,
      source: 'native',
      status: 'collecting',
    }),
    'none',
  )
})

test('denied location selects native recovery only when it is usable', () => {
  assert.equal(
    getCrowdingPreviewMode({
      isEnabled: true,
      isLocationReady: false,
      nativeRecoverySupported: true,
      status: 'denied',
    }),
    'deniedNative',
  )
  assert.equal(
    getCrowdingPreviewMode({
      isEnabled: true,
      isLocationReady: false,
      nativeRecoverySupported: false,
      status: 'denied',
    }),
    'deniedFallback',
  )
})

test('terminal heartbeat failure is visible and explicitly restartable', () => {
  const firstRevision = createCrowdingHeartbeatRevisionKey('trip-1', 1_000)
  const nextRevision = createCrowdingHeartbeatRevisionKey('trip-1', 1_001)
  assert.notEqual(firstRevision, nextRevision)

  const failed = reduceCrowdingHeartbeatState(initialCrowdingHeartbeatState, {
    key: firstRevision,
    retryable: false,
    type: 'failed',
  })
  assert.equal(hasTerminalHeartbeatFailure(failed, firstRevision), true)
  assert.equal(hasTerminalHeartbeatFailure(failed, nextRevision), false)

  const retryingFailure = reduceCrowdingHeartbeatState(failed, {
    key: firstRevision,
    retryable: true,
    type: 'failed',
  })
  assert.deepEqual(retryingFailure, failed)

  const restarted = reduceCrowdingHeartbeatState(failed, {
    key: firstRevision,
    type: 'retryRequested',
  })
  assert.equal(hasTerminalHeartbeatFailure(restarted, firstRevision), false)
  assert.equal(restarted.restartGeneration, 1)

  const recovered = reduceCrowdingHeartbeatState(failed, {
    key: nextRevision,
    type: 'requestStarted',
  })
  assert.equal(recovered.terminalErrorKey, null)
  assert.equal(recovered.restartGeneration, 0)
})

test('terminal heartbeat error overrides the active legend but retryable GPS errors do not', () => {
  assert.equal(
    getCrowdingPreviewMode({
      isEnabled: true,
      isLocationReady: true,
      nativeRecoverySupported: false,
      status: 'heartbeatError',
    }),
    'status',
  )
  assert.equal(
    getCrowdingPreviewMode({
      isEnabled: true,
      isLocationReady: true,
      nativeRecoverySupported: false,
      status: 'error',
    }),
    'active',
  )
})

test('UI status keeps opt-in and permission failures ahead of timetable state', () => {
  const common = {
    classificationStatus: 'insufficient',
    departureStatus: 'loading',
    hasSelectedStop: true,
    hasTrip: false,
    hasTerminalHeartbeatError: false,
    isEnabled: true,
    presenceStatus: 'requesting',
    signalMatchesTrip: false,
  }

  assert.equal(
    deriveCrowdingPresenceUiStatus({ ...common, isEnabled: false }),
    'disabled',
  )
  assert.equal(
    deriveCrowdingPresenceUiStatus({
      ...common,
      presenceStatus: 'denied',
    }),
    'denied',
  )
  assert.equal(deriveCrowdingPresenceUiStatus(common), 'timetableLoading')

  assert.equal(
    deriveCrowdingPresenceUiStatus({
      ...common,
      departureStatus: 'ready',
      hasTerminalHeartbeatError: true,
      hasTrip: true,
      presenceStatus: 'collecting',
    }),
    'heartbeatError',
  )
})
