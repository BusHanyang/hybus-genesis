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
    <div className="w-full card ">
      {data.map((item, idx) => {
        return (
          <React.Fragment key={idx}>
            <div key={idx} className={idx === num ? '' : 'hidden'}>
              <Box
                label={item.label}
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

const Box = (props: {
  url: string
  label: string
  title: string
  date: string
}) => {
  return (
    <div className="cursor-pointer bg-slate-50">
      <a
        className="animate-carousel "
        onClick={() => {
          window.open(props.url)
        }}
      >
        <div className="float-left font-bold text-base text-chip-red">
          {props.label}
        </div>
        <div className="float-left px-3 font-medium text-base">
          {props.title}
        </div>
        <div className="float-right px-3 font-normal text-base">
          {props.date}
        </div>
      </a>
    </div>
  )
}

export default Notice
