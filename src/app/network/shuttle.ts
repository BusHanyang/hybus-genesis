import {
  Season,
  Settings,
  SingleShuttleSchedule,
  StopLocation,
  Week,
} from '@/data'
import { apiHandler } from '@/network/apiHandler'

export const shuttleAPI = async (
  season: Season,
  week: Week,
  location: StopLocation,
): Promise<Array<SingleShuttleSchedule>> => {
  return apiHandler<Array<SingleShuttleSchedule>>(
    `/v2/timetable/${season}/${week}/${location}`,
  )
}

export const settingAPI = async (): Promise<Settings> => {
  return apiHandler<Settings>('/settings/')
}
