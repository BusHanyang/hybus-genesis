import { t } from 'i18next'

const getMapURLScheme = (loc: string): string => {
  if (loc == 'shuttlecoke_o') {
    return 'nmap://place?lat=37.2987258&lng=126.8379922&zoom=18&name=셔틀콕&appname=hybus.app'
  } else if (loc == 'subway') {
    return 'nmap://place?lat=37.309738&lng=126.852051&zoom=18&name=한대앞역 셔틀버스 정류장&appname=hybus.app'
  } else if (loc == 'yesulin') {
    return 'nmap://place?lat=37.31951&lng=126.84564&zoom=18&name=예술인 셔틀버스 정류장&appname=hybus.app'
  } else if (loc == 'jungang') {
    return 'nmap://place?lat=37.31489&lng=126.83961&zoom=18&name=중앙역 셔틀버스 정류장&appname=hybus.app'
  } else if (loc == 'shuttlecoke_i') {
    return 'nmap://place?lat=37.29923&lng=126.83737&zoom=18&name=셔틀콕 건너편 정류장&appname=hybus.app'
  } else if (loc == 'residence') {
    return 'nmap://place?lat=37.29349&lng=126.83644&zoom=18&name=기숙사 셔틀버스 정류장&appname=hybus.app'
  } else {
    return 'nmap://place?lat=37.2987258&lng=126.8379922&zoom=18&name=셔틀콕&appname=hybus.app'
  }
}
const getMapURL = (loc: string): string => {
  if (loc == 'shuttlecoke_o') {
    return 'https://map.naver.com/v5/?lng=126.8379922&lat=37.2987258&type=0&title=셔틀콕'
  } else if (loc == 'subway') {
    return 'https://map.naver.com/v5/?lng=126.852051&lat=37.309738&type=0&title=한대앞역 셔틀버스 정류장'
  } else if (loc == 'yesulin') {
    return 'https://map.naver.com/v5/?lng=126.84564&lat=37.31951&type=0&title=예술인 셔틀버스 정류장'
  } else if (loc == 'jungang') {
    return 'https://map.naver.com/v5/?lng=126.83961&lat=37.31489&type=0&title=중앙역 셔틀버스 정류장'
  } else if (loc == 'shuttlecoke_i') {
    return 'https://map.naver.com/v5/?lng=126.83737&lat=37.29923&type=0&title=셔틀콕 건너편 정류장'
  } else if (loc == 'residence') {
    return 'https://map.naver.com/v5/?lng=126.83644&lat=37.29349&type=0&title=기숙사 셔틀버스 정류장'
  } else {
    return 'https://map.naver.com'
  }
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
