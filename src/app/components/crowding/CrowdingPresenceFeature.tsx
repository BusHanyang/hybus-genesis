import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { createPresenceSignal } from '@/components/crowding/createPresenceSignal'
import { createSerialHeartbeat } from '@/components/crowding/crowdingHeartbeat'
import {
  crowdingNativeActionClassName,
  type CrowdingPresenceUiStatus,
  CrowdingPreview,
} from '@/components/crowding/CrowdingPreview'
import GpsDebugPanel from '@/components/crowding/GpsDebugPanel'
import NativeGeolocationRecovery, {
  supportsNativeGeolocationRecovery,
} from '@/components/crowding/NativeGeolocationRecovery'
import {
  createScheduledTripId,
  getScheduledTripDescriptorKey,
  type ScheduledTripDescriptor,
} from '@/components/crowding/scheduledTrip'
import { useStopPresence } from '@/components/crowding/useStopPresence'
import type { NextShuttleDeparture } from '@/components/shuttle/Shuttle'
import type { CrowdingStopId } from '@/data/crowding/stopGeometry'
import {
  type CrowdingAggregate,
  CrowdingApiError,
  type CrowdingPresenceRequest,
  type CrowdingPresenceResponse,
  postCrowdingPresence,
} from '@/network/crowding'

const HEARTBEAT_INTERVAL_MILLISECONDS = 20_000

const isRetryableHeartbeatError = (error: unknown): boolean =>
  !(error instanceof CrowdingApiError) ||
  error.status === null ||
  error.status === 429 ||
  error.status >= 500

type HeartbeatPhase = 'error' | 'idle' | 'ready' | 'sending'

type HeartbeatSnapshot = {
  aggregate: CrowdingAggregate | null
  expiresAt: number
  phase: HeartbeatPhase
  tripKey: string | null
}

const emptyHeartbeatSnapshot: HeartbeatSnapshot = {
  aggregate: null,
  expiresAt: 0,
  phase: 'idle',
  tripKey: null,
}

