import stopMetadataJson from '@/data/common/stopMetadata.json' with { type: 'json' }

export const stopMetadata = stopMetadataJson

export type MappableStopLocation = keyof typeof stopMetadata

export const isMappableStopLocation = (
  location: string,
): location is MappableStopLocation =>
  Object.prototype.hasOwnProperty.call(stopMetadata, location)
