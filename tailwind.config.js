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
        'fab-color': 'var(--color-fab-color)',
        'ontouch-bg': 'var(--color-ontouch-bg)',

        'ft-element' : 'var(--color-ft-element)',
        'ft-active' : 'var(--color-ft-active)',
        'ft-active-text' : 'var(--color-ft-active-text)',
        'ft-text' : 'var(--color-ft-text)',
        'ft-border' : 'var(--color-ft-border)',

        'chip-red': '#FF897A',
        'chip-blue': '#7FAAFF',
        'chip-green': '#81c784',
        'chip-purple': '#d0affb',
      },
      boxShadow: { 
        'theme-shadow' : 'var(--color-theme-shadow)',
      },
      fontFamily: {
        Ptd: ['Pretendard'],
      },
      animation: {
        carousel: 'upOut 7s ease-in-out infinite',
        modalShow: 'modalShow 0.3s',
        modalBgShow: 'modalBgShow 0.3s',
        modalBgClose: 'modalBgClose 0.3s',
        modalClose: 'modalClose 0.3s',
        ldsEllipsis1: 'ldsEllipsis1 0.6s infinite',
        ldsEllipsis2: 'ldsEllipsis2 0.6s infinite',
        ldsEllipsis3: 'ldsEllipsis3 0.6s infinite',
      },
      keyframes: {
        upOut: {
          from: {
            opacity: '0',
            transform: 'translate3d(0, 10%, 0)',
          },

          '30%': {
            opacity: '1',
            transform: 'translate3d(0, 0%, 0)',
          },
          '70%': {
            opacity: '1',
            transform: 'translate3d(0, 0%, 0)',
          },
          to: {
            opacity: '0',
            transform: 'translate3d(0, -10%, 0)',
          },
        },
        modalShow: {
          from: {
            opacity: '0',
            marginTop: '-50px',
          },
          to: {
            opacity: '1',
            marginTop: '0px',
          },
        },
        modalBgShow: {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
        modalBgClose: {
          from: {
            opacity: '1',
          },
          to: {
            opacity: '0',
          },
        },
        modalClose: {
          from: {
            opacity: '1',
            marginTop: '0px',
          },
          to: {
            opacity: '0',
            marginTop: '-50px',
          },
        },
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
      },
    },
  },
  darkMode: 'class',
}
