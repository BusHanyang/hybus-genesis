import {
  APIResponse,
  Season,
  SingleShuttleSchedule,
  StopLocation,
  Week,
} from '@/data'
import { apiHandler } from '@/network/apiHandler'

export const shuttleAPI = async (
  season: Season,
  week: Week,
  location: StopLocation
): Promise<APIResponse<Array<SingleShuttleSchedule>>> => {
  return apiHandler<APIResponse<Array<SingleShuttleSchedule>>>(
    `/timetable/${season}/${week}/${location}`
  )
}
