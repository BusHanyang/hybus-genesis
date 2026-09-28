import React from 'react'
import { useTranslation } from 'react-i18next'

import ChangelogTimeline from './ChangelogTimeline'
import InfoGuide from './InfoGuide'
import { Modal } from './modal'
import NoticeList from './NoticeList'
import SeasonalPrompt from './SeasonalPrompt'

const ModalOpen = (props: {
  isOpen: boolean
  isModalAni: boolean
  closeModal: () => void
  mTarget: string
  noticeIndex: number | null
  onEnableSeasonalTheme: (origin: Element | null) => void
}) => {
  const { t } = useTranslation()
  const titles: Record<string, string> = {
    Info: t('info_title'),
    Fabs: t('changelog'),
    Notice: t('notice_title'),
    Seasonal: t('seasonal_prompt_title'),
  }

  return (
    <Modal
      open={props.isOpen}
      closing={props.isModalAni}
      title={titles[props.mTarget] ?? ''}
      onClose={props.closeModal}
    >
      {props.mTarget === 'Info' && <InfoGuide />}
      {props.mTarget === 'Fabs' && <ChangelogTimeline />}
      {props.mTarget === 'Notice' && (
        <NoticeList initialIndex={props.noticeIndex} />
      )}
      {props.mTarget === 'Seasonal' && (
        <SeasonalPrompt
          onEnable={props.onEnableSeasonalTheme}
          onKeepOff={props.closeModal}
        />
      )}
    </Modal>
  )
}

export default ModalOpen
