import type React from 'react'

export type RgbColor = readonly [number, number, number]

export type LensFlarePoint = Readonly<{
  x: number
  y: number
}>

export type LensFlareMotionMode = 'static' | 'horizontal' | 'pointer'
export type LensFlareMotionPreference = 'system' | 'animate' | 'reduce'
export type LensFlareStatus =
  | 'idle'
  | 'ready'
  | 'lost'
  | 'restored'
  | 'unsupported'
  | 'error'
  | 'destroyed'

export type LensFlareMotion = Readonly<{
  mode?: LensFlareMotionMode
  amplitude?: LensFlarePoint
  speed?: number
  phase?: number
  settlingTime?: number
  persistAcrossMounts?: boolean
}>

export type LensFlareSourceStyle = Readonly<{
  coreColor?: string
  haloColor?: string
  coreRadius?: number
  coreIntensity?: number
  haloRadius?: number
  haloIntensity?: number
}>

export type LensFlareRayStyle = Readonly<{
  color?: string
  length?: number
  intensity?: number
  count?: number
  softness?: number
  angle?: number
}>

export type LensFlareStreakStyle = Readonly<{
  color?: string
  length?: number
  width?: number
  intensity?: number
  angle?: number
}>

export type LensFlareGhostStyle = Readonly<{
  colorA?: string
  colorB?: string
  count?: number
  spread?: number
  scale?: number
  intensity?: number
  apertureSides?: number
  chroma?: number
  edgeSoftness?: number
  ringIntensity?: number
  breathe?: number
  drift?: number
  driftSpeed?: number
  fadeVariation?: number
  scatter?: number
}>

export type OpticalLensFlareProps = Readonly<{
  source?: LensFlarePoint
  opticalCenter?: LensFlarePoint
  motion?: LensFlareMotion
  sourceStyle?: LensFlareSourceStyle
  rays?: LensFlareRayStyle
  streak?: LensFlareStreakStyle
  ghosts?: LensFlareGhostStyle
  intensity?: number
  maxDpr?: number
  resolutionScale?: number
  motionPreference?: LensFlareMotionPreference
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onStatusChange?: (status: LensFlareStatus) => void
}>

export type ResolvedLensFlareOptions = Readonly<{
  source: LensFlarePoint
  opticalCenter: LensFlarePoint
  motion: Required<LensFlareMotion>
  sourceStyle: Readonly<{
    coreColor: RgbColor
    haloColor: RgbColor
    coreRadius: number
    coreIntensity: number
    haloRadius: number
    haloIntensity: number
  }>
  rays: Readonly<{
    color: RgbColor
    length: number
    intensity: number
    count: number
    softness: number
    angle: number
  }>
  streak: Readonly<{
    color: RgbColor
    length: number
    width: number
    intensity: number
    angle: number
  }>
  ghosts: Readonly<{
    colorA: RgbColor
    colorB: RgbColor
    count: number
    spread: number
    scale: number
    intensity: number
    apertureSides: number
    chroma: number
    edgeSoftness: number
    ringIntensity: number
    breathe: number
    drift: number
    driftSpeed: number
    fadeVariation: number
    scatter: number
  }>
  intensity: number
  maxDpr: number
  resolutionScale: number
  motionPreference: LensFlareMotionPreference
}>

export type LensFlareTimeline = Readonly<{
  mountStartedAt: number
  persistentStartedAt: number
}>

export type LensFlareRenderSize = Readonly<{
  height: number
  width: number
}>

export type LensFlareFrameSnapshot = Readonly<{
  elapsed: number
  ghostCount: number
  ghostDrift: number
  source: LensFlarePoint
  timeline: 'mount' | 'persistent'
}>

export type SerializedLensFlareError = Readonly<{
  message: string
  name: string
  stack?: string
}>

export type LensFlareWorkerRequest =
  | Readonly<{
      type: 'probe'
      options: ResolvedLensFlareOptions
      reducedMotion: boolean
      timeline: LensFlareTimeline
    }>
  | Readonly<{
      type: 'init'
      canvas: OffscreenCanvas
      hidden: boolean
      options: ResolvedLensFlareOptions
      pointer: LensFlarePoint
      reducedMotion: boolean
      size: LensFlareRenderSize
      timeline: LensFlareTimeline
    }>
  | Readonly<{
      type: 'options'
      options: ResolvedLensFlareOptions
      reducedMotion: boolean
    }>
  | Readonly<{ type: 'pointer'; point: LensFlarePoint }>
  | Readonly<{ type: 'resize'; size: LensFlareRenderSize }>
  | Readonly<{ type: 'visibility'; hidden: boolean }>
  | Readonly<{ type: 'render' }>
  | Readonly<{ type: 'destroy' }>

export type LensFlareWorkerResponse =
  | Readonly<{
      type: 'probe-result'
      supported: boolean
    }>
  | Readonly<{
      type: 'status'
      status: LensFlareStatus
    }>
  | Readonly<{
      type: 'frame'
      snapshot: LensFlareFrameSnapshot
    }>
  | Readonly<{
      type: 'fatal'
      error: SerializedLensFlareError
    }>
