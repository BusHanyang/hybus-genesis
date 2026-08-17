import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createScheduledTripDescriptor,
  createScheduledTripId,
  getKoreaServiceDateForMinute,
  normalizeScheduledRouteType,
} from './scheduledTrip.ts'
import { crowdingStopIds } from '../../data/crowding/stopGeometry.ts'

test('duplicate ordinals use the full original timetable order', () => {
  const timetable = [
    { time: '09:00', type: 'C' },
    { time: '09:00', type: 'DH' },
    { time: '09:00', type: 'C' },
    { time: '09:10', type: 'C' },
    { time: '09:00', type: 'C' },
  ]

  assert.deepEqual(
    createScheduledTripDescriptor(timetable, 0, 'shuttlecoke_o'),
    {
      departureTime: '09:00',
      ordinal: 1,
      routeType: 'C',
      stopId: 'shuttlecoke_o',
    },
  )
  assert.equal(
    createScheduledTripDescriptor(timetable, 2, 'shuttlecoke_o')?.ordinal,
    2,
  )
  assert.equal(
    createScheduledTripDescriptor(timetable, 4, 'shuttlecoke_o')?.ordinal,
    3,
  )
})

test('same-time rows of different normalized route types have separate ordinals', () => {
  const timetable = [
    { time: '10:30', type: '' },
    { time: '10:30', type: 'DH' },
    { time: '10:30', type: '   ' },
    { time: '10:30', type: ' dh ' },
  ]

  assert.equal(
    createScheduledTripDescriptor(timetable, 2, 'shuttlecoke_i')?.ordinal,
    2,
  )
  assert.equal(
    createScheduledTripDescriptor(timetable, 3, 'shuttlecoke_i')?.ordinal,
    2,
  )
})

test('route values normalize to the backend allowlist', () => {
  assert.equal(normalizeScheduledRouteType(' dhj '), 'DHJ')
  assert.equal(normalizeScheduledRouteType(''), 'UNSPECIFIED')
  assert.equal(normalizeScheduledRouteType('legacy'), null)
})

test('Korea service dates come from the observed minute around UTC midnight', () => {
  const beforeKoreaMidnight = Math.floor(
    Date.parse('2026-08-14T14:59:00.000Z') / 60_000,
  )
  const afterKoreaMidnight = Math.floor(
    Date.parse('2026-08-14T15:00:00.000Z') / 60_000,
  )

  assert.equal(getKoreaServiceDateForMinute(beforeKoreaMidnight), '2026-08-14')
  assert.equal(getKoreaServiceDateForMinute(afterKoreaMidnight), '2026-08-15')
})

test('scheduledTripId combines the observed Korea date and descriptor', () => {
  const observedAtMinute = Math.floor(
    Date.parse('2026-08-14T15:00:00.000Z') / 60_000,
  )
  const descriptor = createScheduledTripDescriptor(
    [
      { time: '23:50', type: 'R' },
      { time: '23:50', type: 'R' },
    ],
    1,
    'shuttlecoke_i',
  )

  assert.ok(descriptor)
  assert.equal(
    createScheduledTripId(descriptor, observedAtMinute),
    '2026-08-15|shuttlecoke_i|23:50|R|2',
  )
})

test('all six shuttle stops produce stop-matched scheduledTripIds', () => {
  const observedAtMinute = Math.floor(
    Date.parse('2026-08-15T01:00:00.000Z') / 60_000,
  )

  for (const stopId of crowdingStopIds) {
    const descriptor = createScheduledTripDescriptor(
      [{ time: '10:30', type: 'DH' }],
      0,
      stopId,
    )

    assert.ok(descriptor)
    assert.equal(
      createScheduledTripId(descriptor, observedAtMinute),
      `2026-08-15|${stopId}|10:30|DH|1`,
    )
  }
})

test('invalid target rows and ordinals are rejected', () => {
  assert.equal(
    createScheduledTripDescriptor(
      [{ time: '9:00', type: 'C' }],
      0,
      'shuttlecoke_o',
    ),
    null,
  )
  assert.equal(
    createScheduledTripDescriptor(
      [{ time: '09:00', type: 'legacy' }],
      0,
      'shuttlecoke_o',
    ),
    null,
  )

  const tooManyDuplicates = Array.from({ length: 501 }, () => ({
    time: '09:00',
    type: 'C',
  }))
  assert.equal(
    createScheduledTripDescriptor(tooManyDuplicates, 500, 'shuttlecoke_o'),
    null,
  )
})
