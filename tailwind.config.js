/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        Noto: ["Noto Sans KR", "sans-serif"],
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
