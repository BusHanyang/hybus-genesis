import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  classifyStopPresence,
  type GpsSample,
  isFreshUsableGpsSample,
} from '@/components/crowding/gps/classifyStopPresence'
import {
  crowdingStopAnchors,
  type CrowdingStopId,
} from '@/data/crowding/stopGeometry'

import { crowdingPresencePolicy } from '../crowdingConfig'
import { appendCrowdingSample, getRetryPresenceSource } from '../crowdingState'

export type StopPresenceStatus =
  | 'collecting'
  | 'denied'
  | 'error'
  | 'idle'
  | 'paused'
  | 'requesting'
  | 'unsupported'

export type StopPresenceErrorCode =
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'unknown'

export type StopPresencePermission = PermissionState | 'unknown' | 'unsupported'
export type StopPresenceSource = 'native' | 'navigator' | null

const RETRY_DELAYS_MILLISECONDS = [5_000, 15_000, 30_000] as const

const getGeolocationErrorCode = (
  error: GeolocationPositionError,
): StopPresenceErrorCode => {
  if (error.code === error.PERMISSION_DENIED) return 'permission_denied'
  if (error.code === error.POSITION_UNAVAILABLE) return 'position_unavailable'
  if (error.code === error.TIMEOUT) return 'timeout'
  return 'unknown'
}

