import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import { crowdingNetworkIntervals } from '@/components/crowding/crowdingConfig'
import {
  crowdingNativeActionClassName,
  CrowdingPreview,
} from '@/components/crowding/CrowdingPreview'
import {
  canSendCrowdingHeartbeatRequest,
  canSendCrowdingPresence,
  createCrowdingHeartbeatRevisionKey,
  deriveCrowdingPresenceUiStatus,
  getCrowdingLocationReady,
  getNativeUsabilityFallbackAction,
  hasTerminalHeartbeatFailure,
  initialCrowdingHeartbeatState,
  reduceCrowdingHeartbeatState,
} from '@/components/crowding/crowdingState'
import { createPresenceSignal } from '@/components/crowding/gps/createPresenceSignal'
import NativeGeolocationRecovery, {
  supportsNativeGeolocationRecovery,
} from '@/components/crowding/gps/NativeGeolocationRecovery'
import { useStopPresence } from '@/components/crowding/gps/useStopPresence'
import { createSerialHeartbeat } from '@/components/crowding/sync/crowdingHeartbeat'
import { createScheduledTripId } from '@/components/crowding/sync/scheduledTrip'
import type { NextShuttleDeparture } from '@/components/shuttle/Shuttle'
import type { CrowdingStopId } from '@/data/crowding/stopGeometry'
import {
  CrowdingApiError,
  type CrowdingPresenceRequest,
  isRetryableCrowdingRequestError,
  postCrowdingPresence,
} from '@/network/crowding'
import { isCrowdingFieldTestOrigin } from '@/network/crowdingEndpoints'

const FieldTestPanel = lazy(
  () => import('@/components/crowding/field-test/FieldTestPanel'),
)
const fieldTestEnabled = isCrowdingFieldTestOrigin(window.location.origin)
const HEARTBEAT_REQUEST_TIMEOUT_MILLISECONDS = 15_000

class CrowdingHeartbeatContextExpiredError extends Error {
  constructor() {
    super('crowding_heartbeat_context_expired')
    this.name = 'CrowdingHeartbeatContextExpiredError'
  }
}

const isHeartbeatContextExpiredError = (error: unknown): boolean =>
  error instanceof CrowdingHeartbeatContextExpiredError

