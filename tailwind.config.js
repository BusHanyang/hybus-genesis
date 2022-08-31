module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        hm: { max: '400px' },
        hsm: { max: '360px' },
      },
      transitionTimingFunction: {
        ptrTran: 'cubic-bezier(0, 1, 1, 0)',
      },
      zIndex: {
        99: '99',
      },
      colors: {
        'chip-red': '#FF897A',
        'chip-blue': '#7FAAFF',
      },
      fontFamily: {
        Ptd: ['Pretendard'],
      },
      animation: {
        carousel: 'upOut 4s ease-in-out infinite',
        modalShow: 'modalShow 0.3s',
        modalBgShow: 'modalBgShow 0.3s',
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
            opacity: '0',
            transform: 'translate3d(0, 0%, 0)',
          },
          to: {
            opacity: '0',
            transform: 'translate3d(0, 0%, 0)',
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
  plugins: [],
  darkMode: 'class',
}
