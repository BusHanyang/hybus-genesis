import { classed } from '@tw-classed/react'
import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { distanceBetweenPointsMeters } from '@/components/crowding/classifyStopPresence'
import type { PresenceSignal } from '@/components/crowding/createPresenceSignal'
import type {
  StopPresenceController,
  StopPresenceErrorCode,
  StopPresenceStatus,
} from '@/components/crowding/useStopPresence'
import { crowdingStopAnchors } from '@/data/crowding/stopGeometry'

const DebugRoot = classed('div', 'fixed bottom-4 left-4 z-[100] font-Ptd')
const DebugTrigger = classed(
  'button',
  'flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-900 shadow-lg',
)
const DebugPanel = classed(
  'section',
  'mb-2 max-h-[72vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-900 shadow-2xl',
)
const DebugBadge = classed(
  'span',
  'rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700',
)
const DebugMetric = classed(
  'div',
  'rounded-lg border border-slate-200 bg-slate-50 p-2',
)
const DebugButton = classed(
  'button',
  'h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40',
)

const statusLabels: Record<StopPresenceStatus, string> = {
  collecting: 'GPS 수집 중',
  denied: '위치 권한 거부',
  error: 'GPS 오류',
  idle: '측정 전',
  paused: '화면 숨김으로 중지',
  requesting: '권한 또는 첫 좌표 대기',
  stopped: '측정 중지',
  unsupported: 'GPS 미지원',
}

const getErrorLabel = (errorCode: StopPresenceErrorCode): string => {
  switch (errorCode) {
    case 'permission_denied':
      return '브라우저 또는 운영체제에서 위치 권한을 허용해야 합니다.'
    case 'position_unavailable':
      return '현재 위치를 가져올 수 없습니다.'
    case 'timeout':
      return '15초 안에 위치를 가져오지 못했습니다.'
    case 'unknown':
      return '알 수 없는 위치 오류가 발생했습니다.'
  }
}

const copyTextToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard !== undefined) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back to the legacy copy command in restricted dev browsers.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('clipboard')
}

type GpsDebugPanelProps = {
  isParticipating: boolean
  onDisable: () => void
  onEnable: () => void
  presence: StopPresenceController
  signal: PresenceSignal | null
}

