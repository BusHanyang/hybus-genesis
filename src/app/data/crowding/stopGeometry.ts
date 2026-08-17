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

export type GeoPoint = {
  latitude: number
  longitude: number
}

export type StopAnchor = GeoPoint & {
  id: CrowdingStopId
}

export const isCrowdingStopId = (stopId: string): stopId is CrowdingStopId =>
  (crowdingStopIds as ReadonlyArray<string>).includes(stopId)

export const crowdingStopAnchors = [
  {
    id: 'shuttlecoke_o',
    latitude: stopMetadata.shuttlecoke_o.latitude,
    longitude: stopMetadata.shuttlecoke_o.longitude,
  },
  {
    id: 'subway',
    latitude: stopMetadata.subway.latitude,
    longitude: stopMetadata.subway.longitude,
  },
  {
    id: 'yesulin',
    latitude: stopMetadata.yesulin.latitude,
    longitude: stopMetadata.yesulin.longitude,
  },
  {
    id: 'jungang',
    latitude: stopMetadata.jungang.latitude,
    longitude: stopMetadata.jungang.longitude,
  },
  {
    id: 'shuttlecoke_i',
    latitude: stopMetadata.shuttlecoke_i.latitude,
    longitude: stopMetadata.shuttlecoke_i.longitude,
  },
  {
    id: 'residence',
    latitude: stopMetadata.residence.latitude,
    longitude: stopMetadata.residence.longitude,
  },
] as const satisfies ReadonlyArray<StopAnchor>
