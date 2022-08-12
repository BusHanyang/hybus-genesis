module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'chip-red': '#FF897A',
        'chip-blue': '#7FAAFF',
      },
      fontFamily: {
        Ptd: ['Pretendard'],
        BHS: ['Black Han Sans'],
      },
      animation: {
        carousel: 'upOut 4s ease-in-out infinite',
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
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
