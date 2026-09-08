import {
  type GpsSample,
  isFreshUsableGpsSample,
  type PresenceClassificationStatus,
} from './gps/classifyStopPresence.ts'
import type {
  StopPresencePermission,
  StopPresenceSource,
  StopPresenceStatus,
} from './gps/useStopPresence'

export type CrowdingPresenceUiStatus =
  | 'collecting'
  | 'denied'
  | 'disabled'
  | 'error'
  | 'heartbeatError'
  | 'outside'
  | 'requesting'
  | 'timetableLoading'
  | 'unavailable'
  | 'unsupported'
  | 'unsupportedStop'

export type CrowdingPreviewMode =
  | 'active'
  | 'deniedFallback'
  | 'deniedNative'
  | 'disabled'
  | 'status'

type NativeUsabilityFallbackAction = 'none' | 'release' | 'retryNavigator'

export type CrowdingHeartbeatState = {
  restartGeneration: number
  terminalErrorKey: string | null
}

export type CrowdingHeartbeatEvent =
  | {
      key: string
      retryable: boolean
      type: 'failed'
    }
  | {
      key: string
      type: 'requestStarted'
    }
  | {
      key: string
      type: 'retryRequested'
    }

export const initialCrowdingHeartbeatState: CrowdingHeartbeatState = {
  restartGeneration: 0,
  terminalErrorKey: null,
}

export const reduceCrowdingHeartbeatState = (
  state: CrowdingHeartbeatState,
  event: CrowdingHeartbeatEvent,
): CrowdingHeartbeatState => {
  if (event.type === 'failed') {
    if (event.retryable) return state
    if (state.terminalErrorKey === event.key) return state

    return { ...state, terminalErrorKey: event.key }
  }

  if (event.type === 'retryRequested') {
    return {
      restartGeneration: state.restartGeneration + 1,
      terminalErrorKey:
        state.terminalErrorKey === event.key ? null : state.terminalErrorKey,
    }
  }

  if (state.terminalErrorKey === null) return state
  return { ...state, terminalErrorKey: null }
}

export const hasTerminalHeartbeatFailure = (
  state: CrowdingHeartbeatState,
  heartbeatKey: string | null,
): boolean => heartbeatKey !== null && state.terminalErrorKey === heartbeatKey

export const getRetryPresenceSource = (
  source: StopPresenceSource,
): StopPresenceSource => (source === 'native' ? null : source)

export const createCrowdingHeartbeatRevisionKey = (
  scheduledTripId: string,
  observedAtMinute: number,
): string => JSON.stringify([scheduledTripId, observedAtMinute])

export const appendCrowdingSample = <Sample extends { timestamp: number }>(
  currentSamples: ReadonlyArray<Sample>,
  nextSample: Sample,
  {
    cutoffTimestamp,
    maxSampleCount,
  }: {
    cutoffTimestamp: number
    maxSampleCount: number
  },
): ReadonlyArray<Sample> => {
  if (!Number.isInteger(maxSampleCount) || maxSampleCount <= 0) return []

  const samplesByTimestamp = new Map<number, Sample>()
  for (const sample of [...currentSamples, nextSample]) {
    if (
      !Number.isFinite(sample.timestamp) ||
      sample.timestamp < cutoffTimestamp
    ) {
      continue
    }
    samplesByTimestamp.set(sample.timestamp, sample)
  }

  return [...samplesByTimestamp.values()]
    .sort((first, second) => first.timestamp - second.timestamp)
    .slice(-maxSampleCount)
}

export const getNativeUsabilityFallbackAction = ({
  isUsable,
  source,
  status,
}: {
  isUsable: boolean
  source: StopPresenceSource
  status: StopPresenceStatus
}): NativeUsabilityFallbackAction => {
  if (isUsable || source !== 'native') return 'none'
  return status === 'collecting' ? 'retryNavigator' : 'release'
}

export const getCrowdingLocationReady = ({
  hasFreshPosition,
  hasSelectedStop,
  isEnabled,
  permission,
}: {
  hasFreshPosition: boolean
  hasSelectedStop: boolean
  isEnabled: boolean
  permission: StopPresencePermission
}): boolean =>
  hasFreshPosition && hasSelectedStop && isEnabled && permission === 'granted'

export const canSendCrowdingHeartbeatRequest = ({
  canSend,
  latestSample,
  now,
}: {
  canSend: boolean
  latestSample: GpsSample | null
  now: number
}): boolean => canSend && isFreshUsableGpsSample(latestSample, now)

export const deriveCrowdingPresenceUiStatus = ({
  classificationStatus,
  departureStatus,
  hasSelectedStop,
  hasTrip,
  hasTerminalHeartbeatError,
  isEnabled,
  presenceStatus,
  signalMatchesTrip,
}: {
  classificationStatus: PresenceClassificationStatus
  departureStatus: 'loading' | 'ready' | 'unavailable'
  hasSelectedStop: boolean
  hasTrip: boolean
  hasTerminalHeartbeatError: boolean
  isEnabled: boolean
  presenceStatus: StopPresenceStatus
  signalMatchesTrip: boolean
}): CrowdingPresenceUiStatus => {
  if (!hasSelectedStop) return 'unsupportedStop'
  if (!isEnabled) return 'disabled'
  if (presenceStatus === 'denied') return 'denied'
  if (presenceStatus === 'unsupported') return 'unsupported'
  if (departureStatus === 'loading') return 'timetableLoading'
  if (departureStatus === 'unavailable' || !hasTrip) return 'unavailable'
  if (presenceStatus === 'requesting') return 'requesting'
  if (presenceStatus === 'error') return 'error'
  if (hasTerminalHeartbeatError) return 'heartbeatError'
  if (
    classificationStatus === 'outside' ||
    classificationStatus === 'transient' ||
    classificationStatus === 'ambiguous' ||
    (classificationStatus === 'waiting' && !signalMatchesTrip)
  ) {
    return 'outside'
  }
  return 'collecting'
}

export const canSendCrowdingPresence = ({
  hasFreshPosition,
  hasScheduledTrip,
  isEnabled,
  isPageVisible,
  isSummaryVisible,
  permission,
  presenceStatus,
}: {
  hasFreshPosition: boolean
  hasScheduledTrip: boolean
  isEnabled: boolean
  isPageVisible: boolean
  isSummaryVisible: boolean
  permission: StopPresencePermission
  presenceStatus: StopPresenceStatus
}): boolean =>
  hasFreshPosition &&
  hasScheduledTrip &&
  isEnabled &&
  isPageVisible &&
  isSummaryVisible &&
  permission === 'granted' &&
  presenceStatus === 'collecting'

export const getCrowdingPreviewMode = ({
  isEnabled,
  isLocationReady,
  nativeRecoverySupported,
  status,
}: {
  isEnabled: boolean
  isLocationReady: boolean
  nativeRecoverySupported: boolean
  status: CrowdingPresenceUiStatus
}): CrowdingPreviewMode => {
  if (!isEnabled) return 'disabled'
  if (status === 'heartbeatError') return 'status'
  if (isLocationReady) return 'active'
  if (status !== 'denied') return 'status'
  return nativeRecoverySupported ? 'deniedNative' : 'deniedFallback'
}
