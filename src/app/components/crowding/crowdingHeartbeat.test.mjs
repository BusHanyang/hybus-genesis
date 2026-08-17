import assert from 'node:assert/strict'
import test from 'node:test'

import { createSerialHeartbeat } from './crowdingHeartbeat.ts'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

test('heartbeats remain serial and wait the configured interval', async () => {
  const requests = []
  const scheduled = []
  let concurrent = 0
  let maxConcurrent = 0
  const controller = createSerialHeartbeat({
    getRetryDelay: () => null,
    intervalMilliseconds: 20_000,
    request: async () => {
      concurrent += 1
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      const request = deferred()
      requests.push(request)
      try {
        return await request.promise
      } finally {
        concurrent -= 1
      }
    },
    scheduleTimer: (callback, delayMilliseconds) => {
      scheduled.push({ callback, delayMilliseconds })
      return scheduled.length
    },
  })

  controller.start()
  controller.start()
  assert.equal(requests.length, 1)
  assert.equal(maxConcurrent, 1)

  requests[0].resolve('ok')
  await flushPromises()
  assert.equal(scheduled[0].delayMilliseconds, 20_000)
  assert.equal(requests.length, 1)

  scheduled[0].callback()
  assert.equal(requests.length, 2)
  assert.equal(maxConcurrent, 1)
  controller.stop()
})

test('stop aborts an active request and prevents retries', async () => {
  const request = deferred()
  const scheduled = []
  let requestSignal
  const controller = createSerialHeartbeat({
    cancelTimer: () => undefined,
    getRetryDelay: () => 20_000,
    intervalMilliseconds: 20_000,
    request: async (signal) => {
      requestSignal = signal
      return await request.promise
    },
    scheduleTimer: (callback, delayMilliseconds) => {
      scheduled.push({ callback, delayMilliseconds })
      return scheduled.length
    },
  })

  controller.start()
  controller.stop()
  assert.equal(requestSignal.aborted, true)

  request.reject(new Error('aborted'))
  await flushPromises()
  assert.equal(scheduled.length, 0)
})

test('retry delay is selected from the request error', async () => {
  const scheduled = []
  const controller = createSerialHeartbeat({
    getRetryDelay: (error) => error.retryAfterMilliseconds,
    intervalMilliseconds: 20_000,
    request: async () => {
      throw { retryAfterMilliseconds: 35_000 }
    },
    scheduleTimer: (callback, delayMilliseconds) => {
      scheduled.push({ callback, delayMilliseconds })
      return scheduled.length
    },
  })

  controller.start()
  await flushPromises()
  assert.equal(scheduled[0].delayMilliseconds, 35_000)
  controller.stop()
})
