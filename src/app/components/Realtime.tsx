import axios from 'axios'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'
import styled from 'styled-components'
import tw from 'twin.macro'

type SingleSchedule = {
    btrainNo: string //차량 번호
    subwayId: string //노선
    updnLine: string //상행 0  하행 1
    bstatnNm: string //목적지 ㅇㅇ행
    arvlMsg2: string //남은 정거장 수 msg
    arvlMsg3: string //현재 역
    arvlCd: string //현재역에서의 상태
}

type ScheduleInfo = {
    station: string
}

const TimetableWrapper = styled.div`
  ${tw`h-[14.8rem] hm:h-[15.3rem]`}
`

const HeadlineWrapper = styled.div`
  ${tw`flex justify-center`} drag-save-n
`

const Headline = styled.h2`
  ${tw`font-bold text-2xl mb-2 hsm:text-lg hm:text-[1.375rem] hsm:mb-4 hsm:mt-2 hm:mb-2 hm:mt-2`}
`

const DestStnLeftWrapper = styled.div`
  ${tw`flex justify-end font-Ptd tabular-nums w-[5.1rem] text-right 
  hm:text-[0.9rem]
  hsm:text-sm hsm:w-[4rem]
  `}
`

const ArrivalStnStatusWrapper = styled.span`
  ${tw`text-left inline-block hsm:text-sm hm:text-[0.9rem] pl-1`}
`

const StatusWrapper = styled.span`
    ${tw`font-Ptd tabular-nums inline-block px-1 w-[5rem] text-right 
    hm:text-[0.9rem] hm:w-[4rem] hm:px-0
    hsm:text-sm hsm:w-[4rem]
    `}
`

const MainTimetable = styled.div`
  ${tw`inline-block select-none h-full`}
`

const NoTimetable = styled.div`
  ${tw`h-full table `}
`

const NoTimetableInner = styled.span`
  ${tw`table-cell align-middle leading-6`}
`

const ApiStatusButton = styled.button`
  ${tw`rounded-md bg-gray-200 text-gray-700 cursor-default px-2 py-1 mt-2`}
`

const Chip = styled.img`
    ${tw`my-auto w-[1.5rem] inline-block`}
` 

const arrivalUntil = (arvlMsg2: string, station: string): string => {
    if (arvlMsg2 == '전역 출발' || 
        arvlMsg2 == '전역 도착' || 
        arvlMsg2 == '전역 진입' || 
        arvlMsg2 == '전역 접근' 
    ) {
        return t('prevstn')
    } else if(arvlMsg2.includes(station.trim())){
        return t('here')
    } else {
        const str = arvlMsg2.substring(arvlMsg2.indexOf('[')+1, arvlMsg2.indexOf(']'))
        return str + t('n_stn')
    }
}

const stationName = (arvlMsg3: string): string => {
    if (arvlMsg3 == '남동인더스파크') {
        return '남동공단'
    } else if (arvlMsg3 == '정부과천청사') {
        return '과천청사'
    } else if (arvlMsg3 == '총신대입구(이수)'){
        return '이수'
    } else if (arvlMsg3 == '동대문역사문화공원'){
        return '동역사'
    } else if (arvlMsg3 == '성신여대입구'){
        return '성신여대'
    } else if (arvlMsg3 == '대모산입구'){
        return '대모산'
    } else {
        return arvlMsg3
    }
}

const arrivalStnStatus = (arvlCd: string): string => {
    if (arvlCd == '0') {
        return t('entry')
    } else if (arvlCd == '1') {
        return t('arrival')
    } else if (arvlCd == '2') {
        return t('depart')
    } else if (arvlCd == '3') {
        return t('depart')
    } else if (arvlCd == '4') {
        return t('entry')
    } else if (arvlCd == '5') {
        return t('arrival')
    } else if (arvlCd == '99') {
        return t('operation')
    }else {
        return 'Error'
    }
}

const titleText = (location: string): string => {
    if (location.trim() === '한대앞') {
        return t('hyu_stn')
    } else if (location.trim() === '중앙') {
        return t('jungang_stn')
    } else {
        return t('else')
    }
}

const getDestination = (bstatnNm: string): string => {
    let str = ''
    let isLast = false
    let isRapid = false
    if(bstatnNm.includes('(막차)')){
        isLast = true
        bstatnNm = bstatnNm.replace(' (막차)', '')
    } else if(bstatnNm.includes('(급행)')){
        //str = '⚡'
        isRapid = true
        bstatnNm = bstatnNm.replace(' (급행)', '')
    }

    if (bstatnNm == '오이도') {
        str += t('oido')
    } else if (bstatnNm == '안산') {
        str += t('ansan')
    } else if (bstatnNm == '금정') {
        str += t('geumjeong')
    } else if (bstatnNm == '당고개') {
        str += t('danggogae')
    } else if (bstatnNm == '노원') {
        str += t('nowon')
    } else if (bstatnNm == '한성대입구') {
        str += t('hansung')
    } else if (bstatnNm == '왕십리') {
        str += t('wangsimni')
    } else if (bstatnNm == '인천') {
        str += t('incheon')
    } else if (bstatnNm == '죽전') {
        str += t('jukjeon')
    } else if (bstatnNm == '고색') {
        str += t('gosaek')
    } else {
        str += bstatnNm
    }
    return str + (!isLast && !isRapid ? t('for') : '')
} 

const getRapidOrLastElement = (bstatnNm : string) => {
    if (bstatnNm.includes('막차')) {
        return <img className='h-5 ml-1 items-center' src={t('last_train_img')} /> 
    } else if(bstatnNm.includes('급행')) {
        return <img className='h-5 ml-1 items-center' src={t('rapid_train_img')} /> 
    } 
}

