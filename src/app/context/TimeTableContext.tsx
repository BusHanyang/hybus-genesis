import React, { useState } from 'react'

import { SingleShuttleSchedule } from '@/data'

interface TimeTableContextProps {
  currTimetable: Array<SingleShuttleSchedule>
  setCurrTimetable: React.Dispatch<
    React.SetStateAction<Array<SingleShuttleSchedule>>
  >
}

const TimeTableContext = React.createContext<TimeTableContextProps | null>(null)

export const useTimeTableContext = () => {
  const context = React.useContext(TimeTableContext)
  if (!context) throw Error('TimeTable provider not defined!')
  return context
}

export const TimeTableContextProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [currTimetable, setCurrTimetable] = useState<
    Array<SingleShuttleSchedule>
  >([])

  const value = React.useMemo(
    () => ({ currTimetable, setCurrTimetable }),
    [currTimetable],
  )

  return (
    <TimeTableContext.Provider value={value}>
      {children}
    </TimeTableContext.Provider>
  )
}
