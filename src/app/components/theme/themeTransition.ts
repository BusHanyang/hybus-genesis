import { flushSync } from 'react-dom'

const SWAP_CLASS = 'hb-swap'

/**
 * Switches the theme with a circle that grows from `origin`.
 *
 * `hb-swap` turns every CSS transition off so colors flip in a single frame;
 * the View Transition supplies the motion. Without View Transitions support,
 * or with reduced motion, the theme simply switches in place.
 */
export const runThemeTransition = (
  origin: Element | null,
  update: () => void,
) => {
  const root = document.documentElement
  const reduceMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const finish = () => {
    window.setTimeout(() => root.classList.remove(SWAP_CLASS), 60)
  }

  root.classList.add(SWAP_CLASS)

  if (typeof document.startViewTransition !== 'function' || reduceMotion) {
    flushSync(update)
    finish()
    return
  }

  const box = origin?.getBoundingClientRect()
  const x = box ? box.left + box.width / 2 : window.innerWidth / 2
  const y = box ? box.top + box.height / 2 : window.innerHeight / 2
  // Just far enough to reach the farthest corner of the viewport.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
  root.style.setProperty('--hb-rx', `${Math.round(x)}px`)
  root.style.setProperty('--hb-ry', `${Math.round(y)}px`)
  root.style.setProperty('--hb-r', `${Math.ceil(radius) + 2}px`)

  const transition = document.startViewTransition(() => flushSync(update))
  transition.finished.then(finish, finish)
  transition.ready.catch(() => undefined)
  transition.updateCallbackDone.catch(() => undefined)
}
