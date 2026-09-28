const OPEN_CLASS = 'hb-open-all'
const CLOSE_CLASS = 'hb-close-all'
const HOME_SCROLL_KEY = 'hb-home-scroll'

const canAnimate = () =>
  typeof document.startViewTransition === 'function' &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// The rectangle the page grows out of / shrinks into, as percentages of the
// viewport so it lines up at any zoom (see the theme reveal).
const setButtonInset = (button: Element | null) => {
  if (button === null) return
  const box = button.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const inset = [
    (box.top / height) * 100,
    ((width - box.right) / width) * 100,
    ((height - box.bottom) / height) * 100,
    (box.left / width) * 100,
  ]
  document.documentElement.style.setProperty(
    '--hb-all-inset',
    inset.map((value) => `${value.toFixed(2)}%`).join(' '),
  )
}

// Routes render asynchronously (and the timetable page is lazy-loaded), so
// wait until the target page is actually in the DOM before it's captured.
const waitFor = (selector: string, timeoutMs = 3000) =>
  new Promise<Element | null>((resolve) => {
    const found = document.querySelector(selector)
    if (found !== null) {
      resolve(found)
      return
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element !== null) {
        observer.disconnect()
        resolve(element)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    window.setTimeout(() => {
      observer.disconnect()
      resolve(document.querySelector(selector))
    }, timeoutMs)
  })

const restoreHomeScroll = () => {
  window.scrollTo(0, Number(window.sessionStorage.getItem(HOME_SCROLL_KEY) ?? 0))
}

/** Opens the full timetable by growing it out of the button that was pressed. */
export const openFullTime = (button: Element, navigate: () => void) => {
  window.sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY))

  if (!canAnimate()) {
    navigate()
    return
  }

  const root = document.documentElement
  setButtonInset(button)
  root.classList.add(OPEN_CLASS)
  const transition = document.startViewTransition(async () => {
    navigate()
    await waitFor('[data-fulltime-page]')
    window.scrollTo(0, 0)
  })
  const done = () => root.classList.remove(OPEN_CLASS)
  transition.finished.then(done, done)
  transition.ready.catch(() => undefined)
}

/** Goes back home, shrinking the timetable into the full timetable button. */
export const closeFullTime = (navigate: () => void) => {
  if (!canAnimate()) {
    navigate()
    void waitFor('#all').then(restoreHomeScroll)
    return
  }

  const root = document.documentElement
  root.classList.add(CLOSE_CLASS)
  const transition = document.startViewTransition(async () => {
    navigate()
    const button = await waitFor('#all')
    restoreHomeScroll()
    setButtonInset(button)
  })
  const done = () => root.classList.remove(CLOSE_CLASS)
  transition.finished.then(done, done)
  transition.ready.catch(() => undefined)
}
