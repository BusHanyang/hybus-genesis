import {
  APIResponse,
  Changelog,
  NoticeInfo,
  Settings,
  SingleShuttleSchedule,
  SingleTrainInfo,
} from '@/data'
import { responseStatus } from '@/data/api/responseStatus'
import { apiClient } from '@/network/apiClient'

export const apiHandler = async <
  T extends APIResponse<
    | Array<SingleShuttleSchedule | Changelog | NoticeInfo | SingleTrainInfo>
    | Settings
  >
>(
  urlPath: string
): Promise<T> => {
  return apiClient
    .get(urlPath)
    .then((response) => {
      return {
        status: responseStatus.SUCCESS,
        data: response.data,
      }
    })
    .catch((error) => {
      if (error.response) {
        // Error that falls out of the range of 2xx
        if (Math.floor(error.response.status / 100) === 4) {
          // 4xx Error
          console.log('Error 4xx', error.response.data)
          return {
            status: responseStatus.CLIENT_ERROR,
            data: null,
          }
        } else if (Math.floor(error.response.status / 100) === 5) {
          // 5xx Error
          console.log('Error 5xx', error.response.data)
          return {
            status: responseStatus.API_ERROR,
            data: null,
          }
        } else {
          // Unknown Error
          console.log('Unknown Error', error.response.data)
          return {
            status: responseStatus.UNKNOWN_ERROR,
            data: null,
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No Response Error', error.request)
        return {
          status: responseStatus.NO_RESPONSE_ERROR,
          data: null,
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
        return {
          status: responseStatus.UNKNOWN_ERROR,
          data: null,
        }
      }
    })
    .then((response) => {
      return response as T
    })
}
