import React from 'react'

import { Div, LdsEllipsisDiv } from './refreshing-contentCSS'

// Source: https://loading.io/css/


interface RefreshingContentProps {
  mode?: boolean
}

const RefreshingContent: React.FC<RefreshingContentProps> = ({
  mode = false,
}) => {
    return (
      <LdsEllipsisDiv theme={mode}>
        <Div></Div>
        <Div></Div>
        <Div></Div>
        <Div></Div>
      </LdsEllipsisDiv>
    )
}

export default RefreshingContent
