import { Clock, CheckCircle2, AlertCircle, Calendar, CalendarRange, Hammer, LifeBuoy, FileText, MoonStar, UserRound, Wrench, ShieldCheck } from "lucide-react";
import { STALE_DAYS } from "../utils/bitacora";

// Chips de la Bitácora sobre fondo oscuro (colores de la especificación de diseño).
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

// Tipo de bitácora: Proyecto o Soporte mensual (los proyectos conservan además su duración 1 día / Varios días).
export function KindChip({ kind }) {
  const support = kind === "SOPORTE";
  const Icon = support ? LifeBuoy : Hammer;
  return (
    <span className={chip} style={support ? { background: "rgba(192,132,252,.16)", color: "#D8B4FE" } : { background: "rgba(43,184,255,.10)", color: "#A5DBFF" }}>
      <Icon size={12} aria-hidden="true" /> {support ? "Soporte mensual" : "Proyecto"}
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

export function QuotationChip({ number }) {
  if (!number) return null;
  return (
    <span className={chip} style={{ background: "rgba(255,255,255,.07)", color: "#CBD5E1" }}>
      <FileText size={12} aria-hidden="true" /> {number}
    </span>
  );
}

export function StaleChip() {
  return (
    <span className={chip} style={{ background: "rgba(251,146,60,.16)", color: "#FDBA74" }} title={`Sin actividad desde hace ${STALE_DAYS} días o más`}>
      <MoonStar size={12} aria-hidden="true" /> Sin movimiento
    </span>
  );
}

const ORIGIN = {
  CLIENTE: { label: "Cliente", icon: UserRound, bg: "rgba(43,184,255,.14)", fg: "#7DD3FF" },
  INTERNO: { label: "Interno", icon: Wrench, bg: "rgba(255,255,255,.07)", fg: "#CBD5E1" },
  GARANTIA: { label: "Garantía", icon: ShieldCheck, bg: "rgba(52,211,153,.14)", fg: "#6EE7B7" },
};

export function OriginChip({ origin }) {
  const o = ORIGIN[origin];
  if (!o) return null;
  const Icon = o.icon;
  return (
    <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: o.bg, color: o.fg }}>
      <Icon size={11} aria-hidden="true" /> {o.label}
    </span>
  );
}
