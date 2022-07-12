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
        {/* {console.log(num)} */}

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
    <div className="animate-carousel relative float-left w-full card">
      <a
        id="notice"
        // className="card"
        onClick={() => {
          window.open(props.url)
        }}
      >
        <p id="gong" className="font-black text-chip-red">
          {props.label}
        </p>
        <p id="notice_text" className="font-medium">
          {props.title}
        </p>
        <p id="notice_date">{props.date}</p>
      </a>
    </div>
  )
}

export default Notice
