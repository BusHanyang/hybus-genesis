import { useQuery } from '@tanstack/react-query'
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
  const notices = useQuery({
    queryKey: ['notice'],
    queryFn: noticeAPI,
  })

  const [num, changeNum] = useState<number>(0)

  useEffect(() => {
    setTimeout(() => {
      changeNum((num + 1) % (notices.data?.length ?? 1))
    }, 7000)
  }, [notices.data?.length, num])

  return (
    <div className="relative w-full">
      {notices.data?.map((item, idx) => {
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
      })}
    </div>
  )
}

export default Notice
