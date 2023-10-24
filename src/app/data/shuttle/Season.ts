export const seasonKeys = {
  SEMESTER: 'semester',
  VACATION_SESSION: 'vacation_session',
  VACATION: 'vacation',
} as const

export type Season = (typeof seasonKeys)[keyof typeof seasonKeys]
