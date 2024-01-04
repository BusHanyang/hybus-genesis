import { NoticeInfo } from '@/data'
import { apiHandler } from '@/network/apiHandler'

export const noticeAPI = async (): Promise<Array<NoticeInfo>> => {
  return apiHandler<Array<NoticeInfo>>('/announcements/')
}
