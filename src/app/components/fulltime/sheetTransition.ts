const OPEN_CLASS = 'hb-sheet-open'
const CLOSE_CLASS = 'hb-sheet-close'

let current: { kind: 'open' | 'close'; transition: ViewTransition } | null =
  null

/** Which view transition, if any, is opening or closing the full timetable. */
export const runningSheetTransition = () => current?.kind ?? null

/** Ends a running open or close at once (the page came back mid-close). */
export const skipSheetTransition = () => current?.transition.skipTransition()

/**
 * Whether the full timetable can open and close like the theme switch.
 * Without view transitions (or with reduced motion) the sheet animates
 * itself, or simply appears.
 */
export const canAnimateSheet = () =>
  typeof document.startViewTransition === 'function' &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
  document.visibilityState === 'visible'

/**
 * Opens or closes the full timetable through the home button's box, the way
 * the theme switch reveals a theme through a circle. The pages are
 * snapshots, so the motion stays smooth however heavy the timetable is.
 *
 * `update` has to leave the DOM in its new state (flushSync the React
 * update); it may await something first, like the page's code.
 */
export const runSheetTransition = (
  kind: 'open' | 'close',
  button: Element,
  update: () => void | Promise<void>,
) => {
  const root = document.documentElement
  const box = button.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  // As shares of the viewport, like the theme reveal's circle, so the box
  // lands on the button whatever scale the transition layer is drawn at.
  const share = (value: number, total: number) =>
    `${((value / total) * 100).toFixed(3)}%`
  root.style.setProperty(
    '--hb-sheet-box',
    `inset(${share(box.top, height)} ${share(width - box.right, width)} ${share(height - box.bottom, height)} ${share(box.left, width)} round ${share(16, width)} / ${share(16, height)})`,
  )
  root.classList.remove(OPEN_CLASS, CLOSE_CLASS)
  root.classList.add(kind === 'open' ? OPEN_CLASS : CLOSE_CLASS)

  const transition = document.startViewTransition(update)
  current = { kind, transition }
  // A newer transition (closing while still opening) takes over the classes.
  const finish = () => {
    if (current?.transition !== transition) return
    current = null
    root.classList.remove(OPEN_CLASS, CLOSE_CLASS)
  }
  transition.finished.then(finish, finish)
  transition.ready.catch(() => undefined)
  transition.updateCallbackDone.catch(() => undefined)
}
