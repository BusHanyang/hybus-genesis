import React, { useEffect, useRef } from "react"
// import tw from "twin.macro"
import tw from 'tailwind-styled-components'
// const RollingBackground= styled.div`
//     ${tw`w-14 h-14 bg-gray-100 rounded-full absolute top-28 z-10 scale-0 translate-x-[-50%] left-1/2 drop-shadow-[0px_0px_10px_rgba(0,0,0,0.25)]`}
// `

interface RollingBackgroundProps {
    $isDragging: boolean
}

const RollingBackground = tw.div<RollingBackgroundProps>`
    w-14 h-14 bg-gray-100 rounded-full absolute top-28 z-10 translate-x-[-50%] left-1/2 drop-shadow-[0px_0px_10px_rgba(0,0,0,0.25)]
    ${props => props.$isDragging ? ``: `scale-0`}
`

// const RollingSpinner = styled.div`
//     ${tw`relative`}
// `

const RollingSpinner = tw.div`
    relative
`

// const Spinner = styled.div<{$isref: boolean}>`
//     ${tw`absolute w-[40px] h-[40px] top-[8.5px] left-[8.5px] border border-[8px] border-solid border-[#5fa5f9] border-t-transparent rounded-[50%] rotate-[-180deg] m-auto`}
//     ${props => props.$isref ? tw`animate-[refSpinner_1s_linear_infinite]`: tw``}
// `

interface SpinnerProps {
    $isref: boolean
}

const Spinner = tw.div<SpinnerProps>`
    absolute w-[40px] h-[40px] top-[8.5px] left-[8.5px] border-[8px] border-solid border-[#5fa5f9] border-t-transparent rounded-[50%] m-auto
    ${props => props.$isref ? `animate-[refSpinner_1s_linear_infinite]`: ``}
`

export const RefIcon = (props: {
    iconRef: React.RefObject<HTMLDivElement | null>,
    isRefreshed: boolean,
    isDragging: boolean
}) => {
    return(
        // <div ref={props.iconRef} className="w-10 h-10 scale-0 rounded-full absolute top-32 right-1/2 bg-gray-500 z-10"></div>
        <RollingBackground ref={props.iconRef} $isDragging={props.isDragging}>
            <RollingSpinner>
                <Spinner $isref={props.isRefreshed}/>
            </RollingSpinner>
        </RollingBackground>
    )
}