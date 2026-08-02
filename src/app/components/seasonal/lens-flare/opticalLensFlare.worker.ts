import {
  OpticalLensFlareRenderer,
  serializeLensFlareError,
  toAbsoluteLensFlareTime,
} from './opticalLensFlareRenderer'
import type {
  LensFlareFrameSnapshot,
  LensFlareWorkerRequest,
  LensFlareWorkerResponse,
} from './opticalLensFlareTypes'

const DIAGNOSTIC_INTERVAL = 250

type LensFlareWorkerScope = Readonly<{
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<LensFlareWorkerRequest>) => void,
  ) => void
  cancelAnimationFrame: (frameId: number) => void
  postMessage: (message: LensFlareWorkerResponse) => void
  requestAnimationFrame: (callback: FrameRequestCallback) => number
}>

const workerScope = self as unknown as LensFlareWorkerScope

let renderer: OpticalLensFlareRenderer | null = null
let canvas: OffscreenCanvas | null = null
let frameId: number | null = null
let hidden = false
let reducedMotion = false
let contextLost = false
let lastDiagnosticTime = Number.NEGATIVE_INFINITY

const postMessage = (message: LensFlareWorkerResponse): void => {
  workerScope.postMessage(message)
}

const postStatus = (
  status: Extract<LensFlareWorkerResponse, { type: 'status' }>['status'],
): void => {
  postMessage({ type: 'status', status })
}

const postFatal = (error: unknown): void => {
  postMessage({
    type: 'fatal',
    error: serializeLensFlareError(error),
  })
}

const cancelFrame = (): void => {
  if (frameId === null) return

  workerScope.cancelAnimationFrame(frameId)
  frameId = null
}

const postDiagnostics = (
  snapshot: LensFlareFrameSnapshot,
  timestamp: number,
  force = false,
): void => {
  if (!force && timestamp - lastDiagnosticTime < DIAGNOSTIC_INTERVAL) return

  lastDiagnosticTime = timestamp
  postMessage({ type: 'frame', snapshot })
}

const draw = (timestamp: number): void => {
  frameId = null
  if (!renderer || hidden || contextLost) return

  try {
    const absoluteTimestamp = toAbsoluteLensFlareTime(timestamp)
    const snapshot = renderer.draw(absoluteTimestamp, reducedMotion)
    const animated = renderer.isAnimated(reducedMotion)

    if (snapshot) postDiagnostics(snapshot, absoluteTimestamp, !animated)
    if (animated) requestFrame()
  } catch (error) {
    postFatal(error)
  }
}

const requestFrame = (): void => {
  if (!renderer || hidden || contextLost || frameId !== null) return

  frameId = workerScope.requestAnimationFrame(draw)
}

const handleContextLost = (event: Event): void => {
  event.preventDefault()
  contextLost = true
  cancelFrame()
  postStatus('lost')
}

const handleContextRestored = (): void => {
  if (!renderer) return

  postStatus('restored')

  try {
    renderer.restore()
    renderer.resetLastFrameTime(toAbsoluteLensFlareTime(performance.now()))
    contextLost = false
    postStatus('destroyed')
    postStatus('ready')
    requestFrame()
  } catch (error) {
    postFatal(error)
  }
}

const destroyRenderer = (): void => {
  cancelFrame()

  if (canvas) {
    canvas.removeEventListener('webglcontextlost', handleContextLost)
    canvas.removeEventListener('webglcontextrestored', handleContextRestored)
  }

  renderer?.destroy()
  renderer = null
  canvas = null
  contextLost = false
}

const handleProbe = (
  message: Extract<LensFlareWorkerRequest, { type: 'probe' }>,
): void => {
  if (
    typeof OffscreenCanvas !== 'function' ||
    typeof workerScope.requestAnimationFrame !== 'function' ||
    typeof workerScope.cancelAnimationFrame !== 'function'
  ) {
    postMessage({ type: 'probe-result', supported: false })
    return
  }

  let probeRenderer: OpticalLensFlareRenderer | null = null

  try {
    const probeCanvas = new OffscreenCanvas(1, 1)
    probeRenderer = new OpticalLensFlareRenderer(
      probeCanvas,
      message.options,
      message.timeline,
    )
    probeRenderer.resize({ height: 1, width: 1 })
    probeRenderer.draw(
      toAbsoluteLensFlareTime(performance.now()),
      message.reducedMotion,
    )
    probeRenderer.destroy(true)
    probeRenderer = null
    postMessage({ type: 'probe-result', supported: true })
  } catch {
    probeRenderer?.destroy(true)
    postMessage({ type: 'probe-result', supported: false })
  }
}

const handleInit = (
  message: Extract<LensFlareWorkerRequest, { type: 'init' }>,
): void => {
  destroyRenderer()

  try {
    canvas = message.canvas
    hidden = message.hidden
    reducedMotion = message.reducedMotion
    renderer = new OpticalLensFlareRenderer(
      canvas,
      message.options,
      message.timeline,
    )
    renderer.updatePointer(message.pointer)
    renderer.resize(message.size)
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    postStatus('ready')
    requestFrame()
  } catch (error) {
    postFatal(error)
  }
}

workerScope.addEventListener('message', (event) => {
  const message = event.data

  switch (message.type) {
    case 'probe':
      handleProbe(message)
      break
    case 'init':
      handleInit(message)
      break
    case 'options':
      reducedMotion = message.reducedMotion
      renderer?.updateOptions(message.options)
      requestFrame()
      break
    case 'pointer':
      renderer?.updatePointer(message.point)
      requestFrame()
      break
    case 'resize':
      renderer?.resize(message.size)
      requestFrame()
      break
    case 'visibility':
      hidden = message.hidden
      if (hidden) {
        cancelFrame()
      } else {
        renderer?.resetLastFrameTime(toAbsoluteLensFlareTime(performance.now()))
        requestFrame()
      }
      break
    case 'render':
      requestFrame()
      break
    case 'destroy':
      destroyRenderer()
      break
  }
})
