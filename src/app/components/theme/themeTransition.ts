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
    const box = origin.getBoundingClientRect()
    root.style.setProperty(
      '--hb-rx',
      `${Math.round(box.left + box.width / 2)}px`,
    )
    root.style.setProperty(
      '--hb-ry',
      `${Math.round(box.top + box.height / 2)}px`,
    )
  }

  const transition = document.startViewTransition(() => flushSync(update))
  transition.finished.then(finish, finish)
  transition.ready.catch(() => undefined)
  transition.updateCallbackDone.catch(() => undefined)
}
