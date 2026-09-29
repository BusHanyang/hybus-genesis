import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import ChevronImg from '/public/image/chevron_up_24dp.svg?react'
import OpenImg from '/public/image/open_in_new_outline_24dp.svg?react'
import { NoticeInfo } from '@/data'
import { noticeType } from '@/data/notice/noticeType'
import { noticeAPI } from '@/network/notice'

const List = classed('div', 'flex flex-col gap-2.5')
const Item = classed(
  'div',
  'overflow-hidden rounded-2xl bg-press-bg transition-colors duration-[350ms] animate-rise',
)
const rowBase =
  'flex min-h-[68px] w-full items-center gap-3 px-3.5 py-3 text-left transition-[scale] duration-150 active:scale-[.985]'
const RowButton = classed('button', rowBase)
const RowLink = classed('a', rowBase)
const Label = classed('span', 'shrink-0 text-[13px] font-extrabold text-news')
const Text = classed('span', 'flex min-w-0 grow flex-col gap-0.5')
const Title = classed('span', 'text-[15.5px] font-bold hsm:text-sm')
const DateText = classed('span', 'text-[13px] tabular-nums text-ink-2')
const ExpandIcon = classed(
  ChevronImg,
  'h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300 ease-smooth',
  {
    variants: {
      'data-open': {
        true: 'rotate-0',
        false: 'rotate-180',
      },
    },
    defaultVariants: {
      'data-open': 'false',
    },
  },
)
const LinkIcon = classed(OpenImg, 'h-4 w-4 shrink-0 text-ink-3')
const Content = classed(
  'div',
  'whitespace-pre-wrap px-3.5 pb-4 text-[14.5px] leading-relaxed animate-[hb-rise_.3s_cubic-bezier(.2,.8,.2,1)_both]',
)
const ContentLink = classed(
  'a',
  'mt-3 flex items-center gap-1.5 text-sm font-bold text-ink-2 underline underline-offset-2',
)
const SkeletonItem = classed('div', 'hb-skeleton h-[68px] rounded-2xl')
const Message = classed(
  'p',
  'm-0 py-6 text-center text-[15px] font-semibold text-ink-2',
)

const hasContent = (notice: NoticeInfo) => notice.content.trim() !== ''

const NoticeList = (props: { initialIndex: number | null }) => {
  const { t } = useTranslation()
  const notices = useQuery({
    queryKey: ['notice'],
    queryFn: noticeAPI,
    staleTime: 5 * 60 * 1000,
  })
  const [openIndex, setOpenIndex] = useState<number | null>(props.initialIndex)

  if (notices.isPending) {
    return (
      <List aria-hidden="true">
        <SkeletonItem />
        <SkeletonItem />
      </List>
    )
  }

  if (notices.isError) return <Message>{t('api_error')}</Message>
  if (notices.data.length === 0) return <Message>{t('notice_empty')}</Message>

  return (
    <List>
      {notices.data.map((notice, i) => {
        const open = openIndex === i && hasContent(notice)
        const summary = (
          <>
            <Label>
              {notice.label === noticeType.GENERAL
                ? t('notice_label_general')
                : t('notice_label_news')}
            </Label>
            <Text>
              <Title>{notice.title}</Title>
              <DateText>{notice.date}</DateText>
            </Text>
          </>
        )

        return (
          <Item key={`${notice.date}-${notice.title}`} style={{ animationDelay: `${60 + i * 60}ms` }}>
            {hasContent(notice) || notice.url.trim() === '' ? (
              <RowButton
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                {summary}
                <ExpandIcon aria-hidden="true" data-open={open ? 'true' : 'false'} />
              </RowButton>
            ) : (
              <RowLink href={notice.url} target="_blank" rel="noreferrer">
                {summary}
                <LinkIcon aria-hidden="true" />
              </RowLink>
            )}
            {open && (
              <Content>
                {notice.content}
                {notice.url.trim() !== '' && (
                  <ContentLink
                    href={notice.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('notice_open_link')}
                    <LinkIcon aria-hidden="true" />
                  </ContentLink>
                )}
              </Content>
            )}
          </Item>
        )
      })}
    </List>
  )
}

export default NoticeList
