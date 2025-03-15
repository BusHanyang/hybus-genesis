import React from 'react'

import { CircleAnimate, SingleShuttleSchedule } from '@/data'

interface DotProps {
    dotDir: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>,
    dotCyc: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>,
    dotYes: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>,
    dotJun: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>,
}

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
            'z-[1]',
            i === 5 || (i === 4 && props.chipColor === 'bg-chip-blue') ? 'bg-chip-orange': props.chipColor,
            'mx-2')
        const ind = props.ref.current[i].title === 'skip' ? i+1 : i
        props.ref.current[ind]?.append(pingCircle)
    }
}

const timetableType = (type: string, index:number, dotall: DotProps) => {
    if (type === 'C') return {ref: dotall.dotCyc, index: index, chipColor: 'bg-chip-red'}

    else if(type === 'DHJ') return {ref: dotall.dotJun, index: index, chipColor: 'bg-chip-purple'}

    else if(type === 'DY') return {ref: dotall.dotYes, index: index, chipColor: 'bg-chip-green'}

    else return {ref: dotall.dotDir, index: index, chipColor: 'bg-chip-blue'}
}

const circleAnimationRemove = (refs: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>) => {
    if (refs.current === undefined) return

    for (const refr of refs.current){
        if (refr?.childNodes.length > 1) refr?.removeChild(refr?.lastChild as Node)
    }
}

const circleAnimationRemoveAll = (dots: DotProps) => {
    circleAnimationRemove(dots.dotDir)
    circleAnimationRemove(dots.dotCyc)
    circleAnimationRemove(dots.dotYes)
    circleAnimationRemove(dots.dotJun)
}

const Animation = (
    dots: DotProps,
    tab: string,
    timeCheck: React.MutableRefObject<SingleShuttleSchedule>,
    timetable: SingleShuttleSchedule
) => {
    circleAnimationRemoveAll(dots)

    if (timeCheck.current === timetable) return

    timeCheck.current = timetable

    if (timetable?.time !== ''){
        switch (tab){
            case 'shuttlecoke_o':
                circleAnimation(timetableType(timetable.type,1,dots))
                break
            case 'subway':
                circleAnimation(timetableType(timetable.type,2,dots))
                break
            case 'yesulin':
                circleAnimation(timetableType(timetable.type,3,dots))
                break
            case 'jungang':
                circleAnimation({ref: dots.dotJun, index: 3, chipColor: 'bg-chip-purple'})
                break
            case 'shuttlecoke_i':
                if (timetable.type === 'NA') return

                circleAnimation({ref: dots.dotDir, index: 3, chipColor: 'bg-chip-blue'})
                circleAnimation({ref: dots.dotJun, index: 4, chipColor: 'bg-chip-purple'})
                circleAnimation({ref: dots.dotCyc, index: 4, chipColor: 'bg-chip-red'})
                circleAnimation({ref: dots.dotYes, index: 4, chipColor: 'bg-chip-green'})
                break
            default:
                circleAnimation(timetableType(timetable.type,0, dots))
                break
        }
    }
}

export default Animation
