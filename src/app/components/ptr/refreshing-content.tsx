import { classed } from '@tw-classed/react'
import React from 'react'

// Source: https://loading.io/css/

const LdsEllipsis = classed('div', 'inline-block relative w-16 h-16')

const LdsEllipsisDiv = classed(
  'div',
  'absolute top-7 w-3 h-3 rounded-full bg-ptr-color ease-ptrTran',
  {
    variants: {
      position: {
        first: 'left-1.5 animate-ldsEllipsis1',
        second: 'left-1.5 animate-ldsEllipsis2',
        third: 'left-7 animate-ldsEllipsis2',
        fourth: 'left-11 animate-ldsEllipsis3',
      },
    },
  },
)

interface RefreshingContentProps {
  mode: string
}

const RefreshingContent: React.FC<RefreshingContentProps> = () => {
  return (
    <LdsEllipsis>
      <LdsEllipsisDiv position="first"></LdsEllipsisDiv>
      <LdsEllipsisDiv position="second"></LdsEllipsisDiv>
      <LdsEllipsisDiv position="third"></LdsEllipsisDiv>
      <LdsEllipsisDiv position="fourth"></LdsEllipsisDiv>
    </LdsEllipsis>
  )
}

export default RefreshingContent
