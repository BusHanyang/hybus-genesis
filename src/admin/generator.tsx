let input = [
  /* 나중 오는 규칙이 우선 순위 */
  {
    where: 'subway' /* subway or yesulin 기준역 */,
    start: '08:00' /* String Seperated with : 시작 시간 */,
    end: '19:00' /* String Seperated with :  끝나는 시간 */,
    when: [40, 50] /* Number 매시간 몇분마다 */,
    isNonStop: 'Y' /* "Y" or "N" 직항인가 */,
  },
  {
    where: 'yesulin' /* subway or yesulin 기준역 */,
    start: '08:00' /* String Seperated with : 시작 시간 */,
    end: '19:00' /* String Seperated with :  끝나는 시간 */,
    when: [10, 20] /* Number 매시간 몇분마다 */,
    isNonStop: 'Y' /* "Y" or "N" 직항인가 */,
  },
  {
    where: 'subway' /* subway or yesulin 기준역 */,
    start: '08:00' /* String Seperated with : 시작 시간 */,
    end: '19:00' /* String Seperated with :  끝나는 시간 */,
    when: [0, 30] /* Number 매시간 몇분마다 */,
    isNonStop: 'N' /* "Y" or "N" 직항인가 */,
  },
]

class Rulegenerator {
  generate(rule: json): string {
    const output = {
      giksa: [],
      shuttlecock_i: [],
      shuttlecock_o: [],
      subway: [],
      yesulin: [],
    }
  }
  make(query) {
    let result = {
      giksa: [],
      shuttlecock_i: [],
      shuttlecock_o: [],
      subway: [],
      yesulin: [],
    }
    query.forEach((rule) => {
      result = makeRule(result, rule)
    })
    Object.keys(result).map((key) => {
      result[key] = result[key].map((i) => {
        i.time = timeToString(i.time)
        return i
      })
    })
    return result
  }
}

export default new Rulegenerator()

/**
 *  where , isNonStop은 3가지의 경우만 존재한다
 *  subway     Y
 *  subway     N
 *  yesulin    Y
 *  yesulin    N  => 순환인경우에는 subway에 포함됨  그러므로 rule에 포함 시킬 필요 X
 */

/* giksa or subway or shuttlecock_i or shuttlecock_o or subway or yesulin */
// make(input)
console.log(make(input))

/* rule 마다 규칙 적용 */
function makeRule(output, rule) {
  let flag = true
  let [startSi, startBun] = rule.start.split(':')
  let [endSi, endBun] = rule.end.split(':')

  let startTime = parseInt(startSi) * 60 + parseInt(startBun)
  let endTime = parseInt(endSi) * 60 + parseInt(endBun)
  if (startTime > endTime) endTime += 1440 // 끝나는 시간이 더 적을 때

  let nowTime = parseInt(startSi) * 60

  while (flag) {
    rule.when.forEach((targetBun) => {
      if (nowTime + targetBun <= endTime && nowTime + targetBun > startTime) {
        if (rule.isNonStop === 'Y') {
          /* 직행 */
          output = makeD(output, rule.where, nowTime + targetBun)
        } else if (rule.isNonStop === 'N') {
          /* 순환 */
          output = makeC(output, nowTime + targetBun)
        } else {
          throw 'rule needs isNonStop property!'
        }
      } else {
        flag = false
      }
    })
    nowTime += 60
  }
  return output
}

/**
 * 직행 노선 인 경우
 */
function makeD(output, where, time) {
  output['giksa'] = safePush(
    output['giksa'],
    time - 15,
    where === 'subway' ? 'DH' : 'DY'
  ) // 기숙사
  output['shuttlecock_o'] = safePush(
    output['shuttlecock_o'],
    time - 10,
    where === 'subway' ? 'DH' : 'DY'
  ) // 셔틀콕_나가는거 out
  output[where] = safePush(
    output[where],
    time,
    where === 'subway' ? 'DH' : 'DY'
  ) // 목적지
  output['shuttlecock_i'] = safePush(output['shuttlecock_i'], time + 10, 'R') // 셔틀콕_들어오는거 in
  return output
}

/*
C	순환노선
DH	한대앞역 행
DY	예술인아파트 행
R	기숙사행
NA	정보없음
*/

/**
 * 순환 노선 인 경우
 * Tip: 무조건 한대앞 시간일수 밖에없음
 */
function makeC(output, time) {
  output['giksa'] = safePush(output['giksa'], time - 15, 'C') // 기숙사
  output['shuttlecock_o'] = safePush(output['shuttlecock_o'], time - 10, 'C') // 셔틀콕_나가는거 out
  output['subway'] = safePush(output['subway'], time, 'C') // 한대앞
  output['yesulin'] = safePush(output['yesulin'], time + 5, 'C') // 예술인
  output['shuttlecock_i'] = safePush(output['shuttlecock_i'], time + 10, 'C') // 셔틀콕_들어오는거 in
  return output
}

/**
 * 이미 존재하는 시간인지 검사
 */
function safePush(arr, time, type) {
  time = time % 1440 // 24시간 기준 검열
  let idx = arr.findIndex((i) => i.time === time)
  if (idx == -1) {
    /* 없는 경우 */
    arr.push({ time: time, type: type })
  } else {
    /* 존재하는 경우*/
    arr[idx] = { time: time, type: type }
  }
  arr = arr.sort((a, b) => {
    if (a.time < b.time) {
      return -1
    }
    if (a.time > b.time) {
      return 1
    }
    return 0
  })
  return arr
}

/**
 *  시간을 문자로 변환
 */

function timeToString(time) {
  return '' + isTwoDigit(parseInt(time / 60)) + ':' + isTwoDigit(time % 60)
}

function isTwoDigit(num) {
  if (num < 10) return '0' + num
  return '' + num
}

/*
소요시간 
If C 순환
긱사 5 셔틀콕 10 한대앞 5 예술인 10 셔틀콕 5 긱사
IF DH 한대앞
긱사 5 셔틀콕 10 한대앞 10  셔틀콕 5 긱사
IF DC 예술인
긱사 5 셔틀콕 10 예술인 10  셔틀콕 5 긱사
*/
