import React from 'react'

import { LdsEllipsis, LdsEllipsisDiv } from './refreshing-contentCSS'

// Source: https://loading.io/css/

interface RefreshingContentProps {
  mode: string
}

const RefreshingContent: React.FC<RefreshingContentProps> = ({ mode = '' }) => {
  return (
    <LdsEllipsis>
      <LdsEllipsisDiv theme={mode}></LdsEllipsisDiv>
      <LdsEllipsisDiv theme={mode}></LdsEllipsisDiv>
      <LdsEllipsisDiv theme={mode}></LdsEllipsisDiv>
      <LdsEllipsisDiv theme={mode}></LdsEllipsisDiv>
    </LdsEllipsis>
  )
}

export default RefreshingContent
