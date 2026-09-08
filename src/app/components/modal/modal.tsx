import { classed } from '@tw-classed/react'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useDarkmodeContext } from '@/context/ThemeContext'

const ModalBackground = classed(
  'div',
  'fixed inset-0 z-99 bg-black/60 select-none',
  {
    variants: {
      'data-state': {
        open: 'flex items-center',
        closed: 'hidden',
      },
    },
    defaultVariants: {
      'data-state': 'closed',
    },
  },
)

const ModalMain = classed('div', 'fixed inset-0 z-99 bg-black/60 select-none', {
  variants: {
    'data-state': {
      open: 'flex items-center',
      closed: 'hidden',
    },
    'data-ani': {
      opening: 'animate-modalBgShow',
      closing: 'animate-modalBgClose',
      idle: '',
    },
  },
  defaultVariants: {
    'data-state': 'closed',
    'data-ani': 'idle',
  },
})

const ModalButton = classed('button', 'outline-hidden cursor-pointer border-0')

const ModalSection = classed('section', 'w-11/12 mx-auto rounded-lg bg-white', {
  variants: {
    'data-ani': {
      opening: 'animate-modalShow',
      closing: 'animate-modalClose',
      idle: '',
    },
    'data-content': {
      notice: 'max-w-(--breakpoint-sm) overflow-hidden',
      seasonal: 'max-w-(--breakpoint-sm) overflow-hidden',
      default: 'max-w-(--breakpoint-sm) overflow-auto',
    },
  },
  defaultVariants: {
    'data-ani': 'idle',
    'data-content': 'default',
  },
})

const ModalHeader = classed(
  'header',
  'relative pt-4 pr-16 pb-4 pl-4 font-bold font-Ptd',
  {
    variants: {
      'data-theme': {
        dark: 'bg-zinc-800 text-white',
        light: 'bg-white',
      },
    },
    defaultVariants: {
      'data-theme': 'light',
    },
  },
)

const ModalFooterButton = classed(
  ModalButton,
  'py-2 px-4 text-white bg-gray-500 font-Ptd rounded-md text-xs',
)

const ModalSubMain = classed('main', 'p-4 border-y border-solid', {
  variants: {
    'data-theme': {
      dark: 'border-zinc-800 bg-gray-700 text-white',
      light: 'border-sky-50',
    },
  },
  defaultVariants: {
    'data-theme': 'light',
  },
})

const ModalFooter = classed('footer', 'py-3 px-4 text-right', {
  variants: {
    'data-theme': {
      dark: 'text-white bg-gray-700',
      light: '',
    },
  },
  defaultVariants: {
    'data-theme': 'light',
  },
})

export const Modal = (props: {
  ani: boolean
  open: boolean
  close: () => void
  children: React.ReactNode
  mTarget: string
  seasonalFooter?: React.ReactNode
}) => {
  const modalBackgroundRef = useRef<HTMLDivElement>(null)
  const handleClickModalBackground = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalBackgroundRef.current) {
      props.close()
    }
  }

  const { theme } = useDarkmodeContext()

  const { t } = useTranslation()
  const modalAnimationState = props.ani
    ? 'closing'
    : props.open
      ? 'opening'
      : 'idle'

  return (
    <ModalBackground
      data-state={props.open ? 'open' : 'closed'}
      onClick={handleClickModalBackground}
    >
      <ModalMain
        data-state={props.open ? 'open' : 'closed'}
        data-ani={modalAnimationState}
        ref={modalBackgroundRef}
      >
        {props.open ? (
          <ModalSection
            data-ani={modalAnimationState}
            data-content={
              props.mTarget === 'Notice'
                ? 'notice'
                : props.mTarget === 'Seasonal'
                  ? 'seasonal'
                  : 'default'
            }
          >
            {props.mTarget === 'Fabs' && (
              <ModalHeader data-theme={theme === 'dark' ? 'dark' : 'light'}>
                {t('changelog')}
              </ModalHeader>
            )}
            {props.mTarget === 'Info' && (
              <ModalHeader data-theme={theme === 'dark' ? 'dark' : 'light'}>
                {t('info')}
              </ModalHeader>
            )}
            {props.mTarget === 'Seasonal' && (
              <ModalHeader data-theme={theme === 'dark' ? 'dark' : 'light'}>
                {t('seasonal_prompt_title')}
              </ModalHeader>
            )}
            {props.mTarget === 'Notice' && (
              <ModalHeader data-theme={theme === 'dark' ? 'dark' : 'light'}>
                {t('notice')}
              </ModalHeader>
            )}

            <ModalSubMain data-theme={theme === 'dark' ? 'dark' : 'light'}>
              {props.children}
            </ModalSubMain>
            <ModalFooter data-theme={theme === 'dark' ? 'dark' : 'light'}>
              {props.mTarget === 'Seasonal' ? (
                props.seasonalFooter
              ) : (
                <ModalFooterButton className="close" onClick={props.close}>
                  {t('close')}
                </ModalFooterButton>
              )}
            </ModalFooter>
          </ModalSection>
        ) : null}
      </ModalMain>
    </ModalBackground>
  )
}
