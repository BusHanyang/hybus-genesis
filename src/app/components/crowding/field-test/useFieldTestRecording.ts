import { useCallback, useEffect, useRef, useState } from 'react'

import { CROWDING_PRESENCE_ENDPOINT } from '../../../network/crowding'
import {
  type CrowdingRequestObservation,
  subscribeCrowdingRequests,
} from '../../../network/crowdingObservation'
import type { FieldStandingLocation, FieldTestSnapshot } from './fieldTestModel'
import {
  appendFieldTestRecord,
  createFieldTestRecording,
  FIELD_TEST_STORAGE_KEY,
  type FieldTestRecordEntry,
  type FieldTestRecording,
  parseFieldTestRecording,
  serializeFieldTestRecording,
} from './fieldTestRecording'

type StorageStatus = 'empty' | 'saved' | 'unavailable' | 'invalid'

const readSavedRecording = (): {
  record: FieldTestRecording | null
  storageStatus: StorageStatus
} => {
  try {
    const raw = localStorage.getItem(FIELD_TEST_STORAGE_KEY)
    const record = parseFieldTestRecording(raw)
    return {
      record,
      storageStatus:
        raw === null ? 'empty' : record === null ? 'invalid' : 'saved',
    }
  } catch {
    return { record: null, storageStatus: 'unavailable' }
  }
}

export const useFieldTestRecording = (
  snapshot: FieldTestSnapshot,
  standingLocation: FieldStandingLocation,
  onLimit: () => void,
) => {
  const [initial] = useState(readSavedRecording)
  const [record, setRecord] = useState(initial.record)
  const [storageStatus, setStorageStatus] = useState(initial.storageStatus)
  const [isRecording, setIsRecording] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const [lastPresence, setLastPresence] =
    useState<CrowdingRequestObservation | null>(null)
  const [lastAccepted, setLastAccepted] =
    useState<CrowdingRequestObservation | null>(null)
  const [lastAggregates, setLastAggregates] =
    useState<CrowdingRequestObservation | null>(null)
  const recordRef = useRef(initial.record)
  const recordingRef = useRef(false)
  const standingRef = useRef(standingLocation)
  const snapshotRef = useRef(snapshot)
  const onLimitRef = useRef(onLimit)
  standingRef.current = standingLocation
  snapshotRef.current = snapshot
  onLimitRef.current = onLimit

  const append = useCallback(
    (kind: FieldTestRecordEntry['kind'], data: Record<string, unknown>) => {
      if (!recordingRef.current) return
      const at = Date.now()
      const current = recordRef.current ?? createFieldTestRecording(at)
      const result = appendFieldTestRecord(current, {
        at,
        kind,
        standingLocation: standingRef.current,
        data,
      })
      if (!result.accepted) {
        recordingRef.current = false
        setIsRecording(false)
        setLimitMessage(
          result.reason === 'invalid-entry'
            ? '기록할 수 없는 값이 있어 테스트를 멈췄어요.'
            : '기록 한도에 도달해 테스트를 멈췄어요. JSON을 저장한 뒤 기록을 비워주세요.',
        )
        onLimitRef.current()
        return
      }
      recordRef.current = result.record
      setRecord(result.record)
      try {
        localStorage.setItem(
          FIELD_TEST_STORAGE_KEY,
          serializeFieldTestRecording(result.record),
        )
        setStorageStatus('saved')
      } catch {
        setStorageStatus('unavailable')
      }
    },
    [],
  )

  useEffect(
    () =>
      subscribeCrowdingRequests((event) => {
        if (event.operation === 'presence') {
          setLastPresence(event)
          if (event.phase === 'succeeded') setLastAccepted(event)
        } else {
          setLastAggregates(event)
        }
        append('network', { ...event })
      }),
    [append],
  )

  // Source state only: ticking the UI clock does not manufacture GPS samples.
  const snapshotKey = JSON.stringify(snapshot)
  useEffect(() => {
    append('state', snapshotRef.current)
  }, [append, snapshotKey])

  useEffect(() => {
    append('location', { snapshot: snapshotRef.current })
  }, [append, standingLocation])

  const start = useCallback(() => {
    setExportStatus(null)
    if (recordingRef.current) return false
    setLimitMessage(null)
    recordingRef.current = true
    setIsRecording(true)
    append('start', snapshotRef.current)
    return recordingRef.current
  }, [append])

  const stop = useCallback(() => {
    append('stop', snapshotRef.current)
    recordingRef.current = false
    setIsRecording(false)
  }, [append])

  const clear = useCallback(() => {
    setExportStatus(null)
    recordingRef.current = false
    setIsRecording(false)
    setLimitMessage(null)
    try {
      localStorage.removeItem(FIELD_TEST_STORAGE_KEY)
      recordRef.current = null
      setRecord(null)
      setStorageStatus('empty')
    } catch {
      setStorageStatus('unavailable')
    }
  }, [])

  const exportRecord = useCallback(() => {
    if (record === null) return
    let url: string | null = null
    try {
      const content = JSON.stringify(
        {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          pageOrigin: window.location.origin,
          presenceEndpoint: CROWDING_PRESENCE_ENDPOINT,
          recording: record,
        },
        null,
        2,
      )
      url = URL.createObjectURL(
        new Blob([content], { type: 'application/json;charset=utf-8' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `hybus-field-test-${new Date(record.startedAt).toISOString().replaceAll(':', '-')}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      const downloadUrl = url
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000)
      setExportStatus(
        'JSON 내보내기를 요청했어요. 브라우저의 다운로드 파일을 확인해주세요.',
      )
    } catch {
      if (url !== null) URL.revokeObjectURL(url)
      setExportStatus(
        '파일을 만들지 못했어요. 기록을 비우지 말고 다시 시도해주세요.',
      )
    }
  }, [record])

  return {
    record,
    hasData: record !== null && record.entries.length > 0,
    exportStatus,
    exportRecord,
    storageStatus,
    isRecording,
    limitMessage,
    lastPresence,
    lastAccepted,
    lastAggregates,
    start,
    stop,
    clear,
  }
}

export type FieldTestRecorder = ReturnType<typeof useFieldTestRecording>
