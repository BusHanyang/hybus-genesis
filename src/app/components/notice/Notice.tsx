import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'

import { noticeType } from '@/data/notice/noticeType'
import { noticeAPI } from '@/network/notice'

const Box = (props: {
  url: string
  label: string
  title: string
  date: string
}) => {
  return (
    <div className="animate-carousel">
      <a className="cursor-default " href={props.url}>
        <div className="grid grid-flow-col  grid-cols-5 gap-2">
          <p className="col-span-1 font-bold text-base text-chip-red">
            {props.label}
          </p>
          <p className="col-span-3 text-base truncate">{props.title}</p>
          <p className="col-span-1 font-normal text-base">{props.date}</p>
        </div>
      </a>
    </div>
  )
}

const Notice = () => {
  const {
    data: notices = [],
    isError,
  } = useQuery({
    queryKey: ['notice'],
    queryFn: noticeAPI,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const [num, changeNum] = useState<number>(0)

  const getToday = () => {
    const d = new Date() // Asia/Seoul 기준 브라우저 로컬 타임
    const mm = String(d.getMonth() + 1).padStart(2, '0') // 01~12
    const dd = String(d.getDate()).padStart(2, '0') // 01~31
    return `${mm}/${dd}`
  }

  useEffect(() => {
    setTimeout(() => {
      if (notices?.length === 0) return
      changeNum((num + 1) % (notices?.length ?? 1))
    }, 7000)
  }, [notices?.length, num])

  return (
    <div className="relative w-full">
      {!isError ? (
        notices?.map((item, idx) => {
          return (
            <React.Fragment key={idx}>
              <div key={idx} className={idx === num ? '' : 'hidden'}>
                <Box
                  label={item.label === noticeType.GENERAL ? '공지' : '소식'}
                  title={item.title}
                  date={item.date}
                  url={item.url}
                />
              </div>
            </React.Fragment>
          )
        })) : (
          <div>
            <Box
              label={'오류'}
              title={t('api_error')}
              date={getToday()} // 오늘 날짜
              url={'https://monitor.hybus.app/status/bushanyang'}
            />
          </div>
        )}
    </div>
  )
}

export default Notice
