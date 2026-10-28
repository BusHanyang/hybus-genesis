import { classed } from '@tw-classed/react'
import React from 'react'

import ArrowImg from '/public/image/arrow_back_outline_24dp.svg?react'

const Indicator = classed('div', 'flex justify-center pt-3.5 pb-5')

const Chip = classed(
  'div',
  'flex h-10 w-10 items-center justify-center rounded-full bg-theme-card text-ptr-color shadow-theme-shadow',
)

const PullArrow = classed(ArrowImg, 'h-5 w-5 -rotate-90 stroke-[2.6]')

const SpinnerPop = classed('span', 'flex animate-pop-sm')

const Spinner = classed(
  'span',
  'h-5 w-5 animate-spin rounded-full border-[2.5px] border-control-main border-t-ptr-color',
)

export const PullingContent = () => (
  <Indicator>
    <Chip>
      <PullArrow aria-hidden="true" />
    </Chip>
  </Indicator>
)

const RefreshingContent = () => (
  <Indicator>
    <Chip>
      <SpinnerPop>
        <Spinner />
      </SpinnerPop>
    </Chip>
  </Indicator>
)

export default RefreshingContent
