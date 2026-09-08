import type { CrowdingStopId } from '../data/crowding/stopGeometry'
import type {
  CrowdingAggregatesResponse,
  CrowdingPresenceRequest,
  CrowdingPresenceResponse,
} from './crowding'

type CrowdingRequestContext = {
  endpoint: string
  requestId: string
  scheduledTripIds: ReadonlyArray<string>
  startedAt: number
  stopId: CrowdingStopId
}

type CrowdingRequestResult = {
  error: string | null
  observedAt: number
  retryAfterMilliseconds: number | null
  status: number | null
}

type CrowdingRequestOperation =
  | { operation: 'presence'; presenceRequest: CrowdingPresenceRequest }
  | { operation: 'aggregates'; presenceRequest?: never }

export type CrowdingRequestObservation = CrowdingRequestContext &
  CrowdingRequestResult &
  (
    | (CrowdingRequestOperation & {
        phase: 'started' | 'failed'
        response?: never
      })
    | {
        operation: 'presence'
        phase: 'succeeded'
        presenceRequest: CrowdingPresenceRequest
        response: CrowdingPresenceResponse
      }
    | {
        operation: 'aggregates'
        phase: 'succeeded'
        presenceRequest?: never
        response: CrowdingAggregatesResponse
      }
  )

type CrowdingRequestListener = (observation: CrowdingRequestObservation) => void
const listeners = new Set<CrowdingRequestListener>()
let nextRequestId = 0

export const subscribeCrowdingRequests = (
  listener: CrowdingRequestListener,
): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const publishCrowdingRequest = (
  observation: CrowdingRequestObservation,
): void => {
  for (const listener of [...listeners]) {
    try {
      // Each listener receives its own copy, separate from the caller's data.
      listener(structuredClone(observation))
    } catch {
      // Diagnostic subscribers must never affect requests or other subscribers.
    }
  }
}

export const startCrowdingRequest = <
  Operation extends CrowdingRequestOperation,
>(
  request: Omit<CrowdingRequestContext, 'requestId' | 'startedAt'> & Operation,
) => {
  const startedAt = Date.now()
  const context = {
    ...request,
    requestId: `${startedAt}-${++nextRequestId}`,
    startedAt,
  }
  publishCrowdingRequest({
    ...context,
    error: null,
    observedAt: startedAt,
    phase: 'started',
    retryAfterMilliseconds: null,
    status: null,
  })
  return context
}
