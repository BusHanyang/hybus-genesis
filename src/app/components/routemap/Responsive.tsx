import React from 'react'

const responsiveLines = (
  dot: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>,
  line: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>,
) => {
  if (
    dot.current !== undefined &&
    line.current !== undefined &&
    dot.current.length > 0 &&
    line.current.length > 0
  ) {
    for (let i = 1; i <= line.current.length; i++) {
      const rectA = {
        left: dot.current[i - 1]?.offsetLeft,
        top: dot.current[i - 1]?.offsetTop,
        width: dot.current[i - 1]?.offsetWidth,
        height: dot.current[i - 1]?.offsetHeight,
      }
      const rectB = {
        left: dot.current[i]?.offsetLeft,
        top: dot.current[i]?.offsetTop,
        width: dot.current[i]?.offsetWidth,
        height: dot.current[i]?.offsetHeight,
      }

      const x1 = (rectA.left ?? 0) + (rectA.width ?? 0) / 2
      const y1 = (rectA.top ?? 0) + (rectA.height ?? 0) / 2
      const x2 = (rectB.left ?? 0) + (rectB.width ?? 0) / 2
      const y2 = (rectB.top ?? 0) + (rectB.height ?? 0) / 2

      const d = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

      line.current[i - 1].style.width = `${d}px`
      line.current[i - 1].style.top =
        `${(dot.current[i - 1]?.offsetTop ?? 0) + 4}px`

      const dotchild = dot.current[i - 1]?.firstChild as HTMLElement
      if (dotchild != undefined)
        line.current[i - 1].style.left =
          `${dot.current[i - 1]?.offsetLeft + dotchild.offsetLeft + 1}px`
    }
  }
}

const Responsive = (
  dots: Array<React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>>,
  lines: Array<React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>>,
) => {
  const updateLines = () => {
    dots.forEach((dot, index) => {
      responsiveLines(dot, lines[index])
    })
  }

  updateLines()

  window.addEventListener('resize', updateLines)

  return () => {
    window.removeEventListener('resize', updateLines)
  }
}

export default Responsive
