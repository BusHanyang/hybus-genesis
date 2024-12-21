import React, {useEffect,useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import tw from 'twin.macro';

const Circle = styled.span`
  ${tw`
    flex rounded-full inline-block
    h-3 w-3 rt1:h-2.5 rt1:w-2.5
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
${tw`flex relative`}
`
const RouteMethod = styled.div`
${tw`text-center rounded-full py-1 w-16 hm:w-12 hm:text-xs self-center dark:text-black`}
`
const MainContainer = styled.div<{status: string}>`
${tw`transition duration-150 ease-in-out mx-auto`}
    ${(props) => props.status === 'entered' || props.status === 'exit' ? tw`opacity-100` : tw`opacity-0`}
`
export const RouteMap = (props: {
    status:string,
    tab: string
}) => {
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
    const refdir = useRef<Array<HTMLDivElement|null>>([])
    const refcyc = useRef<Array<HTMLDivElement|null>>([])
    const refyes = useRef<Array<HTMLDivElement|null>>([])
    const refjun = useRef<Array<HTMLDivElement|null>>([])
    // line refs
    const linedir = useRef<Array<HTMLDivElement|null>>([])
    const linecyc = useRef<Array<HTMLDivElement|null>>([])
    const lineyes = useRef<Array<HTMLDivElement|null>>([])
    const linejun = useRef<Array<HTMLDivElement|null>>([])
    // langtest
    const lang = useRef<Array<HTMLParagraphElement | null>>([])
    const directInput = () => {
        const arrdir = []
        const arrcyc = []
        const arryes = []
        const arrjun = []
        for(let i = 0; i < 5; i++){
            arrdir.push(<RouteStations key={i} ref={d => refdir.current[i] = d}><DirectCircle/></RouteStations>)
        }
        for(let i = 0; i < 6; i++){
            if(i === 2){
                arrcyc.push(
                    <div className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                    <RouteStations key={i} ref={d => refcyc.current[i] = d}><CycleCircle/></RouteStations>
                    <RouteStations key={i+1} ref={d => refcyc.current[i+1] = d}><CycleCircle className='grid grid-rows-2 relative'><p key={0} ref={d => lang.current[0] = d} className='absolute text-xs top-[-20px] left-[-14px] text-center w-10 text-chip-green'>{t('yesul')}</p></CycleCircle></RouteStations>
                    <RouteStations key={i+2} ref={d => refcyc.current[i+2] = d}><CycleCircle/></RouteStations>
                    </div>
                )
                arryes.push(
                    <div className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                    <RouteStations key={i} ref={d => refyes.current[i] = d}><YesulinCircle className='opacity-0'/></RouteStations>
                    <RouteStations key={i+1} ref={d => refyes.current[i+1] = d}><YesulinCircle className='grid grid-rows-2 relative'><p key={1} ref={d => lang.current[1] = d} className='absolute text-xs top-[-20px] left-[-14px] text-center w-10 text-chip-green'>{t('yesul')}</p></YesulinCircle></RouteStations>
                    <RouteStations key={i+2} ref={d => refyes.current[i+2] = d}><YesulinCircle/></RouteStations>
                    </div>
                )
                arrjun.push(
                    <div className='col-span-2 grid grid-cols-3 w-[75%] place-items-center'>
                    <RouteStations key={i} ref={d => refjun.current[i] = d}><JungangCircle/></RouteStations>
                    <RouteStations key={i+1} ref={d => refjun.current[i+1] = d}><JungangCircle className='grid grid-rows-2 relative'><p key={2} ref={d => lang.current[2] = d} className='absolute text-xs top-[-20px] left-[-14px] text-center w-10 text-chip-purple'>{t('jung')}</p></JungangCircle></RouteStations>
                    <RouteStations key={i+2} ref={d => refjun.current[i+2] = d}><JungangCircle/></RouteStations>
                    </div>
                )
            }
            if(i >= 2 && i <= 4){continue}
            arrcyc.push(<RouteStations key={i} ref={d => refcyc.current[i] = d}><CycleCircle/></RouteStations>)
            arryes.push(<RouteStations key={i} ref={d => refyes.current[i] = d}><YesulinCircle/></RouteStations>)
            arrjun.push(<RouteStations key={i} ref={d => refjun.current[i] = d}><JungangCircle/></RouteStations>)
        }
        setDirect(arrdir)
        setCycle(arrcyc)
        setYesulin(arryes)
        setJungang(arrjun)
    }
        const directLineInput = () => {
            const arrdir = []
            const arrcyc = []
            const arryes = []
            const arrjun = []
            for(let i = 0; i < 4; i++){
                arrdir.push(
                    <div className={'bg-chip-blue'} key={i} ref={d=> linedir.current[i] = d} style={{height:"3px", position:"absolute"}}></div>
                )
            }
            for(let i = 0; i < 5; i++){
                arrcyc.push(
                    <div className={'bg-chip-red'} key={i} ref={d=> linecyc.current[i] = d} style={{height:"3px", position:"absolute"}}></div>
                )
                arryes.push(
                    <div className={'bg-chip-green'} key={i} ref={d=> lineyes.current[i] = d} style={{height:"3px", position:"absolute"}}></div>
                )
                arrjun.push(
                    <div className={'bg-chip-purple'} key={i} ref={d=> linejun.current[i] = d} style={{height:"3px", position:"absolute"}}></div>
                )
            }
            setDirLine(arrdir)
            setCycLine(arrcyc)
            setYesLine(arryes)
            setJunLine(arrjun)
        }
        const fetchLines = (refs, lines) => {
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
                    lines.current[i-1].style.left = `${refs.current[i-1]?.offsetLeft+refs.current[i-1]?.children[0].offsetLeft+1}px`
                }
            }
        }
        const updateLines = () => {
            fetchLines(refdir, linedir)
            fetchLines(refcyc, linecyc)
            fetchLines(refyes, lineyes)
            fetchLines(refjun, linejun)
        }
        const fetchLanguages = () => {
            console.log(lang)
            lang.current.forEach((element:HTMLParagraphElement | null, index:number) => {
                if(element != undefined){
                    if(index <= 1){
                        element.innerText = t('yesul')
                    } else {
                        element.innerText = t('jung')
                    }
                }
            });
        }
        useEffect(() => {
            fetchLanguages()
        },[i18n.language])
        useEffect(() => {
            directInput()
            directLineInput()
            window.addEventListener("resize",updateLines)
            return () => window.removeEventListener("resize", updateLines);
        }, [])
        useEffect(() => {
            updateLines()
            console.log()
        },[direct, cycle, yesulin, jungang, dirLine, cycLine, yesLine, junLine])
        useEffect(() => {
            if(props.tab === 'shuttlecoke_o'){
                console.log('route')
            }
        }, [props.tab])
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
