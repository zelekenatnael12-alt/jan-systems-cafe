/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: 'var(--primary-color, #1C1209)',
        amber: 'var(--secondary-color, #C8873A)',
        cream: '#FAF7F2',
        softBlue: '#E0E7FF',
        softAmber: '#FEF3C7',
        softGreen: '#D1FAE5',
      },
      fontFamily: {
        sans: ['system-ui', 'Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      letterSpacing: {
        tightest: '-.075em',
        tighter: '-.05em',
        tight: '-.025em',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      borderWidth: {
        '0.5': '0.5px',
      }
    },
  },
  plugins: [],
}
