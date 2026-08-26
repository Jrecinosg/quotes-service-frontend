/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Archivo Expanded"', 'Arial Narrow', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#182454',
          blue: '#1F8CFF',
          orange: '#FF6A00',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #1F8CFF 0%, #FF6A00 100%)',
      },
    },
  },
  plugins: [],
}