import React, { useEffect, useState } from 'react'

type Info = {
  label: '공지' | '소식'
  title: string
  date: string
  url: string
}

const Notice = () => {
  const info: Info[] = [
    {
      label: '공지',
      title: 'testtesttesttes',
      date: '07/23',
      url: 'https://huchu.link/yiBacVJ',
    },
    {
      label: '공지',
      title: 'testtest231',
      date: '07/23',
      url: 'https://huchu.link/0XaPgDF',
    },
  ]

  const [num, changeNum] = useState<number>(0)

  useEffect(() => {
    setTimeout(() => {
      changeNum((num + 1) % info.length)
    }, 3000)
  }, [num])

  return (
    <div>
      <div className=" relative w-full overflow-hidden">
        {info.map((item, idx) => {
          return (
            <div key={idx} className={idx === num ? '' : 'hidden'}>
              <Box
                label={item.label}
                title={item.title}
                date={item.date}
                url={item.url}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Box = (props: {
  url: string
  label: string
  title: string
  date: string
}) => {
  return (
    <div className="animate-carousel w-full card">
      <a
        onClick={() => {
          window.open(props.url)
        }}
      >
        <p className="float-left font-bold text-base text-chip-red">
          {props.label}
        </p>
        <p className="float-left px-3 font-medium text-base">{props.title}</p>
        <p className="float-right px-3 font-normal text-base">{props.date}</p>
      </a>
    </div>
  )
}

export default Notice
