import type { CrowdingPresencePayload } from '@/network/crowding'

import {
  crowdingStopAnchors,
  type CrowdingStopId,
} from '../../../data/crowding/stopGeometry.ts'
import { crowdingPresencePolicy } from '../crowdingConfig.ts'
import {
  distanceBetweenPointsMeters,
  getSampleAnchorLikelihood,
  type GpsSample,
  isFreshUsableGpsSample,
  type PresenceClassification,
} from './classifyStopPresence.ts'

export type PresenceSignal = CrowdingPresencePayload

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
  options?: { now?: number },
): PresenceSignal | null => {
  const now = options?.now ?? Date.now()

  if (
    classification.status !== 'waiting' ||
    classification.stopId === null ||
    latestSample === null ||
    classification.latestSampleTimestamp !== latestSample.timestamp ||
    classification.sampleCount < crowdingPresencePolicy.minSamples ||
    classification.sampleCount > crowdingPresencePolicy.maxSampleCount ||
    classification.dwellMilliseconds <
      crowdingPresencePolicy.minDwellMilliseconds ||
    !isFreshUsableGpsSample(latestSample, now)
  ) {
    return null
  }

  const stopAnchor = crowdingStopAnchors.find(
    (anchor) => anchor.id === classification.stopId,
  )
  if (
    stopAnchor === undefined ||
    distanceBetweenPointsMeters(latestSample, stopAnchor) >
      crowdingPresencePolicy.maxAnchorDistanceMeters ||
    getSampleAnchorLikelihood(
      latestSample,
      stopAnchor,
      crowdingPresencePolicy.minSigmaMeters,
    ) < crowdingPresencePolicy.minAnchorLikelihood
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
