export const crowdingPresencePolicy = {
  intentWeight: 1.15,
  maxAccuracyMeters: 60,
  maxAnchorDistanceMeters: 90,
  maxSampleAgeMilliseconds: 2 * 60 * 1_000,
  maxSampleCount: 60,
  maxStationarySpeedMetersPerSecond: 2,
  // exp(-(r95^2) / (2 * sigma^2)) = 0.05 at the reported 95% radius.
  minAnchorLikelihood: 0.05,
  minDwellMilliseconds: 30_000,
  minProbability: 0.75,
  minProbabilityMargin: 0.25,
  minSamples: 3,
  minSigmaMeters: 8,
} as const

export const crowdingNetworkIntervals = {
  aggregateRefreshMilliseconds: 20_000,
  heartbeatMilliseconds: 20_000,
} as const
