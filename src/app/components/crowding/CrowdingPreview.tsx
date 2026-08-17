import React from 'react'
import { useTranslation } from 'react-i18next'

import { isCrowdingStopId } from '../../data/crowding/stopGeometry'
import type { CrowdingAggregate } from '../../network/crowding'
import { mapCrowdingAggregateStatus } from '../../network/crowding'

export type CrowdingAvailability = 'loading' | 'ready' | 'unavailable'
export type CrowdingLevel =
  | 'busy'
  | 'disabled'
  | 'insufficient'
  | 'loading'
  | 'normal'
  | 'relaxed'
  | 'unavailable'
export type CrowdingPresenceUiStatus =
  | 'collecting'
  | 'denied'
  | 'disabled'
  | 'error'
  | 'outside'
  | 'ready'
  | 'requesting'
  | 'sending'
  | 'timetableLoading'
  | 'unavailable'
  | 'unsupported'
  | 'unsupportedStop'

type CrowdingLevelChipProps = {
  level: CrowdingLevel
  variant?: 'row' | 'summary'
}

type CrowdingPreviewProps = {
  aggregate: CrowdingAggregate | null
  availability: CrowdingAvailability
  departureTime?: string
  isEnabled: boolean
  isLocationReady: boolean
  location: string
  nativeRecoveryControl: React.ReactNode
  nativeRecoverySupported: boolean
  onDisable: () => void
  onEnable: () => void
  onOpenLocationHelp: () => void
  status: CrowdingPresenceUiStatus
}

export const crowdingCompactActionClassName =
  'min-h-8 shrink-0 rounded-md border border-theme-border px-2.5 py-1 text-[11px] font-medium opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2'
export const crowdingNativeActionClassName =
  'relative z-[3] min-h-6 shrink-0 rounded-md border border-theme-border bg-theme-card px-2.5 py-1 [font-size:small] font-medium text-theme-text opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2'

