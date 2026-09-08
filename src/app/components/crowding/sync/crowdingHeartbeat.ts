type TimerHandle = unknown

export type SerialHeartbeatSchedule = {
  nextRequestAt: number
}

export type SerialHeartbeatOptions<Result> = {
  cancelTimer?: (handle: TimerHandle) => void
  getRetryDelay: (error: unknown) => number | null
  intervalMilliseconds: number
  now?: () => number
  onError?: (error: unknown) => void
  onSending?: () => void
  onSuccess?: (result: Result) => void
  request: (signal: AbortSignal) => Promise<Result>
  requestTimeoutMilliseconds?: number
  scheduleState?: SerialHeartbeatSchedule
  scheduleTimer?: (
    callback: () => void,
    delayMilliseconds: number,
  ) => TimerHandle
}

class HeartbeatRequestTimeoutError extends Error {
  constructor() {
    super('heartbeat_request_timeout')
    this.name = 'HeartbeatRequestTimeoutError'
  }
}

export type SerialHeartbeatController = {
  start: () => void
  stop: () => void
}

const defaultScheduleTimer = (
  callback: () => void,
  delayMilliseconds: number,
): TimerHandle => globalThis.setTimeout(callback, delayMilliseconds)

const defaultCancelTimer = (handle: TimerHandle): void => {
  globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>)
}

export const createSerialHeartbeat = <Result>({
  cancelTimer = defaultCancelTimer,
  getRetryDelay,
  intervalMilliseconds,
  now = Date.now,
  onError,
  onSending,
  onSuccess,
  request,
  requestTimeoutMilliseconds,
  scheduleState = { nextRequestAt: 0 },
  scheduleTimer = defaultScheduleTimer,
}: SerialHeartbeatOptions<Result>): SerialHeartbeatController => {
  let activeRequest: AbortController | null = null
  let isRunning = false
  let isStarted = false
  let isStopped = false
  let requestTimer: TimerHandle | null = null
  let timer: TimerHandle | null = null

  const schedule = (delayMilliseconds: number): void => {
    if (isStopped) return

    timer = scheduleTimer(() => {
      timer = null
      void execute()
    }, delayMilliseconds)
  }

  const execute = async (): Promise<void> => {
    if (isStopped || isRunning) return

    // A replacement controller or a late response can extend this deadline.
    const remainingDelay = scheduleState.nextRequestAt - now()
    if (remainingDelay > 0) {
      schedule(remainingDelay)
      return
    }

    isRunning = true
    scheduleState.nextRequestAt = now() + intervalMilliseconds
    activeRequest = new AbortController()
    onSending?.()
    let nextDelay: number | null = null

    try {
      const requestPromise = request(activeRequest.signal)
      const result =
        requestTimeoutMilliseconds === undefined
          ? await requestPromise
          : await Promise.race([
              requestPromise,
              new Promise<never>((_, reject) => {
                requestTimer = scheduleTimer(() => {
                  requestTimer = null
                  reject(new HeartbeatRequestTimeoutError())
                  activeRequest?.abort()
                }, requestTimeoutMilliseconds)
              }),
            ])
      nextDelay = intervalMilliseconds
      scheduleState.nextRequestAt = Math.max(
        scheduleState.nextRequestAt,
        now() + nextDelay,
      )
      if (isStopped) return

      onSuccess?.(result)
    } catch (error) {
      const isStoppedAbort =
        isStopped &&
        error instanceof DOMException &&
        error.name === 'AbortError'
      if (isStoppedAbort) return

      nextDelay = getRetryDelay(error)
      if (nextDelay !== null) {
        scheduleState.nextRequestAt = Math.max(
          scheduleState.nextRequestAt,
          now() + nextDelay,
        )
      }
      if (isStopped) return

      onError?.(error)
    } finally {
      if (requestTimer !== null) {
        cancelTimer(requestTimer)
        requestTimer = null
      }
      activeRequest = null
      isRunning = false
    }

    if (nextDelay !== null) schedule(nextDelay)
  }

  return {
    start: () => {
      if (isStarted || isStopped) return
      isStarted = true
      void execute()
    },
    stop: () => {
      if (isStopped) return
      isStopped = true
      if (timer !== null) {
        cancelTimer(timer)
        timer = null
      }
      if (requestTimer !== null) {
        cancelTimer(requestTimer)
        requestTimer = null
      }
      activeRequest?.abort()
    },
  }
}
