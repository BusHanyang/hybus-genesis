import { drawScene, type SceneConfig } from 'godlights'

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

type WorkerScope = Readonly<{
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<RenderRequestMessage>) => void,
  ) => void
  postMessage: (
    message: RenderSuccessMessage | RenderErrorMessage,
    transfer?: Transferable[],
  ) => void
}>

const workerScope = self as unknown as WorkerScope

const supportsRequiredCanvasFeatures = (): boolean => {
  if (typeof OffscreenCanvas === 'undefined') return false

  try {
    const probeCanvas = new OffscreenCanvas(2, 2)
    const context = probeCanvas.getContext('2d')
    if (!context || !('filter' in context)) return false

    context.filter = 'blur(1px)'

    return (
      context.filter === 'blur(1px)' &&
      typeof probeCanvas.transferToImageBitmap === 'function'
    )
  } catch {
    return false
  }
}

const canvasFeaturesSupported = supportsRequiredCanvasFeatures()

workerScope.addEventListener('message', (event) => {
  const request = event.data
  if (request.type !== 'render') return

  let bitmap: ImageBitmap | null = null

  try {
    if (!canvasFeaturesSupported) {
      throw new Error('Required OffscreenCanvas features are unavailable')
    }

    const canvas = new OffscreenCanvas(
      request.scene.width,
      request.scene.height,
    )

    // godlights types the public draw target as HTMLCanvasElement, but its
    // implementation only uses the Canvas 2D surface shared by OffscreenCanvas.
    drawScene(canvas as unknown as HTMLCanvasElement, request.scene)
    bitmap = canvas.transferToImageBitmap()

    workerScope.postMessage({ type: 'rendered', id: request.id, bitmap }, [
      bitmap,
    ])
    bitmap = null
  } catch (error) {
    bitmap?.close()
    workerScope.postMessage({
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    })
  }
})
