import axios from 'axios'
import React, { useEffect, useState } from 'react'

type Info = {
  label: '공지' | '소식'
  title: string
  date: string
  url: string
}

const Notice = () => {
  const [data, setData] = useState<Array<Info>>([])
  const [isLoaded, setLoaded] = useState<boolean>(false)

  const getData = async (): Promise<Array<Info>> => {
    return await axios
      .get(
        'https://proxy.anoldstory.workers.dev/https://api.hybus.app/announcements/'
      )
      .then((res) => {
        return res.data
      })
      .catch((err) => {
        console.log(err)
        return new Array<Info>()
      })
      .then((res) => res as Array<Info>)
  }

  useEffect(() => {
    if (!isLoaded) {
      getData().then((res) => {
        setData(res)
        setLoaded(true)
      })
    }
  }, [])

  const [num, changeNum] = useState<number>(0)

  useEffect(() => {
    setTimeout(() => {
      changeNum((num + 1) % data.length)
    }, 3000)
  }, [data.length, num])

  return (
    <div>
      <div className="relative w-full">
        <div className="h-[3rem] w-full card p3">
          {data.map((item, idx) => {
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
      </div>{' '}
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
    <a
      className="animate-carousel cursor-pointer "
      onClick={() => {
        window.open(props.url)
      }}
    >
      <p className="float-left pl-2 font-bold text-base text-chip-red">
        {props.label}
      </p>
      <p className="inline font-medium text-base">{props.title}</p>
      <p className="float-right pr-2 font-normal text-base">{props.date}</p>
    </a>
  )
}

export default Notice
