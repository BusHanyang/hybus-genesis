import axios from 'axios'
import dayjs from 'dayjs'
import customParse from 'dayjs/plugin/customParseFormat'
import dotenv from 'dotenv'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'
import styled from 'styled-components'
import tw from 'twin.macro'

dotenv.config({ path: "../.env", encoding: "utf8" })

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

const TimetableWrapper = styled.div`
    ${tw`h-[14.8rem]`}
`

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

const Chip = styled.img`
    ${tw`py-1 w-12 rounded-full inline-block hsm:w-10 hm:w-10`}
`

const SingleTimetable = styled.div`
    ${tw`text-left mx-auto py-1.5`}
`

const OnTouchAvailableWrapper = styled.div`
    ${tw`bg-slate-200 dark:bg-slate-500 rounded-md text-center h-8 w-[17.5rem] hm:w-[16.25rem] hsm:w-[14.85rem] mx-auto p-1.5 leading-5`}
`

const TimeLeftWrapper = styled.span`
    ${tw`font-Ptd tabular-nums inline-block px-1 w-32 text-right hsm:text-sm hsm:w-[6.5rem] hm:text-[0.9rem] hm:w-[7rem] hm:px-0 hm:leading-6`}
    &.touched {
    ${tw`font-bold text-[#ff673d] dark:text-[#ff996a]`}
    }
`

const ArrowWrapper = styled.div`
    ${tw`text-center inline-block w-6 mx-1.5 hsm:w-4 hsm:text-sm hsm:mx-[0.040rem] hm:mx-0.5 hm:text-[0.9rem] hm:w-6 hm:leading-6`}
`

const DestinationWrapper = styled.span`
    ${tw`text-left inline-block hsm:text-sm hm:text-[0.9rem] hm:leading-6`}
`

const NoTimetable = styled.div`
    ${tw`h-full table`}
`

const NoTimetableInner = styled.span`
    ${tw`table-cell align-middle leading-6`}
`

const TimeClickableConversionText = styled.span`
    ${tw`transition duration-300`}
`

const TimeClickableNotifyText = styled.div`
    ${tw`transition-transform float-left my-auto hsm:text-[0.8rem] hm:text-[0.875rem]`}
`

const ApiStatusButton = styled.button`
    ${tw`rounded-md bg-gray-200 text-gray-700 cursor-default px-2 py-1 mt-2`}
`

const getRealtimeSubway = async (
    API_KEY: string,
    location: string
): Promise<Array<SingleSchedule>> => {
    if(location == 'subway') location = '한대앞'
    else location = '중앙'
    return await realtimeApi(
        `http://swopenapi.seoul.go.kr/api/subway/${API_KEY}/json/realtimeStationArrival/0/5/${location}`
    ).then((res) =>
    res.map((val) => {
        /*
        val['subwayId'] = String(val.subwayId), //노선
        val['updnLine'] = String(val.updnLine), //상행 0  하행 1
        val['bstatnNm'] = val.bstatnNm, //목적지 ㅇㅇ행
        val['arvlMsg2'] = val.arvlMsg2, //남은 정거장 수 msg
        val['arvlMsg3'] = val.arvlMsg3, //현재 역
        val['arvlCd'] = val.arvlCd //현재역에서의 상태
        //val['time'] = String(dayjs(val.time, 'HH:mm').unix())
      */
        return val
    })
    )
} 

