export const noticeType = {
  GENERAL: 'general',
  NEWS: 'news',
} as const

export type NoticeType = (typeof noticeType)[keyof typeof noticeType]
