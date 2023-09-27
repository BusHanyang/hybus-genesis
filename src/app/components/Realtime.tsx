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
    recptnDt : string //갱신 시각
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

const StnListWrapper = styled.div`
    ${tw`flex mb-1 gap-2 hsm:gap-2 leading-6 rounded-full
        hover:brightness-90 hover:bg-slate-50 dark:hover:text-black
    `}
`

const DestStnLeftWrapper = styled.div`
    ${tw`flex justify-end items-center font-Ptd tabular-nums text-right
    w-[5.1rem] hm:text-[0.9rem] hsm:text-sm hsm:w-[4rem] 
    `}
`

const ArrivalStnStatusWrapper = styled.span`
    ${tw`text-left inline-block hsm:text-sm hm:text-[0.9rem] pl-1 pr-2`}
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
    ${tw`h-full flex items-center justify-center`}
`

const NoTimetableInner = styled.span`
    ${tw`text-center hsm:text-sm table-cell align-middle`}
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
    if (arvlCd == '0' || arvlCd == '4') {
        return t('entry')
    } else if (arvlCd == '1' || arvlCd == '5') {
        return t('arrival')
    } else if (arvlCd == '2' || arvlCd == '3') {
        return t('depart')
    } else if (arvlCd == '99') {
        return t('operation')
    } else {
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
    } else if (bstatnNm == '청량리') {
        str += t('cheongnyangni')
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
        return <img className='h-4 ml-[0.15rem]' src={t('last_train_img')} /> 
    } else if(bstatnNm.includes('급행')) {
        return <img className='h-4 ml-[0.15rem]' src={t('rapid_train_img')} /> 
    } 
}

const getLineMarkElement = (line: string): JSX.Element => {
    if (line == '1004') {
        return <Chip src="/image/line4.svg" />
    } else if(line == '1075'){
        return <Chip src={`/image/${t('suin')}.svg`}/>
    } else return <Chip src="/image/helpblack.svg" />
    
}

const RealtimeAPI = async (url: string): Promise<Array<SingleSchedule>> => {
    return await axios
    .get(url)
    .then((response) => {
        if (response.status !== 200) {
            console.log(`Error code: ${response.statusText}`)
            return new Array<SingleSchedule>()
        }
        
        if (response.data.code == 'INFO-200'){
            return new Array<SingleSchedule>()
        } else{
            return new Array<SingleSchedule>(1)
            console.log(`Error code: ${response.data.code}`)
            console.log(`Error Msg: ${response.data.message}`)
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

const search = async(staName : string) : Promise<Array<SingleSchedule>> => {
    return await RealtimeAPI(
        `https://api.hybus.app/subway/1/8/${staName == "한대앞" ? 'subway' : 'jungang'}`
    ).then((res) =>
    res.map((val : SingleSchedule) => {
        //val['arvlMsg2'] = arrivalUntil(val.arvlMsg2)
        return val
    })
    //.finally(() => { setSpinning(false) })
    )
    //console.log(data.data)
}

const openRailblue = (btrainNo: string): void => {
    const today = new Date()
    const year = today.getFullYear()
    const month = ('0' + (today.getMonth() + 1)).slice(-2)
    const day = ('0' + today.getDate()).slice(-2)
    const hours = ('0' + today.getHours()).slice(-2)

    const yesterday = new Date(today.setDate(today.getDate()-1))
    const yYear = yesterday.getFullYear()
    const yMonth = ('0' + (yesterday.getMonth() + 1)).slice(-2)
    const yDay = ('0' + yesterday.getDate()).slice(-2)

    let date = year + month + day
    if(hours == '00' || hours == '01'){
        date = yYear + yMonth + yDay
    }
    window.location.href = 'https://rail.blue/railroad/logis/Default.aspx?train=K' + btrainNo + '&date=' + date + '#!'
}

const isExistAPIError = (recptnDt : string, bstatnNm : string): boolean => {
    // Open API's own data error correction
    const Now : Date =  new Date()
    const Lastest : Date = new Date(recptnDt)
    //Lastest.setSeconds(Lastest.getSeconds() + 300)

    const diffMSec = Now.getTime() - Lastest.getTime()
    const diffMin = diffMSec / (60 * 1000)

    if(bstatnNm.includes('막차') && diffMin >= 3){
        return true
    } else {
        return false
    } 
}

