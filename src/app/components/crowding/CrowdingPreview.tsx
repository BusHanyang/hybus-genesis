import React from 'react'
import { useTranslation } from 'react-i18next'

export type CrowdingAvailability = 'loading' | 'ready' | 'unavailable'
export type CrowdingLevel =
  | 'busy'
  | 'insufficient'
  | 'loading'
  | 'normal'
  | 'relaxed'

type CrowdingLevelChipProps = {
  level: CrowdingLevel
  variant?: 'row' | 'summary'
}

type CrowdingPreviewProps = {
  availability: CrowdingAvailability
  departureTime?: string
  location: string
}

const supportedStopNames: ReadonlySet<string> = new Set([
  'jungang',
  'residence',
  'shuttlecoke_i',
  'shuttlecoke_o',
  'subway',
  'yesulin',
])

const previewCrowdingLevels: ReadonlyArray<CrowdingLevel> = [
  'normal',
  'busy',
  'relaxed',
  'normal',
  'busy',
]

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
} as const

export const getCrowdingLevelForIndex = (index: number): CrowdingLevel => {
  if (!import.meta.env.DEV) return 'insufficient'
  return previewCrowdingLevels[index % previewCrowdingLevels.length]
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
  availability,
  departureTime,
  location,
}: CrowdingPreviewProps) => {
  const { t } = useTranslation()
  const stopKey = supportedStopNames.has(location) ? location : 'shuttlecoke_o'
  const isReady = availability === 'ready' && departureTime !== undefined
  const level = isReady
    ? getCrowdingLevelForIndex(0)
    : availability === 'loading'
      ? 'loading'
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

  return (
    <section
      aria-labelledby="crowding-preview-title"
      className="mb-3 flex h-14 items-center justify-between gap-3 rounded-lg border border-theme-border bg-theme-card px-5 text-left text-theme-text shadow-theme-shadow transition-colors hm:h-16 hm:px-4"
      data-component="shuttle-crowding-summary"
      data-departure-availability={availability}
      data-level={level}
      data-stop={stopKey}
    >
      <div className="min-w-0">
        <h2
          className="truncate text-sm font-bold leading-5"
          id="crowding-preview-title"
        >
          {t('crowding_next_title')}
        </h2>
        <p className="truncate text-xs leading-4 opacity-70">
          {departureBasis}
        </p>
      </div>
      <CrowdingLevelChip level={level} variant="summary" />
    </section>
  )
}
