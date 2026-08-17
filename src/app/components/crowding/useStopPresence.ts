import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  classifyStopPresence,
  type GpsSample,
} from '@/components/crowding/classifyStopPresence'
import {
  crowdingStopAnchors,
  type CrowdingStopId,
} from '@/data/crowding/stopGeometry'

export type StopPresenceStatus =
  | 'collecting'
  | 'denied'
  | 'error'
  | 'idle'
  | 'paused'
  | 'requesting'
  | 'stopped'
  | 'unsupported'

export type StopPresenceErrorCode =
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'unknown'

export type StopPresencePermission = PermissionState | 'unknown' | 'unsupported'
export type StopPresenceSource = 'native' | 'navigator' | null

const MAX_SAMPLE_AGE_MILLISECONDS = 2 * 60 * 1000
const MAX_SAMPLE_COUNT = 60
const RETRY_DELAYS_MILLISECONDS = [5_000, 15_000, 30_000] as const

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
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null)
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
    setRetryAttempt(0)
    setNextRetryAt(null)
  }, [clearRetryTimer])

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
      const cutoff = Date.now() - MAX_SAMPLE_AGE_MILLISECONDS

      setSamples((currentSamples) =>
        [
          ...currentSamples.filter((sample) => sample.timestamp >= cutoff),
          nextSample,
        ].slice(-MAX_SAMPLE_COUNT),
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
      setNextRetryAt(null)
      return
    }

    const nextAttempt = retryAttemptRef.current + 1
    const delay =
      RETRY_DELAYS_MILLISECONDS[
        Math.min(nextAttempt - 1, RETRY_DELAYS_MILLISECONDS.length - 1)
      ]
    retryAttemptRef.current = nextAttempt
    setRetryAttempt(nextAttempt)
    setNextRetryAt(Date.now() + delay)
    retryTimeoutRef.current = window.setTimeout(() => {
      retryTimeoutRef.current = null
      setNextRetryAt(null)
      startWatchRef.current()
    }, delay)
  }, [clearRetryTimer])

  const handlePositionError = useCallback(
    (error: GeolocationPositionError) => {
      if (sourceRef.current !== 'navigator') return
      clearActiveWatch()

      if (!shouldCollectRef.current) return

      if (error.code === error.PERMISSION_DENIED) {
        shouldCollectRef.current = false
        resetRetryState()
        setErrorCode('permission_denied')
        setPermission('denied')
        setStatus('denied')
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setErrorCode('position_unavailable')
        setStatus('error')
        scheduleRetry()
      } else if (error.code === error.TIMEOUT) {
        setErrorCode('timeout')
        setStatus('error')
        scheduleRetry()
      } else {
        setErrorCode('unknown')
        setStatus('error')
        scheduleRetry()
      }
    },
    [clearActiveWatch, resetRetryState, scheduleRetry],
  )

  const startWatch = useCallback(() => {
    clearRetryTimer()
    setNextRetryAt(null)

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
      clearActiveWatch()
      resetRetryState()
      setSourceMode('native')
      const isDenied = error.code === error.PERMISSION_DENIED
      setPermission(isDenied ? 'denied' : 'unknown')
      setErrorCode(
        error.code === error.PERMISSION_DENIED
          ? 'permission_denied'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'position_unavailable'
            : error.code === error.TIMEOUT
              ? 'timeout'
              : 'unknown',
      )
      if (isDenied) shouldCollectRef.current = false
      setStatus(isDenied ? 'denied' : 'error')
    },
    [clearActiveWatch, resetRetryState, setSourceMode],
  )

  const stop = useCallback(() => {
    shouldCollectRef.current = false
    resetRetryState()
    clearActiveWatch()
    setSourceMode(null)
    setErrorCode(null)
    setStatus((currentStatus) =>
      currentStatus === 'idle' ? 'idle' : 'stopped',
    )
  }, [clearActiveWatch, resetRetryState, setSourceMode])

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
        shouldCollectRef.current = false
        resetRetryState()
        clearActiveWatch()
        setErrorCode('permission_denied')
        setStatus('denied')
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
  }, [clearActiveWatch, resetRetryState])

  useEffect(() => {
    const pruneExpiredSamples = window.setInterval(() => {
      const cutoff = Date.now() - MAX_SAMPLE_AGE_MILLISECONDS

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
        setNextRetryAt(null)
        clearActiveWatch()
        if (shouldCollectRef.current) setStatus('paused')
      } else if (shouldCollectRef.current) {
        if (sourceRef.current === 'native') {
          setStatus('requesting')
        } else {
          startWatchRef.current()
        }
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

  return {
    classification,
    beginNativeRecovery,
    errorCode,
    handleNativePosition,
    handleNativePositionError,
    isActive: status === 'collecting' || status === 'requesting',
    isPageVisible,
    latestSample: samples.at(-1) ?? null,
    nextRetryAt,
    permission,
    reset,
    retryAttempt,
    sampleCount: samples.length,
    selectedStopId,
    source,
    start,
    status,
    stop,
  }
}

export type StopPresenceController = ReturnType<typeof useStopPresence>
