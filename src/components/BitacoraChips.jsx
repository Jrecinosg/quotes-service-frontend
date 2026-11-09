import { Clock, CheckCircle2, AlertCircle, Calendar, CalendarRange } from "lucide-react";

// Chips de estado de la Bitácora sobre fondo oscuro (colores de la especificación de diseño).
// Siempre ícono + palabra: nunca solo color.
const STATUS = {
  EN_CURSO: { label: "En curso", icon: Clock, bg: "rgba(43,184,255,.16)", fg: "#7DD3FF" },
  CON_PENDIENTES: { label: "Con pendientes", icon: AlertCircle, bg: "rgba(251,191,36,.16)", fg: "#FCD34D" },
  TERMINADO: { label: "Terminado", icon: CheckCircle2, bg: "rgba(52,211,153,.16)", fg: "#6EE7B7" },
};

const chip = "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap";

export function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.EN_CURSO;
  const Icon = s.icon;
  return (
    <span className={chip} style={{ background: s.bg, color: s.fg }}>
      <Icon size={12} aria-hidden="true" /> {s.label}
    </span>
  );
}

export function TypeChip({ type }) {
  const multi = type === "VARIOS_DIAS";
  const Icon = multi ? CalendarRange : Calendar;
  return (
    <span className={chip} style={{ background: "rgba(255,255,255,.07)", color: "#CBD5E1" }}>
      <Icon size={12} aria-hidden="true" /> {multi ? "Varios días" : "1 día"}
    </span>
  );
}
