/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FDF0F3',
        card: '#FFFFFF',
        ink: '#4A2C1A',
        accent: '#D96A85',
        accentLight: '#FBE0E6',
        whatsapp: '#25D366',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(217, 106, 133, 0.10)',
        cardHover: '0 14px 30px rgba(217, 106, 133, 0.22)',
        drawer: '-8px 0 40px rgba(74, 44, 26, 0.18)',
      },
    },
  },
  plugins: [],
}
