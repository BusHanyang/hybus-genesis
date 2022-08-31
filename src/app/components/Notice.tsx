import axios from 'axios'
import React, { useEffect, useState } from 'react'

type Info = {
  label: '공지' | '소식'
  title: string
  date: string
  url: string
}

const Box = (props: {
  url: string
  label: string
  title: string
  date: string
}) => {
  return (
    <a className="animate-carousel cursor-pointer " href={props.url}>
      <div className="grid grid-flow-col  grid-cols-5 gap-2">
        <p className="col-span-1 font-bold text-base text-chip-red">
          {props.label}
        </p>
        <p className="col-span-3 text-base truncate">{props.title}</p>
        <p className="col-span-1 font-normal text-base">{props.date}</p>
      </div>
    </a>
  )
}

const Notice = () => {
  const [data, setData] = useState<Array<Info>>([])
  const [isLoaded, setLoaded] = useState<boolean>(false)

  const getData = async (): Promise<Array<Info>> => {
    return await axios
      .get('https://api.hybus.app/announcements/')
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
  }, [isLoaded])

  const [num, changeNum] = useState<number>(0)

  useEffect(() => {
    setTimeout(() => {
      changeNum((num + 1) % data.length)
    }, 7000)
  }, [data.length, num])

  return (
    <div className="relative w-full">
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

export default Notice
