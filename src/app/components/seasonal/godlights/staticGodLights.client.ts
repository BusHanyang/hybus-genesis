import type { SceneConfig } from 'godlights'

type RenderRequestMessage = Readonly<{
  type: 'render'
  id: number
  scene: SceneConfig
}>

type RenderSuccessMessage = Readonly<{
  type: 'rendered'
  id: number
  bitmap: ImageBitmap
}>

type RenderErrorMessage = Readonly<{
  type: 'error'
  id: number
  message: string
}>

type RenderResponseMessage = RenderSuccessMessage | RenderErrorMessage

type PendingRender = Readonly<{
  resolve: (bitmap: ImageBitmap) => void
  reject: (error: Error) => void
}>

export type StaticGodLightsRender = Readonly<{
  bitmap: Promise<ImageBitmap>
  cancel: () => void
}>

let nextRequestId = 1
let renderWorker: Worker | null = null
let workerUnavailable = false
const pendingRenders = new Map<number, PendingRender>()

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

const releaseIdleWorker = () => {
  if (pendingRenders.size > 0 || !renderWorker) return

  renderWorker.terminate()
  renderWorker = null
}

const disableWorker = (error: Error) => {
  workerUnavailable = true
  renderWorker?.terminate()
  renderWorker = null

  pendingRenders.forEach(({ reject }) => reject(error))
  pendingRenders.clear()
}

const handleWorkerMessage = (event: MessageEvent<RenderResponseMessage>) => {
  const response = event.data
  const pendingRender = pendingRenders.get(response.id)

  if (!pendingRender) {
    if (response.type === 'rendered') response.bitmap.close()
    return
  }

  pendingRenders.delete(response.id)

  if (response.type === 'rendered') {
    pendingRender.resolve(response.bitmap)
    releaseIdleWorker()
    return
  }

  const error = new Error(response.message)
  pendingRender.reject(error)
  disableWorker(error)
}

const createRenderWorker = (): Worker | null => {
  if (workerUnavailable) return null

  try {
    const worker = new Worker(
      new URL('./staticGodLights.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.addEventListener('message', handleWorkerMessage)
    worker.addEventListener('error', (event) => {
      disableWorker(new Error(event.message || 'GodLights worker failed'))
    })
    worker.addEventListener('messageerror', () => {
      disableWorker(new Error('GodLights worker returned an invalid message'))
    })

    return worker
  } catch (error) {
    disableWorker(toError(error))
    return null
  }
}

export const supportsStaticGodLightsWorker = (): boolean =>
  !workerUnavailable &&
  typeof window !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  typeof ImageBitmap !== 'undefined'

export const renderStaticGodLights = (
  scene: SceneConfig,
): StaticGodLightsRender | null => {
  if (!supportsStaticGodLightsWorker()) return null

  const worker = renderWorker ?? createRenderWorker()
  if (!worker) return null

  renderWorker = worker
  const id = nextRequestId++
  let rejectRender: (error: Error) => void = () => undefined
  const bitmap = new Promise<ImageBitmap>((resolve, reject) => {
    rejectRender = reject
    pendingRenders.set(id, { resolve, reject })
  })

  try {
    worker.postMessage({
      type: 'render',
      id,
      scene,
    } satisfies RenderRequestMessage)
  } catch (error) {
    const renderError = toError(error)
    pendingRenders.delete(id)
    rejectRender(renderError)
    disableWorker(renderError)
  }

  return {
    bitmap,
    cancel: () => {
      const pendingRender = pendingRenders.get(id)
      if (!pendingRender) return

      pendingRenders.delete(id)
      pendingRender.reject(new Error('GodLights worker render cancelled'))
      releaseIdleWorker()
    },
  }
}
