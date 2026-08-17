import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { classifyNativeGeolocationInvalidReason } from '@/components/crowding/nativeGeolocationUsability'

const VALIDATION_SETTLE_MILLISECONDS = 650

export const supportsNativeGeolocationRecovery = (): boolean =>
  typeof window !== 'undefined' && 'HTMLGeolocationElement' in window

const NativeGeolocationRecovery = ({
  className,
  isVisible,
  onActivate,
  onError,
  onPosition,
  onUsabilityChange,
}: {
  className?: string
  isVisible: boolean
  onActivate: () => void
  onError: (error: GeolocationPositionError) => void
  onPosition: (position: GeolocationPosition) => void
  onUsabilityChange: (isUsable: boolean) => void
}) => {
  const { i18n } = useTranslation()
  const elementRef = useRef<HTMLGeolocationElement>(null)
  const language = i18n.language === 'ko' ? 'ko' : 'en'

  useEffect(() => {
    const element = elementRef.current
    if (element === null) return

    let isWatching = false
    let validationTimer: number | null = null
    const clearValidationTimer = () => {
      if (validationTimer === null) return

      window.clearTimeout(validationTimer)
      validationTimer = null
    }
    const reportCurrentUsability = () => {
      clearValidationTimer()
      onUsabilityChange(element.isValid)
    }
    const scheduleSettledValidation = () => {
      clearValidationTimer()
      validationTimer = window.setTimeout(
        reportCurrentUsability,
        VALIDATION_SETTLE_MILLISECONDS,
      )
    }
    const handleActivate = (event: Event) => {
      if (!element.isValid) {
        event.preventDefault()
        event.stopPropagation()
        onUsabilityChange(false)
        return
      }

      onActivate()
    }
    const handleLocation = () => {
      if (element.position !== null) {
        if (!isWatching) {
          element.watch = true
          isWatching = true
        }
        onPosition(element.position)
      } else if (element.error !== null) {
        element.watch = false
        isWatching = false
        onError(element.error)
      }
    }
    const handleValidationStatusChange = () => {
      if (element.isValid) {
        reportCurrentUsability()
        return
      }

      if (
        classifyNativeGeolocationInvalidReason(element.invalidReason) ===
        'permanent'
      ) {
        clearValidationTimer()
        onUsabilityChange(false)
        return
      }

      scheduleSettledValidation()
    }

    element.autolocate = false
    element.watch = false
    element.addEventListener('click', handleActivate)
    element.addEventListener('promptaction', handleActivate)
    element.addEventListener('location', handleLocation)
    element.addEventListener(
      'validationstatuschange',
      handleValidationStatusChange,
    )
    scheduleSettledValidation()

    return () => {
      clearValidationTimer()
      element.autolocate = false
      element.watch = false
      isWatching = false
      element.removeEventListener('click', handleActivate)
      element.removeEventListener('promptaction', handleActivate)
      element.removeEventListener('location', handleLocation)
      element.removeEventListener(
        'validationstatuschange',
        handleValidationStatusChange,
      )
    }
  }, [onActivate, onError, onPosition, onUsabilityChange])

  return React.createElement('geolocation', {
    accuracymode: 'precise',
    className,
    hidden: !isVisible,
    lang: language,
    ref: elementRef,
  })
}

export default NativeGeolocationRecovery
