import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { changelogAPI } from '@/network/changelog'

const Timeline = classed('ol', 'relative m-0 list-none p-0 pt-1')
// The rail behind the dots.
const Rail = classed(
  'span',
  'absolute bottom-4 left-1.5 top-3 w-0.5 rounded-sm bg-off',
)
const Entry = classed('li', 'relative pb-[18px] pl-7 animate-rise')
const Dot = classed('span', 'absolute left-0 top-1 h-3.5 w-3.5 rounded-full', {
  variants: {
    'data-latest': {
      true: 'bg-button-active shadow-[inset_0_0_0_3px_var(--color-theme-card),0_0_0_2px_var(--color-button-active)]',
      false: 'bg-theme-card shadow-[inset_0_0_0_3px_var(--color-off)]',
    },
  },
  defaultVariants: {
    'data-latest': 'false',
  },
})
const EntryDate = classed(
  'div',
  'text-[13px] font-extrabold tabular-nums text-ink-2',
)
const EntryDetail = classed('div', 'mt-1 text-[15px] leading-normal hsm:text-sm')
const SkeletonEntry = classed('div', 'flex flex-col gap-2 pb-5 pl-7')
const SkeletonBar = classed('span', 'hb-skeleton h-3.5', {
  variants: {
    'data-part': {
      date: 'w-20',
      detail: 'w-3/4',
    },
  },
})
const Message = classed(
  'p',
  'm-0 py-6 text-center text-[15px] font-semibold text-ink-2',
)

const ChangelogTimeline = () => {
  const { t } = useTranslation()
  const changelogs = useQuery({
    queryKey: ['changelog'],
    queryFn: changelogAPI,
    staleTime: 5 * 60 * 1000,
  })

  if (changelogs.isPending) {
    return (
      <div aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <SkeletonEntry key={i}>
            <SkeletonBar data-part="date" />
            <SkeletonBar data-part="detail" />
          </SkeletonEntry>
        ))}
      </div>
    )
  }

  if (changelogs.isError) return <Message>{t('api_error')}</Message>

  return (
    <Timeline>
      <Rail aria-hidden="true" />
      {changelogs.data.map((entry, i) => (
        <Entry
          key={entry.date}
          style={{ animationDelay: `${Math.min(60 + i * 40, 420)}ms` }}
        >
          <Dot aria-hidden="true" data-latest={i === 0 ? 'true' : 'false'} />
          <EntryDate>{entry.date}</EntryDate>
          {entry.details.map((detail) => (
            <EntryDetail key={detail}>{detail}</EntryDetail>
          ))}
        </Entry>
      ))}
    </Timeline>
  )
}

export default ChangelogTimeline
