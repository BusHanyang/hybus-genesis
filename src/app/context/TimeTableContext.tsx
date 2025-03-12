import React, { useState } from "react"

import { SingleShuttleSchedule } from "@/data"

interface TimeTableContextProps {
    timetable: SingleShuttleSchedule,
    setTimetable: React.Dispatch<React.SetStateAction<SingleShuttleSchedule>>
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
    const [timetable, setTimetable] = useState<SingleShuttleSchedule>({time : "", type : "NA"})
    return (
        <TimeTableContext.Provider value={{ timetable, setTimetable }}>
            {children}
        </TimeTableContext.Provider>
    )
}