export type SingleTrainInfo = {
  btrainNo: string // Train number
  subwayId: string // Line 4(1004) or Suin-Bundang(1075)
  updnLine: string // UpLine 0 or DownLine 1
  bstatnNm: string // Destination
  arvlMsg2: string // the number of stations left (Msg)
  arvlMsg3: string // Current Station
  arvlCd: string // Status of Current Station
  recptnDt: string // Update time
}
