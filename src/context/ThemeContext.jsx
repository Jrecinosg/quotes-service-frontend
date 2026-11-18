import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext, THEME_KEY, readStoredTheme } from "./theme";

// Proveedor del ambiente visual (Cielo / Claro / Noche). Solo aspecto: no toca datos ni sesión.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* sin almacenamiento: solo esta sesión */ }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
