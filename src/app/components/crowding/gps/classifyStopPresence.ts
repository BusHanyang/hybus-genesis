import { crowdingPresencePolicy } from '../crowdingConfig.ts'

export type GpsSample = {
  accuracyMeters: number
  latitude: number
  longitude: number
  speedMetersPerSecond?: number | null
  timestamp: number
}

export type StopAnchor<StopId extends string = string> = {
  id: StopId
  latitude: number
  longitude: number
}

export type PresenceClassificationStatus =
  | 'ambiguous'
  | 'candidate'
  | 'insufficient'
  | 'outside'
  | 'transient'
  | 'waiting'

export type PresenceClassificationReason =
  | 'classified'
  | 'dwell_too_short'
  | 'moving_too_fast'
  | 'likelihood_too_low'
  | 'not_enough_nearby_samples'
  | 'not_enough_usable_samples'
  | 'outside_geofence'
  | 'probability_too_close'

export type StopProbability<StopId extends string = string> = {
  probability: number
  stopId: StopId
}

export type PresenceClassification<StopId extends string = string> = {
  dwellMilliseconds: number
  latestSampleTimestamp: number | null
  probabilities: ReadonlyArray<StopProbability<StopId>>
  reason: PresenceClassificationReason
  sampleCount: number
  selectedStopId: StopId | null
  status: PresenceClassificationStatus
  stopId: StopId | null
}

const EARTH_RADIUS_METERS = 6_371_000
const GPS_95_PERCENT_RADIUS_TO_SIGMA = Math.sqrt(
  -2 * Math.log(crowdingPresencePolicy.minAnchorLikelihood),
)

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

