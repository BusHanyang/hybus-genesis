let pageTheme = window.localStorage.getItem('theme')

if (pageTheme !== null) {
  const barStyle = document.querySelector('meta[name=theme-color]')

  if (barStyle !== null) {
    console.log('hi')

    if (pageTheme === 'light') {
      barStyle.setAttribute('content', '#FFFFFF')
    }

    if (pageTheme === 'dark') {
      barStyle.setAttribute('content', '#27272A')
    }
  }
}
