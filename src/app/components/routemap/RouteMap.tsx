import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import { useTimeTableContext } from '@/context/TimeTableContext'
import { CircleAnimate } from '@/data'

const Circle = styled.span`
    ${tw`
        flex rounded-full inline-block
        h-3 w-3 rt1:h-2.5 rt1:w-2.5
        z-1 mx-2
    `}
`

const RouteRowsContainer = styled.div`
    ${tw`grid grid-rows-5 gap-2`}
`

const RouteColsContainer = styled.div`
    ${tw`grid grid-cols-6 place-items-center`}
`

const RouteTextContainer =  styled.div<{lang:string}>`
    ${tw`whitespace-nowrap text-center tracking-tighter mt-1 hm:mt-2 hsm:mt-2 font-semibold`}
    ${(props) => props.lang === 'ko' ? tw`text-[15px] hm:text-[13px] hsm:text-[12px]` : tw`wide:text-[13px] mwide:text-[12px] text-[11px] hm:text-[11px] hsm:text-[9.3px]`}
`

const RouteStations = styled.div`
    ${tw`transition duration-150 ease-in-out flex relative`}
`

const RouteMethod = styled.div`
    ${tw`text-center rounded-full py-1 w-16 text-sm hm:w-12 hm:text-xs self-center text-black tracking-tight font-semibold`}
`

const MainContainer = styled.div<{status: string}>`
    ${tw`transition duration-150 ease-in-out mx-auto h-[14rem]`}
    ${(props) => props.status === 'entered' || props.status === 'exit' ? tw`opacity-100` : tw`opacity-0`}
`

const RouteLine = styled.div`
    ${tw`absolute transition duration-150 ease-in-out h-[3px] z-0`}
`

const SpecialStopsText = styled.p<{key:number, lang:string}>`
    ${tw`absolute text-xs top-[-17px] left-[-15px] text-center w-10 font-bold`}
    ${(props) => props.lang === 'ko' ? tw`tracking-tight` : tw`tracking-tighter text-[0.7rem]`}
`