const GpsDebugPanel = ({
  isParticipating,
  onDisable,
  onEnable,
  presence,
  signal,
}: GpsDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [copyStatus, setCopyStatus] = useState<'copied' | 'error' | 'idle'>(
    'idle',
  )

  useEffect(() => {
    if (!isOpen) return

    setNow(Date.now())
    setCopyStatus('idle')
    const clock = window.setInterval(() => setNow(Date.now()), 1_000)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearInterval(clock)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const latestSample = presence.latestSample
  const lastSampleAgeSeconds =
    latestSample === null
      ? null
      : Math.max(0, Math.floor((now - latestSample.timestamp) / 1_000))
  const nextRetrySeconds =
    presence.nextRetryAt === null
      ? null
      : Math.max(0, Math.ceil((presence.nextRetryAt - now) / 1_000))
  const anchorDistances = useMemo(
    () =>
      latestSample === null
        ? []
        : crowdingStopAnchors.map((anchor) => ({
            distanceMeters: distanceBetweenPointsMeters(latestSample, anchor),
            stopId: anchor.id,
          })),
    [latestSample],
  )

  const copyDiagnosticSummary = async () => {
    const diagnosticSummary = {
      capturedAt: new Date(now).toISOString(),
      classification: presence.classification,
      errorCode: presence.errorCode,
      isPageVisible: presence.isPageVisible,
      isParticipating,
      latestSample:
        latestSample === null
          ? null
          : {
              accuracyMeters: Math.round(latestSample.accuracyMeters),
              ageSeconds: lastSampleAgeSeconds,
              anchorDistancesMeters: Object.fromEntries(
                anchorDistances.map(({ distanceMeters, stopId }) => [
                  stopId,
                  Math.round(distanceMeters),
                ]),
              ),
            },
      nextRetrySeconds,
      permission: presence.permission,
      retryAttempt: presence.retryAttempt,
      sampleCount: presence.sampleCount,
      status: presence.status,
    }

    try {
      await copyTextToClipboard(JSON.stringify(diagnosticSummary, null, 2))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return createPortal(
    <DebugRoot data-component="gps-debug-panel">
      {isOpen && (
        <DebugPanel aria-label="GPS Dev 진단" role="dialog">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-sm font-bold">GPS Dev 진단</h2>
                <DebugBadge>SHARED CORE</DebugBadge>
              </div>
              <p className="text-[11px] leading-4 text-slate-600">
                일반 기능과 같은 측정 상태를 관찰합니다. 유효한 coarse 신호는
                실제 혼잡도 heartbeat에 사용됩니다.
              </p>
            </div>
            <button
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-sm"
              type="button"
              aria-label="GPS Dev 진단 닫기"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
            <DebugMetric>
              <p className="mb-1 text-slate-500">측정 상태</p>
              <p className="font-bold">{statusLabels[presence.status]}</p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">브라우저 권한</p>
              <p className="font-bold">{presence.permission}</p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">일반 참여</p>
              <p className="font-bold">{isParticipating ? '켜짐' : '꺼짐'}</p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">메모리 표본</p>
              <p className="font-bold">{presence.sampleCount}개</p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">최근 정확도</p>
              <p className="font-bold">
                {latestSample === null
                  ? '-'
                  : `±${Math.round(latestSample.accuracyMeters)}m`}
              </p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">최근 표본</p>
              <p className="font-bold">
                {lastSampleAgeSeconds === null
                  ? '-'
                  : `${lastSampleAgeSeconds}초 전`}
              </p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">분류 상태</p>
              <p className="font-bold">{presence.classification.status}</p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">체류 시간</p>
              <p className="font-bold">
                {Math.floor(presence.classification.dwellMilliseconds / 1000)}초
              </p>
            </DebugMetric>
            <DebugMetric>
              <p className="mb-1 text-slate-500">재시도</p>
              <p className="font-bold">
                {nextRetrySeconds === null
                  ? presence.retryAttempt === 0
                    ? '-'
                    : `${presence.retryAttempt}회 완료`
                  : `${nextRetrySeconds}초 후 (${presence.retryAttempt}회차)`}
              </p>
            </DebugMetric>
          </div>

          <div className="mb-3 space-y-2 text-[11px]">
            <p className="font-bold text-slate-500">정류장 거리</p>
            {anchorDistances.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-2 text-slate-500">
                최근 위치 표본이 없습니다.
              </p>
            ) : (
              anchorDistances.map(({ distanceMeters, stopId }) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  key={stopId}
                >
                  <span>{stopId}</span>
                  <strong>{Math.round(distanceMeters)}m</strong>
                </div>
              ))
            )}
          </div>

          <div className="mb-3 space-y-2 text-[11px]">
            <p className="font-bold text-slate-500">정류장 분류 확률</p>
            {presence.classification.probabilities.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-2 text-slate-500">
                분류할 수 있는 GPS 표본이 아직 없습니다.
              </p>
            ) : (
              presence.classification.probabilities.map((probability) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  key={probability.stopId}
                >
                  <span>{probability.stopId}</span>
                  <strong>{Math.round(probability.probability * 100)}%</strong>
                </div>
              ))
            )}
          </div>

          <div className="mb-3 rounded-lg bg-slate-950 p-3 text-[10px] leading-4 text-slate-100">
            <p className="mb-1 font-bold text-slate-300">전송 후보 미리보기</p>
            <pre className="whitespace-pre-wrap break-words">
              {signal === null
                ? '확정된 대기 신호 없음'
                : JSON.stringify(signal, null, 2)}
            </pre>
          </div>

          <div className="mb-3">
            <DebugButton
              className="w-full"
              type="button"
              onClick={() => void copyDiagnosticSummary()}
            >
              개인정보 제외 진단 요약 복사
            </DebugButton>
            {copyStatus !== 'idle' && (
              <p className="mt-2 text-center text-[10px] text-slate-500">
                {copyStatus === 'copied'
                  ? '진단 요약을 복사했습니다.'
                  : '브라우저에서 클립보드 복사를 허용하지 않았습니다.'}
              </p>
            )}
          </div>

          {presence.errorCode !== null && (
            <p className="mb-3 rounded-lg bg-rose-50 p-2 text-[11px] leading-4 text-rose-800">
              {getErrorLabel(presence.errorCode)}
            </p>
          )}

          <div className="flex gap-2">
            <DebugButton
              className="flex-1 bg-slate-900 text-white"
              type="button"
              disabled={presence.isActive}
              onClick={onEnable}
            >
              측정 시작
            </DebugButton>
            <DebugButton
              type="button"
              disabled={!presence.isActive}
              onClick={onDisable}
            >
              중지
            </DebugButton>
            <DebugButton type="button" onClick={presence.reset}>
              표본 초기화
            </DebugButton>
          </div>
        </DebugPanel>
      )}

      <DebugTrigger
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            presence.isActive ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
        GPS DEV
      </DebugTrigger>
    </DebugRoot>,
    document.body,
  )
}

export default GpsDebugPanel
