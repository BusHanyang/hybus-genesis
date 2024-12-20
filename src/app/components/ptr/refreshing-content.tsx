import React from 'react'
import styled from 'styled-components'
import tw from 'twin.macro'

// Source: https://loading.io/css/

const LdsEllipsis = styled.div`
  ${tw`inline-block relative w-16 h-16`}
`

const LdsEllipsisDiv = styled.div<{ theme: string }>`
  ${({ theme }) => {
    return theme !== 'light'
      ? tw`absolute top-7 w-3 h-3 rounded-full bg-white ease-ptrTran`
      : tw`absolute top-7 w-3 h-3 rounded-full bg-gray-700 ease-ptrTran`
  }}
  &:nth-child(1) {
    ${tw`left-1.5 animate-ldsEllipsis1`}
  }

  &:nth-child(2) {
    ${tw`left-1.5 animate-ldsEllipsis2`}
  }

  &:nth-child(3) {
    ${tw`left-7 animate-ldsEllipsis2`}
  }

  &:nth-child(4) {
    ${tw`left-11 animate-ldsEllipsis3`}
  }
`

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
