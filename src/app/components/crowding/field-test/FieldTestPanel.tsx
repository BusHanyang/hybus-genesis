import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { isCrowdingLocalOrigin } from '../../../network/crowdingEndpoints'
import FieldTestControls, {
  fieldTestButtonClass as buttonClass,
} from './FieldTestControls'
import {
  createFieldTestSnapshot,
  type FieldStandingLocation,
  fieldStandingLocations,
  type FieldTestContext,
} from './fieldTestModel'
import FieldTestStages from './FieldTestStages'
import { useFieldTestRecording } from './useFieldTestRecording'

type FieldTestPanelProps = FieldTestContext & {
  nextRequestAt: () => number
  onDisable: () => void
  onEnable: () => void
  onRetry: () => void
}

const FieldTestPanel = (props: FieldTestPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [, setNow] = useState(Date.now())
  const now = Date.now()
  const [standingLocation, setStandingLocation] =
    useState<FieldStandingLocation>('unset')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const snapshot = createFieldTestSnapshot(props)
  const recorder = useFieldTestRecording(
    snapshot,
    standingLocation,
    props.onDisable,
  )
  const isLocal = isCrowdingLocalOrigin(window.location.origin)
  const blockReason = snapshot.transmissionBlock
  const { hasData } = recorder

  useEffect(() => {
    if (!isOpen) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return
    if (isOpen) {
      dialog.showModal()
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        dialog.close()
        document.body.style.overflow = previousOverflow
      }
    }
  }, [isOpen])

  const closePanel = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const startTest = () => {
    if (recorder.start()) props.onEnable()
  }

  const stopTest = () => {
    recorder.stop()
    props.onDisable()
  }

  const clearRecord = () => {
    if (
      !window.confirm(
        '이 기기의 현장 테스트 기록을 비울까요? 필요한 기록은 먼저 JSON으로 저장해주세요.',
      )
    )
      return
    props.onDisable()
    recorder.clear()
  }

  return createPortal(
    <div className="font-Ptd text-slate-900" data-component="gps-debug-panel">
      <button
        ref={triggerRef}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[100] flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span
          className={`size-2 rounded-full ${recorder.isRecording ? 'bg-emerald-400' : 'bg-slate-400'}`}
          aria-hidden="true"
        />
        현장 테스트 <span className="text-[10px] text-slate-400">DEV</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="field-test-title"
        onCancel={(event) => {
          event.preventDefault()
          closePanel()
        }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 h-[90dvh] max-h-[900px] w-full max-w-none overflow-hidden rounded-t-3xl border-0 bg-slate-50 p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/40 sm:inset-0 sm:m-auto sm:h-[86dvh] sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex h-full flex-col">
          <header className="shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-blue-600">
                  HYBUS · DEVELOPMENT
                </p>
                <h2
                  id="field-test-title"
                  className="text-xl font-bold tracking-tight"
                >
                  현장 테스트
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  위치부터 서버 반영까지, 실제 앱의 흐름을 확인해요.
                </p>
              </div>
              <button
                type="button"
                className={`${buttonClass} shrink-0`}
                aria-label="현장 테스트 닫기"
                onClick={closePanel}
              >
                닫기
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs">
              <span className="font-semibold">
                {isLocal ? '로컬 프론트엔드' : '개발 Preview'}
              </span>
              <span
                className={
                  recorder.isRecording
                    ? 'font-semibold text-emerald-700'
                    : 'text-slate-500'
                }
              >
                {recorder.isRecording
                  ? `기록 중 · ${recorder.record?.entries.length ?? 0}건`
                  : '기록 멈춤'}
              </span>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <label
                htmlFor="field-standing-location"
                className="text-sm font-bold text-slate-900"
              >
                지금 실제로 서 있는 위치
              </label>
              <select
                id="field-standing-location"
                className="mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm text-slate-900 focus:outline-blue-600"
                value={standingLocation}
                onChange={(event) =>
                  setStandingLocation(
                    event.target.value as FieldStandingLocation,
                  )
                }
              >
                {Object.entries(fieldStandingLocations).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <p className="mb-0 mt-2 text-xs leading-5 text-slate-600">
                기록용 표식이에요. 앱의 선택 정류장이나 GPS 판정은 바뀌지
                않아요.
              </p>
            </section>

            {isLocal && (
              <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                로컬에서는 같은 주소의 API를 사용해요. API가 연결되지 않았다면
                전송 오류가 표시돼요. 현장 서버 연동은 개발 Preview 배포 후
                확인해주세요.
              </p>
            )}
            {blockReason !== null && (
              <p
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                role="status"
              >
                {blockReason}
              </p>
            )}

            <FieldTestStages
              context={props}
              snapshot={snapshot}
              observations={recorder}
              nextRequestAt={props.nextRequestAt()}
              now={now}
              onRetry={props.onRetry}
            />
            <FieldTestControls
              recorder={recorder}
              isLocal={isLocal}
              onClear={clearRecord}
            />
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                className={`${buttonClass} border-blue-700 !bg-blue-700 !text-white hover:!bg-blue-800`}
                disabled={
                  recorder.isRecording ||
                  standingLocation === 'unset' ||
                  !props.isSummaryVisible ||
                  props.selectedStopId === null ||
                  recorder.storageStatus === 'invalid'
                }
                onClick={startTest}
              >
                {recorder.isRecording
                  ? '테스트 기록 중'
                  : hasData
                    ? '기록 이어서 시작'
                    : '테스트 시작'}
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={!recorder.isRecording && !props.isParticipating}
                onClick={stopTest}
              >
                중지
              </button>
            </div>
            <p className="mb-0 mt-2 text-center text-[11px] leading-4 text-slate-500">
              {recorder.isRecording
                ? '패널을 닫아도 기록돼요. 화면을 켜둔 채 측정해주세요.'
                : '실제 위치와 앱의 셔틀 정류장을 선택한 뒤 시작해주세요.'}
            </p>
          </footer>
        </div>
      </dialog>
    </div>,
    document.body,
  )
}

export default FieldTestPanel
