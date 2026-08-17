import { t } from 'i18next'

import {
  isMappableStopLocation,
  stopMetadata,
} from '@/data/common/stopMetadata'

const getMapURLScheme = (loc: string): string => {
  const stop = isMappableStopLocation(loc)
    ? stopMetadata[loc]
    : stopMetadata.shuttlecoke_o

  return `nmap://place?lat=${stop.latitude}&lng=${stop.longitude}&zoom=18&name=${stop.naverName}&appname=hybus.app`
}

const getMapURL = (loc: string): string => {
  if (!isMappableStopLocation(loc)) return 'https://map.naver.com'

  const stop = stopMetadata[loc]
  return `https://map.naver.com/?lng=${stop.longitude}&lat=${stop.latitude}&type=0&title=${stop.naverName}`
}
export const openNaverMapApp = (loc: string): void => {
  // Check if web client is Safari
  if (
    navigator.userAgent.match(/(iPod|iPhone|iPad|Macintosh)/) &&
    navigator.userAgent.match(/AppleWebKit/) &&
    !navigator.userAgent.match(/Chrome/)
  ) {
    const naverMap = confirm(t('use_naver_map'))

    if (naverMap) {
      window.location.href = getMapURLScheme(loc)
    } else {
      window.location.href = getMapURL(loc)
    }
  } else {
    const clicked = +new Date()
    location.href = getMapURLScheme(loc)
    setTimeout(function () {
      if (+new Date() - clicked < 1500 && !document.hidden) {
        window.location.href = getMapURL(loc)
      }
    }, 1000)
  }
}
