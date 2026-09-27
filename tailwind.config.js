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
        surface: {
          base: '#0D1330',
          card: '#161F45',
          hover: '#1C2650',
          border: '#2A355F',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #1F8CFF 0%, #FF6A00 100%)',
        'brand-glow': 'radial-gradient(circle at 100% 0%, rgba(31,140,255,0.35), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255,106,0,0.25), transparent 55%)',
      },
    },
  },
  plugins: [],
}