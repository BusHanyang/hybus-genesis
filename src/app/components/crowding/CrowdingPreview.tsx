import React from 'react'
import { useTranslation } from 'react-i18next'

import type { CrowdingStopId } from '../../data/crowding/stopGeometry'
import {
  type CrowdingPresenceUiStatus,
  getCrowdingPreviewMode,
} from './crowdingState'

export type CrowdingLevel =
  | 'busy'
  | 'insufficient'
  | 'loading'
  | 'normal'
  | 'relaxed'
  | 'unavailable'

type CrowdingPreviewProps = {
  isEnabled: boolean
  isLocationReady: boolean
  nativeRecoveryControl: React.ReactNode
  onDisable: () => void
  onEnable: () => void
  onOpenLocationHelp: () => void
  onRetry: () => void
  status: CrowdingPresenceUiStatus
  stopId: CrowdingStopId | null
}

export const crowdingCompactActionClassName =
  'min-h-8 shrink-0 rounded-md border border-theme-border px-2.5 py-1 text-[11px] font-medium opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2'
export const crowdingNativeActionClassName =
  'relative z-[3] min-h-6 shrink-0 rounded-md border border-theme-border bg-theme-card px-2.5 py-1 [font-size:small] font-medium text-theme-text opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2'

const compactCardClassName =
  'mb-3 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-left text-theme-text shadow-theme-shadow transition-colors hm:px-3'

const crowdingLevelConfig = {
  busy: {
    labelKey: 'crowding_level_busy',
    shortLabelKey: 'crowding_level_busy_short',
    tone: 'border-rose-300 bg-rose-100 text-rose-900',
  },
  insufficient: {
    labelKey: 'crowding_level_insufficient',
    shortLabelKey: 'crowding_level_insufficient_short',
    tone: 'border-theme-border bg-theme-main text-theme-text',
  },
  loading: {
    labelKey: 'crowding_level_loading',
    shortLabelKey: 'crowding_level_loading',
    tone: 'border-theme-border bg-theme-main text-theme-text',
  },
  normal: {
    labelKey: 'crowding_level_normal',
    shortLabelKey: 'crowding_level_normal_short',
    tone: 'border-amber-300 bg-amber-100 text-amber-900',
  },
  relaxed: {
    labelKey: 'crowding_level_relaxed',
    shortLabelKey: 'crowding_level_relaxed_short',
    tone: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  },
  unavailable: {
    labelKey: 'crowding_level_unavailable',
    shortLabelKey: 'crowding_level_unavailable',
    tone: 'border-theme-border bg-theme-main text-theme-text',
  },
} as const

const crowdingLegendLevels = [
  'relaxed',
  'normal',
  'busy',
  'insufficient',
] as const

const statusMessageKeys: Record<CrowdingPresenceUiStatus, string> = {
  collecting: 'crowding_status_collecting',
  denied: 'crowding_status_denied_compact',
  disabled: 'crowding_status_disabled',
  error: 'crowding_status_error',
  heartbeatError: 'crowding_status_error',
  outside: 'crowding_status_outside',
  requesting: 'crowding_status_requesting',
  timetableLoading: 'crowding_status_timetable_loading',
  unavailable: 'crowding_status_unavailable',
  unsupported: 'crowding_status_unsupported',
  unsupportedStop: 'crowding_status_unsupported_stop',
}

export const CrowdingLevelChip = ({ level }: { level: CrowdingLevel }) => {
  const { t } = useTranslation()
  const config = crowdingLevelConfig[level]

  return (
    <span
      aria-label={t('crowding_level_aria', { level: t(config.labelKey) })}
      className={`relative -top-px ml-2 inline-flex h-6 w-12 shrink-0 items-center justify-center align-middle rounded-full border text-xs font-bold hm:ml-1 hm:w-10 hm:text-[0.7rem] ${config.tone}`}
      data-crowding-level={level}
    >
      {t(config.shortLabelKey)}
    </span>
  )
}

