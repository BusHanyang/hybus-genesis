import React from 'react'

import type { CrowdingRequestObservation } from '../../../network/crowdingObservation'
import { createScheduledTripId } from '../sync/scheduledTrip'
import { fieldTestButtonClass as buttonClass } from './FieldTestControls'
import {
  fieldClassificationReasons,
  fieldStandingLocations,
  fieldStopNames,
  type FieldTestContext,
  type FieldTestSnapshot,
  formatFieldTestTime as timeText,
  isCurrentFieldResponse,
} from './fieldTestModel'
import type { FieldTestRecorder } from './useFieldTestRecording'

const elapsedText = (timestamp: number, now: number) =>
  `${Math.max(0, Math.floor((now - timestamp) / 1_000))}초 전`
const stopName = (id: FieldTestContext['selectedStopId']) =>
  id === null ? '미확정' : fieldStopNames[id]
const aggregateNames = {
  insufficient: '데이터 부족',
  low: '여유',
  medium: '보통',
  high: '많음',
} as const

const requestStateText = (event: CrowdingRequestObservation | null) => {
  if (event === null) return '아직 요청 없음'
  if (event.phase === 'started') return '응답 기다리는 중'
  if (event.phase === 'succeeded') return '응답 확인 완료'
  if (event.error === 'aborted') return '요청 취소됨'
  if (event.status === 429) return '잠시 후 재시도'
  if (event.error === 'invalid_response') return '응답 형식 오류'
  return '요청 실패'
}

const Metric = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="min-w-0 rounded-xl bg-slate-50 p-3">
    <dt className="mb-1 text-xs text-slate-500">{label}</dt>
    <dd className="m-0 break-words text-sm font-semibold text-slate-900">
      {children}
    </dd>
  </div>
)

