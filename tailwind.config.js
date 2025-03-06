module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      height: {
        dfull: '100dvh',
      },
      screens: {
        hm: { max: '400px' },
        hsm: { max: '360px' },
        shuttlei: { max: '580px' },
        rt1: { max: '495px' },
        rt2: { max: '440px' },
      },
      transitionTimingFunction: {
        ptrTran: 'cubic-bezier(0, 1, 1, 0)',
      },
      zIndex: {
        99: '99',
      },
      colors: {
        'theme-main': 'var(--color-theme-main)',
        'theme-card': 'var(--color-theme-card)',
        'theme-text' : 'var(--color-theme-text)',
        'theme-border' : 'var(--color-theme-border)',
        'control-main' : 'var(--color-control-main)',
        'control-active' : 'var(--color-control-active)',
        'button-active' : 'var(--color-button-active)',

        'ft-element' : 'var(--color-ft-element)',
        'ft-active' : 'var(--color-ft-active)',
        'ft-active-text' : 'var(--color-ft-active-text)',
        'ft-text' : 'var(--color-ft-text)',
        'ft-border' : 'var(--color-ft-border)',

        'chip-red': '#FF897A',
        'chip-blue': '#7FAAFF',
        'chip-green': '#81c784',
        'chip-purple': '#d0affb',
        'chip-orange': '#FFAB40',
      },
      boxShadow: { 
        'theme-shadow' : 'var(--color-theme-shadow)',
      },
      fontFamily: {
        Ptd: ['Pretendard'],
      },
      animation: {
        ldsEllipsis1: 'ldsEllipsis1 0.6s infinite',
        ldsEllipsis2: 'ldsEllipsis2 0.6s infinite',
        ldsEllipsis3: 'ldsEllipsis3 0.6s infinite',
      },
      keyframes: {
        ldsEllipsis1: {
          '0%': {
            transform: 'scale(0)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
        ldsEllipsis2: {
          '0%': {
            transform: 'translate(0, 0)',
          },
          '100%': {
            transform: 'translate(19px, 0)',
          },
        },
        ldsEllipsis3: {
          '0%': {
            transform: 'scale(1)',
          },
          '100%': {
            transform: 'scale(0)',
          },
        },
        refSpinner: {
          '0%':{transform: "rotate(-180deg)"},
          '100%':{transform: "rotate(180deg)"},
        }
      },
      transitionProperty:{
        'height': ['responsive', 'hover', 'focus'],
      },
    },
  },
  darkMode: 'class',
}
