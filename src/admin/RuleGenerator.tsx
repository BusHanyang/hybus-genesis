type Iinput = {
  where: 'yesulin' | 'subway' /* subway or yesulin 기준역 */
  start: string /* String Seperated with : 시작 시간 */
  end: string /* String Seperated with :  끝나는 시간 */
  eachWhen: number /* Number 몇분마다 */
  isNonStop: 'Y' | 'N' /* "Y" or "N" 직항인가 */
}

type Idirect = 'C' | 'DH' | 'DY' | 'R'

type Irule = {
  time: string
  type: Idirect
}

type Ioutput = {
  giksa: Array<Irule>
  // eslint-disable-next-line camelcase
  shuttlecock_i: Array<Irule>
  // eslint-disable-next-line camelcase
  shuttlecock_o: Array<Irule>
  subway: Array<Irule>
  yesulin: Array<Irule>
}

const input: Array<Iinput> = [
  /* 나중 오는 규칙이 우선 순위 */
  {
    where: 'yesulin' /* subway or yesulin 기준역 */,
    start: '08:00' /* String Seperated with : 시작 시간 */,
    end: '19:00' /* String Seperated with :  끝나는 시간 */,
    eachWhen: 5 /* Number 몇분마다 */,
    isNonStop: 'Y' /* "Y" or "N" 직항인가 */,
  },
  {
    where: 'subway' /* subway or yesulin 기준역 */,
    start: '08:00' /* String Seperated with : 시작 시간 */,
    end: '19:00' /* String Seperated with :  끝나는 시간 */,
    eachWhen: 5 /* Number 몇분마다 */,
    isNonStop: 'N' /* "Y" or "N" 직항인가 */,
  },
]

/*
C	순환노선
DH	한대앞역 행
DY	예술인아파트 행
R	기숙사행
NA	정보없음
*/

/*
소요시간 
If C 순환
긱사 5 셔틀콕 10 한대앞 5 예술인 10 셔틀콕 5 긱사
IF DH 한대앞
긱사 5 셔틀콕 10 한대앞 10  셔틀콕 5 긱사
IF DC 예술인
긱사 5 셔틀콕 10 예술인 10  셔틀콕 5 긱사
*/

/**
 * Bus Rule Generator
 */
class RuleGenerator {
  /**
   *  giksa or subway or shuttlecock_i or shuttlecock_o or subway or yesulin
   *  where , isNonStop은 3가지의 경우만 존재한다
   *  subway     Y
   *  subway     N
   *  yesulin    Y
   *  yesulin    N  => 순환인경우에는 subway에 포함됨  그러므로 rule에 포함 시킬 필요 X
   */
  generate(rule: Array<Iinput> = input) {
    return this.make(rule)
  }

  /**
   * main logic
   */
  make(query: Array<Iinput>) {
    /* result example */
    let result: Ioutput = {
      giksa: [],
      // eslint-disable-next-line camelcase
      shuttlecock_i: [],
      // eslint-disable-next-line camelcase
      shuttlecock_o: [],
      subway: [],
      yesulin: [],
    }
    /* rule generator */
    query.forEach((rule: Iinput) => {
      result = this.makeRule(result, rule)
    })
    return result
  }

  /**
   * Make Rule
   */
  makeRule(output: Ioutput, rule: Iinput) {
    let flag = true
    const [startSi, startBun] = rule.start.split(':')
    const [endSi, endBun] = rule.end.split(':')

    const startTime = parseInt(startSi) * 60 + parseInt(startBun)
    let endTime = parseInt(endSi) * 60 + parseInt(endBun)
    if (startTime > endTime) endTime += 1440 // 끝나는 시간이 더 적을 때

    let nowTime = parseInt(startSi) * 60

    while (flag) {
      if (
        nowTime + rule.eachWhen <= endTime &&
        nowTime + rule.eachWhen > startTime
      ) {
        if (rule.isNonStop === 'Y') {
          /* 직행 */
          output = this.makeD(output, rule.where, nowTime + rule.eachWhen)
        } else if (rule.isNonStop === 'N') {
          /* 순환 */
          output = this.makeC(output, nowTime + rule.eachWhen)
        } else {
          throw 'rule needs isNonStop property!'
        }
      } else {
        flag = false
      }

      nowTime += 60
    }
    return output
  }

  /**
   * 직행 노선 인 경우
   */
  makeD(output: Ioutput, where: 'yesulin' | 'subway', time: number) {
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

  /**
   * 순환 노선 인 경우
   * Tip: 무조건 한대앞 시간일수 밖에없음
   */
  makeC(output: Ioutput, time: number) {
    output['giksa'] = safePush(output['giksa'], time - 15, 'C') // 기숙사
    output['shuttlecock_o'] = safePush(output['shuttlecock_o'], time - 10, 'C') // 셔틀콕_나가는거 out
    output['subway'] = safePush(output['subway'], time, 'C') // 한대앞
    output['yesulin'] = safePush(output['yesulin'], time + 5, 'C') // 예술인
    output['shuttlecock_i'] = safePush(output['shuttlecock_i'], time + 10, 'C') // 셔틀콕_들어오는거 in
    return output
  }
}

export default new RuleGenerator()

/**
 * hoisting zone
 */

/**
 * 이미 존재하는 시간인지 검사
 */
function safePush(arr: Array<Irule>, time: number, type: Idirect) {
  time = time % 1440 // 24시간 기준 검열
  const stringTime = timeToString(time)
  const idx = arr.findIndex((i) => i.time === stringTime)
  if (idx == -1) {
    /* 없는 경우 */
    arr.push({ time: stringTime, type: type })
  } else {
    /* 존재하는 경우*/
    arr[idx] = { time: stringTime, type: type }
  }
  arr = arr.sort((a, b) => {
    if (a.time < b.time) return -1
    else if (a.time > b.time) return 1
    else return 0
  })
  return arr
}

/**
 *  시간을 문자로 변환
 */
function timeToString(time: number): string {
  return '' + isTwoDigit(~~(time / 60)) + ':' + isTwoDigit(time % 60)
}

/**
 *  두글자 숫자를 문자로 변환
 */
function isTwoDigit(num: number): string {
  if (num < 10) return '0' + num
  return '' + num
}
