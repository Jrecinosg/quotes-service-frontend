import { createContext, useContext } from "react";

// Ambientes visuales del portal. La elección se recuerda en este navegador (localStorage)
// y se aplica en <html data-theme="..."> antes del primer pintado (script en index.html).
export const THEME_KEY = "gac-tema";
export const THEMES = [
  { id: "cielo", label: "Cielo" },
  { id: "claro", label: "Claro" },
  { id: "noche", label: "Noche" },
];
export const DEFAULT_THEME = "cielo";

export function readStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (THEMES.some((x) => x.id === t)) return t;
  } catch {
    /* sin almacenamiento disponible: ambiente por defecto */
  }
  return DEFAULT_THEME;
}

// Colores para las gráficas (recharts recibe colores como texto, no variables CSS)
const CHART = {
  light: { tick: "#546686", grid: "#D6E0F0", blue: "#0A62FF", orange: "#F07800", cursor: "rgba(10,98,255,0.07)" },
  noche: { tick: "#7A8DA8", grid: "#1E2A3E", blue: "#2BA0FF", orange: "#FF8A00", cursor: "rgba(255,255,255,0.05)" },
};
export const chartColors = (theme) => (theme === "noche" ? CHART.noche : CHART.light);

export const ThemeContext = createContext({ theme: DEFAULT_THEME, setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);