export const useStopPresence = (selectedStopId: CrowdingStopId | null) => {
  const watchIdRef = useRef<number | null>(null)
  const retryTimeoutRef = useRef<number | null>(null)
  const retryAttemptRef = useRef(0)
  const shouldCollectRef = useRef(false)
  const sourceRef = useRef<StopPresenceSource>(null)
  const startWatchRef = useRef<() => void>(() => undefined)
  const isPageVisibleRef = useRef(document.visibilityState === 'visible')
  const [status, setStatus] = useState<StopPresenceStatus>('idle')
  const [errorCode, setErrorCode] = useState<StopPresenceErrorCode | null>(null)
  const [permission, setPermission] = useState<StopPresencePermission>(
    'geolocation' in navigator ? 'unknown' : 'unsupported',
  )
  const [isPageVisible, setIsPageVisible] = useState(isPageVisibleRef.current)
  const [samples, setSamples] = useState<ReadonlyArray<GpsSample>>([])
  const [source, setSource] = useState<StopPresenceSource>(null)

  const setSourceMode = useCallback((nextSource: StopPresenceSource) => {
    sourceRef.current = nextSource
    setSource(nextSource)
  }, [])

  const clearActiveWatch = useCallback(() => {
    if (watchIdRef.current === null || !('geolocation' in navigator)) return

    navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
  }, [])

  const clearRetryTimer = useCallback(() => {
    if (retryTimeoutRef.current === null) return

    window.clearTimeout(retryTimeoutRef.current)
    retryTimeoutRef.current = null
  }, [])

  const resetRetryState = useCallback(() => {
    clearRetryTimer()
    retryAttemptRef.current = 0
  }, [clearRetryTimer])

  const markPermissionDenied = useCallback(
    (nextSource: StopPresenceSource) => {
      shouldCollectRef.current = false
      resetRetryState()
      clearActiveWatch()
      setSourceMode(nextSource)
      setErrorCode('permission_denied')
      setPermission('denied')
      setStatus('denied')
    },
    [clearActiveWatch, resetRetryState, setSourceMode],
  )

  const recordPosition = useCallback(
    (
      position: GeolocationPosition,
      nextSource: Exclude<StopPresenceSource, null>,
    ) => {
      const nextSample: GpsSample = {
        accuracyMeters: position.coords.accuracy,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speedMetersPerSecond: position.coords.speed,
        timestamp: position.timestamp,
      }
      const cutoff =
        Date.now() - crowdingPresencePolicy.maxSampleAgeMilliseconds

      setSamples((currentSamples) =>
        appendCrowdingSample(currentSamples, nextSample, {
          cutoffTimestamp: cutoff,
          maxSampleCount: crowdingPresencePolicy.maxSampleCount,
        }),
      )
      resetRetryState()
      setSourceMode(nextSource)
      setErrorCode(null)
      setPermission('granted')
      setStatus('collecting')
    },
    [resetRetryState, setSourceMode],
  )

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      if (sourceRef.current !== 'navigator') return
      recordPosition(position, 'navigator')
    },
    [recordPosition],
  )

  const scheduleRetry = useCallback(() => {
    clearRetryTimer()

    if (!shouldCollectRef.current || !isPageVisibleRef.current) {
      return
    }

    const nextAttempt = retryAttemptRef.current + 1
    const delay =
      RETRY_DELAYS_MILLISECONDS[
        Math.min(nextAttempt - 1, RETRY_DELAYS_MILLISECONDS.length - 1)
      ]
    retryAttemptRef.current = nextAttempt
    retryTimeoutRef.current = window.setTimeout(() => {
      retryTimeoutRef.current = null
      startWatchRef.current()
    }, delay)
  }, [clearRetryTimer])

  const handlePositionError = useCallback(
    (error: GeolocationPositionError) => {
      if (sourceRef.current !== 'navigator') return
      if (!shouldCollectRef.current) return

      if (error.code === error.PERMISSION_DENIED) {
        markPermissionDenied(null)
      } else {
        clearActiveWatch()
        setErrorCode(getGeolocationErrorCode(error))
        setStatus('error')
        scheduleRetry()
      }
    },
    [clearActiveWatch, markPermissionDenied, scheduleRetry],
  )

  const startWatch = useCallback(() => {
    clearRetryTimer()

    if (!shouldCollectRef.current || !isPageVisibleRef.current) return
    if (sourceRef.current === 'native') return
    if (watchIdRef.current !== null) return
    if (!('geolocation' in navigator)) {
      shouldCollectRef.current = false
      setErrorCode(null)
      setPermission('unsupported')
      setStatus('unsupported')
      return
    }

    setErrorCode(null)
    setStatus('requesting')
    setSourceMode('navigator')
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 15_000,
      },
    )
  }, [clearRetryTimer, handlePosition, handlePositionError, setSourceMode])

  useEffect(() => {
    startWatchRef.current = startWatch
  }, [startWatch])

  const start = useCallback(() => {
    shouldCollectRef.current = true
    resetRetryState()
    if (sourceRef.current === 'native') return
    startWatchRef.current()
  }, [resetRetryState])

  const beginNativeRecovery = useCallback(() => {
    shouldCollectRef.current = true
    resetRetryState()
    clearActiveWatch()
    setSourceMode('native')
    setErrorCode(null)
  }, [clearActiveWatch, resetRetryState, setSourceMode])

  const releaseNativeRecovery = useCallback(() => {
    if (sourceRef.current !== 'native') return
    setSourceMode(null)
  }, [setSourceMode])

  const retry = useCallback(() => {
    shouldCollectRef.current = true
    resetRetryState()
    clearActiveWatch()

    const nextSource = getRetryPresenceSource(sourceRef.current)
    if (nextSource !== sourceRef.current) setSourceMode(nextSource)
    startWatchRef.current()
  }, [clearActiveWatch, resetRetryState, setSourceMode])

  const handleNativePosition = useCallback(
    (position: GeolocationPosition) => {
      if (!shouldCollectRef.current || sourceRef.current !== 'native') {
        return
      }
      clearActiveWatch()
      recordPosition(position, 'native')
    },
    [clearActiveWatch, recordPosition],
  )

  const handleNativePositionError = useCallback(
    (error: GeolocationPositionError) => {
      if (!shouldCollectRef.current || sourceRef.current !== 'native') {
        return
      }
      const isDenied = error.code === error.PERMISSION_DENIED
      if (isDenied) {
        markPermissionDenied('native')
      } else {
        clearActiveWatch()
        resetRetryState()
        setSourceMode(null)
        setPermission('unknown')
        setErrorCode(getGeolocationErrorCode(error))
        setStatus('error')
      }
    },
    [clearActiveWatch, markPermissionDenied, resetRetryState, setSourceMode],
  )

  const reset = useCallback(() => {
    shouldCollectRef.current = false
    resetRetryState()
    clearActiveWatch()
    setSourceMode(null)
    setErrorCode(null)
    setSamples([])
    setStatus('idle')
  }, [clearActiveWatch, resetRetryState, setSourceMode])

  useEffect(() => {
    if (!('permissions' in navigator)) return

    let disposed = false
    let permissionStatus: PermissionStatus | null = null
    const handlePermissionChange = () => {
      if (permissionStatus === null) return

      setPermission(permissionStatus.state)
      if (
        permissionStatus.state === 'denied' &&
        shouldCollectRef.current &&
        sourceRef.current !== 'native'
      ) {
        markPermissionDenied(null)
      }
    }

    void navigator.permissions
      .query({ name: 'geolocation' })
      .then((nextPermissionStatus) => {
        if (disposed) return
        permissionStatus = nextPermissionStatus
        handlePermissionChange()
        permissionStatus.addEventListener('change', handlePermissionChange)
      })
      .catch(() => {
        if (!disposed) setPermission('unknown')
      })

    return () => {
      disposed = true
      permissionStatus?.removeEventListener('change', handlePermissionChange)
    }
  }, [markPermissionDenied])

  useEffect(() => {
    const pruneExpiredSamples = window.setInterval(() => {
      const cutoff =
        Date.now() - crowdingPresencePolicy.maxSampleAgeMilliseconds

      setSamples((currentSamples) => {
        const recentSamples = currentSamples.filter(
          (sample) => sample.timestamp >= cutoff,
        )

        return recentSamples.length === currentSamples.length
          ? currentSamples
          : recentSamples
      })
    }, 5_000)

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      isPageVisibleRef.current = isVisible
      setIsPageVisible(isVisible)

      if (!isVisible) {
        if (sourceRef.current === 'native') {
          if (shouldCollectRef.current) {
            setSourceMode(null)
            setStatus('paused')
          }
          return
        }
        clearRetryTimer()
        clearActiveWatch()
        if (shouldCollectRef.current) setStatus('paused')
      } else if (shouldCollectRef.current) {
        startWatchRef.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      shouldCollectRef.current = false
      window.clearInterval(pruneExpiredSamples)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearRetryTimer()
      clearActiveWatch()
    }
  }, [clearActiveWatch, clearRetryTimer, setSourceMode])

  const classification = useMemo(
    () =>
      classifyStopPresence(samples, crowdingStopAnchors, {
        selectedStopId,
      }),
    [samples, selectedStopId],
  )
  const latestSample = samples.at(-1) ?? null
  const hasFreshPosition = isFreshUsableGpsSample(latestSample, Date.now())

  return {
    classification,
    beginNativeRecovery,
    errorCode,
    handleNativePosition,
    handleNativePositionError,
    hasFreshPosition,
    isPageVisible,
    latestSample,
    permission,
    releaseNativeRecovery,
    reset,
    retry,
    sampleCount: samples.length,
    source,
    start,
    status,
  }
}

export type StopPresenceController = ReturnType<typeof useStopPresence>