export const CrowdingPreview = ({
  isEnabled,
  isLocationReady,
  nativeRecoveryControl,
  onDisable,
  onEnable,
  onOpenLocationHelp,
  onRetry,
  status,
  stopId,
}: CrowdingPreviewProps) => {
  const { t } = useTranslation()
  const isParticipatingStop = stopId !== null
  const mode = getCrowdingPreviewMode({
    isEnabled,
    isLocationReady,
    nativeRecoverySupported: nativeRecoveryControl !== null,
    status,
  })

  if (mode === 'active') {
    return (
      <section
        className="mb-3 grid min-h-11 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-left text-theme-text shadow-theme-shadow transition-colors shuttlei:grid-cols-1 shuttlei:justify-items-center shuttlei:gap-x-0 shuttlei:gap-y-1 hm:px-3"
        data-component="shuttle-crowding-summary"
        data-presence-status={status}
        data-stop={stopId ?? 'unsupported'}
      >
        <span aria-hidden="true" className="shuttlei:hidden" />
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 justify-self-center">
          {crowdingLegendLevels.map((level) => {
            const config = crowdingLevelConfig[level]
            return (
              <span
                className="inline-flex items-center gap-1.5 text-base leading-4 rt1:text-sm rt2:text-xs"
                key={level}
              >
                <span
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 rounded-full border rt1:h-2.5 rt1:w-2.5 ${config.tone}`}
                />
                {t(
                  level === 'insufficient'
                    ? config.labelKey
                    : config.shortLabelKey,
                )}
              </span>
            )
          })}
        </div>
        <button
          className="min-h-8 shrink-0 justify-self-end px-2 text-xs underline opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 shuttlei:justify-self-center"
          type="button"
          onClick={onDisable}
        >
          {t('crowding_location_disable')}
        </button>
        {nativeRecoveryControl}
      </section>
    )
  }

  const deniedFallback = mode === 'deniedFallback'
  const deniedNative = mode === 'deniedNative'
  const showDisable = isParticipatingStop && isEnabled

  return (
    <section
      className={`${compactCardClassName} ${deniedFallback ? 'hm:flex-col hm:items-stretch' : ''}`}
      data-component="shuttle-crowding-summary"
      data-level={mode === 'disabled' ? 'disabled' : 'unavailable'}
      data-presence-status={status}
      data-stop={stopId ?? 'unsupported'}
    >
      <p aria-live="polite" className="min-w-0 text-xs leading-4 opacity-70">
        {t(
          deniedFallback
            ? 'crowding_status_denied_fallback'
            : statusMessageKeys[status],
        )}
      </p>
      {mode === 'disabled' && isParticipatingStop && (
        <button
          className={crowdingCompactActionClassName}
          type="button"
          onClick={onEnable}
        >
          {t('crowding_location_enable')}
        </button>
      )}
      {deniedFallback && isParticipatingStop && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 hm:w-full hm:justify-between">
          <button
            className={`${crowdingCompactActionClassName} border-0 px-1 underline`}
            type="button"
            onClick={onOpenLocationHelp}
          >
            {t('crowding_location_help_action')}
          </button>
          <button
            className={crowdingCompactActionClassName}
            type="button"
            onClick={onRetry}
          >
            {t('crowding_location_retry')}
          </button>
          {showDisable && (
            <button
              className={`${crowdingCompactActionClassName} border-0 px-1 underline`}
              type="button"
              onClick={onDisable}
            >
              {t('crowding_location_disable')}
            </button>
          )}
        </div>
      )}
      {deniedNative && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {nativeRecoveryControl}
          {showDisable && (
            <button
              className={`${crowdingCompactActionClassName} border-0 px-1 underline`}
              type="button"
              onClick={onDisable}
            >
              {t('crowding_location_disable')}
            </button>
          )}
        </div>
      )}
      {showDisable && !deniedFallback && !deniedNative && (
        <div className="flex shrink-0 items-center gap-1">
          {(status === 'error' || status === 'heartbeatError') && (
            <button
              className={crowdingCompactActionClassName}
              type="button"
              onClick={onRetry}
            >
              {t('crowding_location_retry')}
            </button>
          )}
          <button
            className={`${crowdingCompactActionClassName} border-0 px-1 underline`}
            type="button"
            onClick={onDisable}
          >
            {t('crowding_location_disable')}
          </button>
        </div>
      )}
      {!deniedNative && nativeRecoveryControl}
    </section>
  )
}