const Stage = ({
  number,
  title,
  state,
  ready,
  children,
}: {
  number: string
  title: string
  state: string
  ready: boolean
  children: React.ReactNode
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[11px] text-slate-600">
          {number}
        </span>
        {title}
      </h3>
      <span
        className={`max-w-[55%] rounded-md px-2 py-1 text-right text-xs font-semibold ${ready ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
      >
        {state}
      </span>
    </div>
    {children}
  </section>
)

const RequestDetails = ({
  event,
  now,
}: {
  event: CrowdingRequestObservation | null
  now: number
}) =>
  event === null ? null : (
    <p className="mt-2 break-words text-xs leading-5 text-slate-500">
      {timeText(event.observedAt)} · {elapsedText(event.observedAt, now)}
      {event.status !== null && ` · HTTP ${event.status}`}
      {event.phase === 'failed' && event.error !== null && ` · ${event.error}`}
    </p>
  )

type FieldTestStagesProps = {
  context: FieldTestContext
  snapshot: FieldTestSnapshot
  observations: Pick<
    FieldTestRecorder,
    'lastPresence' | 'lastAccepted' | 'lastAggregates'
  >
  nextRequestAt: number
  now: number
  onRetry: () => void
}

const FieldTestStages = ({
  context: props,
  snapshot,
  observations,
  nextRequestAt,
  now,
  onRetry,
}: FieldTestStagesProps) => {
  const trip = props.departure?.trip ?? null
  const targetTripId =
    trip === null ? null : createScheduledTripId(trip, Math.floor(now / 60_000))
  const lastPresence = observations.lastPresence
  const lastAccepted = observations.lastAccepted
  const lastAggregates = observations.lastAggregates
  const currentAcceptance = isCurrentFieldResponse(
    lastAccepted,
    targetTripId,
    now,
  )
  const currentAggregates = isCurrentFieldResponse(
    lastAggregates,
    targetTripId,
    now,
  )
  const aggregate =
    currentAggregates &&
    lastAggregates?.phase === 'succeeded' &&
    lastAggregates.operation === 'aggregates'
      ? (lastAggregates.response.aggregates.find(
          (entry) => entry.scheduledTripId === targetTripId,
        )?.aggregate ?? null)
      : null
  const nextRequestSeconds = Math.max(
    0,
    Math.ceil((nextRequestAt - now) / 1_000),
  )
  const retryAfterSeconds =
    lastPresence?.phase === 'failed' &&
    lastPresence.retryAfterMilliseconds !== null
      ? Math.max(
          0,
          Math.ceil(
            (lastPresence.observedAt +
              lastPresence.retryAfterMilliseconds -
              now) /
              1_000,
          ),
        )
      : 0
  const sample = snapshot.sample
  const permissionText = {
    granted: '허용',
    denied: '차단',
    prompt: '허용 대기',
    unknown: '확인 중',
    unsupported: '지원 안 함',
  }[props.presence.permission]
  const isSending = lastPresence?.phase === 'started'
  const presenceMatchesTarget =
    targetTripId !== null &&
    lastPresence?.scheduledTripIds.includes(targetTripId) === true

  return (
    <>
      <Stage
        number="1"
        title="GPS 수집"
        state={props.presence.hasFreshPosition ? '유효한 위치' : permissionText}
        ready={props.presence.hasFreshPosition}
      >
        <dl className="m-0 grid grid-cols-2 gap-2">
          <Metric label="위치 권한">{permissionText}</Metric>
          <Metric label="최근 정확도">
            {sample === null
              ? '측정 전'
              : `${Math.round(sample.accuracyMeters)}m 반경`}
          </Metric>
          <Metric label="최근 표본">
            {sample === null ? '아직 없음' : elapsedText(sample.timestamp, now)}
          </Metric>
          <Metric label="유효 표본 / 전체">
            {snapshot.usableSampleCount} / {snapshot.sampleCount}개
          </Metric>
        </dl>
        <p className="mb-0 mt-2 text-xs text-slate-500">
          {props.presence.isPageVisible
            ? '화면 표시 중'
            : '화면 숨김으로 측정 중지'}{' '}
          · {props.presence.source ?? '위치 입력 대기'}
        </p>
      </Stage>

      <Stage
        number="2"
        title="위치와 출발편"
        state={
          props.signal === null
            ? '판정 대기'
            : stopName(snapshot.classifiedStopId)
        }
        ready={props.signal !== null}
      >
        <dl className="m-0 grid grid-cols-2 gap-2">
          <Metric label="앱에서 선택한 정류장">
            {stopName(props.selectedStopId)}
          </Metric>
          <Metric label="GPS가 판정한 정류장">
            {stopName(snapshot.classifiedStopId)}
          </Metric>
          <Metric label="체류 시간">
            {Math.floor(snapshot.dwellMilliseconds / 1_000)}초 / 최소 30초
          </Metric>
          <Metric label="연결할 다음 출발편">
            {trip === null
              ? props.departure?.status === 'unavailable'
                ? '현재 없음'
                : '확인 중'
              : `${trip.departureTime} · ${trip.routeType} · ${trip.ordinal}번`}
          </Metric>
        </dl>
        <p className="mb-0 mt-2 text-xs leading-5 text-slate-600">
          {fieldClassificationReasons[snapshot.classificationReason]}
        </p>
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer py-2 font-semibold text-slate-600">
            승차 위치 거리 · 출발편 ID
          </summary>
          <dl className="m-0 mt-2 space-y-2">
            {(['general', 'artist', 'across'] as const).map((location) => (
              <div className="flex justify-between gap-2" key={location}>
                <dt>{fieldStandingLocations[location]}</dt>
                <dd className="m-0 font-semibold">
                  {sample?.boardingReferenceDistancesMeters?.[location] ===
                  undefined
                    ? '측정 전'
                    : `${sample.boardingReferenceDistancesMeters[location]}m`}
                </dd>
              </div>
            ))}
          </dl>
          <p className="rounded-lg bg-amber-50 p-2 leading-5 text-amber-900">
            일반·예술인 전용 거리는 실측 사이트의 지도 기준점과 비교한
            참고값이에요. 현재 HYBUS는 두 위치에 셔틀콕 기준점 하나를 사용하며,
            노선 자동 구분은 아직 적용되지 않았어요.
          </p>
          <p className="mb-1 font-semibold text-slate-600">현재 출발편 ID</p>
          <code className="block break-all rounded-lg bg-slate-100 p-2 text-[11px]">
            {targetTripId ?? '출발편 없음'}
          </code>
          <p className="mb-1 mt-3 font-semibold text-slate-600">
            앱 기준점별 거리 / 분류 확률
          </p>
          <dl className="m-0 space-y-2">
            {Object.entries(fieldStopNames).map(([id, name]) => (
              <div key={id} className="flex justify-between gap-2">
                <dt>{name}</dt>
                <dd className="m-0">
                  {sample?.stopDistancesMeters?.[id] === undefined
                    ? '—'
                    : `${sample.stopDistancesMeters[id]}m`}{' '}
                  /{' '}
                  {snapshot.probabilities.find(
                    (entry) => entry.stopId === id,
                  ) === undefined
                    ? '—'
                    : `${Math.round(snapshot.probabilities.find((entry) => entry.stopId === id)!.probability * 100)}%`}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </Stage>

      <Stage
        number="3"
        title="서버 접수"
        state={
          presenceMatchesTarget
            ? lastPresence?.phase === 'succeeded' && !currentAcceptance
              ? '접수 유효시간 만료'
              : requestStateText(lastPresence)
            : currentAcceptance
              ? '현재 편 접수 확인'
              : '현재 편 접수 대기'
        }
        ready={
          currentAcceptance &&
          presenceMatchesTarget &&
          lastPresence?.phase === 'succeeded'
        }
      >
        <p className="m-0 text-sm font-semibold">
          {currentAcceptance &&
          lastAccepted?.phase === 'succeeded' &&
          lastAccepted.operation === 'presence'
            ? `접수 성공 · ${lastAccepted.response.accepted ? 'accepted: true' : ''}`
            : '현재 편의 유효한 접수 확인 없음'}
        </p>
        <RequestDetails event={lastPresence} now={now} />
        {lastAccepted?.phase === 'succeeded' && (
          <p className="mb-0 mt-2 text-xs leading-5 text-slate-500">
            마지막 성공 {timeText(lastAccepted.observedAt)} · 유효시간{' '}
            {lastAccepted.response.expiresInSeconds}초
            {!currentAcceptance && ' · 현재 편과 다르거나 유효시간이 지났어요'}
          </p>
        )}
        {lastPresence !== null && !presenceMatchesTarget && (
          <p className="mt-2 text-xs text-slate-500">
            위 요청 기록은 이전 출발편의 상태일 수 있어요.
          </p>
        )}
        {retryAfterSeconds > 0 && (
          <p className="mt-2 text-xs font-semibold text-amber-800">
            서버 대기 요청: 최소 {retryAfterSeconds}초 남음
          </p>
        )}
        {props.canSend &&
          !props.hasTerminalHeartbeatError &&
          nextRequestSeconds > 0 && (
            <p className="mb-0 mt-2 text-xs text-slate-500">
              {isSending
                ? '현재 응답을 기다리고 있어요.'
                : `다음 전송까지 약 ${nextRequestSeconds}초`}
            </p>
          )}
        {(props.hasTerminalHeartbeatError ||
          props.presence.status === 'denied' ||
          props.presence.status === 'error') && (
          <button
            type="button"
            className={`${buttonClass} mt-3 w-full`}
            onClick={onRetry}
          >
            다시 시도
          </button>
        )}
      </Stage>

      <Stage
        number="4"
        title="해당 편 집계"
        state={aggregate === null ? '조회 확인 필요' : '조회 완료'}
        ready={aggregate !== null}
      >
        <p className="m-0 text-sm font-semibold">
          {aggregate === null
            ? lastAggregates?.phase === 'succeeded'
              ? '현재 편의 유효한 조회 결과 없음'
              : requestStateText(lastAggregates)
            : `${aggregateNames[aggregate.status]} · 서버 구간 ${aggregate.bucket}`}
        </p>
        <RequestDetails event={lastAggregates} now={now} />
        {lastAggregates?.phase === 'succeeded' && !currentAggregates && (
          <p className="mt-2 text-xs text-slate-500">
            이전 편의 응답이거나 조회 결과가 만료됐어요. 현재 편의 새 응답을
            기다려주세요.
          </p>
        )}
        <p className="mb-0 mt-2 text-xs leading-5 text-slate-500">
          혼자 테스트하면 접수에 성공해도 ‘데이터 부족’일 수 있어요. 집계
          조회만으로 내 신호의 반영 여부를 개별 식별할 수는 없어요.
        </p>
      </Stage>
    </>
  )
}

export default FieldTestStages
