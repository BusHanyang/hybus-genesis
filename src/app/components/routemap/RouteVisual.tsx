import React from "react"
import { useTranslation } from "react-i18next"
import styled from "styled-components"
import tw from "twin.macro"

const RouteLine = styled.div`
    ${tw`absolute transition duration-150 ease-in-out h-[3px] z-0`}
`

const Circle = styled.span`
    ${tw`
        flex rounded-full inline-block
        h-3 w-3 rt1:h-2.5 rt1:w-2.5
        z-1 mx-2
    `}
`

const RouteStations = styled.div`
    ${tw`transition duration-150 ease-in-out flex relative`}
`

const SpecialStopsText = styled.p<{key:number, lang:string}>`
    ${tw`absolute text-xs top-[-17px] left-[-15px] text-center w-10 font-bold`}
    ${(props) => props.lang === 'ko' ? tw`tracking-tight` : tw`tracking-tighter text-[0.7rem]`}
`

export const DotRoute = (props: {
    rootStatus: string,
    isPrevStop: (line: string, index: number) => boolean
}) => {
    const { t, i18n } = useTranslation()

    const directDot = () => {
        const arrDir = []

        for (let i = 0; i < 5; i++){
            if (i === 4){
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
            if (i === 5){
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

    switch (props.rootStatus){
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

export const LineRoute = (props: {
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
