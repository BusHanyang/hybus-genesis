import { SingleTrainInfo } from '@/data'
import { apiClient } from '@/network/apiClient'

export const subwayAPI = async (
  station: string
): Promise<Array<SingleTrainInfo>> => {
  const stationCode = station.trim() === '한대앞' ? 'hanyang_univ' : 'jungang'

  return apiClient.get(`subway/1/9/${stationCode}`).then((response) => {
    if (response.data.code === 'INFO-200') {
      return new Array<SingleTrainInfo>()
    } else if (response.data.code === 'ERROR-337') {
      console.log(`Error code: 337`)
      throw new Error(`Error Msg: ${response.data.message}`)
    }

    return response.data['realtimeArrivalList'] as Array<SingleTrainInfo>
  })
}