export const Realtime = ({ station }: ScheduleInfo) => {
    const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
    const [isLoaded, setLoaded] = useState<boolean>(false)
    const [isBlink, setBlink] = useState<boolean>(false)
    const [currentLocation, setCurrentLocation] = useState<string>('init')
    const [spinning, setSpinning] = useState<boolean>(true)

    const { t, i18n } = useTranslation()

     // For fetching the timetable for the initial time
    useEffect(() => {
        if (!isLoaded) {
            search(station.trim()).then((res) => {
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
        search(station.trim()).then((res) => {
            setTimetable(res)
            setSpinning(false)
            setCurrentLocation(station.trim())
        })
        } 
    }, [currentLocation, isLoaded, station])

    useEffect(()=>{
        const timer = setTimeout(()=>{ 
            search(station.trim()).then((res) => {
                setTimetable(res)
                setSpinning(false)
                setLoaded(true)
                setCurrentLocation(station.trim())
            })
        }, 10000)

        return ()=>{ clearTimeout(timer) }
    }, [station, timetable])

    useEffect(() => {
        setTimeout(() => {
            isBlink ? setBlink(false) : setBlink(true)
        }, 3000)
    }, [isBlink, setBlink])

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
                    {updn == '상행' && countUp() == 0 
                        ? t('no_train_up') : t('no_train_down')}
                </NoTimetableInner>
            </NoTimetable>
            </>
        )
    }
    // Otherwise - normal case
    let downPrintCnt = 0
    let prevTrain = ''
    return (
        <>
        {timetable.map((val, idx) => {    
            if (!(idx>=3 && updn=='상행') && val.updnLine == updn && downPrintCnt < 3 // Maximum: 3
                && prevTrain != val.btrainNo // Two same trains to one train
                && !isExistAPIError(val.recptnDt, val.bstatnNm)){ // API Error Prevention
                prevTrain = val.btrainNo
                if(updn == '하행') downPrintCnt++
                return (
                    <React.Fragment key={idx}>
                        <StnListWrapper className={`
                            ${val.arvlMsg2.includes(station.trim()) || val.arvlCd == '3'
                                ? 'text-[#ff3737] dark:bg-red-100 dark:text-gray-800 font-bold items-center' : ''}
                            ${val.arvlCd == '5'
                                ? 'text-[#FFBF00] dark:bg-[#F5ECCE] dark:text-gray-800 font-bold items-center' : ''}
                            `}
                            onClick={() => openRailblue(val.btrainNo)}
                            >
                            {getLineMarkElement(val.subwayId)}
                            <DestStnLeftWrapper className={i18n.language=='en' ? 'tracking-tighter' : ''}>
                                <div className={`${i18n.language=='en' && getRapidOrLastElement(val.bstatnNm) 
                                                ? 'tracking-[-0.09em]' : ''} 
                                                ${i18n.language=='en' && val.bstatnNm.includes('청량리') 
                                                ? 'tracking-[-0.15em] hsm:text-xs' : ''}
                                                `}>
                                    {getDestination(val.bstatnNm)}
                                </div>
                                {getRapidOrLastElement(val.bstatnNm)}
                            </DestStnLeftWrapper>
                            <StatusWrapper>
                                {isBlink ? 
                                    stationName(val.arvlMsg3) : 
                                    arrivalUntil(val.arvlMsg2, station.trim())
                                }
                            </StatusWrapper>
                            <ArrivalStnStatusWrapper className={i18n.language=='en' ? 'tracking-tighter' : ''}>
                                {arrivalStnStatus(val.arvlCd)}
                            </ArrivalStnStatusWrapper>
                        </StnListWrapper>
                    </React.Fragment>
                )
            } else {
                return <React.Fragment key={idx} />
            }
            })}
        </>
    )} else {
        return <></>
    }
}
    // Main Code for Implementation of DOM
    return(
        <TimetableWrapper>
            <HeadlineWrapper>
                <Chip className='pb-2 hm:pb-0 hsm:pb-2 mr-[0.1rem]' src="/image/line4.svg" />
                <Chip className='pb-2 hm:pb-0 hsm:pb-2 mr-1.5' src={`/image/${t('suin')}.svg`} />
                <Headline>
                    {titleText(station.trim())}
                </Headline>
            </HeadlineWrapper>
            <MainTimetable>
                {spinning ? (
                <div className='h-[12rem]'>
                    <NoTimetable>
                        <SyncLoader
                            color="#AFBDCE"
                            margin={4}
                            size={8}
                            loading={spinning}
                            cssOverride={tw`table-cell align-middle`}
                        />
                    </NoTimetable>
                </div>
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