const CrowdingPresenceFeature = ({
  departure,
  isEnabled,
  isSummaryVisible,
  onDisable,
  onEnable,
  onOpenLocationHelp,
  onRowCrowdingVisibilityChange,
  selectedStopId,
}: {
  departure: NextShuttleDeparture | null
  isEnabled: boolean
  isSummaryVisible: boolean
  onDisable: () => void
  onEnable: () => void
  onOpenLocationHelp: () => void
  onRowCrowdingVisibilityChange: (isVisible: boolean) => void
  selectedStopId: CrowdingStopId | null
}) => {
  const presence = useStopPresence(selectedStopId)
  const [nativeRecoveryUsable, setNativeRecoveryUsable] = useState(true)
  const [heartbeatState, dispatchHeartbeat] = useReducer(
    reduceCrowdingHeartbeatState,
    initialCrowdingHeartbeatState,
  )
  const heartbeatScheduleRef = useRef({ nextRequestAt: 0 })
  const shouldCollect = isEnabled && isSummaryVisible && selectedStopId !== null
  const {
    classification,
    beginNativeRecovery,
    handleNativePosition,
    handleNativePositionError,
    hasFreshPosition,
    isPageVisible,
    latestSample,
    permission,
    releaseNativeRecovery,
    reset,
    retry,
    source,
    start,
    status,
  } = presence
  const nativeRecoveryStateRef = useRef({ source, status })
  nativeRecoveryStateRef.current = { source, status }
  const isLocationReady = getCrowdingLocationReady({
    hasFreshPosition,
    hasSelectedStop: selectedStopId !== null,
    isEnabled,
    permission,
  })

  useLayoutEffect(() => {
    onRowCrowdingVisibilityChange(isLocationReady)
  }, [isLocationReady, onRowCrowdingVisibilityChange])

  const handleEnable = useCallback(() => {
    onEnable()
    start()
  }, [onEnable, start])
  const handleDisable = useCallback(() => {
    reset()
    onDisable()
  }, [onDisable, reset])
  const handleNativeUsabilityChange = useCallback(
    (isUsable: boolean) => {
      setNativeRecoveryUsable(isUsable)
      const currentNativeState = nativeRecoveryStateRef.current
      const fallbackAction = getNativeUsabilityFallbackAction({
        isUsable,
        source: currentNativeState.source,
        status: currentNativeState.status,
      })
      if (fallbackAction === 'retryNavigator') retry()
      else if (fallbackAction === 'release') releaseNativeRecovery()
    },
    [releaseNativeRecovery, retry],
  )
  const nativeRecoverySupported = supportsNativeGeolocationRecovery()
  const signal = useMemo(
    () => createPresenceSignal(classification, latestSample),
    [classification, latestSample],
  )
  const trip = departure?.trip ?? null
  const signalMatchesTrip =
    signal !== null &&
    trip !== null &&
    selectedStopId !== null &&
    signal.stopId === selectedStopId &&
    trip.stopId === signal.stopId
  const scheduledTripId =
    signalMatchesTrip && trip !== null && signal !== null
      ? createScheduledTripId(trip, signal.observedAtMinute)
      : null
  const canSend = canSendCrowdingPresence({
    hasFreshPosition,
    hasScheduledTrip: scheduledTripId !== null,
    isEnabled,
    isPageVisible,
    isSummaryVisible,
    permission,
    presenceStatus: status,
  })
  const heartbeatRevisionKey =
    canSend && scheduledTripId !== null && signal !== null
      ? createCrowdingHeartbeatRevisionKey(
          scheduledTripId,
          signal.observedAtMinute,
        )
      : null
  const hasTerminalHeartbeatError = hasTerminalHeartbeatFailure(
    heartbeatState,
    heartbeatRevisionKey,
  )
  const heartbeatContextRef = useRef({ canSend, latestSample, signal, trip })
  heartbeatContextRef.current = { canSend, latestSample, signal, trip }
  const handleRetry = useCallback(() => {
    if (heartbeatRevisionKey !== null && hasTerminalHeartbeatError) {
      dispatchHeartbeat({
        key: heartbeatRevisionKey,
        type: 'retryRequested',
      })
      return
    }

    retry()
  }, [hasTerminalHeartbeatError, heartbeatRevisionKey, retry])

  useEffect(() => {
    if (shouldCollect) start()
    else reset()
  }, [reset, shouldCollect, start])

  useEffect(() => {
    if (heartbeatRevisionKey === null || scheduledTripId === null) return

    const heartbeatController = createSerialHeartbeat({
      getRetryDelay: (error) => {
        if (
          isHeartbeatContextExpiredError(error) ||
          !isRetryableCrowdingRequestError(error)
        ) {
          return null
        }

        return Math.max(
          crowdingNetworkIntervals.heartbeatMilliseconds,
          error instanceof CrowdingApiError
            ? (error.retryAfterMilliseconds ?? 0)
            : 0,
        )
      },
      intervalMilliseconds: crowdingNetworkIntervals.heartbeatMilliseconds,
      onError: (error) => {
        if (isHeartbeatContextExpiredError(error)) return

        dispatchHeartbeat({
          key: heartbeatRevisionKey,
          retryable: isRetryableCrowdingRequestError(error),
          type: 'failed',
        })
      },
      onSending: () => {
        dispatchHeartbeat({
          key: heartbeatRevisionKey,
          type: 'requestStarted',
        })
      },
      request: (requestSignal) => {
        const context = heartbeatContextRef.current
        if (
          !canSendCrowdingHeartbeatRequest({
            canSend: context.canSend,
            latestSample: context.latestSample,
            now: Date.now(),
          })
        ) {
          throw new CrowdingHeartbeatContextExpiredError()
        }

        if (
          context.signal === null ||
          context.trip === null ||
          context.signal.stopId !== context.trip.stopId
        ) {
          throw new CrowdingApiError('invalid_heartbeat_context', {
            status: 422,
          })
        }

        const currentScheduledTripId = createScheduledTripId(
          context.trip,
          context.signal.observedAtMinute,
        )
        if (
          currentScheduledTripId !== scheduledTripId ||
          createCrowdingHeartbeatRevisionKey(
            scheduledTripId,
            context.signal.observedAtMinute,
          ) !== heartbeatRevisionKey
        ) {
          throw new CrowdingApiError('invalid_heartbeat_context', {
            status: 422,
          })
        }

        const request: CrowdingPresenceRequest = {
          ...context.signal,
          scheduledTripId,
        }
        return postCrowdingPresence(request, { signal: requestSignal })
      },
      requestTimeoutMilliseconds: HEARTBEAT_REQUEST_TIMEOUT_MILLISECONDS,
      scheduleState: heartbeatScheduleRef.current,
    })

    heartbeatController.start()
    return heartbeatController.stop
  }, [heartbeatRevisionKey, heartbeatState.restartGeneration, scheduledTripId])

  const uiStatus = deriveCrowdingPresenceUiStatus({
    classificationStatus: classification.status,
    departureStatus: departure?.status ?? 'loading',
    hasSelectedStop: selectedStopId !== null,
    hasTrip: trip !== null,
    hasTerminalHeartbeatError,
    isEnabled,
    presenceStatus: status,
    signalMatchesTrip,
  })
  const shouldMountNativeRecovery =
    isEnabled &&
    nativeRecoverySupported &&
    nativeRecoveryUsable &&
    (status === 'denied' || source === 'native')
  const nativeRecoveryControl = shouldMountNativeRecovery ? (
    <NativeGeolocationRecovery
      className={crowdingNativeActionClassName}
      isVisible={status === 'denied'}
      onActivate={beginNativeRecovery}
      onError={handleNativePositionError}
      onPosition={handleNativePosition}
      onUsabilityChange={handleNativeUsabilityChange}
    />
  ) : null

  return (
    <>
      {isSummaryVisible && (
        <CrowdingPreview
          isEnabled={isEnabled}
          isLocationReady={isLocationReady}
          nativeRecoveryControl={nativeRecoveryControl}
          onDisable={handleDisable}
          onEnable={handleEnable}
          onOpenLocationHelp={onOpenLocationHelp}
          onRetry={handleRetry}
          status={uiStatus}
          stopId={selectedStopId}
        />
      )}
      {fieldTestEnabled && (
        <Suspense fallback={null}>
          <FieldTestPanel
            canSend={canSend}
            departure={departure}
            hasTerminalHeartbeatError={hasTerminalHeartbeatError}
            isParticipating={isEnabled}
            isSummaryVisible={isSummaryVisible}
            nextRequestAt={() => heartbeatScheduleRef.current.nextRequestAt}
            onDisable={handleDisable}
            onEnable={handleEnable}
            onRetry={handleRetry}
            presence={presence}
            scheduledTripId={scheduledTripId}
            selectedStopId={selectedStopId}
            signal={signal}
          />
        </Suspense>
      )}
    </>
  )
}

export default CrowdingPresenceFeature