const getLineMarkElement = (line: string): JSX.Element => {
    if (line == '1004') {
        return <Chip src="/image/line4.svg" />
    } else if(line == '1075'){
        return <Chip src={`/image/${t('suin')}.svg`}/>
    } else return <Chip src="/image/helpblack.svg" />
    
}

const openRailblue = (btrainNo: string): void => {
    window.location.href = 'https://rail.blue/railroad/logis/Default.aspx?train=K' + btrainNo + '#!'
}


export const Realtime = ({ station }: ScheduleInfo) => {
    const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
    const [isLoaded, setLoaded] = useState<boolean>(false)
    const [isBlink, setBlink] = useState<boolean>(false)
    const [currentLocation, setCurrentLocation] = useState<string>('init')
    //const [station, setStation] = useState<string>(stationary)
    const [spinning, setSpinning] = useState<boolean>(true)

     // For fetching the timetable for the initial time

    useEffect(() => {
        if (!isLoaded) {
            search().then((res) => {
                setTimetable(res)
                setSpinning(false)
                setLoaded(true)
                setCurrentLocation(station.trim())
            })
        } 
    }, [isLoaded, station])

    // For fetching the timetable when tab is changed (Efficient)
    useEffect(() => {
        if (
            isLoaded &&
            currentLocation !== 'init' &&
            station.trim() !== currentLocation
        ) {
        setSpinning(true)
        setTimetable([])
        search().then((res) => {
            setTimetable(res)
            setSpinning(false)
            setCurrentLocation(station.trim())
        })
        } 
    }, [currentLocation, isLoaded, station])

    useEffect(()=>{
        const timer = setInterval(()=>{ 
            search().then((res) => {
                setTimetable(res)
                setSpinning(false)
                setLoaded(true)
                setCurrentLocation(station.trim())
            })
        }, 10000)

        return ()=>{ clearTimeout(timer) }
        })

    useEffect(() => {
        setTimeout(() => {
            isBlink ? setBlink(false) : setBlink(true)
        }, 3000)
    }, [isBlink, setBlink])

    const timetableApi = async (url: string): Promise<Array<SingleSchedule>> => {
        return await axios
        .get(url)
        .then((response) => {
            if (response.status !== 200) {
            console.log(`Error code: ${response.statusText}`)
            return new Array<SingleSchedule>()
            }
            
            if (response.data.code == 'INFO-200'){
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

    const search = async() : Promise<Array<SingleSchedule>> => {
        //if(location === 'jungang') setStation('중앙')
        //else if((location === 'subway')) setStation('한대앞')
        return await timetableApi(
            `https:///api.hybus.app/subway/1/7/${station.trim()}`
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

    const countUp = () : number => {
        let upCnt = 0
        for(const idx in timetable){
            if(timetable[idx].updnLine === '상행') upCnt++
        }
        return upCnt
    }

    const RenderTimetable = (updn : string) => {
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

    if (timetable.length === 0 
        || (updn == '상행' && countUp() === 0) 
        || (updn == '하행' && timetable.length - countUp() === 0)) {
        // Trains are done for today. User should refresh after midnight.
        return (
            <>
            <NoTimetable>
                <NoTimetableInner>
                    {countUp() === 0 ? t('no_train_up') : t('no_train_down')}
                </NoTimetableInner>
            </NoTimetable>
            </>
        )
    }
    // Otherwise - normal case
    let downPrintCnt = 0
    return (
        <>
        {timetable.map((val, idx) => {    
            if (!(idx==3 && updn=='상행') && val.updnLine == updn && downPrintCnt < 3) {
                if(updn == '하행') {
                    downPrintCnt++
                }
                return (
                    <React.Fragment key={idx}>
                        <div className={`flex mb-1 gap-2 hsm:gap-2 leading-6 
                            ${val.arvlMsg2.includes(station.trim()) 
                                || (val.arvlCd == '3') 
                                ? 'text-[#ff3737] dark:bg-red-200 dark:text-gray-800 rounded-full font-bold' : ''}`}
                            onClick={() => {
                                openRailblue(val.btrainNo)
                        }}>
                            {getLineMarkElement(val.subwayId)}
                            <DestStnLeftWrapper>
                                <div>{getDestination(val.bstatnNm)}</div>
                                {getRapidOrLastElement(val.bstatnNm)}
                            </DestStnLeftWrapper>
                            <StatusWrapper>
                                {isBlink ? 
                                    stationName(val.arvlMsg3) : 
                                    arrivalUntil(val.arvlMsg2, station.trim())
                                }
                            </StatusWrapper>
                            <ArrivalStnStatusWrapper>
                                {arrivalStnStatus(val.arvlCd)}
                            </ArrivalStnStatusWrapper>
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
        <TimetableWrapper>
            <HeadlineWrapper>
                <Chip className='pb-2 hm:pb-0 hsm:pb-2 mr-[0.1rem]' src="/image/line4.svg" />
                <Chip className='pb-2 hm:pb-0 hsm:pb-2 mr-1.5' src={`/image/${t('suin')}.svg`} />
                <Headline>
                    {titleText(station)}
                </Headline>
            </HeadlineWrapper>
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
            <div className='h-[5rem]'>{RenderTimetable('상행')}</div>
            <hr className='my-2' />
            <div className='h-[5rem]'>{RenderTimetable('하행')}</div>
            </MainTimetable>
        </TimetableWrapper>
    )
}

export default Realtime