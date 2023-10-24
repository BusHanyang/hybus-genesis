export const weekKeys = {
  WEEK: 'week',
  WEEKEND: 'weekend',
} as const

export type Week = (typeof weekKeys)[keyof typeof weekKeys]
