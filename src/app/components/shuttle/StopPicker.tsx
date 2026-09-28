import { classed } from '@tw-classed/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { STOP_ORDER, StopTab } from '@/components/shuttle/TimetableCard'

const Wrapper = classed('div', 'relative mt-3')
const Grid = classed('div', 'grid grid-cols-3 gap-2.5')
const BackdropGrid = classed(Grid, 'pointer-events-none absolute inset-0')
const ButtonGrid = classed(Grid, 'relative')
const Backdrop = classed(
  'div',
  'h-[58px] rounded-2xl bg-theme-card shadow-theme-shadow transition-[background-color,box-shadow] duration-[350ms]',
)
// One pill slides between the six buttons instead of each button repainting.
// Each step is one button width plus the 10px gap.
const Pill = classed(
  'div',
  'absolute left-0 top-0 h-[58px] w-[calc((100%-20px)/3)] rounded-2xl bg-button-active shadow-[inset_0_1px_3px_rgba(16,24,40,.14),0_2px_8px_rgba(59,130,246,.18)] transition-[translate,background-color] duration-500 ease-[cubic-bezier(.34,1.25,.64,1)]',
  {
    variants: {
      'data-index': {
        'shuttlecoke_o': 'translate-x-0 translate-y-0',
        'subway': 'translate-x-[calc(100%+10px)] translate-y-0',
        'yesulin': 'translate-x-[calc(200%+20px)] translate-y-0',
        'jungang': 'translate-x-0 translate-y-[calc(100%+10px)]',
        'shuttlecoke_i':
          'translate-x-[calc(100%+10px)] translate-y-[calc(100%+10px)]',
        'residence':
          'translate-x-[calc(200%+20px)] translate-y-[calc(100%+10px)]',
      },
    },
    defaultVariants: {
      'data-index': 'shuttlecoke_o',
    },
  },
)
const StopButton = classed(
  'button',
  'flex h-[58px] flex-col items-center justify-center rounded-2xl bg-transparent px-1.5 text-[15px] leading-[1.2] text-balance transition-[color,scale] duration-300 active:scale-[.96] hm:text-sm hsm:text-[13px]',
  {
    variants: {
      'data-active': {
        true: 'font-extrabold text-button-active-ink',
        false: 'font-semibold text-theme-text',
      },
    },
    defaultVariants: {
      'data-active': 'false',
    },
  },
)

const StopPicker = (props: {
  tab: StopTab
  onSelect: (tab: StopTab) => void
}) => {
  const { t } = useTranslation()

  return (
    <Wrapper>
      <BackdropGrid aria-hidden="true">
        {STOP_ORDER.map((stop) => (
          <Backdrop key={stop} />
        ))}
      </BackdropGrid>
      <Pill aria-hidden="true" data-index={props.tab} />
      <ButtonGrid>
        {STOP_ORDER.map((stop) => {
          const active = stop === props.tab

          return (
            <StopButton
              key={stop}
              id={stop}
              type="button"
              aria-pressed={active}
              data-active={active ? 'true' : 'false'}
              onClick={() => {
                if (!active) props.onSelect(stop)
              }}
            >
              {t(`${stop}_btn`)
                .split('\n')
                .map((line) => (
                  <span key={line}>{line}</span>
                ))}
            </StopButton>
          )
        })}
      </ButtonGrid>
    </Wrapper>
  )
}

export default StopPicker
