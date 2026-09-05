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

const createClock = (initialTime) => {
  let now = initialTime
  const timers = new Set()
  return {
    options: {
      now: () => now,
      cancelTimer: (timer) => timers.delete(timer),
      scheduleTimer: (callback, delay) => {
        const timer = { at: now + delay, callback }
        timers.add(timer)
        return timer
      },
    },
    advanceTo: async (target) => {
      for (;;) {
        const timer = [...timers].sort((a, b) => a.at - b.at)[0]
        if (!timer || timer.at > target) break
        now = timer.at
        timers.delete(timer)
        timer.callback()
        await flushPromises()
      }
      now = target
    },
  }
}

test('a new observation-minute controller preserves the server retry deadline', async () => {
  const clock = createClock(55_000)
  const scheduleState = { nextRequestAt: 0 }
  const sentAt = []
  const options = {
    ...clock.options,
    scheduleState,
    intervalMilliseconds: 20_000,
    getRetryDelay: (error) => error.retryAfterMilliseconds,
    request: async () => {
      sentAt.push(clock.options.now())
      throw { retryAfterMilliseconds: 120_000 }
    },
  }
  const previousMinute = createSerialHeartbeat(options)
  previousMinute.start()
  await flushPromises()

  await clock.advanceTo(60_000)
  previousMinute.stop()
  const nextMinute = createSerialHeartbeat(options)
  nextMinute.start()
  await flushPromises()
  assert.deepEqual(sentAt, [55_000])
  await clock.advanceTo(174_999)
  assert.deepEqual(sentAt, [55_000])
  await clock.advanceTo(175_000)
  assert.deepEqual(sentAt, [55_000, 175_000])
  nextMinute.stop()
})

test('pause and resume preserve the interval reserved by an in-flight request', async () => {
  const clock = createClock(55_000)
  const scheduleState = { nextRequestAt: 0 }
  const pending = deferred()
  let signal
  const sentAt = []
  const options = {
    ...clock.options,
    scheduleState,
    intervalMilliseconds: 20_000,
    getRetryDelay: () => 20_000,
    request: async (requestSignal) => {
      signal = requestSignal
      sentAt.push(clock.options.now())
      if (sentAt.length === 1) return await pending.promise
    },
  }
  const initial = createSerialHeartbeat(options)
  initial.start()
  await clock.advanceTo(60_000)
  initial.stop()
  assert.equal(signal.aborted, true)
  pending.reject(new DOMException('Stopped', 'AbortError'))
  await flushPromises()

  const resumed = createSerialHeartbeat(options)
  resumed.start()
  assert.deepEqual(sentAt, [55_000])
  await clock.advanceTo(74_999)
  assert.deepEqual(sentAt, [55_000])
  await clock.advanceTo(75_000)
  assert.deepEqual(sentAt, [55_000, 75_000])
  resumed.stop()
})

test('a received rate limit settling after stop extends a replacement timer', async () => {
  const clock = createClock(55_000)
  const scheduleState = { nextRequestAt: 0 }
  const pending = deferred()
  const sentAt = []
  let oldErrorCallbacks = 0
  const options = {
    ...clock.options,
    scheduleState,
    intervalMilliseconds: 20_000,
    getRetryDelay: (error) => error.retryAfterMilliseconds,
    request: async () => {
      sentAt.push(clock.options.now())
      if (sentAt.length === 1) return await pending.promise
    },
  }
  const initial = createSerialHeartbeat({
    ...options,
    onError: () => oldErrorCallbacks++,
  })
  initial.start()
  await clock.advanceTo(60_000)
  initial.stop()
  const replacement = createSerialHeartbeat(options)
  replacement.start()
  pending.reject({ retryAfterMilliseconds: 120_000 })
  await flushPromises()
  assert.equal(oldErrorCallbacks, 0)
  await clock.advanceTo(179_999)
  assert.deepEqual(sentAt, [55_000])
  await clock.advanceTo(180_000)
  assert.deepEqual(sentAt, [55_000, 180_000])
  replacement.stop()
})

test('heartbeats remain serial and wait the configured interval', async () => {
  const clock = createClock(0)
  const requests = []
  let concurrent = 0
  let maxConcurrent = 0
  const controller = createSerialHeartbeat({
    ...clock.options,
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
  })

  controller.start()
  controller.start()
  assert.equal(requests.length, 1)
  assert.equal(maxConcurrent, 1)

  requests[0].resolve('ok')
  await flushPromises()
  await clock.advanceTo(19_999)
  assert.equal(requests.length, 1)

  await clock.advanceTo(20_000)
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

test('request timeout aborts a pending heartbeat and enters the retry policy', async () => {
  const request = deferred()
  const scheduled = []
  const errors = []
  let requestSignal
  const controller = createSerialHeartbeat({
    getRetryDelay: () => 20_000,
    intervalMilliseconds: 20_000,
    onError: (error) => errors.push(error),
    request: async (signal) => {
      requestSignal = signal
      return await request.promise
    },
    requestTimeoutMilliseconds: 15_000,
    scheduleTimer: (callback, delayMilliseconds) => {
      scheduled.push({ callback, delayMilliseconds })
      return scheduled.length
    },
  })

  controller.start()
  assert.equal(scheduled[0].delayMilliseconds, 15_000)
  scheduled[0].callback()
  await flushPromises()

  assert.equal(requestSignal.aborted, true)
  assert.equal(errors[0].name, 'HeartbeatRequestTimeoutError')
  assert.equal(scheduled[1].delayMilliseconds, 20_000)
  controller.stop()
})
