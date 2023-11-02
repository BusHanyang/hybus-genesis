export const responseStatus = {
  SUCCESS: 'success', // 200
  API_ERROR: 'apiError', // 5xx
  CLIENT_ERROR: 'clientError', // 4xx
  UNKNOWN_ERROR: 'unknownError',
  NO_RESPONSE_ERROR: 'noResponseError',
} as const

export type ResponseStatus =
  (typeof responseStatus)[keyof typeof responseStatus]