const crowdingLevelConfig = {
  busy: {
    labelKey: 'crowding_level_busy',
    shortLabelKey: 'crowding_level_busy_short',
    tone: 'border-rose-300 bg-rose-100 text-rose-900',
  },
  disabled: {
    labelKey: 'crowding_level_disabled',
    shortLabelKey: 'crowding_level_disabled',
    tone: 'border-theme-border bg-theme-main text-theme-text',
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
  outside: 'crowding_status_outside',
  ready: 'crowding_status_ready',
  requesting: 'crowding_status_requesting',
  sending: 'crowding_status_sending',
  timetableLoading: 'crowding_status_timetable_loading',
  unavailable: 'crowding_status_unavailable',
  unsupported: 'crowding_status_unsupported',
  unsupportedStop: 'crowding_status_unsupported_stop',
}

export const CrowdingLevelChip = ({
  level,
  variant = 'row',
}: CrowdingLevelChipProps) => {
  const { t } = useTranslation()
  const config = crowdingLevelConfig[level]
  const isSummary = variant === 'summary'

  return (
    <span
      aria-label={t('crowding_level_aria', { level: t(config.labelKey) })}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-bold ${
        isSummary
          ? 'h-8 min-w-16 px-3 text-sm'
          : 'ml-2 h-6 w-12 text-xs hm:ml-1 hm:w-10 hm:text-[0.7rem]'
      } ${config.tone}`}
      data-crowding-level={level}
    >
      {t(isSummary ? config.labelKey : config.shortLabelKey)}
    </span>
  )
}

export const CrowdingPreview = ({
  aggregate,
  availability,
  departureTime,
  isEnabled,
  isLocationReady,
  location,
  nativeRecoveryControl,
  nativeRecoverySupported,
  onDisable,
  onEnable,
  onOpenLocationHelp,
  status,
}: CrowdingPreviewProps) => {
  const { t } = useTranslation()
  const stopKey = isCrowdingStopId(location) ? location : 'shuttlecoke_o'
  const isParticipatingStop = isCrowdingStopId(location)
  const isReady = availability === 'ready' && departureTime !== undefined

  if (status === 'disabled') {
    return (
      <section
        aria-live="polite"
        className="mb-3 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-left text-theme-text shadow-theme-shadow transition-colors hm:px-3"
        data-component="shuttle-crowding-summary"
        data-departure-availability={availability}
        data-level="disabled"
        data-presence-status={status}
        data-stop={stopKey}
      >
        <p className="text-xs leading-4 opacity-70">
          {t('crowding_status_disabled')}
        </p>
        {isParticipatingStop && (
          <button
            className={crowdingCompactActionClassName}
            type="button"
            onClick={onEnable}
          >
            {t('crowding_location_enable')}
          </button>
        )}
      </section>
    )
  }

  const isIncompleteLocationState =
    status === 'denied' ||
    status === 'requesting' ||
    status === 'unsupported' ||
    status === 'unsupportedStop'

  if (isLocationReady && !isIncompleteLocationState) {
    return (
      <section
        aria-live="polite"
        className="mb-3 grid min-h-11 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-left text-theme-text shadow-theme-shadow transition-colors shuttlei:grid-cols-1 shuttlei:justify-items-center shuttlei:gap-x-0 shuttlei:gap-y-1 hm:px-3"
        data-component="shuttle-crowding-summary"
        data-departure-availability={availability}
        data-presence-status={status}
        data-stop={stopKey}
      >
        <span aria-hidden="true" className="shuttlei:hidden" />
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 justify-self-center">
          {crowdingLegendLevels.map((legendLevel) => {
            const config = crowdingLevelConfig[legendLevel]

            return (
              <span
                className="inline-flex items-center gap-1.5 text-base leading-4 rt1:text-sm rt2:text-xs"
                key={legendLevel}
              >
                <span
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 rounded-full border rt1:h-2.5 rt1:w-2.5 ${config.tone}`}
                />
                {t(
                  legendLevel === 'insufficient'
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

  const isDenied = status === 'denied'
  const level: CrowdingLevel =
    aggregate !== null
      ? mapCrowdingAggregateStatus(aggregate.status)
      : status === 'collecting' ||
          status === 'requesting' ||
          status === 'sending' ||
          status === 'timetableLoading'
        ? 'loading'
        : status === 'unavailable' ||
            status === 'unsupported' ||
            status === 'unsupportedStop'
          ? 'unavailable'
          : 'insufficient'
  const departureBasis = isReady
    ? t('crowding_departure_basis', {
        stop: t(stopKey),
        time: departureTime,
      })
    : t(
        availability === 'loading'
          ? 'crowding_departure_loading'
          : 'crowding_departure_unavailable',
        { stop: t(stopKey) },
      )
  const detail =
    aggregate === null
      ? t(statusMessageKeys[status])
      : t(
          status === 'error' ? 'crowding_bucket_stale' : 'crowding_bucket_live',
          { bucket: aggregate.bucket },
        )
  const showDisableButton = isParticipatingStop && isEnabled

  return (
    <section
      aria-labelledby={isDenied ? undefined : 'crowding-preview-title'}
      aria-live="polite"
      className={
        isDenied
          ? 'mb-3 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-left text-theme-text shadow-theme-shadow transition-colors hm:px-3'
          : 'mb-3 flex min-h-20 items-center justify-between gap-3 rounded-lg border border-theme-border bg-theme-card px-5 py-3 text-left text-theme-text shadow-theme-shadow transition-colors hm:px-4'
      }
      data-bucket={aggregate?.bucket}
      data-component="shuttle-crowding-summary"
      data-departure-availability={availability}
      data-level={isDenied ? 'disabled' : level}
      data-presence-status={status}
      data-stop={stopKey}
    >
      {isDenied ? (
        <>
          <p className="text-xs leading-4 opacity-70">
            {t(
              nativeRecoverySupported
                ? 'crowding_status_denied_compact'
                : 'crowding_status_denied_fallback',
            )}
          </p>
          {!nativeRecoverySupported && isParticipatingStop && (
            <div className="flex shrink-0 items-center gap-1">
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
                onClick={onEnable}
              >
                {t('crowding_location_retry')}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-sm font-bold leading-5"
              id="crowding-preview-title"
            >
              {t('crowding_next_title')}
            </h2>
            <p className="truncate text-xs leading-4 opacity-70">
              {departureBasis}
            </p>
            <p className="mt-1 text-xs leading-4">{detail}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CrowdingLevelChip level={level} variant="summary" />
            {showDisableButton && (
              <button
                className="min-h-8 px-2 text-xs underline opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                type="button"
                onClick={onDisable}
              >
                {t('crowding_location_disable')}
              </button>
            )}
          </div>
        </>
      )}
      {nativeRecoveryControl}
    </section>
  )
}
