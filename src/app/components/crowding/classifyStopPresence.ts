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

export type PresenceClassifierConfig = {
  intentWeight: number
  maxAccuracyMeters: number
  maxAnchorDistanceMeters: number
  maxStationarySpeedMetersPerSecond: number
  minDwellMilliseconds: number
  minProbability: number
  minProbabilityMargin: number
  minSamples: number
  minSigmaMeters: number
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
  | 'not_enough_nearby_samples'
  | 'not_enough_usable_samples'
  | 'outside_geofence'
  | 'probability_too_close'

export type StopProbability<StopId extends string = string> = {
  distanceMeters: number
  probability: number
  stopId: StopId
}

export type PresenceClassification<StopId extends string = string> = {
  dwellMilliseconds: number
  probabilities: ReadonlyArray<StopProbability<StopId>>
  reason: PresenceClassificationReason
  sampleCount: number
  selectedStopId: StopId | null
  status: PresenceClassificationStatus
  stopId: StopId | null
}

export const defaultPresenceClassifierConfig: Readonly<PresenceClassifierConfig> =
  {
    intentWeight: 1.15,
    maxAccuracyMeters: 60,
    maxAnchorDistanceMeters: 90,
    maxStationarySpeedMetersPerSecond: 2,
    minDwellMilliseconds: 30_000,
    minProbability: 0.75,
    minProbabilityMargin: 0.25,
    minSamples: 3,
    minSigmaMeters: 8,
  }

const EARTH_RADIUS_METERS = 6_371_000
const GPS_95_PERCENT_RADIUS_TO_SIGMA = Math.sqrt(-2 * Math.log(0.05))

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

const isUsableSample = (
  sample: GpsSample,
  maxAccuracyMeters: number,
): boolean =>
  Number.isFinite(sample.accuracyMeters) &&
  sample.accuracyMeters > 0 &&
  sample.accuracyMeters <= maxAccuracyMeters &&
  Number.isFinite(sample.latitude) &&
  Number.isFinite(sample.longitude) &&
  Number.isFinite(sample.timestamp) &&
  (sample.speedMetersPerSecond === undefined ||
    sample.speedMetersPerSecond === null ||
    (Number.isFinite(sample.speedMetersPerSecond) &&
      sample.speedMetersPerSecond >= 0))

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
): PresenceClassification<StopId> => ({
  dwellMilliseconds: 0,
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
    config?: Partial<PresenceClassifierConfig>
    selectedStopId?: StopId | null
  },
): PresenceClassification<StopId> => {
  const config = {
    ...defaultPresenceClassifierConfig,
    ...options?.config,
  }
  const selectedStopId = options?.selectedStopId ?? null

  if (anchors.length < 2) {
    return emptyClassification(
      'insufficient',
      'not_enough_usable_samples',
      0,
      selectedStopId,
    )
  }

  const usableSamples = samples
    .filter((sample) => isUsableSample(sample, config.maxAccuracyMeters))
    .sort((first, second) => first.timestamp - second.timestamp)

  if (usableSamples.length < config.minSamples) {
    return emptyClassification(
      'insufficient',
      'not_enough_usable_samples',
      usableSamples.length,
      selectedStopId,
    )
  }

  const nearbySamples = usableSamples.filter((sample) =>
    anchors.some(
      (anchor) =>
        distanceBetweenPointsMeters(sample, anchor) <=
        config.maxAnchorDistanceMeters,
    ),
  )

  if (nearbySamples.length < config.minSamples) {
    return emptyClassification(
      nearbySamples.length === 0 ? 'outside' : 'candidate',
      nearbySamples.length === 0
        ? 'outside_geofence'
        : 'not_enough_nearby_samples',
      nearbySamples.length,
      selectedStopId,
    )
  }

  const firstSample = nearbySamples[0]
  const lastSample = nearbySamples[nearbySamples.length - 1]
  const dwellMilliseconds = Math.max(
    0,
    lastSample.timestamp - firstSample.timestamp,
  )

  if (dwellMilliseconds < config.minDwellMilliseconds) {
    return {
      ...emptyClassification(
        'candidate',
        'dwell_too_short',
        nearbySamples.length,
        selectedStopId,
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

  if (movementSpeed > config.maxStationarySpeedMetersPerSecond) {
    return {
      ...emptyClassification(
        'transient',
        'moving_too_fast',
        nearbySamples.length,
        selectedStopId,
      ),
      dwellMilliseconds,
    }
  }

  const scoredStops = anchors.map((anchor) => {
    const distances = nearbySamples.map((sample) =>
      distanceBetweenPointsMeters(sample, anchor),
    )
    const score = nearbySamples.reduce((total, sample, index) => {
      const sigmaMeters = Math.max(
        sample.accuracyMeters / GPS_95_PERCENT_RADIUS_TO_SIGMA,
        config.minSigmaMeters,
      )
      const distanceScore = Math.exp(
        -(distances[index] ** 2) / (2 * sigmaMeters ** 2),
      )
      const intentScore = selectedStopId === anchor.id ? config.intentWeight : 1
      return total + distanceScore * intentScore
    }, 0)

    return {
      anchor,
      distanceMeters: median(distances),
      score,
    }
  })
  const scoreTotal = scoredStops.reduce((total, stop) => total + stop.score, 0)
  const probabilities = scoredStops
    .map(({ anchor, distanceMeters, score }) => ({
      distanceMeters,
      probability: scoreTotal === 0 ? 0 : score / scoreTotal,
      stopId: anchor.id,
    }))
    .sort((first, second) => second.probability - first.probability)
  const [best, secondBest] = probabilities
  const probabilityMargin = best.probability - secondBest.probability

  if (
    best.probability < config.minProbability ||
    probabilityMargin < config.minProbabilityMargin
  ) {
    return {
      dwellMilliseconds,
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
    probabilities,
    reason: 'classified',
    sampleCount: nearbySamples.length,
    selectedStopId,
    status: 'waiting',
    stopId: best.stopId,
  }
}
