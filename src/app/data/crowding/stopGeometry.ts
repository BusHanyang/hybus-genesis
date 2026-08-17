import stopMetadata from '../common/stopMetadata.json' with { type: 'json' }

export const crowdingStopIds = [
  'shuttlecoke_o',
  'subway',
  'yesulin',
  'jungang',
  'shuttlecoke_i',
  'residence',
] as const

export type CrowdingStopId = (typeof crowdingStopIds)[number]

export const isCrowdingStopId = (stopId: string): stopId is CrowdingStopId =>
  (crowdingStopIds as ReadonlyArray<string>).includes(stopId)

export const crowdingStopAnchors = crowdingStopIds.map((id) => ({
  id,
  latitude: stopMetadata[id].latitude,
  longitude: stopMetadata[id].longitude,
}))
