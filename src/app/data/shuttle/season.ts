export const seasonKeys = {
  INIT: 'init',
  SEMESTER: 'semester',
  VACATION_SESSION: 'vacation_session',
  VACATION: 'vacation',
  HALT: 'halt',
  UNKNOWN: 'unknown',
} as const

export type Season = (typeof seasonKeys)[keyof typeof seasonKeys]
