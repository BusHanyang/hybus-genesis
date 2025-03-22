import { SingleTrainInfo } from '@/data'
import { apiClient } from '@/network/apiClient'

export const subwayAPI = async (
  station: string,
): Promise<Array<SingleTrainInfo>> => {
  const stationCode = station.trim() === '한대앞' ? 'hanyang_univ' : 'jungang'

  return apiClient.get(`v1/subway/${stationCode}`).then((response) => {
    if (response.data.message === 'Not Found') {
      return new Array<SingleTrainInfo>()
    } else if (response.data.message === 'Server Error') {
      console.log(`Error : Server Error`)
      throw new Error(`Error Msg: ${response.data.message}`)
    }

    return response.data['trainList'] as Array<SingleTrainInfo>
  })
}
