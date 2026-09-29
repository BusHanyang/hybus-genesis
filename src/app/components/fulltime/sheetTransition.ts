const OPEN_CLASS = 'hb-sheet-open'
const CLOSE_CLASS = 'hb-sheet-close'

let current: { kind: 'open' | 'close'; transition: ViewTransition } | null =
  null

export const runningSheetTransition = () => current?.kind ?? null

export const skipSheetTransition = () => current?.transition.skipTransition()

export const canAnimateSheet = () =>
  typeof document.startViewTransition === 'function' &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
  document.visibilityState === 'visible'

export const runSheetTransition = (
  kind: 'open' | 'close',
  button: Element,
  update: () => void | Promise<void>,
) => {
  const root = document.documentElement
  const box = button.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const share = (value: number, total: number) =>
    `${((value / total) * 100).toFixed(3)}%`
  root.style.setProperty(
    '--hb-sheet-box',
    `inset(${share(box.top, height)} ${share(width - box.right, width)} ${share(height - box.bottom, height)} ${share(box.left, width)})`,
  )
  root.classList.remove(OPEN_CLASS, CLOSE_CLASS)
  root.classList.add(kind === 'open' ? OPEN_CLASS : CLOSE_CLASS)

  const transition = document.startViewTransition(update)
  current = { kind, transition }
  const finish = () => {
    if (current?.transition !== transition) return
    current = null
    root.classList.remove(OPEN_CLASS, CLOSE_CLASS)
  }
  transition.finished.then(finish, finish)
  transition.ready.catch(() => undefined)
  transition.updateCallbackDone.catch(() => undefined)
}