const CrowdingPresenceFeature = ({
  departure,
  isEnabled,
  isSummaryVisible,
  location,
  onDisable,
  onEnable,
  onOpenLocationHelp,
  onRowCrowdingVisibilityChange,
  selectedStopId,
}: {
  departure: NextShuttleDeparture | null
  isEnabled: boolean
  isSummaryVisible: boolean
  location: string
  onDisable: () => void
  onEnable: () => void
  onOpenLocationHelp: () => void
  onRowCrowdingVisibilityChange: (isVisible: boolean) => void
  selectedStopId: CrowdingStopId | null
}) => {
  const presence = useStopPresence(selectedStopId)
  const [heartbeat, setHeartbeat] = useState<HeartbeatSnapshot>(
    emptyHeartbeatSnapshot,
  )
  const [nativeRecoveryUsable, setNativeRecoveryUsable] = useState(true)
  const shouldCollect = isEnabled && isSummaryVisible && selectedStopId !== null
  const wasCollectingRef = useRef(false)
  const {
    classification,
    beginNativeRecovery,
    handleNativePosition,
    handleNativePositionError,
    isActive,
    isPageVisible,
    latestSample,
    permission,
    reset,
    sampleCount,
    source,
    start,
    status,
  } = presence
  const isLocationReady =
    isEnabled && selectedStopId !== null && permission === 'granted'

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
  const nativeRecoverySupported = supportsNativeGeolocationRecovery()
  const signal = useMemo(
    () => createPresenceSignal(classification, latestSample),
    [classification, latestSample],
  )
  const trip: ScheduledTripDescriptor | null = departure?.trip ?? null
  const descriptorKey =
    trip === null ? null : getScheduledTripDescriptorKey(trip)
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
  const heartbeatKey = shouldCollect && isPageVisible ? scheduledTripId : null
  const signalRef = useRef(signal)
  const tripRef = useRef(trip)
  signalRef.current = signal
  tripRef.current = trip

  useEffect(() => {
    const wasCollecting = wasCollectingRef.current
    wasCollectingRef.current = shouldCollect

    if (shouldCollect && !wasCollecting) {
      start()
      return
    }

    if (
      !shouldCollect &&
      (wasCollecting || isActive || status !== 'idle' || sampleCount > 0)
    ) {
      reset()
    }
  }, [isActive, reset, sampleCount, shouldCollect, start, status])

  useEffect(() => {
    const canResume =
      shouldCollect &&
      source === 'navigator' &&
      permission === 'granted' &&
      isPageVisible &&
      !isActive &&
      (status === 'idle' || status === 'paused' || status === 'stopped')

    if (canResume) start()
  }, [
    isActive,
    isPageVisible,
    permission,
    shouldCollect,
    source,
    start,
    status,
  ])

  useEffect(() => {
    if (heartbeatKey === null || descriptorKey === null) return

    const heartbeatController = createSerialHeartbeat<CrowdingPresenceResponse>(
      {
        getRetryDelay: (error) => {
          if (!isRetryableHeartbeatError(error)) return null

          return Math.max(
            HEARTBEAT_INTERVAL_MILLISECONDS,
            error instanceof CrowdingApiError
              ? (error.retryAfterMilliseconds ?? 0)
              : 0,
          )
        },
        intervalMilliseconds: HEARTBEAT_INTERVAL_MILLISECONDS,
        onError: (error) => {
          setHeartbeat((current) => ({
            aggregate:
              current.tripKey === heartbeatKey &&
              isRetryableHeartbeatError(error)
                ? current.aggregate
                : null,
            expiresAt:
              current.tripKey === heartbeatKey &&
              isRetryableHeartbeatError(error)
                ? current.expiresAt
                : 0,
            phase: 'error',
            tripKey: heartbeatKey,
          }))
        },
        onSending: () => {
          setHeartbeat((current) => ({
            aggregate:
              current.tripKey === heartbeatKey ? current.aggregate : null,
            expiresAt: current.tripKey === heartbeatKey ? current.expiresAt : 0,
            phase: 'sending',
            tripKey: heartbeatKey,
          }))
        },
        onSuccess: (response) => {
          setHeartbeat({
            aggregate: response.aggregate,
            expiresAt: Date.now() + response.expiresInSeconds * 1_000,
            phase: 'ready',
            tripKey: heartbeatKey,
          })
        },
        request: (requestSignal) => {
          const currentSignal = signalRef.current
          const currentTrip = tripRef.current
          if (
            currentSignal === null ||
            currentTrip === null ||
            currentSignal.stopId !== currentTrip.stopId ||
            getScheduledTripDescriptorKey(currentTrip) !== descriptorKey
          ) {
            throw new CrowdingApiError('invalid_heartbeat_context', {
              status: 422,
            })
          }

          const currentScheduledTripId = createScheduledTripId(
            currentTrip,
            currentSignal.observedAtMinute,
          )
          if (currentScheduledTripId !== heartbeatKey) {
            throw new CrowdingApiError('invalid_trip_id', { status: 422 })
          }

          const request: CrowdingPresenceRequest = {
            ...currentSignal,
            scheduledTripId: heartbeatKey,
          }
          return postCrowdingPresence(request, { signal: requestSignal })
        },
      },
    )

    heartbeatController.start()
    return heartbeatController.stop
  }, [descriptorKey, heartbeatKey])

  useEffect(() => {
    if (heartbeat.aggregate === null) return

    const remainingMilliseconds = heartbeat.expiresAt - Date.now()
    if (remainingMilliseconds <= 0) {
      setHeartbeat((current) =>
        current.expiresAt === heartbeat.expiresAt
          ? { ...current, aggregate: null }
          : current,
      )
      return
    }

    const expiryTimer = window.setTimeout(() => {
      setHeartbeat((current) =>
        current.expiresAt === heartbeat.expiresAt
          ? { ...current, aggregate: null }
          : current,
      )
    }, remainingMilliseconds + 1)

    return () => window.clearTimeout(expiryTimer)
  }, [heartbeat.aggregate, heartbeat.expiresAt])

  const aggregate =
    signalMatchesTrip &&
    heartbeatKey !== null &&
    heartbeat.tripKey === heartbeatKey &&
    heartbeat.expiresAt > Date.now()
      ? heartbeat.aggregate
      : null
  let uiStatus: CrowdingPresenceUiStatus

  if (selectedStopId === null) {
    uiStatus = 'unsupportedStop'
  } else if (!isEnabled) {
    uiStatus = 'disabled'
  } else if (status === 'denied') {
    uiStatus = 'denied'
  } else if (status === 'unsupported') {
    uiStatus = 'unsupported'
  } else if (departure === null || departure.status === 'loading') {
    uiStatus = 'timetableLoading'
  } else if (departure.status === 'unavailable' || trip === null) {
    uiStatus = 'unavailable'
  } else if (status === 'requesting') {
    uiStatus = 'requesting'
  } else if (status === 'error') {
    uiStatus = 'error'
  } else if (
    classification.status === 'outside' ||
    classification.status === 'transient' ||
    classification.status === 'ambiguous' ||
    (classification.status === 'waiting' && !signalMatchesTrip)
  ) {
    uiStatus = 'outside'
  } else if (signalMatchesTrip && heartbeat.phase === 'sending') {
    uiStatus = 'sending'
  } else if (signalMatchesTrip && heartbeat.phase === 'error') {
    uiStatus = 'error'
  } else if (signalMatchesTrip && aggregate !== null) {
    uiStatus = 'ready'
  } else {
    uiStatus = 'collecting'
  }

  const shouldMountNativeRecovery =
    isEnabled &&
    nativeRecoverySupported &&
    (status === 'denied' || source === 'native')
  const nativeRecoveryControl = shouldMountNativeRecovery ? (
    <NativeGeolocationRecovery
      key="native-geolocation-recovery"
      className={crowdingNativeActionClassName}
      isVisible={status === 'denied' && nativeRecoveryUsable}
      onActivate={beginNativeRecovery}
      onError={handleNativePositionError}
      onPosition={handleNativePosition}
      onUsabilityChange={setNativeRecoveryUsable}
    />
  ) : null

  return (
    <>
      {isSummaryVisible && (
        <CrowdingPreview
          aggregate={aggregate}
          availability={departure?.status ?? 'loading'}
          departureTime={departure?.time}
          isEnabled={isEnabled}
          isLocationReady={isLocationReady}
          location={location}
          nativeRecoveryControl={nativeRecoveryControl}
          nativeRecoverySupported={
            nativeRecoverySupported && nativeRecoveryUsable
          }
          onDisable={handleDisable}
          onEnable={handleEnable}
          onOpenLocationHelp={onOpenLocationHelp}
          status={uiStatus}
        />
      )}
      {import.meta.env.DEV && (
        <GpsDebugPanel
          isParticipating={isEnabled}
          onDisable={handleDisable}
          onEnable={handleEnable}
          presence={presence}
          signal={signal}
        />
      )}
    </>
  )
}

export default CrowdingPresenceFeature
