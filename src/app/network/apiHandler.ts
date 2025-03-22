import {
  Changelog,
  NoticeInfo,
  Settings,
  SingleShuttleSchedule,
  SingleTrainInfo,
} from '@/data'
import { apiClient } from '@/network/apiClient'

export const apiHandler = async <
  T extends
    | Array<SingleShuttleSchedule | Changelog | NoticeInfo | SingleTrainInfo>
    | Settings,
>(
  urlPath: string,
): Promise<T> => {
  return apiClient.get(urlPath).then((response) => {
    return response.data as T
  })
}
