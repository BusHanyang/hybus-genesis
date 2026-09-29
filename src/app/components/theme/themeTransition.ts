import { flushSync } from 'react-dom'

const SWAP_CLASS = 'hb-swap'

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
