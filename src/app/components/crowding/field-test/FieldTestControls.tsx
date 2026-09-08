import React from 'react'

import { CROWDING_PRESENCE_ENDPOINT } from '../../../network/crowding'
import {
  type FieldStandingLocation,
  fieldStandingLocations,
  formatFieldTestTime as timeText,
} from './fieldTestModel'
import { FIELD_TEST_MAX_ENTRIES } from './fieldTestRecording'
import type { FieldTestRecorder } from './useFieldTestRecording'

export const fieldTestButtonClass =
  'min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40'

type FieldTestControlsProps = {
  recorder: FieldTestRecorder
  isLocal: boolean
  onClear: () => void
}

const FieldTestControls = ({
  recorder,
  isLocal,
  onClear,
}: FieldTestControlsProps) => {
  const buttonClass = fieldTestButtonClass
  const { hasData, exportStatus } = recorder
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-bold">테스트 기록</h3>
        <span className="text-xs text-slate-500">
          {recorder.record?.entries.length ?? 0} / {FIELD_TEST_MAX_ENTRIES}건
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        {recorder.storageStatus === 'saved'
          ? '이 기기에 저장됨 · 새로고침 후에도 기록이 남아요.'
          : recorder.storageStatus === 'unavailable'
            ? '기기 저장 실패 · 창을 닫기 전에 JSON을 내보내주세요.'
            : recorder.storageStatus === 'invalid'
              ? '기존 기록을 읽지 못했어요. 기록을 비운 뒤 다시 시작해주세요.'
              : '테스트 시작 후 시각별 기록이 여기에 쌓여요.'}
      </p>
      <p className="text-xs leading-5 text-slate-500">
        정확한 좌표와 쿠키는 기록에 포함하지 않아요. 판정·거리·출발편·서버
        응답을 저장하며, 서버에는 이 진단 기록을 올리지 않아요.
      </p>
      {recorder.limitMessage !== null && (
        <p
          className="rounded-lg bg-amber-50 p-2 text-xs leading-5 text-amber-900"
          role="alert"
        >
          {recorder.limitMessage}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={!hasData}
          onClick={recorder.exportRecord}
        >
          JSON 내보내기
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!hasData && recorder.storageStatus !== 'invalid'}
          onClick={onClear}
        >
          기록 비우기
        </button>
      </div>
      {exportStatus !== null && (
        <p className="mb-0 mt-2 text-xs leading-5 text-slate-600" role="status">
          {exportStatus}
        </p>
      )}
      {hasData && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer py-2 font-semibold text-slate-600">
            최근 기록 8개
          </summary>
          <ol className="m-0 list-none space-y-2 p-0">
            {recorder
              .record!.entries.slice(-8)
              .reverse()
              .map((entry, index) => (
                <li
                  key={`${entry.at}-${index}`}
                  className="rounded-lg bg-slate-50 p-2"
                >
                  <span className="font-semibold">{timeText(entry.at)}</span> ·{' '}
                  {fieldStandingLocations[
                    entry.standingLocation as FieldStandingLocation
                  ] ?? entry.standingLocation}{' '}
                  ·{' '}
                  {
                    {
                      start: '시작',
                      stop: '중지',
                      state: '측정·판정',
                      network: '서버 요청',
                      location: '실제 위치 변경',
                    }[entry.kind]
                  }
                </li>
              ))}
          </ol>
        </details>
      )}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer py-2 font-semibold text-slate-600">
          연결 주소
        </summary>
        <code className="block break-all rounded-lg bg-slate-100 p-2 text-[11px]">
          {CROWDING_PRESENCE_ENDPOINT}
        </code>
        <p className="mb-0 mt-2 leading-5 text-slate-500">
          {isLocal
            ? '로컬 API 연결 상태는 실제 응답으로 확인해요.'
            : '개발 Preview의 기존 Pages 프록시를 사용해요.'}
        </p>
      </details>
    </section>
  )
}

export default FieldTestControls
