import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyNativeGeolocationInvalidReason } from './nativeGeolocationUsability.ts'

test('classifies stable native-control blockers as permanent', () => {
  for (const reason of [
    'intersection_occluded_or_distorted',
    'intersection_out_of_viewport_or_clipped',
    'style_invalid',
  ]) {
    assert.equal(classifyNativeGeolocationInvalidReason(reason), 'permanent')
  }
})

test('keeps attach, layout, and attribute invalidation recoverable', () => {
  for (const reason of [
    'recently_attached',
    'intersection_changed',
    'attribute_changed',
    '',
    'future_browser_reason',
  ]) {
    assert.equal(classifyNativeGeolocationInvalidReason(reason), 'transient')
  }
})
