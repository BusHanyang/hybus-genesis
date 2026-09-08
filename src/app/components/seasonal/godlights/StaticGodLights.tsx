import { GodLights, type SceneConfig } from 'godlights'
import React from 'react'

import {
  renderStaticGodLights,
  supportsStaticGodLightsWorker,
} from './staticGodLights.client'

type StaticGodLightsProps = Readonly<{
  scene: SceneConfig
  className?: string
  style?: React.CSSProperties
}>

const canvasStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
}

const StaticGodLights = ({ scene, className, style }: StaticGodLightsProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [useMainThreadFallback, setUseMainThreadFallback] = React.useState(
    () => !supportsStaticGodLightsWorker(),
  )
  const fallbackScene = React.useMemo<SceneConfig>(() => {
    if (typeof OffscreenCanvas !== 'undefined') return scene

    return {
      ...scene,
      layers: scene.layers.map((layer) =>
        layer.type === 'rays' ? { ...layer, blur: 0 } : layer,
      ),
    }
  }, [scene])

  React.useEffect(() => {
    if (useMainThreadFallback) return

    const canvas = canvasRef.current
    const render = renderStaticGodLights(scene)
    if (!canvas || !render) {
      setUseMainThreadFallback(true)
      return
    }

    canvas.dataset.godlightsRenderStatus = 'pending'
    let active = true

    void render.bitmap.then(
      (bitmap) => {
        if (!active) {
          bitmap.close()
          return
        }

        try {
          const context = canvas.getContext('2d')
          if (!context) throw new Error('Canvas 2D context is unavailable')

          context.clearRect(0, 0, scene.width, scene.height)
          context.drawImage(bitmap, 0, 0)
          canvas.dataset.godlightsPresenter = '2d-copy'
          canvas.dataset.godlightsRenderStatus = 'ready'
        } catch {
          if (active) setUseMainThreadFallback(true)
        } finally {
          bitmap.close()
        }
      },
      () => {
        if (active) setUseMainThreadFallback(true)
      },
    )

    return () => {
      active = false
      render.cancel()
    }
  }, [scene, useMainThreadFallback])

  if (useMainThreadFallback) {
    return <GodLights className={className} scene={fallbackScene} style={style} />
  }

  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      <canvas
        ref={canvasRef}
        data-godlights-renderer="worker-offscreen-bitmap"
        height={scene.height}
        style={canvasStyle}
        width={scene.width}
      />
    </div>
  )
}

export default StaticGodLights
