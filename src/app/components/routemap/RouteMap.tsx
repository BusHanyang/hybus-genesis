import React, { useCallback, useEffect,useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';

import { CircleAnimate } from '@/data';
import { SingleShuttleSchedule } from "@/data";

const Circle = styled.span`
  ${tw`
    flex rounded-full inline-block
    h-3 w-3 rt1:h-2.5 rt1:w-2.5
    z-10
  `}
`

const CycleCircle = styled(Circle)`
  ${tw`bg-chip-red mx-2`}
`

const DirectCircle = styled(Circle)`
  ${tw`bg-chip-blue mx-2`}
`

const YesulinCircle = styled(Circle)`
  ${tw`bg-chip-green mx-2`}
`

const JungangCircle = styled(Circle)`
  ${tw`bg-chip-purple mx-2`}
`
const EndCircle = styled(Circle)`
    ${tw`bg-chip-orange mx-2`}
`
const RouteRowsContainer = styled.div`
${tw`grid grid-rows-5 gap-2`}
`
const RouteColsContainer = styled.div`
${tw`grid grid-cols-6 place-items-center`}
`
const RouteTextContainer =  styled.div<{lang:string}>`
${tw`whitespace-nowrap text-center`}
${(props) => props.lang === 'ko' ? tw`text-[15px] hm:text-[13px]` : tw`text-[12px] rt1:text-[9px]`}
`
const RouteStations = styled.div`
${tw`transition duration-150 ease-in-out flex relative`}
`
const RouteMethod = styled.div`
${tw`text-center rounded-full py-1 w-16 hm:w-12 hm:text-xs self-center text-black`}
`
const MainContainer = styled.div<{status: string}>`
${tw`transition duration-150 ease-in-out mx-auto`}
    ${(props) => props.status === 'entered' || props.status === 'exit' ? tw`opacity-100` : tw`opacity-0`}
`
const RouteLine = styled.div`
    ${tw`absolute transition duration-150 ease-in-out h-[3px] z-1`}

`
export const RouteMap = (props: {
    status:string,
    tab: string
}) => {
    interface RootState {
        actions: SingleShuttleSchedule[]
    }
    const timetable = useSelector((state: RootState) => state.actions)
    const { t, i18n } = useTranslation()
    // dots
    const [direct, setDirect] = useState<JSX.Element[]>([])
    const [cycle, setCycle] = useState<JSX.Element[]>([])
    const [yesulin, setYesulin] = useState<JSX.Element[]>([])
    const [jungang, setJungang] = useState<JSX.Element[]>([])
    // lines
    const [dirLine, setDirLine] = useState<JSX.Element[]>([])
    const [cycLine, setCycLine] = useState<JSX.Element[]>([])
    const [yesLine, setYesLine] = useState<JSX.Element[]>([])
    const [junLine, setJunLine] = useState<JSX.Element[]>([])
    // dot refs
    const refdir = useRef<Array<HTMLDivElement>>([])
    const refcyc = useRef<Array<HTMLDivElement>>([])
    const refyes = useRef<Array<HTMLDivElement>>([])
    const refjun = useRef<Array<HTMLDivElement>>([])
    // line refs
    const linedir = useRef<Array<HTMLDivElement>>([])
    const linecyc = useRef<Array<HTMLDivElement>>([])
    const lineyes = useRef<Array<HTMLDivElement>>([])
    const linejun = useRef<Array<HTMLDivElement>>([])
    // langtest
    const lang = useRef<Array<HTMLParagraphElement | null>>([])
    const directInput = useCallback(() => {
        const arrdir = []
        const arrcyc = []
        const arryes = []
        const arrjun = []
        for(let i = 0; i < 5; i++){
            if(i === 4){
                arrdir.push(<RouteStations key={i} ref={d => d!= null?refdir.current[i] = d:null}><EndCircle/></RouteStations>)
                continue
            }
            arrdir.push(<RouteStations key={i} ref={d => d!= null?refdir.current[i] = d:null}><DirectCircle/></RouteStations>)
        }
        for(let i = 0; i < 6; i++){
            if(i >= 2 && i <= 4){
                if(i === 2){
                    arrcyc.push(
                        <div key={i} className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                            <RouteStations key={i} ref={d => d!= null?refcyc.current[i] = d:null}><CycleCircle/></RouteStations>
                            <RouteStations key={i+1} ref={d => d!= null?refcyc.current[i+1] = d:null}><CycleCircle className='grid grid-rows-2 relative'><p key={0} ref={d => lang.current[0] = d} className='absolute text-xs top-[-20px] left-[-14px] text-center w-10 text-chip-green'>{t('yesul')}</p></CycleCircle></RouteStations>
                            <RouteStations key={i+2} ref={d => d!= null?refcyc.current[i+2] = d:null}><CycleCircle/></RouteStations>
                        </div>
                    )
                    arryes.push(
                        <div key={i} className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                            <RouteStations key={i} ref={d => d!= null?refyes.current[i] = d:null} title='skip'><YesulinCircle className='opacity-0'/></RouteStations>
                            <RouteStations key={i+1} ref={d => d!= null?refyes.current[i+1] = d:null}><YesulinCircle className='grid grid-rows-2 relative'><p key={1} ref={d => lang.current[1] = d} className='absolute text-xs top-[-20px] left-[-14px] text-center w-10 text-chip-green'>{t('yesul')}</p></YesulinCircle></RouteStations>
                            <RouteStations key={i+2} ref={d => d!= null?refyes.current[i+2] = d:null}><YesulinCircle/></RouteStations>
                        </div>
                    )
                    arrjun.push(
                        <div key={i} className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                            <RouteStations key={i} ref={d => d!= null?refjun.current[i] = d:null}><JungangCircle/></RouteStations>
                            <RouteStations key={i+1} ref={d => d!= null?refjun.current[i+1] = d:null}><JungangCircle className='grid grid-rows-2 relative'><p key={2} ref={d => lang.current[2] = d} className='absolute text-xs top-[-20px] left-[-14px] text-center w-10 text-chip-purple'>{t('jung')}</p></JungangCircle></RouteStations>
                            <RouteStations key={i+2} ref={d => d!= null?refjun.current[i+2] = d:null}><JungangCircle/></RouteStations>
                        </div>
                    )
                }
                continue
            }
            if(i === 5){
                arrcyc.push(<RouteStations key={i} ref={d => d!= null?refcyc.current[i] = d:null}><EndCircle/></RouteStations>)
                arryes.push(<RouteStations key={i} ref={d => d!= null?refyes.current[i] = d:null}><EndCircle/></RouteStations>)
                arrjun.push(<RouteStations key={i} ref={d => d!= null?refjun.current[i] = d:null}><EndCircle/></RouteStations>)
                continue
            }
            arrcyc.push(<RouteStations key={i} ref={d => d!= null?refcyc.current[i] = d:null}><CycleCircle/></RouteStations>)
            arryes.push(<RouteStations key={i} ref={d => d!= null?refyes.current[i] = d:null}><YesulinCircle/></RouteStations>)
            arrjun.push(<RouteStations key={i} ref={d => d!= null?refjun.current[i] = d:null}><JungangCircle/></RouteStations>)
        }
        setDirect(arrdir)
        setCycle(arrcyc)
        setYesulin(arryes)
        setJungang(arrjun)
    },[t])
        const directLineInput = useCallback(() => {
            const arrdir = []
            const arrcyc = []
            const arryes = []
            const arrjun = []
            for(let i = 0; i < 4; i++){
                if(i === 3){
                    arrdir.push(
                        <RouteLine className={'bg-chip-orange'} key={i} ref={d=> d!= null?linedir.current[i] = d:null}></RouteLine>
                    )
                    continue
                }
                arrdir.push(
                    <RouteLine className={'bg-chip-blue'} key={i} ref={d=> d!= null?linedir.current[i] = d:null}></RouteLine>
                )
            }
            for(let i = 0; i < 5; i++){
                if(i === 4){
                    arrcyc.push(<RouteLine className={'bg-chip-orange'} key={i} ref={d=> d!= null?linecyc.current[i] = d:null}></RouteLine>)
                    arryes.push(<RouteLine className={'bg-chip-orange'} key={i} ref={d=> d!= null?lineyes.current[i] = d:null}></RouteLine>)
                    arrjun.push(<RouteLine className={'bg-chip-orange'} key={i} ref={d=> d!= null?linejun.current[i] = d:null}></RouteLine>)
                    continue
                }
                arrcyc.push(
                    <RouteLine className={'bg-chip-red'} key={i} ref={d=> d!= null?linecyc.current[i] = d:null}></RouteLine>
                )
                arryes.push(
                    <RouteLine className={'bg-chip-green'} key={i} ref={d=> d!= null?lineyes.current[i] = d:null}></RouteLine>
                )
                arrjun.push(
                    <RouteLine className={'bg-chip-purple'} key={i} ref={d=> d!= null?linejun.current[i] = d:null}></RouteLine>
                )
            }
            setDirLine(arrdir)
            setCycLine(arrcyc)
            setYesLine(arryes)
            setJunLine(arrjun)
        },[])
        const responsiveLines = (refs:React.MutableRefObject<Array<HTMLDivElement>>, lines:React.MutableRefObject<Array<HTMLDivElement>>) => {
            if(refs.current.length > 0 && lines.current.length > 0){
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
        const updateLines = useCallback(() => {
            responsiveLines(refdir, linedir)
            responsiveLines(refcyc, linecyc)
            responsiveLines(refyes, lineyes)
            responsiveLines(refjun, linejun)
        },[])
        const fetchLanguages = useCallback(() => {
            lang.current.forEach((element:HTMLParagraphElement | null, index:number) => {
                if(element != undefined){
                    if(index <= 1){
                        element.innerText = t('yesul')
                    } else {
                        element.innerText = t('jung')
                    }
                }
            });
        }, [t])
        const circleAnimation = (props: CircleAnimate) => {
            for(let i = props.index; i <= props.index+1; i++){
                if(props.ref.current[i].childNodes.length <= 1){
                    if(i === 5 || (i === 4 && props.chipColor === 'bg-chip-blue')){
                        const pingCircle = document.createElement('div')
                        pingCircle.classList.add('animate-ping', 'absolute', 'rounded-full', 'inline-flex', 'h-3', 'w-3', 'rt1:h-2.5', 'rt1:w-2.5', 'z-99', 'bg-chip-orange', 'mx-2');
                        if(props.ref.current[i].title === 'skip'){
                            props.ref.current[i+1]?.append(pingCircle)
                        } else{
                            props.ref.current[i]?.append(pingCircle)
                        }
                        props.ref.current[i]?.append(pingCircle)
                        continue

                    }
                    const pingCircle = document.createElement('div')
                    pingCircle.classList.add('animate-ping', 'absolute', 'rounded-full', 'inline-flex', 'h-3', 'w-3', 'rt1:h-2.5', 'rt1:w-2.5', 'z-99', props.chipColor, 'mx-2');
                    if(props.ref.current[i].title === 'skip'){
                        props.ref.current[i+1]?.append(pingCircle)
                    } else{
                        props.ref.current[i]?.append(pingCircle)
                    }
                }
            }
        }
        const circleAnimationRemove = (refs: React.MutableRefObject<Array<HTMLDivElement>>) => {
            for(const refr of refs.current){
                if(refr?.childNodes.length > 1){
                    refr?.removeChild(refr?.lastChild as Node)
                }
            }
        //    ref.current[i]?.removeChild(props.ref.current[i]?.lastChild as Node)
                
        }
        const timetableType = (type: string, index:number) => {
            if(type === 'C'){
                return {ref: refcyc, index: index, chipColor: 'bg-chip-red'}
            } else if(type === 'DHJ'){
                return {ref: refjun, index: index, chipColor: 'bg-chip-purple'}
            } else if(type === 'DY'){
                return {ref: refyes, index: index, chipColor: 'bg-chip-green'}
            }else {
                return {ref: refdir, index: index, chipColor: 'bg-chip-blue'}
            }
        }
        useEffect(() => {
            fetchLanguages()
        },[i18n.language, fetchLanguages])
        useEffect(() => {
            directInput()
            directLineInput()
            window.addEventListener("resize",updateLines)
            return () => {
                window.removeEventListener("resize", updateLines);
            }
        }, [updateLines, directInput, directLineInput])
        useEffect(() => {
            const circleAnimationRemoveAll = () => {
                circleAnimationRemove(refdir)
                circleAnimationRemove(refcyc)
                circleAnimationRemove(refyes)
                circleAnimationRemove(refjun)
            }
            const updateHighlight = () => {
                if(linecyc.current.length > 0 && linedir.current.length > 0 && lineyes.current.length > 0 && linejun.current.length > 0){
                    circleAnimationRemoveAll()
                    if(timetable.length > 0){
                        if(props.tab === 'shuttlecoke_o'){
                            circleAnimation(timetableType(timetable[0].type,1))
                        } else if(props.tab === 'subway'){
                            circleAnimation(timetableType(timetable[0].type,2))
                        } else if(props.tab === 'yesulin'){
                            circleAnimation(timetableType(timetable[0].type,3))
                        } else if(props.tab === 'jungang'){
                            circleAnimation({ref: refjun, index: 3, chipColor: 'bg-chip-purple'})
                        } else if(props.tab === 'shuttlecoke_i'){
                            if(timetable[0].type === 'NA'){
                                return
                            }
                            circleAnimation({ref: refdir, index: 3, chipColor: 'bg-chip-blue'})
                            circleAnimation({ref: refjun, index: 4, chipColor: 'bg-chip-purple'})
                            circleAnimation({ref: refcyc, index: 4, chipColor: 'bg-chip-red'})
                            circleAnimation({ref: refyes, index: 4, chipColor: 'bg-chip-green'})
                        } else {
                            circleAnimation(timetableType(timetable[0].type,0))
                        }
                    }
                }
            }
            updateLines()
            updateHighlight()
        },[direct, cycle, yesulin, jungang, dirLine, cycLine, yesLine, junLine, props.tab, timetable, updateLines])
    return (
        <MainContainer status={props.status}>
            <RouteRowsContainer>
                <RouteColsContainer>
                    <RouteTextContainer lang={i18n.language} className='col-start-2'>{t('dest_dorm')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_shuttle_o')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_subway')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_shuttle_o')}</RouteTextContainer>
                    <RouteTextContainer lang={i18n.language}>{t('dest_dorm')}</RouteTextContainer>
                </RouteColsContainer>
                <RouteColsContainer className='grid grid-cols-6'>
                <RouteMethod className='bg-chip-blue'>{t('direct')}</RouteMethod>
                    {direct.map((item) => {
                        return item
                    })}
                    {dirLine.map((item) => {
                        return item
                    })}
                </RouteColsContainer>
                <RouteColsContainer>
                <RouteMethod className='bg-chip-red'>{t('cycle')}</RouteMethod>
                    {cycle.map((item) => {
                        return item
                    })}
                    {cycLine.map((item) => {
                        return item
                    })}
                </RouteColsContainer>
                <RouteColsContainer>
                <RouteMethod className='bg-chip-green'>{t('yesul')}</RouteMethod>
                    {yesulin.map((item) => {
                        return item
                    })}
                    {yesLine.map((item) => {
                        return item
                    })}
                </RouteColsContainer>
                <RouteColsContainer>
                <RouteMethod className='bg-chip-purple'>{t('jung')}</RouteMethod>
                    {jungang.map((item) => {
                        return item
                    })}
                    {junLine.map((item) => {
                        return item
                    })}
                </RouteColsContainer>
            </RouteRowsContainer>
        </MainContainer>
    )
}
