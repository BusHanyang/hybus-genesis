export const stopLocationKeys = {
  RESIDENCE: 'residence',
  SHUTTLECOKE_INBOUND: 'shuttlecoke_i',
  SHUTTLECOKE_OUTBOUND: 'shuttlecoke_o',
  SUBWAY: 'subway',
  YESULIN: 'yesulin',
  JUNGANG: 'jungang',
} as const

export type StopLocation =
  (typeof stopLocationKeys)[keyof typeof stopLocationKeys]
