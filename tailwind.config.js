/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Paleta Pantone entregada por el usuario -valores exactos, no aproximados.
        brand: {
          navy: '#0A1A2F',
          blue: '#007BFF',
          cyan: '#00C2FF',
          orange: '#FF8A00',
          orangeDeep: '#FF5A1F',
        },
        surface: {
          base: '#0A1A2F',
          card: '#10263F',
          hover: '#15304D',
          border: '#2A3B4C',
        },
        ink: {
          secondary: '#5B6B7C',
          light: '#D9E6F2',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #007BFF 0%, #FF8A00 100%)',
        'brand-glow': 'radial-gradient(circle at 105% -10%, rgba(0,194,255,0.55), transparent 45%), radial-gradient(circle at 100% 30%, rgba(0,123,255,0.4), transparent 50%), radial-gradient(circle at -5% 110%, rgba(255,138,0,0.45), transparent 50%)',
      },
      dropShadow: {
        glowBlue: '0 0 18px rgba(0,123,255,0.65)',
        glowCyan: '0 0 18px rgba(0,194,255,0.65)',
        glowOrange: '0 0 18px rgba(255,138,0,0.65)',
      },
    },
  },
  plugins: [],
}