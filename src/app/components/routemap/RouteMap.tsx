import React, { LegacyRef, useEffect,useRef, useState } from 'react';
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
  /* &::after{
    ${tw`content-[''] absolute top-1/2 left-full w-[850%] h-[2px] translate-y-[-50%]`}
  } */
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
const RouteTextContainer =  styled.div`
${tw`hm:text-xs`}
`
const RouteStations = styled.div`
${tw`flex relative`}
`
const RouteMethod = styled.div`
${tw`text-center rounded-full py-1 w-16 hm:w-12 hm:text-xs self-center`}
`
const MainContainer = styled.div<{status: string}>`
${tw`transition duration-150 ease-in-out mx-auto`}
    ${(props) => props.status === 'entered' || props.status === 'exit' ? tw`opacity-100` : tw`opacity-0`}
`
export const RouteMap = (props: {
    status:string,
}) => {
    const [direct, setDirect] = useState<JSX.Element[]>([])
    const [cycle, setCycle] = useState<JSX.Element[]>([])
    const [dirLine, setDirLine] = useState<JSX.Element[]>([])
    const [cycLine, setCycLine] = useState<JSX.Element[]>([])
    const refdir = useRef<Array<HTMLDivElement|null>>([])
    const linedir = useRef<Array<HTMLDivElement|null>>([])
    const refcyc = useRef<Array<HTMLDivElement|null>>([])
    const linecyc = useRef<Array<HTMLDivElement|null>>([])
    const directInput = () => {
        const arrdir = []
        const arrcyc = []
        for(let i = 0; i < 5; i++){
            arrdir.push(<RouteStations key={i} ref={d => refdir.current[i] = d}><DirectCircle/></RouteStations>)
            arrcyc.push(<RouteStations key={i} ref={d => refcyc.current[i] = d}><CycleCircle/></RouteStations>)
            }
            setDirect(arrdir)
            setCycle(arrcyc)
        }
        const directLineInput = () => {
            const arrdir = []
            const arrcyc = []
            for(let i = 0; i < 4; i++){
                arrdir.push(
                    <div className={'bg-chip-blue'} key={i} ref={d=> linedir.current[i] = d} style={{height:"3px", position:"absolute"}}></div>
                )
                arrcyc.push(
                    <div className={'bg-chip-red'} key={i} ref={d=> linecyc.current[i] = d} style={{height:"3px", position:"absolute"}}></div>
                )
            }
            // setLine(line.current)
            // return arr
            setDirLine(arrdir)
            setCycLine(arrcyc)
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
        }
        useEffect(() => {
            directInput()
            directLineInput()
            window.addEventListener("resize",updateLines)
            return () => window.removeEventListener("resize", updateLines);
        }, [])
        useEffect(() => {
            updateLines()
        },[direct, cycle, dirLine, cycLine])
    return (
        <MainContainer status={props.status}>
        {/* <div hidden={props.status === 'entered' || props.status === 'exit' ? false : true}> */}
            <RouteRowsContainer>
                <RouteColsContainer>
                    <RouteTextContainer className='col-start-2'>기숙사</RouteTextContainer>
                    <RouteTextContainer>셔틀콕</RouteTextContainer>
                    <RouteTextContainer>한대앞역</RouteTextContainer>
                    <RouteTextContainer>셔틀콕</RouteTextContainer>
                    <RouteTextContainer>기숙사</RouteTextContainer>
                </RouteColsContainer>
                <RouteColsContainer>
                <RouteMethod className='bg-chip-blue'>직행</RouteMethod>
                    {direct.map((item) => {
                        return item
                    })}
                    {dirLine.map((item) => {
                        return item
                    })}
                </RouteColsContainer>
                <RouteColsContainer>
                <RouteMethod className='bg-chip-red'>순환</RouteMethod>
                    {cycle.map((item) => {
                        return item
                    })}
                    {cycLine.map((item) => {
                        return item
                    })}
                </RouteColsContainer>
            </RouteRowsContainer>
        </MainContainer>
    )
}