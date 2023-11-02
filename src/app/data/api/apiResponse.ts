import { ResponseStatus } from '@/data'

export interface APIResponse<T> {
  status: ResponseStatus
  data: T | null
}
