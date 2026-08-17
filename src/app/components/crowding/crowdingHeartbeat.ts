type TimerHandle = unknown

export type SerialHeartbeatOptions<Result> = {
  cancelTimer?: (handle: TimerHandle) => void
  getRetryDelay: (error: unknown) => number | null
  intervalMilliseconds: number
  onError?: (error: unknown) => void
  onSending?: () => void
  onSuccess?: (result: Result) => void
  request: (signal: AbortSignal) => Promise<Result>
  requestTimeoutMilliseconds?: number
  scheduleTimer?: (
    callback: () => void,
    delayMilliseconds: number,
  ) => TimerHandle
}

export class HeartbeatRequestTimeoutError extends Error {
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
  onError,
  onSending,
  onSuccess,
  request,
  requestTimeoutMilliseconds,
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

    isRunning = true
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
      if (isStopped) return

      onSuccess?.(result)
      nextDelay = intervalMilliseconds
    } catch (error) {
      if (isStopped) return

      onError?.(error)
      nextDelay = getRetryDelay(error)
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