const realtimeApi = async (url: string): Promise<Array<SingleSchedule>> => {
    return await axios
        .get(url)
        .then((response) => {
        if (response.status !== 200) {
            console.log(`Error code: ${response.statusText}`)
            return new Array<SingleSchedule>()
        }
        return response.data
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


const arrivalUntil = (arvlMsg2: string, arvlCd: string): string => {
    const str = arvlMsg2.substring(arvlMsg2.indexOf('[') + 1, arvlMsg2.indexOf(']'))
    if (arvlCd == '3' || arvlCd == '4' || arvlCd == '5') {
        return '전 역'
    } else {
        return str + '전 역'
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
        return '운행'
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

const getLineElement = (line: string): JSX.Element => {
    if (line == '1004') {
        return <Chip src="/image/line4.svg"></Chip>
    }
    return <Chip src="/image/suin.svg"></Chip>
}

const getMapURLScheme = (loc: string): string => {
    if (loc == 'shuttlecoke_o') {
    return 'nmap://place?lat=37.2987258&lng=126.8379922&zoom=18&name=셔틀콕&appname=hybus.app'
    } else if (loc == 'subway') {
    return 'nmap://place?lat=37.309738&lng=126.852051&zoom=18&name=한대앞역 셔틀버스 정류장&appname=hybus.app'
    } else if (loc == 'yesulin') {
    return 'nmap://place?lat=37.31951&lng=126.84564&zoom=18&name=예술인 셔틀버스 정류장&appname=hybus.app'
    } else if (loc == 'jungang') {
    return 'nmap://place?lat=37.31489&lng=126.83961&zoom=18&name=중앙역 셔틀버스 정류장&appname=hybus.app'
    } else if (loc == 'shuttlecoke_i') {
    return 'nmap://place?lat=37.29923&lng=126.83737&zoom=18&name=셔틀콕 건너편 정류장&appname=hybus.app'
    } else if (loc == 'residence') {
    return 'nmap://place?lat=37.29349&lng=126.83644&zoom=18&name=기숙사 셔틀버스 정류장&appname=hybus.app'
    } else {
    return 'nmap://place?lat=37.2987258&lng=126.8379922&zoom=18&name=셔틀콕&appname=hybus.app'
    }
}

const getMapURL = (loc: string): string => {
    if (loc == 'shuttlecoke_o') {
    return 'https://map.naver.com/v5/?lng=126.8379922&lat=37.2987258&type=0&title=셔틀콕'
    } else if (loc == 'subway') {
    return 'https://map.naver.com/v5/?lng=126.852051&lat=37.309738&type=0&title=한대앞역 셔틀버스 정류장'
    } else if (loc == 'yesulin') {
    return 'https://map.naver.com/v5/?lng=126.84564&lat=37.31951&type=0&title=예술인 셔틀버스 정류장'
    } else if (loc == 'jungang') {
    return 'https://map.naver.com/v5/?lng=126.83961&lat=37.31489&type=0&title=중앙역 셔틀버스 정류장'
    } else if (loc == 'shuttlecoke_i') {
    return 'https://map.naver.com/v5/?lng=126.83737&lat=37.29923&type=0&title=셔틀콕 건너편 정류장'
    } else if (loc == 'residence') {
    return 'https://map.naver.com/v5/?lng=126.83644&lat=37.29349&type=0&title=기숙사 셔틀버스 정류장'
    } else {
    return 'https://map.naver.com'
    }
}

const openNaverMapApp = (loc: string): void => {
    // Check if web client is Safari
    if (
      navigator.userAgent.match(/(iPod|iPhone|iPad|Macintosh)/) &&
      navigator.userAgent.match(/AppleWebKit/) &&
      !navigator.userAgent.match(/Chrome/)
    ) {
      const naverMap = confirm(t('use_naver_map'))
  
      if (naverMap) {
        window.location.href = getMapURLScheme(loc)
      } else {
        window.location.href = getMapURL(loc)
      }
    } else {
      const clicked = +new Date()
      location.href = getMapURLScheme(loc)
      setTimeout(function () {
        if (+new Date() - clicked < 1500 && !document.hidden) {
          window.location.href = getMapURL(loc)
        }
      }, 1000)
    }
  }

export const Realtime = ({ location }: ScheduleInfo) => {
    const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
    const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())
    const [spinning, setSpinning] = useState<boolean>(true)
    const [isLoaded, setLoaded] = useState<boolean>(false)
    
    const RenderTimetable = (showActualTime: boolean): JSX.Element => {
    const { t } = useTranslation()

    const API_KEY = process.env.REACT_APP_SUBWAY_API_KEY
    
    // For fetching the timetable for the initial time
    useEffect(() => {
        if (!isLoaded) {
            getRealtimeSubway(String(API_KEY), location).then((res) => {
                setTimetable(res)
                setSpinning(false)
                setLoaded(true)
                setCurrentLocation(location)
            })
        }
    }, [isLoaded, location])

    useEffect(() => {
        const timer = setTimeout(() => {
        setCurrentTime(new Date().getTime())
        }, 30000)
        return () => clearTimeout(timer)
    }, [timetable, currentTime])

    if (!spinning) {
        if (timetable.length === 0) {
        // Timetable doesn't exist
        return (
            <>
                <NoTimetable>
                    <NoTimetableInner>{t('no_today')}</NoTimetableInner>
                </NoTimetable>
            </>
        )
        }

        const filtered = timetable.filter((val) => isAfterCurrentTime(val))
        //const reverted = filtered.map((val) => convertUnixToTime(val))

        if (filtered.length === 0) {
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
        {filtered.map((val, idx) => {
            if (idx < 5) {
                return (
                <React.Fragment key={idx}>
                    <HeadlineWrapper>
                    <Headline>{titleText(location)}</Headline>
                        <button
                            className="absolute top-0 right-0 h-full drag-save-n"
                            onClick={() => {
                                openNaverMapApp(location)
                            }}
                        >
                        <img
                            src={'../image/map_black_24dp.svg'}
                            className="cursor-default dark:invert h-8 w-8 hsm:h-7 hsm:w-7 drag-save-n"
                            alt="map icon"
                            onContextMenu={handleContextMenu}
                            draggable="false"
                        />
                        </button>
                    </HeadlineWrapper>
                    <SingleTimetable>
                        {getLineElement(val.subwayId)}
                        <DestinationWrapper>
                            {getDestination(val.bstatnNm)}
                        </DestinationWrapper>
                        <ArrowWrapper> 행</ArrowWrapper>

                    </SingleTimetable>
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

    return (
        <TimetableWrapper>  
            <MainTimeTableWrapper>
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
                </MainTimetable>
            </MainTimeTableWrapper>
        </TimetableWrapper>
    )

}