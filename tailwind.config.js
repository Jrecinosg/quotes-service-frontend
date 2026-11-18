/** @type {import('tailwindcss').Config} */

// Color que cambia con el ambiente elegido (Cielo / Claro / Noche). Los valores viven en
// src/index.css como canales RGB (--c-*) por tema; así funcionan también las opacidades (bg-ok/15).
const tema = (nombre) => `rgb(var(--c-${nombre}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Manrope: títulos, interfaz y números · Instrument Serif (cursiva): una palabra de acento por título
        // · IBM Plex Mono: etiquetas, cabeceras de tabla y correlativos
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      colors: {
        // Paleta Pantone entregada por el usuario -valores exactos, no aproximados (no cambian con el tema).
        brand: {
          navy: '#0A1A2F',
          blue: '#007BFF',
          blue600: '#0A62FF',
          cyan: '#00C2FF',
          orange: '#FF8A00',
          orangeDeep: '#FF5A1F',
          navy950: '#060F1C',   // fondo de portada/login (profundidad bajo el navy)
        },
        // ===== Semánticos que siguen al ambiente (portal interno y pantallas de acceso) =====
        // Superficies SÓLIDAS para datos: surface (tarjeta), surface-base (hundida: cabecera de tabla, campos),
        // surface-hover (fila al pasar), surface-border (= line).
        surface: {
          DEFAULT: tema('surface'),
          base: tema('surface-2'),
          card: tema('surface'),
          hover: tema('surface-hover'),
          border: tema('line'),
        },
        line: { DEFAULT: tema('line'), strong: tema('line-strong') },
        // Texto: ink (principal) · ink-2 (secundario fuerte) · ink-muted (secundario) · ink-soft (metadatos)
        ink: {
          DEFAULT: tema('ink'),
          2: tema('ink-2'),
          muted: tema('ink-muted'),
          soft: tema('ink-soft'),
          // alias heredados (mismos roles)
          text: tema('ink'),
          light: tema('ink-2'),
          secondary: tema('ink-soft'),
        },
        // Capa neutra para hover/fondos sutiles: blanco en Noche, azul marino en Cielo/Claro (usar con /5, /10)
        tint: tema('tint'),
        // Estados (chip pastel = bg-<estado>/15 + text-<estado>)
        info: tema('info'),
        ok: tema('ok'),
        warn: tema('warn'),
        bad: tema('bad'),
        violet: tema('violet'),
        accent: tema('accent'),
        state: { ok: tema('ok'), warn: tema('warn') },
      },
      // Tokens de movimiento aprobados (design-library/tokens.json): 100/150/240/400 ms
      transitionDuration: { micro: '100ms', small: '150ms', notice: '240ms', large: '400ms' },
      transitionTimingFunction: {
        enter: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        move: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: { card: '16px', inner: '8px' },
      boxShadow: { card: 'var(--sh-card)' },
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
        // Avatares y botones con texto blanco: azul de marca en todo el tramo (blanco encima >= 4.5:1)
        'brand-soft': 'linear-gradient(135deg, #0A4FD6 0%, #0A62FF 55%, #4F5FF0 100%)',
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
