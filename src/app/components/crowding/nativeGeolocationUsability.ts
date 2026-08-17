export type NativeGeolocationInvalidReason =
  | 'attribute_changed'
  | 'intersection_changed'
  | 'intersection_occluded_or_distorted'
  | 'intersection_out_of_viewport_or_clipped'
  | 'recently_attached'
  | 'style_invalid'
  | string

export type NativeGeolocationInvalidity = 'permanent' | 'transient'

const permanentInvalidReasons = new Set<NativeGeolocationInvalidReason>([
  'intersection_occluded_or_distorted',
  'intersection_out_of_viewport_or_clipped',
  'style_invalid',
])

export const classifyNativeGeolocationInvalidReason = (
  invalidReason: string,
): NativeGeolocationInvalidity =>
  permanentInvalidReasons.has(invalidReason) ? 'permanent' : 'transient'
