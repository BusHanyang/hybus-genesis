import type {
  GpsSample,
  PresenceClassification,
} from '@/components/crowding/classifyStopPresence'
import type { CrowdingStopId } from '@/data/crowding/stopGeometry'

export type PresenceSignal = {
  accuracyBucket: '0-15m' | '16-30m' | '31-60m'
  confidence: 'high' | 'medium'
  dwellBucket: '120s+' | '30-59s' | '60-119s'
  observedAtMinute: number
  sampleCount: number
  schemaVersion: 1
  state: 'waiting'
  stopId: CrowdingStopId
}

const getAccuracyBucket = (
  accuracyMeters: number,
): PresenceSignal['accuracyBucket'] => {
  if (accuracyMeters <= 15) return '0-15m'
  if (accuracyMeters <= 30) return '16-30m'
  return '31-60m'
}

const getDwellBucket = (
  dwellMilliseconds: number,
): PresenceSignal['dwellBucket'] => {
  if (dwellMilliseconds < 60_000) return '30-59s'
  if (dwellMilliseconds < 120_000) return '60-119s'
  return '120s+'
}

export const createPresenceSignal = (
  classification: PresenceClassification<CrowdingStopId>,
  latestSample: GpsSample | null,
): PresenceSignal | null => {
  if (
    classification.status !== 'waiting' ||
    classification.stopId === null ||
    latestSample === null ||
    classification.sampleCount < 3 ||
    classification.sampleCount > 60 ||
    classification.dwellMilliseconds < 30_000 ||
    latestSample.accuracyMeters <= 0 ||
    latestSample.accuracyMeters > 60 ||
    !Number.isFinite(latestSample.timestamp)
  ) {
    return null
  }

  const stopProbability = classification.probabilities.find(
    (probability) => probability.stopId === classification.stopId,
  )
  if (stopProbability === undefined) return null

  const observedAtMinute = Math.floor(latestSample.timestamp / 60_000)
  if (!Number.isSafeInteger(observedAtMinute) || observedAtMinute < 0) {
    return null
  }

  return {
    accuracyBucket: getAccuracyBucket(latestSample.accuracyMeters),
    confidence: stopProbability.probability >= 0.9 ? 'high' : 'medium',
    dwellBucket: getDwellBucket(classification.dwellMilliseconds),
    observedAtMinute,
    sampleCount: classification.sampleCount,
    schemaVersion: 1,
    state: 'waiting',
    stopId: classification.stopId,
  }
}
