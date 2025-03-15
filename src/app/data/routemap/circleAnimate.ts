import React from 'react'

export type CircleAnimate = {
  ref: React.MutableRefObject<NodeListOf<HTMLDivElement> | undefined>
  index: number
  chipColor: string
}
