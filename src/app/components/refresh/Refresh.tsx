import React, { useRef, useState } from 'react';
import { RefIcon } from './RefIcon';
  
export const Refresh = (props: {
    children: React.ReactNode
    scrollSense: number
}) => {
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const iconRef = useRef<HTMLDivElement | null>(null)
    const [dragging, setDragging] = useState<boolean>(false)
    const [startY, setStartY] = useState(0)
    const [isRefreshed, setIsRefreshed] = useState<boolean>(false)
    // const [scrollSense, setScrollSence] = useState<number>(200);

    const onMouseDragStart = (e:MouseEvent) => {
        e.preventDefault()
        if(scrollRef.current?.scrollTop == 0 && !isRefreshed){
            if(iconRef.current){
            iconRef.current.style.transition = 'transform 0s';
            iconRef.current.style.transform = 'scale(0)';
            }
            setDragging(true)
            setStartY(e.clientY)
        }
    }
    const onTouchDragStart = (e:TouchEvent) => {
        e.preventDefault()
        if(scrollRef.current?.scrollTop == 0 && !isRefreshed){
            if(iconRef.current){
            iconRef.current.style.transition = 'transform 0s';
            
            }
            setDragging(true)
            setStartY(e.changedTouches[0].clientY)
        }
    }
    const onDragEnd = () => {
        setDragging(false)
        if(!isRefreshed){
            if(iconRef.current){
                iconRef.current.style.transform = 'scale(0)';
                iconRef.current.style.transition = 'transform 0.3s';
            }
        } else {
            window.location.reload()
        }
    }
    const onScrolled = (scrolled:number) => {
        if(scrolled >= 0){
            if(scrolled > props.scrollSense){
                if(iconRef.current){
                    iconRef.current.style.transform = `scale(1) rotate(180deg)`;
                    
                }
                setIsRefreshed(true)
            } else {
                if(iconRef.current){
                    iconRef.current.style.transform = `scale(${scrolled/props.scrollSense}) rotate(${scrolled*(180/props.scrollSense)}deg)`;
                }
                setIsRefreshed(false)
            }
        }
    }
    const onMouseDragMove = (e:MouseEvent) => {
        if(dragging){
            const scrolled = e.clientY - startY
            onScrolled(scrolled)
        }
    }
    const onTouchDragMove = (e:TouchEvent) => {
        if(dragging){
            const scrolled = e.changedTouches[0].clientY
            onScrolled(scrolled)
        }
    }
    return(
        <>
            <div ref={scrollRef} onMouseDown={(e) => onMouseDragStart(e.nativeEvent)} onMouseMove={(e) => onMouseDragMove(e.nativeEvent)} onTouchStart={(e) => onTouchDragStart(e.nativeEvent)} onTouchEnd={onDragEnd} onTouchMove={(e) => onTouchDragMove(e.nativeEvent)} onMouseUp={onDragEnd} className='w-screen h-screen flex-col static'>
                <RefIcon iconRef={iconRef} isRefreshed={isRefreshed} isDragging={dragging}/>
                {props.children}
            </div>
        </>
    )
}