export const distanceBetweenPointsMeters = (
  first: Pick<GpsSample, 'latitude' | 'longitude'>,
  second: Pick<GpsSample, 'latitude' | 'longitude'>,
): number => {
  const firstLatitude = toRadians(first.latitude)
  const secondLatitude = toRadians(second.latitude)
  const latitudeDelta = toRadians(second.latitude - first.latitude)
  const longitudeDelta = toRadians(second.longitude - first.longitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

export const getSampleAnchorLikelihood = (
  sample: GpsSample,
  anchor: StopAnchor,
  minSigmaMeters = crowdingPresencePolicy.minSigmaMeters,
): number => {
  const sigmaMeters = Math.max(
    sample.accuracyMeters / GPS_95_PERCENT_RADIUS_TO_SIGMA,
    minSigmaMeters,
  )
  const distanceMeters = distanceBetweenPointsMeters(sample, anchor)
  return Math.exp(-(distanceMeters ** 2) / (2 * sigmaMeters ** 2))
}

const isUsableGpsSample = (sample: GpsSample): boolean =>
  Number.isFinite(sample.accuracyMeters) &&
  sample.accuracyMeters > 0 &&
  sample.accuracyMeters <= crowdingPresencePolicy.maxAccuracyMeters &&
  Number.isFinite(sample.latitude) &&
  sample.latitude >= -90 &&
  sample.latitude <= 90 &&
  Number.isFinite(sample.longitude) &&
  sample.longitude >= -180 &&
  sample.longitude <= 180 &&
  Number.isFinite(sample.timestamp) &&
  sample.timestamp >= 0 &&
  (sample.speedMetersPerSecond === undefined ||
    sample.speedMetersPerSecond === null ||
    (Number.isFinite(sample.speedMetersPerSecond) &&
      sample.speedMetersPerSecond >= 0))

export const isFreshUsableGpsSample = (
  sample: GpsSample | null,
  now: number,
): sample is GpsSample =>
  sample !== null &&
  Number.isFinite(now) &&
  isUsableGpsSample(sample) &&
  sample.timestamp <= now &&
  now - sample.timestamp <= crowdingPresencePolicy.maxSampleAgeMilliseconds

const median = (values: ReadonlyArray<number>): number => {
  if (values.length === 0) return 0

  const sorted = [...values].sort((first, second) => first - second)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) return sorted[middle]
  return (sorted[middle - 1] + sorted[middle]) / 2
}

const emptyClassification = <StopId extends string>(
  status: PresenceClassificationStatus,
  reason: PresenceClassificationReason,
  sampleCount: number,
  selectedStopId: StopId | null,
  latestSampleTimestamp: number | null = null,
): PresenceClassification<StopId> => ({
  dwellMilliseconds: 0,
  latestSampleTimestamp,
  probabilities: [],
  reason,
  sampleCount,
  selectedStopId,
  status,
  stopId: null,
})

export const classifyStopPresence = <StopId extends string>(
  samples: ReadonlyArray<GpsSample>,
  anchors: ReadonlyArray<StopAnchor<StopId>>,
  options?: {
    selectedStopId?: StopId | null
  },
): PresenceClassification<StopId> => {
  const selectedStopId = options?.selectedStopId ?? null

  if (anchors.length < 2) {
    return emptyClassification(
      'insufficient',
      'not_enough_usable_samples',
      0,
      selectedStopId,
    )
  }

  const samplesByTimestamp = new Map<number, GpsSample>()
  for (const sample of samples) {
    if (isUsableGpsSample(sample)) {
      samplesByTimestamp.set(sample.timestamp, sample)
    }
  }
  const usableSamples = [...samplesByTimestamp.values()].sort(
    (first, second) => first.timestamp - second.timestamp,
  )

  if (usableSamples.length < crowdingPresencePolicy.minSamples) {
    return emptyClassification(
      'insufficient',
      'not_enough_usable_samples',
      usableSamples.length,
      selectedStopId,
      usableSamples.at(-1)?.timestamp ?? null,
    )
  }

  const latestUsableSample = usableSamples[usableSamples.length - 1]

  const scoredStops = anchors.map((anchor) => {
    const trailingLikelihoods: number[] = []
    let segmentStart = usableSamples.length

    for (let index = usableSamples.length - 1; index >= 0; index -= 1) {
      const sample = usableSamples[index]
      const distanceMeters = distanceBetweenPointsMeters(sample, anchor)
      const likelihood = getSampleAnchorLikelihood(
        sample,
        anchor,
        crowdingPresencePolicy.minSigmaMeters,
      )

      if (
        distanceMeters > crowdingPresencePolicy.maxAnchorDistanceMeters ||
        likelihood < crowdingPresencePolicy.minAnchorLikelihood
      ) {
        break
      }
      trailingLikelihoods.push(likelihood)
      segmentStart = index
    }

    const evidenceSamples = usableSamples.slice(segmentStart)
    const anchorLikelihood = trailingLikelihoods.reduceRight(
      (total, likelihood) => total + likelihood,
      0,
    )
    const intentScore =
      selectedStopId === anchor.id ? crowdingPresencePolicy.intentWeight : 1

    return {
      anchor,
      evidenceSamples,
      score: anchorLikelihood * intentScore,
    }
  })
  const currentCandidate = [...scoredStops].sort(
    (first, second) => second.score - first.score,
  )[0]
  const isLatestNearAnyAnchor = anchors.some(
    (anchor) =>
      distanceBetweenPointsMeters(latestUsableSample, anchor) <=
      crowdingPresencePolicy.maxAnchorDistanceMeters,
  )

  if (!isLatestNearAnyAnchor) {
    return emptyClassification(
      'outside',
      'outside_geofence',
      0,
      selectedStopId,
      latestUsableSample.timestamp,
    )
  }

  if (currentCandidate.evidenceSamples.length === 0) {
    return emptyClassification(
      'outside',
      'likelihood_too_low',
      0,
      selectedStopId,
      latestUsableSample.timestamp,
    )
  }
  const nearbySamples = currentCandidate.evidenceSamples

  if (nearbySamples.length < crowdingPresencePolicy.minSamples) {
    return emptyClassification(
      'candidate',
      'not_enough_nearby_samples',
      nearbySamples.length,
      selectedStopId,
      latestUsableSample.timestamp,
    )
  }

  const firstSample = nearbySamples[0]
  const lastSample = nearbySamples[nearbySamples.length - 1]
  const dwellMilliseconds = Math.max(
    0,
    lastSample.timestamp - firstSample.timestamp,
  )

  if (dwellMilliseconds < crowdingPresencePolicy.minDwellMilliseconds) {
    return {
      ...emptyClassification(
        'candidate',
        'dwell_too_short',
        nearbySamples.length,
        selectedStopId,
        latestUsableSample.timestamp,
      ),
      dwellMilliseconds,
    }
  }

  const reportedSpeeds = nearbySamples.flatMap((sample) =>
    sample.speedMetersPerSecond === undefined ||
    sample.speedMetersPerSecond === null
      ? []
      : [sample.speedMetersPerSecond],
  )
  const derivedSpeed =
    distanceBetweenPointsMeters(firstSample, lastSample) /
    (dwellMilliseconds / 1000)
  const movementSpeed = Math.max(median(reportedSpeeds), derivedSpeed)

  if (
    movementSpeed > crowdingPresencePolicy.maxStationarySpeedMetersPerSecond
  ) {
    return {
      ...emptyClassification(
        'transient',
        'moving_too_fast',
        nearbySamples.length,
        selectedStopId,
        latestUsableSample.timestamp,
      ),
      dwellMilliseconds,
    }
  }

  const scoreTotal = scoredStops.reduce((total, stop) => total + stop.score, 0)
  const probabilities = scoredStops
    .map(({ anchor, score }) => ({
      probability: score / scoreTotal,
      stopId: anchor.id,
    }))
    .sort((first, second) => second.probability - first.probability)
  const [best, secondBest] = probabilities
  const probabilityMargin = best.probability - secondBest.probability

  if (
    best.probability < crowdingPresencePolicy.minProbability ||
    probabilityMargin < crowdingPresencePolicy.minProbabilityMargin
  ) {
    return {
      dwellMilliseconds,
      latestSampleTimestamp: latestUsableSample.timestamp,
      probabilities,
      reason: 'probability_too_close',
      sampleCount: nearbySamples.length,
      selectedStopId,
      status: 'ambiguous',
      stopId: null,
    }
  }

  return {
    dwellMilliseconds,
    latestSampleTimestamp: latestUsableSample.timestamp,
    probabilities,
    reason: 'classified',
    sampleCount: nearbySamples.length,
    selectedStopId,
    status: 'waiting',
    stopId: best.stopId,
  }
}
