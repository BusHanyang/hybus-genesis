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

  if (origin !== null) {
    // As a share of the viewport, so the circle starts on the icon whatever
    // scale the browser renders the transition layer at.
    const box = origin.getBoundingClientRect()
    const x = ((box.left + box.width / 2) / window.innerWidth) * 100
    const y = ((box.top + box.height / 2) / window.innerHeight) * 100
    root.style.setProperty('--hb-rx', `${x.toFixed(2)}%`)
    root.style.setProperty('--hb-ry', `${y.toFixed(2)}%`)
  }

  const transition = document.startViewTransition(() => flushSync(update))
  transition.finished.then(finish, finish)
  transition.ready.catch(() => undefined)
  transition.updateCallbackDone.catch(() => undefined)
}
