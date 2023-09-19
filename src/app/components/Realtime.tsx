import axios from 'axios'
import customParse from 'dayjs/plugin/customParseFormat'
import dotenv from 'dotenv'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'
import styled from 'styled-components'
import tw from 'twin.macro'

const HeadlineWrapper = styled.div`
  ${tw`relative`} drag-save-n
`

const Headline = styled.h2`
  ${tw`font-bold text-2xl mb-2 hsm:text-lg hsm:mb-4 hsm:mt-2 hm:text-[1.375rem] hm:mb-4 hm:mt-2`}
`

const MainTimeTableWrapper = styled.div`
  ${tw`w-full h-[11.25rem] inline-block touch-none`}
`

const MainTimetable = styled.div`
  ${tw`inline-block select-none h-full`}
`

const NoTimetable = styled.div`
  ${tw`h-full table`}
`

const NoTimetableInner = styled.span`
  ${tw`table-cell align-middle leading-6`}
`

const ApiStatusButton = styled.button`
  ${tw`rounded-md bg-gray-200 text-gray-700 cursor-default px-2 py-1 mt-2`}
`


type SingleSchedule = {
    subwayId: string //노선
    updnLine: string //상행 0  하행 1
    bstatnNm: string //목적지 ㅇㅇ행
    arvlMsg2: string //남은 정거장 수 msg
    arvlMsg3: string //현재 역
    arvlCd: string //현재역에서의 상태
}

type ScheduleInfo = {
    location: string
}
const Chip = styled.img`
    ${tw`py-1 w-[1.5rem] rounded-full inline-block`}
` 

const arrivalUntil = (arvlMsg2: string, station:string): string => {
    if (arvlMsg2 == '전역 출발' || 
        arvlMsg2 == '전역 도착' || 
        arvlMsg2 == '전역 진입' || 
        arvlMsg2 == '전역 접근' ||
        arvlMsg2.indexOf(station) != -1
    ) {
        return '전 역'
    } else {
        //const match = /\[(\d+)\]/g
        //const result = match.exec(arvlMsg2) as RegExpExecArray
        const str = arvlMsg2.substring(arvlMsg2.indexOf('[') + 1, arvlMsg2.indexOf(']'))
        return str + ' 전 역'
        //String(result[1])
    }
}
    
const arrivalStnStatus = (arvlCd: string): string => {
    if (arvlCd == '0') {
        return '진입'
    } else if (arvlCd == '1') {
        return '도착'
    } else if (arvlCd == '2') {
        return '출발'
    } else if (arvlCd == '3') {
        return '출발'
    } else if (arvlCd == '4') {
        return '진입'
    } else if (arvlCd == '5') {
        return '도착'
    } else if (arvlCd == '99') {
        return '운행중'
    }else {
        return '오류'
    }
}

const titleText = (location: string): string => {
    if (location == 'shuttlecoke_o') {
        return t('shuttlecoke_o')
    } else if (location == 'subway') {
        return t('subway')
    } else if (location == 'jungang') {
        return t('jungang')
    } else if (location == 'yesulin') {
        return t('yesulin')
    } else if (location == 'shuttlecoke_i') {
        return t('shuttlecoke_i')
    } else if (location == 'residence') {
        return t('residence')
    } else {
        return t('else')
    }
}

const getDestination = (bstatnNm: string): string => {
    if (bstatnNm == '오이도') {
        return t('oido')
    } else if (bstatnNm == '안산') {
        return t('ansan')
    } else if (bstatnNm == '금정') {
        return t('geumjeong')
    } else if (bstatnNm == '당고개') {
        return t('danggogae')
    } else if (bstatnNm == '노원') {
        return t('nowon')
    } else if (bstatnNm == '한성대입구') {
        return t('hansung')
    } else if (bstatnNm == '왕십리') {
        return t('wangsimni')
    } else if (bstatnNm == '인천') {
        return t('incheon')
    } else if (bstatnNm == '죽전') {
        return t('jukjeon')
    } else if (bstatnNm == '고색') {
        return t('gosaek')
    } else {
        return bstatnNm
    }
} 

const getLineMarkElement = (line: string): JSX.Element => {
    if (line == '1004') {
        return <Chip src="/image/line4.svg"></Chip>
    }
    return <Chip src="/image/suin.svg"></Chip>
}

