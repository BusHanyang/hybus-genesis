import { classed } from '@tw-classed/react'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import CloseImg from '/public/image/close_outline_24dp.svg?react'

const Overlay = classed(
  'div',
  'fixed inset-0 z-99 flex select-none items-center justify-center px-4 font-Ptd',
)
const Scrim = classed(
  'div',
  'absolute inset-0 bg-modal-scrim backdrop-blur-[4px]',
  {
    variants: {
      'data-closing': {
        true: 'animate-fade-out',
        false: 'animate-fade-in',
      },
    },
    defaultVariants: {
      'data-closing': 'false',
    },
  },
)
const Dialog = classed(
  'section',
  'relative flex max-h-[min(740px,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-theme-card text-theme-text shadow-modal transition-colors duration-[350ms]',
  {
    variants: {
      'data-closing': {
        true: 'animate-modal-out',
        false: 'animate-modal-in',
      },
    },
    defaultVariants: {
      'data-closing': 'false',
    },
  },
)
const Header = classed(
  'header',
  'flex shrink-0 items-center gap-2 pb-1 pl-[22px] pr-2 pt-3.5',
)
const Title = classed(
  'h2',
  'm-0 grow text-left text-[19px] font-extrabold tracking-[-0.02em]',
)
const CloseButton = classed(
  'button',
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-transform duration-150 active:scale-[.96]',
)
const CloseIcon = classed(CloseImg, 'h-5 w-5')
const Body = classed(
  'div',
  'hb-noscroll overflow-y-auto px-[22px] pb-[22px] pt-1.5 text-left break-keep',
)

export const Modal = (props: {
  open: boolean
  closing: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) => {
  const { t } = useTranslation()
  const closeRef = useRef<HTMLButtonElement>(null)
  const { open, onClose } = props

  // Focus the dialog while it's open and hand focus back to whatever opened it.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    return () => opener?.focus?.({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const closing = props.closing ? 'true' : 'false'

  return (
    <Overlay>
      <Scrim aria-hidden="true" data-closing={closing} onClick={onClose} />
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="hb-modal-title"
        data-closing={closing}
      >
        <Header>
          <Title id="hb-modal-title">{props.title}</Title>
          <CloseButton
            ref={closeRef}
            type="button"
            aria-label={t('close')}
            onClick={onClose}
          >
            <CloseIcon aria-hidden="true" />
          </CloseButton>
        </Header>
        <Body>{props.children}</Body>
      </Dialog>
    </Overlay>
  )
}
