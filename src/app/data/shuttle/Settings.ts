import { Period } from './Period'

export type Settings = {
  semester: Period
  vacation_session: Period
  vacation: Period
  holiday: Array<string>
  halt: Array<string>
}