export const Realtime = ({ location }: ScheduleInfo) => {
    const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
    const [isLoaded, setLoaded] = useState<boolean>(false)
    const [currentLocation, setCurrentLocation] = useState<string>('init')
    const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())

    const [spinning, setSpinning] = useState<boolean>(true)
    const [CarList, setCarList] = useState<Array<SingleSchedule>>()

    const [a,setA] = useState()
    const [b,setB] = useState()
    const [c,setC] = useState()

    const [upNumA, setUpNumA] = useState<boolean>(false)
    const [upNumB, setUpNumB] = useState<boolean>(false)
    const [upNumC, setUpNumC] = useState<boolean>(false)
    
    let station = '한대앞'
    if(location == 'jungang') station = '중앙'

     // For fetching the timetable for the initial time
    useEffect(() => {
        if (!isLoaded) {
            search(location).then((res) => {
                setTimetable(res)
                setSpinning(false)
                setLoaded(true)
                setCurrentLocation(location)
            })
        } 
    }, [isLoaded, location])

    useEffect(()=>{
        if(location == 'jungang') {
            station = '중앙'
        } else {
            station = '한대앞'
        }
        search(station)
    },[location, station])

    // For fetching the timetable for the initial time
    useEffect(() => {
        if (!isLoaded) {
        search(station).then((res) => {
            setTimetable(res)
            setSpinning(false)
            setLoaded(true)
            setCurrentLocation(location)
        })
        }
    }, [isLoaded, location])

    // For fetching the timetable when tab is changed (Efficient)
  useEffect(() => {
    if (
      isLoaded &&
      currentLocation !== 'init' &&
      location !== currentLocation
    ) {
      setSpinning(true)
      setTimetable([])
      search(location).then((res) => {
        setTimetable(res)
        setSpinning(false)
        setCurrentLocation(location)
        setCurrentTime(new Date().getTime())
      })
    } 
  }, [currentLocation, isLoaded, location])

    useEffect(() => {
        const timer = setTimeout(() => {
          setCurrentTime(new Date().getTime())
        }, 10000)
    
        return () => clearTimeout(timer)
    }, [timetable, currentTime])
        
    const timetableApi = async (url: string): Promise<Array<SingleSchedule>> => {
        return await axios
        .get(url)
        .then((response) => {
            if (response.status !== 200) {
            console.log(`Error code: ${response.statusText}`)
            return new Array<SingleSchedule>()
            }
    
            return response.data.realtimeArrivalList
        })
        .catch((err) => {
            if (err.response) {
            // 2XX Errors
            console.log('Error receiving data', err.data)
            } else if (err.request) {
            // No Response
            console.log('No Response Error', err.request)
            } else {
            // Somehow error occurred
            console.log('Error', err.message)
            }
    
            // Setting array length to 1 makes useEffect to identify that the api has fetched the timetable,
            // but not successfully. If the array length is 0, then due to useEffect the api will call twice.
            return new Array<SingleSchedule>(1)
        })
        .then((res) => res as Array<SingleSchedule>)
    }

    const search = async(
        location : string
    ) : Promise<Array<SingleSchedule>> => {
        return await timetableApi(
            `http://swopenapi.seoul.go.kr/api/subway/sample/json/realtimeStationArrival/0/5/${station}`
        ).then((res) =>
        res.map((val : SingleSchedule) => {
            //val['arvlMsg2'] = arrivalUntil(val.arvlMsg2)
            return val
        })
        //.finally(() => { setSpinning(false) })
        )
        //console.log(data.data)
    }

    const openApiMonitor = () => {
        window.open(
            'https://monitor.hybus.app/status/bushanyang',
            '_black',
            'noopener noreferrer'
        )
    }

    const RenderTimetable = () => {
        const { t } = useTranslation()
        if (!spinning) {
            if (timetable.length === 1 && timetable[0] == null) {
            // Timetable API error
            return (
                <>
                <NoTimetable>
                    <NoTimetableInner>
                        {t('api_error')}
                        <br />
                        <ApiStatusButton onClick={openApiMonitor}>
                            {t('status_check')}
                        </ApiStatusButton>
                    </NoTimetableInner>
                </NoTimetable>
                </>
            )
        }

    if (timetable.length === 0) {
        // Buses are done for today. User should refresh after midnight.
        return (
            <>
            <NoTimetable>
                <NoTimetableInner>{t('end_today')}</NoTimetableInner>
            </NoTimetable>
            </>
        )
    }
      // Otherwise - normal case
    return (
        <>
        {timetable.map((val, idx) => {
            if (idx < 5) {
                return (
                    <React.Fragment key={idx}>
                        <div className='flex m-auto gap-3'>
                            <div>
                                {getLineMarkElement(val.subwayId)}
                            </div>
                            <div>
                                {getDestination(val.bstatnNm) + ' 행'}
                            </div>
                            <div>
                                {arrivalUntil(val.arvlMsg2, station)}
                            </div>
                            <div>
                                {(val.arvlMsg3)} 
                            </div>
                            <div>
                                {arrivalStnStatus(val.arvlCd)}
                            </div>
                        </div>
                    </React.Fragment>
                )
            } else {
                return <React.Fragment key={idx} />
            }
            })}
        </>
      )
    } else {
      return <></>
    }
}
// 본체라능
    return(
        <div className='info start'>
            <div className='pageWrapper'>
                <div className='content-wrapper'>
                    <div className='content-container' id='infoContent-container'>
                        <HeadlineWrapper>
                            <Headline>{titleText(location)}</Headline>
                        </HeadlineWrapper>
                        <div className='info-container'>
                            <MainTimetable>
                            {spinning ? (
                                <NoTimetable>
                                    <SyncLoader
                                        color="#AFBDCE"
                                        margin={4}
                                        size={8}
                                        loading={spinning}
                                        cssOverride={tw`table-cell align-middle`}
                                    />
                                </NoTimetable>
                            ) : (
                                <></>
                            )}
                            {RenderTimetable()}
                            </MainTimetable>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Realtime