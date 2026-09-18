/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0B',
        bgSec: '#141414',
        card: '#191919',
        border: '#292929',
        primaryText: '#F5F3EE',
        secondaryText: '#A3A3A3',
        muted: '#707070',
        cream: '#E8E1D3',
        accent: '#C62828',
        success: '#3A8F5B',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Space Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
