export const weekKeys = {
  INIT: 'init',
  WEEK: 'week',
  WEEKEND: 'weekend',
  UNKNOWN: 'unknown',
} as const

export type Week = (typeof weekKeys)[keyof typeof weekKeys]
