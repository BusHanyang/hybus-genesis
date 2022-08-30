let pageTheme = window.localStorage.getItem('theme')

if (pageTheme !== null) {
  const barStyle = document.querySelector('meta[name=theme-color]')

  if (barStyle !== null) {
    console.log('hi')

    if (pageTheme === 'light') {
      barStyle.setAttribute('content', '#FFFFFF')
      document.body.className = ''
      document.body.style.backgroundColor = '#FFFFFF'
    }

    if (pageTheme === 'dark') {
      barStyle.setAttribute('content', '#27272A')
      document.body.className = 'dark'
      document.body.style.backgroundColor = '#27272A'
    }
  }
}
