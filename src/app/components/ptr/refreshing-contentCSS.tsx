import styled from 'styled-components'
import tw from 'twin.macro'

export const LdsEllipsis = styled.div`
  ${tw`inline-block relative w-16 h-16`}
`

export const LdsEllipsisDiv = styled.div<{ theme: string }>`
  ${({ theme }) => {
    return theme === 'dark'
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
