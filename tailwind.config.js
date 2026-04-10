/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Courier New', 'monospace'],
        mono: ['Courier New', 'monospace']
      }
    }
  },
  plugins: []
}
