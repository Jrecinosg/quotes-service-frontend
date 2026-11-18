import { CloudSun, Sun, Moon } from "lucide-react";
import { THEMES, useTheme } from "../context/theme";

const ICONS = { cielo: CloudSun, claro: Sun, noche: Moon };

// Selector de ambiente con indicador deslizante (resorte). La elección se recuerda en este navegador.
export default function ThemeSwitch({ className = "" }) {
  const { theme, setTheme } = useTheme();
  const idx = Math.max(0, THEMES.findIndex((t) => t.id === theme));
  return (
    <div className={`theme-switch ${className}`} role="group" aria-label="Ambiente visual">
      <span className="theme-switch-thumb" aria-hidden="true" style={{ transform: `translateX(${idx * 100}%)` }} />
      {THEMES.map((t) => {
        const Icon = ICONS[t.id];
        return (
          <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)} title={`Ambiente ${t.label}`}>
            <Icon size={13} aria-hidden="true" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
