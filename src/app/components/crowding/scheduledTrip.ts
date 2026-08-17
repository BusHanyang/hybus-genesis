import type { CrowdingStopId } from '../../data/crowding/stopGeometry'

export const scheduledRouteTypes = [
  'C',
  'DH',
  'DY',
  'DHJ',
  'R',
  'NA',
  'UNSPECIFIED',
] as const

export type ScheduledRouteType = (typeof scheduledRouteTypes)[number]

export type ScheduledTripDescriptor = {
  departureTime: string
  ordinal: number
  routeType: ScheduledRouteType
  stopId: CrowdingStopId
}

type TimetableRow = {
  time: string
  type: string
}

const DEPARTURE_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const KOREA_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1_000
const MAX_TRIP_ORDINAL = 500
const routeTypeSet: ReadonlySet<string> = new Set(scheduledRouteTypes)

export const normalizeScheduledRouteType = (
  routeType: string,
): ScheduledRouteType | null => {
  const normalized = routeType.trim().toUpperCase()

  if (normalized.length === 0) return 'UNSPECIFIED'

  return routeTypeSet.has(normalized)
    ? (normalized as ScheduledRouteType)
    : null
}

export const createScheduledTripDescriptor = (
  timetable: ReadonlyArray<TimetableRow>,
  targetIndex: number,
  stopId: CrowdingStopId,
): ScheduledTripDescriptor | null => {
  if (
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex >= timetable.length
  ) {
    return null
  }

  const target = timetable[targetIndex]
  if (target === undefined || !DEPARTURE_TIME_PATTERN.test(target.time)) {
    return null
  }

  const routeType = normalizeScheduledRouteType(target.type)
  if (routeType === null) return null

  let ordinal = 0

  for (let index = 0; index <= targetIndex; index += 1) {
    const row = timetable[index]
    if (
      row?.time === target.time &&
      normalizeScheduledRouteType(row.type) === routeType
    ) {
      ordinal += 1
    }
  }

  if (ordinal < 1 || ordinal > MAX_TRIP_ORDINAL) return null

  return {
    departureTime: target.time,
    ordinal,
    routeType,
    stopId,
  }
}

export const getScheduledTripDescriptorKey = (
  descriptor: ScheduledTripDescriptor,
): string =>
  `${descriptor.stopId}|${descriptor.departureTime}|${descriptor.routeType}|${descriptor.ordinal}`

export const getKoreaServiceDateForMinute = (
  observedAtMinute: number,
): string | null => {
  if (!Number.isSafeInteger(observedAtMinute) || observedAtMinute < 0) {
    return null
  }

  const observedAt = new Date(
    observedAtMinute * 60_000 + KOREA_OFFSET_MILLISECONDS,
  )
  if (Number.isNaN(observedAt.getTime())) return null

  return observedAt.toISOString().slice(0, 10)
}

export const createScheduledTripId = (
  descriptor: ScheduledTripDescriptor,
  observedAtMinute: number,
): string | null => {
  const serviceDate = getKoreaServiceDateForMinute(observedAtMinute)
  if (serviceDate === null) return null

  return `${serviceDate}|${getScheduledTripDescriptorKey(descriptor)}`
}