const DotRoute = (props: {
    rootStatus: string,
    isPrevStop: (line: string, index: number) => boolean
}) => {
    const { t, i18n } = useTranslation()

    const directDot = () => {
        const arrDir = []

        for (let i = 0; i < 5; i++){
            if(i === 4){
                arrDir.push(<RouteStations id='dirdot' key={i}><Circle className={props.isPrevStop('direct', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'} /></RouteStations>)
                continue
            }
            arrDir.push(<RouteStations id='dirdot' key={i}><Circle className={props.isPrevStop('direct', i) ? 'bg-chip-blue' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
        }

        return (
            <>
                {arrDir.map((item) => {
                    return item
                })}
            </>
            
        )
    }

    const cycleDot = () => {
        const arrCyc = []

        for (let i = 0; i < 6; i++){
            if (i >= 2 && i <= 4){
                if (i === 2){
                    arrCyc.push(
                        <div key={i} className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                            <RouteStations id='cycdot' key={i}><Circle className={props.isPrevStop('cycle', i) ? 'bg-chip-red' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>
                            <RouteStations id='cycdot' key={i+1}>
                                <Circle className={`${props.isPrevStop('cycle', i+1) ? 'bg-chip-red' : 'bg-zinc-200 dark:bg-slate-500'} grid grid-rows-2 relative`}>
                                    <SpecialStopsText key={0} lang={i18n.language} className={props.isPrevStop('cycle', 3) ? 'text-chip-red' : 'text-zinc-200 dark:text-slate-500'}>
                                        {t('yesul')}
                                    </SpecialStopsText>
                                </Circle>
                            </RouteStations>
                            <RouteStations id='cycdot' key={i+2}><Circle className={props.isPrevStop('cycle', i+2) ? 'bg-chip-red' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>
                        </div>
                    )
                }
                continue
            }
            if(i === 5){
                arrCyc.push(<RouteStations id='cycdot' key={i}><Circle className={props.isPrevStop('cycle', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
                continue
            }
            arrCyc.push(<RouteStations id='cycdot' key={i}><Circle className={props.isPrevStop('cycle', i) ? 'bg-chip-red' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
        }

        return (
            <>
                {arrCyc.map((item) => {
                    return item
                })}
            </>
        )
    }

    const yesulDot = () => {
        const arrYes = []

        for (let i = 0; i < 6; i++){
            if (i >= 2 && i <= 4){
                if (i === 2){
                    arrYes.push(
                        <div key={i} className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                            <RouteStations id='yesdot' key={i} title='skip'><Circle className='opacity-0'/></RouteStations>
                            <RouteStations id='yesdot' key={i+1}>
                                <Circle className={`${props.isPrevStop('yesulin', i+1) ? 'bg-chip-green' : 'bg-zinc-200 dark:bg-slate-500'} grid grid-rows-2 relative`}>
                                    <SpecialStopsText key={1} lang={i18n.language} className={props.isPrevStop('yesulin', 3) ? 'text-chip-green' : 'text-zinc-200 dark:text-slate-500'}>
                                        {t('yesul')}
                                    </SpecialStopsText>
                                </Circle>
                            </RouteStations>
                            <RouteStations id='yesdot' key={i+2}><Circle className={props.isPrevStop('yesulin', i+2) ? 'bg-chip-green' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>
                        </div>
                    )
                }
                continue
            }
            if (i === 5){
                arrYes.push(<RouteStations id='yesdot' key={i}><Circle className={props.isPrevStop('yesulin', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
                continue
            }
            arrYes.push(<RouteStations id='yesdot' key={i}><Circle className={props.isPrevStop('yesulin', i) ? 'bg-chip-green' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
        }

        return (
            <>
                {arrYes.map((item) => {
                    return item
                })}
            </>
        )
    }

    const jungDot = () => {
        const arrJun = []

        for (let i = 0; i < 6; i++){
            if (i >= 2 && i <= 4){
                if (i === 2){
                    arrJun.push(
                        <div key={i} className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                            <RouteStations id='jundot' key={i}><Circle className={props.isPrevStop('jungang', i) ? 'bg-chip-purple' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>
                            <RouteStations id='jundot' key={i+1}>
                                <Circle className={`${props.isPrevStop('jungang', i+1) ? 'bg-chip-purple' : 'bg-zinc-200 dark:bg-slate-500'} grid grid-rows-2 relative`}>
                                    <SpecialStopsText key={2} lang={i18n.language} className={props.isPrevStop('jungang', i+1) ? 'text-chip-purple' : 'text-zinc-200 dark:text-slate-500'}>
                                        {t('jung')}
                                    </SpecialStopsText>
                                </Circle>
                            </RouteStations>
                            <RouteStations id='jundot' key={i+2}><Circle className={props.isPrevStop('jungang', i+2) ? 'bg-chip-purple' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>
                        </div>
                    )
                }
                continue
            }
            if (i === 5){
                arrJun.push(<RouteStations id='jundot' key={i}><Circle className={props.isPrevStop('jungang', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
                continue
            }
            arrJun.push(<RouteStations id='jundot' key={i}><Circle className={props.isPrevStop('jungang', i) ? 'bg-chip-purple' : 'bg-zinc-200 dark:bg-slate-500'}/></RouteStations>)
        }

        return(
            <>
                {arrJun.map((item) => {
                    return item
                })}
            </>
        )
    }

    switch(props.rootStatus){
        case 'direct':
            return directDot()
        case 'cycle':
            return cycleDot()
        case 'yesulin':
            return yesulDot()
        case 'jungang':
            return jungDot()
        default:
            return <></>
    }
}

const LineRoute = (props: {
    rootStatus: string,
    isPrevStop: (line: string, index: number) => boolean
}) => {
    const directLine = () => {
        const arrDir = []

        for (let i = 0; i < 4; i++){
            if (i === 3){
                arrDir.push(<RouteLine id='dirline' className={props.isPrevStop('direct', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
                continue
            }

            arrDir.push(<RouteLine id='dirline' className={props.isPrevStop('cycle', i) ? 'bg-chip-blue' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
        }

        return(
            <>
                {arrDir.map((item) => {
                    return item
                })}
            </>
        )
    }

    const cycleLine = () => {
        const arrCyc = []

        for (let i = 0; i < 5; i++){
            if (i === 4){
                arrCyc.push(<RouteLine id='cycline' className={props.isPrevStop('cycle', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
                continue
            }

            arrCyc.push(<RouteLine id='cycline' className={props.isPrevStop('cycle', i) ? 'bg-chip-red' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
        }

        return(
            <>
                {arrCyc.map((item) => {
                    return item
                })}
            </>
        )
    }

    const yesulLine = () => {
        const arrYes = []

        for (let i = 0; i < 5; i++){
            if (i === 4){
                arrYes.push(<RouteLine id='yesline' className={props.isPrevStop('yesulin', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
                continue
            }

            arrYes.push(<RouteLine id='yesline' className={props.isPrevStop('yesulin', i) ? 'bg-chip-green' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
        }

        return(
            <>
                {arrYes.map((item) => {
                    return item
                })}
            </>
        )
    }

    const jungLine = () => {
        const arrJun = []

        for (let i = 0; i < 5; i++){
            if (i === 4){
                arrJun.push(<RouteLine id='junline' className={props.isPrevStop('jungang', i) ? 'bg-chip-orange' : 'bg-zinc-200 dark:bg-slate-500'}key={i}></RouteLine>)
                continue
            }

            arrJun.push(<RouteLine id='junline' className={props.isPrevStop('jungang', i) ? 'bg-chip-purple' : 'bg-zinc-200 dark:bg-slate-500'} key={i}></RouteLine>)
        }

        return(
            <>
                {arrJun.map((item) => {
                    return item
                })}
            </>
        )
    }

    switch(props.rootStatus){
        case 'direct':
            return directLine()
        case 'cycle':
            return cycleLine()
        case 'yesulin':
            return yesulLine()
        case 'jungang':
            return jungLine()
        default:
            return <></>
    }
}

const RouteMap = (props: {
    status:string,
    tab: string
}) => {
    const timetable = useTimeTableContext().timetable

    const { t, i18n } = useTranslation()
    // main ref
    const mainRef = useRef<HTMLDivElement>(null)
    // dot refs
    const dotDir = useRef<NodeListOf<HTMLDivElement>>()
    const dotCyc = useRef<NodeListOf<HTMLDivElement>>()
    const dotYes = useRef<NodeListOf<HTMLDivElement>>()
    const dotJun = useRef<NodeListOf<HTMLDivElement>>()
    // line refs
    const lineDir = useRef<NodeListOf<HTMLDivElement>>()
    const lineCyc = useRef<NodeListOf<HTMLDivElement>>()
    const lineYes = useRef<NodeListOf<HTMLDivElement>>()
    const lineJun = useRef<NodeListOf<HTMLDivElement>>()

    const isPrevStop = (line: string, index: number) => {
        switch(props.tab){
            case 'shuttlecoke_o':
                return index !== 0
            case 'shuttlecoke_i':
                if (line === 'direct') return index >= 3
                return index >= 4
            case 'subway':
                if (line === 'yesulin') return false
                return index >= 2
            case 'yesulin':
                if (line === 'direct' || line === 'jungang') return false
                return index >= 3
            case 'jungang':
                if (line === 'jungang') return index >= 3
                return false
            default:
                return true
        }
    }

    const responsiveLines = (refs:React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>, lines:React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>) => {
        if(refs.current !== undefined && lines.current !== undefined && refs.current.length > 0 && lines.current.length > 0){
            for(let i = 1; i <= lines.current.length; i++){
                const rectA = {"left":refs.current[i-1]?.offsetLeft, "top":refs.current[i-1]?.offsetTop, "width":refs.current[i-1]?.offsetWidth, "height":refs.current[i-1]?.offsetHeight}
                const rectB = {"left":refs.current[i]?.offsetLeft, "top":refs.current[i]?.offsetTop, "width":refs.current[i]?.offsetWidth, "height":refs.current[i]?.offsetHeight}
                const x1 = (rectA.left ?? 0) + (rectA.width ?? 0) / 2
                const y1 = (rectA.top ?? 0) + (rectA.height ?? 0) / 2
                const x2 = (rectB.left ?? 0) + (rectB.width ?? 0) / 2
                const y2 = (rectB.top ?? 0) + (rectB.height ?? 0) / 2

                const d = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                lines.current[i-1].style.width = `${d}px`
                lines.current[i-1].style.top = `${(refs.current[i-1]?.offsetTop ?? 0)+4}px`
                const dotchild = refs.current[i-1]?.firstChild as HTMLElement
                if(dotchild != undefined){
                    lines.current[i-1].style.left = `${refs.current[i-1]?.offsetLeft+dotchild.offsetLeft+1}px`
                }
            }
        }
    }

    useEffect(() => {
        // dot
        dotDir.current = mainRef.current?.querySelectorAll('#dirdot')
        dotCyc.current = mainRef.current?.querySelectorAll('#cycdot')
        dotYes.current = mainRef.current?.querySelectorAll('#yesdot')
        dotJun.current = mainRef.current?.querySelectorAll('#jundot')
        // line
        lineDir.current = mainRef.current?.querySelectorAll('#dirline')
        lineCyc.current = mainRef.current?.querySelectorAll('#cycline')
        lineYes.current = mainRef.current?.querySelectorAll('#yesline')
        lineJun.current = mainRef.current?.querySelectorAll('#junline')

        const updateLines = () => {
            responsiveLines(dotDir, lineDir)
            responsiveLines(dotCyc, lineCyc)
            responsiveLines(dotYes, lineYes)
            responsiveLines(dotJun, lineJun)
        }

        updateLines()

        window.addEventListener("resize",updateLines)

        return () => {
            window.removeEventListener("resize", updateLines)
        }
    }, [])

    const circleAnimation = (props: CircleAnimate) => {
        if (props.ref.current === undefined) return
        for(let i = props.index; i <= props.index+1 && props.ref.current[i].childNodes.length <= 1; i++){
            const pingCircle = document.createElement('div')
            pingCircle.classList.add(
                'animate-ping',
                'absolute',
                'rounded-full',
                'inline-flex',
                'h-3', 'w-3',
                'rt1:h-2.5',
                'rt1:w-2.5',
                'z-1',
                i === 5 || (i === 4 && props.chipColor === 'bg-chip-blue') ? 'bg-chip-orange': props.chipColor,
                'mx-2')
            const ind = props.ref.current[i].title === 'skip' ? i+1 : i
            props.ref.current[ind]?.append(pingCircle)
        }
    }

    const circleAnimationRemove = (refs: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>) => {
        if (refs.current === undefined) return
        for (const refr of refs.current){
            if (refr?.childNodes.length > 1){
                refr?.removeChild(refr?.lastChild as Node)
            }
        }
    }

    const circleAnimationRemoveAll = () => {
        circleAnimationRemove(dotDir)
        circleAnimationRemove(dotCyc)
        circleAnimationRemove(dotYes)
        circleAnimationRemove(dotJun)
    }

    const timetableType = (type: string, index:number) => {
        if(type === 'C'){
            return {ref: dotCyc, index: index, chipColor: 'bg-chip-red'}
        } else if(type === 'DHJ'){
            return {ref: dotJun, index: index, chipColor: 'bg-chip-purple'}
        } else if(type === 'DY'){
            return {ref: dotYes, index: index, chipColor: 'bg-chip-green'}
        } else {
            return {ref: dotDir, index: index, chipColor: 'bg-chip-blue'}
        }
    }

    const updateHighlight = () => {
        console.log(timetable)
        if(timetable?.time !== ''){
            switch(props.tab){
                case 'shuttlecoke_o':
                    circleAnimation(timetableType(timetable.type,1))
                    break
                case 'subway':
                    circleAnimation(timetableType(timetable.type,2))
                    break
                case 'yesulin':
                    circleAnimation(timetableType(timetable.type,3))
                    break
                case 'jungang':
                    circleAnimation({ref: dotJun, index: 3, chipColor: 'bg-chip-purple'})
                    break
                case 'shuttlecoke_i':
                    if(timetable.type === 'NA') return
                    circleAnimation({ref: dotDir, index: 3, chipColor: 'bg-chip-blue'})
                    circleAnimation({ref: dotJun, index: 4, chipColor: 'bg-chip-purple'})
                    circleAnimation({ref: dotCyc, index: 4, chipColor: 'bg-chip-red'})
                    circleAnimation({ref: dotYes, index: 4, chipColor: 'bg-chip-green'})
                    break
                default:
                    circleAnimation(timetableType(timetable.type,0))
                    break
            }
        }
    }

    circleAnimationRemoveAll()

    useEffect(() => {
        updateHighlight()
    })

    return (
        <MainContainer status={props.status}>
            <RouteRowsContainer ref={mainRef}>
                <RouteColsContainer>
                    <RouteTextContainer lang={i18n.language} className='col-start-2'>{t('dorm')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_shuttle_o')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_subway')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_shuttle_o')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dorm')}</RouteTextContainer>
                </RouteColsContainer>
                <RouteColsContainer>
                    <RouteMethod className='bg-chip-blue'>{t('direct')}</RouteMethod>
                    <DotRoute rootStatus='direct' isPrevStop={isPrevStop}/>
                    <LineRoute rootStatus='direct' isPrevStop={isPrevStop}/>
                </RouteColsContainer>
                <RouteColsContainer>
                    <RouteMethod className='bg-chip-red'>{t('cycle')}</RouteMethod>
                    <DotRoute rootStatus='cycle' isPrevStop={isPrevStop}/>
                    <LineRoute rootStatus='cycle' isPrevStop={isPrevStop}/>
                </RouteColsContainer>
                <RouteColsContainer>
                    <RouteMethod className='bg-chip-green'>{t('yesul')}</RouteMethod>
                    <DotRoute rootStatus='yesulin' isPrevStop={isPrevStop}/>
                    <LineRoute rootStatus='yesulin' isPrevStop={isPrevStop}/>
                </RouteColsContainer>
                <RouteColsContainer>
                    <RouteMethod className='bg-chip-purple'>{t('jung')}</RouteMethod>
                    <DotRoute rootStatus='jungang' isPrevStop={isPrevStop}/>
                    <LineRoute rootStatus='jungang' isPrevStop={isPrevStop}/>
                </RouteColsContainer>
            </RouteRowsContainer>
        </MainContainer>
    )
}

export default RouteMap
