import { Changelog } from '@/data'
import { apiHandler } from '@/network/apiHandler'

export const changelogAPI = async (): Promise<Array<Changelog>> => {
  return apiHandler<Array<Changelog>>('/changelog/')
}
