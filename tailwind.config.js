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
      // Tokens de movimiento aprobados (design-library/tokens.json): 100/150/240/400 ms
      transitionDuration: { micro: '100ms', small: '150ms', notice: '240ms', large: '400ms' },
      transitionTimingFunction: {
        enter: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        move: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: { card: '16px', inner: '8px' },
      boxShadow: { card: '0 1px 2px rgba(0,0,0,.25), 0 8px 24px -12px rgba(0,0,0,.35)' },
      keyframes: {
        routeIn: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        popIn: { '0%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
      },
      // 'backwards' (no 'both'): al terminar no queda ningun transform activo, asi los modales
      // con position:fixed dentro de la pagina siguen anclados a la ventana.
      animation: {
        'route-in': 'routeIn 240ms cubic-bezier(0,0,0.2,1) backwards',
        'fade-in': 'fadeIn 150ms cubic-bezier(0,0,0.2,1) backwards',
        'pop-in': 'popIn 150ms cubic-bezier(0,0,0.2,1) backwards',
        'overlay-in': 'fadeIn 240ms cubic-bezier(0,0,0.2,1) backwards',
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