/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D17', // Very dark blue/black background from image
        surface: '#121521', // Darker panel background
        primary: {
          500: '#1DDFEE', // Cyan
          600: '#15A8D3',
        },
        secondary: {
          500: '#A45AFF', // Purple
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming an Inter-like modern font
      }
    },
  },
  plugins: [],
}
