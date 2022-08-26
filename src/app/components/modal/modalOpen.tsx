import axios from 'axios'
import React, { useEffect,useState } from 'react'

import { Modal } from './modal'

type Changelog = {
  date: string,
  details: string
}

export const ModalOpen = (props: {
  isOpen: boolean,
  openModal: () => void,
  closeModal: () => void
}) => {


  const [data, setData] = useState<Array<Changelog>>([]);
  const [isLoaded, setLoaded] = useState<boolean>(false)
  const url = 'https://proxy.anoldstory.workers.dev/https://api.hybus.app/changelog/'

  const getChangelog = async (): Promise<Array<Changelog>> => {
    return await axios
      .get(url)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log(`error ${error}`);
      })
      .then((response) => response as unknown as Array<Changelog>)

  }

    useEffect(() => {
      if (!isLoaded) {
        getChangelog().then((response) => {
          setData(response)
          setLoaded(true)
        })
      }
    }, [])



  return(
    <React.Fragment>
        <Modal open={props.isOpen} close={props.closeModal}>
          <div
            className="font-Ptd"
            style={{ overflow: 'auto', maxHeight: '450px' }}
          >
            <div className="content-area">
              <div className="changelog">
            {data.map((datas : {date : string; details: string}) => {
              return (
                <div key={datas.date} className="changelog-margin">
                  <h4>{datas.date}</h4>
                  <p>{datas.details}</p>
                </div>
              )
            })}
             </div>
            </div>
          </div>
        </Modal>
      </React.Fragment>

  )

}