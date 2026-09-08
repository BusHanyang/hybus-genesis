/* eslint-disable camelcase -- Preserve existing stop IDs and classifier reason codes. */
import type { CrowdingStopId } from '../../../data/crowding/stopGeometry.ts'
import { crowdingStopAnchors } from '../../../data/crowding/stopGeometry.ts'
import type { CrowdingRequestObservation } from '../../../network/crowdingObservation.ts'
import type { NextShuttleDeparture } from '../../shuttle/Shuttle.tsx'
import { distanceBetweenPointsMeters } from '../gps/classifyStopPresence.ts'
import type { PresenceSignal } from '../gps/createPresenceSignal.ts'
import type { StopPresenceController } from '../gps/useStopPresence.ts'

export const fieldStandingLocations = {
  unset: '위치를 선택해주세요',
  general: '셔틀콕 일반',
  artist: '셔틀콕 예술인 전용',
  across: '셔틀콕 건너편',
  moving: '이동 중',
  other: '다른 장소',
} as const

export type FieldStandingLocation = keyof typeof fieldStandingLocations

export const fieldStopNames: Record<CrowdingStopId, string> = {
  shuttlecoke_o: '셔틀콕',
  shuttlecoke_i: '셔틀콕 건너편',
  subway: '한대앞역',
  yesulin: '예술인 정류장',
  jungang: '중앙역',
  residence: '기숙사',
}

// The two boarding reference points are from the existing GPS field lab's
// lib/measurement.ts (Kakao location-share conversion, 2026-09-05).
// They are diagnostic distance references only, never classifier/trip anchors.
const fieldBoardingReferences = [
  {
    id: 'general',
    latitude: 37.29876545135686,
    longitude: 126.83788812731039,
  },
  {
    id: 'artist',
    latitude: 37.29865737679527,
    longitude: 126.83792445121067,
  },
  {
    ...crowdingStopAnchors.find((anchor) => anchor.id === 'shuttlecoke_i')!,
    id: 'across',
  },
] as const

export const fieldClassificationReasons = {
  classified: '정류장 대기 판정 완료',
  dwell_too_short: '같은 위치에서 30초 이상 기다려주세요',
  moving_too_fast: '이동 중으로 판단되어 대기 신호를 보내지 않아요',
  likelihood_too_low: '기준점과 위치 표본이 충분히 맞지 않아요',
  not_enough_nearby_samples: '정류장 근처의 연속 표본이 부족해요',
  not_enough_usable_samples: '정확도 60m 이내의 표본이 3개 이상 필요해요',
  outside_geofence: '정류장 범위 밖이에요',
  probability_too_close: '여러 정류장이 비슷하게 잡혀 판정을 보류했어요',
} as const

export type FieldTestContext = {
  canSend: boolean
  departure: NextShuttleDeparture | null
  hasTerminalHeartbeatError: boolean
  isParticipating: boolean
  isSummaryVisible: boolean
  presence: StopPresenceController
  scheduledTripId: string | null
  selectedStopId: CrowdingStopId | null
  signal: PresenceSignal | null
}

export const getFieldTransmissionBlock = (
  context: FieldTestContext,
): string | null => {
  const { presence, departure } = context
  if (!context.isParticipating) return '테스트 시작을 누르면 위치를 사용해요'
  if (!context.isSummaryVisible || context.selectedStopId === null)
    return '앱에서 셔틀 정류장을 선택해주세요'
  if (!presence.isPageVisible) return '화면이 숨겨져 측정과 전송을 멈췄어요'
  if (presence.permission === 'denied' || presence.status === 'denied')
    return '브라우저의 위치 권한이 차단되어 있어요'
  if (presence.status === 'unsupported')
    return '이 브라우저에서는 위치 측정을 지원하지 않아요'
  if (presence.status === 'error') return '위치 측정 오류를 확인해주세요'
  if (!presence.hasFreshPosition) return '최근의 유효한 위치를 기다리고 있어요'
  if (departure === null || departure.status === 'loading')
    return '다음 출발편을 확인하고 있어요'
  if (departure.status !== 'ready' || departure.trip === undefined)
    return '현재 연결할 출발편이 없어요'
  if (context.signal === null)
    return fieldClassificationReasons[presence.classification.reason]
  if (
    context.signal.stopId !== context.selectedStopId ||
    context.signal.stopId !== departure.trip.stopId
  )
    return 'GPS 판정 위치와 앱에서 선택한 정류장이 달라요'
  if (context.hasTerminalHeartbeatError)
    return '전송이 중단됐어요. 오류를 확인한 뒤 다시 시도해주세요'
  if (!context.canSend) return '전송 조건을 확인하고 있어요'
  return null
}

export const createFieldTestSnapshot = (context: FieldTestContext) => {
  const { presence } = context
  const sample = presence.latestSample
  const distances = (
    anchors: ReadonlyArray<{ id: string; latitude: number; longitude: number }>,
  ) =>
    sample === null
      ? null
      : Object.fromEntries(
          anchors.map((anchor) => [
            anchor.id,
            Math.round(distanceBetweenPointsMeters(sample, anchor) * 10) / 10,
          ]),
        )

  return {
    isParticipating: context.isParticipating,
    isPageVisible: presence.isPageVisible,
    permission: presence.permission,
    gpsStatus: presence.status,
    gpsError: presence.errorCode,
    gpsSource: presence.source,
    selectedStopId: context.selectedStopId,
    classifiedStopId: presence.classification.stopId,
    classificationStatus: presence.classification.status,
    classificationReason: presence.classification.reason,
    probabilities: presence.classification.probabilities.map(
      ({ stopId, probability }) => ({ stopId, probability }),
    ),
    sampleCount: presence.sampleCount,
    usableSampleCount: presence.classification.sampleCount,
    dwellMilliseconds: presence.classification.dwellMilliseconds,
    sample:
      sample === null
        ? null
        : {
            timestamp: sample.timestamp,
            accuracyMeters: sample.accuracyMeters,
            speedMetersPerSecond: sample.speedMetersPerSecond ?? null,
            stopDistancesMeters: distances(crowdingStopAnchors),
            boardingReferenceDistancesMeters: distances(
              fieldBoardingReferences,
            ),
          },
    departureStatus: context.departure?.status ?? 'loading',
    trip:
      context.departure?.trip === undefined
        ? null
        : { ...context.departure.trip },
    scheduledTripId: context.scheduledTripId,
    canSend: context.canSend,
    transmissionBlock: getFieldTransmissionBlock(context),
    signal:
      context.signal === null
        ? null
        : {
            accuracyBucket: context.signal.accuracyBucket,
            confidence: context.signal.confidence,
            dwellBucket: context.signal.dwellBucket,
            observedAtMinute: context.signal.observedAtMinute,
            sampleCount: context.signal.sampleCount,
            schemaVersion: context.signal.schemaVersion,
            state: context.signal.state,
            stopId: context.signal.stopId,
          },
  }
}

export const isCurrentFieldResponse = (
  observation: CrowdingRequestObservation | null,
  scheduledTripId: string | null,
  now: number,
): boolean =>
  observation !== null &&
  observation.phase === 'succeeded' &&
  scheduledTripId !== null &&
  observation.scheduledTripIds.includes(scheduledTripId) &&
  observation.observedAt <= now &&
  observation.observedAt + observation.response.expiresInSeconds * 1_000 > now

export type FieldTestSnapshot = ReturnType<typeof createFieldTestSnapshot>

export const formatFieldTestTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('ko-KR', { hour12: false })
