import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { NoticeInfo } from '@/data'
import { noticeType } from '@/data/notice/noticeType'
import { noticeAPI } from '@/network/notice'

const ROTATE_MS = 7000

const rowBase =
  'grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1.5'
const Row = classed('div', rowBase)
const NoticeLink = classed('a', `${rowBase} animate-slide-up cursor-default`)
const Label = classed(
  'span',
  'text-left text-[14.5px] font-extrabold text-news hsm:text-[13px]',
)
const Title = classed(
  'span',
  'truncate text-center text-[15px] font-semibold hsm:text-sm',
)
const SkeletonBar = classed('span', 'hb-skeleton h-3.5', {
  variants: {
    'data-part': {
      side: '',
      title: 'mx-6',
    },
  },
  defaultVariants: {
    'data-part': 'side',
  },
})
const DateText = classed(
  'span',
  'text-right text-sm font-medium tabular-nums text-ink-2 hsm:text-[13px]',
)

const Notice = (props: {
  onModalOpen: (content: string, title: string) => void
}) => {
  const { t } = useTranslation()
  const notices = useQuery({
    queryKey: ['notice'],
    queryFn: noticeAPI,
    staleTime: 5 * 60 * 1000,
  })
  const [num, changeNum] = useState<number>(0)
  const count = notices.data?.length ?? 0

  useEffect(() => {
    if (count < 2) return
    const timer = window.setTimeout(() => {
      changeNum((current) => (current + 1) % count)
    }, ROTATE_MS)
    return () => window.clearTimeout(timer)
  }, [count, num])

  if (notices.isPending) {
    return (
      <Row aria-hidden="true">
        <SkeletonBar />
        <SkeletonBar data-part="title" />
        <SkeletonBar />
      </Row>
    )
  }

  const item: NoticeInfo | undefined = notices.data?.[num % Math.max(count, 1)]
  if (item === undefined) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (item.content.trim() !== '' || item.url.trim() === '') {
      e.preventDefault()
      props.onModalOpen(item.content, item.title)
    }
  }

  return (
    <NoticeLink key={num} href={item.url} onClick={handleClick}>
      <Label>
        {item.label === noticeType.GENERAL
          ? t('notice_label_general')
          : t('notice_label_news')}
      </Label>
      <Title>{item.title}</Title>
      <DateText>{item.date}</DateText>
    </NoticeLink>
  )
}

export default Notice
