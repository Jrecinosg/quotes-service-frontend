import { useEffect, useState } from "react";
import { quotationService } from "../services/quotation.service";
import { requestService } from "../services/request.service";
import { dashboardService } from "../services/dashboard.service";
import {
    FileText, ClipboardList, ArrowRight, Plus, ShieldCheck, Users,
    ArrowUpRight, ArrowDownRight, Sparkles, Video, KeyRound, Wifi, Network, Lightbulb
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend
} from "recharts";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useTheme, chartColors } from "../context/theme";
import ValidityPill from "../components/ValidityPill";

const MONTH_LABEL = (key) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("es-GT", { month: "short", year: "2-digit" });
};

// "2026-09-21" -> fecha local (sin conversión de zona horaria, es un día de calendario)
const parseDayKey = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
};
const DAY_LABEL = (key) => parseDayKey(key).toLocaleDateString("es-GT", { weekday: "short", day: "numeric" });
const DAY_LABEL_LONG = (key) => parseDayKey(key).toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });

const TOOLTIP_BOX = "bg-surface border border-line rounded-xl shadow-[var(--sh-pop)] px-3 py-2 text-sm";

function PerformanceTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className={TOOLTIP_BOX}>
            <p className="font-bold text-ink">{MONTH_LABEL(p.month)}</p>
            <p className="text-ink-2">{p.avgHours}h promedio para finalizar</p>
            <p className="text-ink-muted text-xs">{p.count} solicitud{p.count === 1 ? "" : "es"} finalizada{p.count === 1 ? "" : "s"}</p>
        </div>
    );
}

function WeekTooltip({ active, payload, colors }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className={TOOLTIP_BOX}>
            <p className="font-bold text-ink capitalize">{DAY_LABEL_LONG(p.date)}</p>
            <p className="text-ink-2"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: colors.blue }} />{p.quotations} cotizaci{p.quotations === 1 ? "ón" : "ones"}</p>
            <p className="text-ink-2"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: colors.orange }} />{p.clients} cliente{p.clients === 1 ? "" : "s"} nuevo{p.clients === 1 ? "" : "s"}</p>
        </div>
    );
}

// Degradados de las tarjetas de color pleno: el texto blanco pasa AA (>= 4.5:1) en todo el tramo
const G = {
    blue: { g: "linear-gradient(135deg, #0A4FD6, #2563EB)", sc: "rgba(10,98,255,.75)" },
    violet: { g: "linear-gradient(135deg, #5A35C9, #7653E6)", sc: "rgba(108,77,224,.75)" },
    orange: { g: "linear-gradient(135deg, #B23A08, #C9490C)", sc: "rgba(220,90,10,.7)" },
    teal: { g: "linear-gradient(135deg, #066B5C, #0B8572)", sc: "rgba(10,140,120,.7)" },
};

const QUICK_ACTIONS = [
    { to: "/app/quotations/new", icon: Plus, label: "Nueva Cotización", tone: G.blue },
    { to: "/app/clients", icon: Users, label: "Clientes", tone: G.violet },
    { to: "/app/requests", icon: ClipboardList, label: "Solicitudes", tone: G.orange },
    { to: "/app/warranties", icon: ShieldCheck, label: "Garantías", tone: G.teal },
];

// Líneas de servicio reales de Grupo AC (texto fijo, no es un dato)
const SERVICE_LINES = [
    { icon: Video, label: "Videovigilancia", sub: "Mayor seguridad", tone: G.blue },
    { icon: KeyRound, label: "Control de acceso", sub: "Protege lo importante", tone: G.violet },
    { icon: Wifi, label: "Enlaces y conectividad", sub: "Sin límites", tone: G.teal },
    { icon: Network, label: "Redes estructuradas", sub: "Tu infraestructura", tone: G.orange },
];

const STAT_CARDS = [
    { key: "quotations", title: "Cotizaciones", icon: FileText, tone: G.blue, to: "/app/quotations" },
    { key: "clients", title: "Clientes", icon: Users, tone: G.violet, to: "/app/clients" },
    { key: "requests", title: "Solicitudes", icon: ClipboardList, tone: G.orange, to: "/app/requests" },
    { key: "warranties", title: "Garantías", icon: ShieldCheck, tone: G.teal, to: "/app/warranties" },
];

// Tendencia real: este mes vs. el mes anterior (conteos del servidor)
function TrendBadge({ thisMonth, lastMonth }) {
    if (!thisMonth && !lastMonth) return null;
    if (!lastMonth) {
        return (
            <span className="kpi-badge">
                <Sparkles size={12} /> Nuevo
            </span>
        );
    }
    const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    if (pct === 0) {
        return <span className="kpi-badge">Igual que el mes pasado</span>;
    }
    const up = pct > 0;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className="kpi-badge">
            <Icon size={13} /> {up ? "+" : ""}{pct}%
        </span>
    );
}

// Contador que sube hasta el valor (ease-out); sin animación si el sistema pide menos movimiento
function useCountUp(target, duration = 1000) {
    const [v, setV] = useState(0);
    useEffect(() => {
        const to = Number(target) || 0;
        if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(to); return undefined; }
        let raf; let start;
        const tick = (t) => {
            if (start === undefined) start = t;
            const p = Math.min((t - start) / duration, 1);
            setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return v;
}

// Mini gráfica de la semana (blanca sobre la tarjeta de color): la línea se dibuja sola al entrar
function Sparkline({ data, id }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => [(i / (data.length - 1)) * 100, 30 - (v / max) * 26]);
    const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    return (
        <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="w-24 h-9 overflow-visible" aria-hidden="true">
            <defs>
                <linearGradient id={`spk-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${d} L100 34 L0 34 Z`} fill={`url(#spk-${id})`} style={{ animation: "fadeIn 700ms ease-out 500ms backwards" }} />
            <path d={d} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  pathLength="1" strokeDasharray="1" vectorEffect="non-scaling-stroke"
                  style={{ "--len": 1, animation: "draw 1200ms var(--ease-out) 450ms backwards" }} />
        </svg>
    );
}

// Tarjeta KPI de color pleno. El número de conteo (no es dinero) conserva su subida de siempre.
function StatCard({ title, stat, icon: Icon, tone, loading, to, spark, sparkId, index = 0 }) {
    const count = useCountUp(stat?.total);
    return (
        <Link to={to} style={{ "--i": index, "--g": tone.g, "--sc": tone.sc }} className="kpi stagger-item">
            <div className="flex items-start justify-between gap-3">
                <div className="kpi-ic"><Icon className="w-5 h-5" /></div>
                {!loading && stat && <TrendBadge thisMonth={stat.thisMonth} lastMonth={stat.lastMonth} />}
            </div>
            <p className="mt-4 text-sm font-bold text-white">{title}</p>
            <h3 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-[-0.04em] tabular text-white">
                {loading ? <span className="inline-block w-16 h-9 align-middle rounded-lg bg-white/25 animate-pulse" /> : stat ? count.toLocaleString("es-GT") : "—"}
            </h3>
            <div className="mt-2 flex items-end justify-between gap-2 min-h-[36px]">
                <span className="text-xs font-semibold text-white">
                    {!loading && stat && (stat.thisMonth > 0 || stat.lastMonth > 0) ? `${stat.thisMonth} este mes · ${stat.lastMonth} el anterior` : ""}
                </span>
                {spark && !loading && <Sparkline data={spark} id={sparkId} />}
            </div>
        </Link>
    );
}

function ChartSkeleton() {
    return (
        <div className="h-[260px] flex items-end gap-3 px-2 pb-2" aria-label="Cargando gráfica">
            {[55, 80, 40, 95, 65, 75, 50].map((h, i) => <div key={i} className="skeleton flex-1" style={{ height: `${h}%` }} />)}
        </div>
    );
}

// Vigencia derivada del campo real validUntil. Si la cotización no tiene
// fecha de vencimiento guardada, se dice tal cual -no se asume "vigente".
export default function Dashboard() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = chartColors(theme);
    const axisTick = { fontSize: 11, fontWeight: 600, fill: colors.tick, fontFamily: "Manrope, system-ui, sans-serif" };
    const [quotations, setQuotations] = useState([]);
    const [stats, setStats] = useState(null);
    const [statsError, setStatsError] = useState(false);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    const firstName = user?.name?.split(" ")[0];

    useEffect(() => {
        const fetchData = async () => {
            // Cada bloque carga por su cuenta: si uno falla, los demás se muestran igual.
            const [listResult, requestResult, statsResult] = await Promise.allSettled([
                quotationService.getAll(1, 10, "", "recent"),
                requestService.getStats(),
                dashboardService.getStats()
            ]);

            if (listResult.status === "fulfilled") setQuotations(listResult.value.data || []);
            else console.error("Error cargando últimas cotizaciones:", listResult.reason);

            if (requestResult.status === "fulfilled") setPerformance(requestResult.value.performance || []);
            else console.error("Error cargando rendimiento de solicitudes:", requestResult.reason);

            if (statsResult.status === "fulfilled") setStats(statsResult.value);
            else {
                console.error("Error cargando estadísticas del dashboard:", statsResult.reason);
                setStatsError(true);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const weekData = stats?.last7Days
        ? stats.last7Days.quotations.map((q, i) => ({
            date: q.date,
            quotations: q.count,
            clients: stats.last7Days.clients[i]?.count ?? 0
        }))
        : [];
    const weekQuotations = weekData.reduce((sum, d) => sum + d.quotations, 0);
    const weekClients = weekData.reduce((sum, d) => sum + d.clients, 0);

    return (
        <div>
            {/* Saludo + acción principal */}
            <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
                <div className="min-w-0">
                    <p className="eyebrow">Plataforma Grupo AC</p>
                    <h1 className="title-xl mt-1.5">
                        {firstName ? <>Hola, <span className="serif-accent">{firstName}</span></> : <>Resumen <span className="serif-accent">general</span></>}
                    </h1>
                    <p className="text-ink-muted font-medium mt-1.5">Esto es lo que está pasando en tu operación hoy.</p>
                </div>
                <Link to="/app/quotations/new" className="btn btn-primary !min-h-[46px] !px-6 !rounded-[14px] !text-[15px] !font-bold">
                    <Plus size={18} />
                    Nueva Cotización
                </Link>
            </div>

            {/* Estadísticas con tendencia (este mes vs. mes anterior): color pleno, enfoque al pasar el cursor */}
            <div>
                {statsError && (
                    <p className="mb-4 text-sm font-semibold text-bad">No se pudieron cargar las estadísticas en este momento. Recarga la página para intentarlo de nuevo.</p>
                )}
                <div className="kpi-group grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {STAT_CARDS.map(({ key, ...card }, idx) => (
                        <StatCard key={key} {...card} index={idx} stat={stats?.[key]} loading={loading} sparkId={key}
                            spark={key === "quotations" ? weekData.map((d) => d.quotations) : key === "clients" ? weekData.map((d) => d.clients) : null} />
                    ))}
                </div>
            </div>

            {/* Últimos 7 días + Rendimiento de solicitudes */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 mt-4">
                <div className="card glow p-6 min-w-0">
                    <h2 className="title-md">Cotizaciones y clientes <span className="serif-accent">de los últimos 7 días</span></h2>
                    <p className="text-ink-muted text-sm mt-0.5 min-h-[20px]">
                        {!loading && stats && <>{weekQuotations} cotizaci{weekQuotations === 1 ? "ón" : "ones"} y {weekClients} cliente{weekClients === 1 ? "" : "s"} nuevo{weekClients === 1 ? "" : "s"} en los últimos 7 días</>}
                    </p>

                    <div className="mt-3">
                        {loading ? (
                            <ChartSkeleton />
                        ) : !stats ? (
                            <div className="h-[260px] flex items-center justify-center text-ink-muted text-sm">No hay datos disponibles.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="fillQuotations" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colors.blue} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={colors.blue} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="fillClients" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colors.orange} stopOpacity={0.22} />
                                            <stop offset="100%" stopColor={colors.orange} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 6" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={DAY_LABEL}
                                        tick={axisTick}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                                    <Tooltip content={<WeekTooltip colors={colors} />} cursor={{ stroke: colors.grid }} />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={32}
                                        iconType="circle"
                                        iconSize={8}
                                        itemSorter={(item) => (item.dataKey === "quotations" ? 0 : 1)}
                                        formatter={(value) => <span className="text-sm font-semibold text-ink-muted">{value}</span>}
                                    />
                                    <Area type="monotone" dataKey="quotations" name="Cotizaciones" stroke={colors.blue} strokeWidth={3} fill="url(#fillQuotations)" dot={false} activeDot={{ r: 5, fill: "#fff", stroke: colors.blue, strokeWidth: 3 }} animationDuration={1400} animationEasing="ease-out" />
                                    <Area type="monotone" dataKey="clients" name="Clientes nuevos" stroke={colors.orange} strokeWidth={3} fill="url(#fillClients)" dot={false} activeDot={{ r: 5, fill: "#fff", stroke: colors.orange, strokeWidth: 3 }} animationBegin={250} animationDuration={1400} animationEasing="ease-out" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="card glow p-6 min-w-0 flex flex-col">
                    <h2 className="title-md">Rendimiento <span className="serif-accent">de solicitudes</span></h2>
                    <p className="text-ink-muted text-sm mt-0.5">Tiempo promedio para finalizar una solicitud, por mes</p>

                    <div className="mt-3 flex-1">
                        {loading ? (
                            <ChartSkeleton />
                        ) : performance.length === 0 ? (
                            <div className="h-[260px] flex items-center justify-center text-center text-ink-muted text-sm">
                                Todavía no hay solicitudes finalizadas para medir el rendimiento.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={performance} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="26%">
                                    <defs>
                                        <linearGradient id="fillBars" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2BA0FF" />
                                            <stop offset="100%" stopColor="#0A62FF" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 6" />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={MONTH_LABEL}
                                        tick={axisTick}
                                        interval={0}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={axisTick}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        tickFormatter={(value) => `${value}h`}
                                    />
                                    <Tooltip content={<PerformanceTooltip />} cursor={{ fill: colors.cursor, radius: 10 }} />
                                    <Bar dataKey="avgHours" fill="url(#fillBars)" radius={[10, 10, 4, 4]} maxBarSize={40} animationDuration={900} animationEasing="ease-out" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {/* un segmento por mes medido (se llenan en cascada una vez) */}
                    {!loading && performance.length > 0 && (
                        <div className="seg-progress mt-3" aria-hidden="true">
                            {performance.map((p, i) => <i key={p.month} style={{ "--i": i }} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Acciones rápidas + consejo */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 mt-4">
                <div className="card p-5">
                    <p className="eyebrow !text-ink-soft mb-3">Acciones rápidas</p>
                    <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map(({ to, icon: Icon, label, tone }) => (
                            <Link
                                key={to}
                                to={to}
                                className="group card card-hover !rounded-2xl !shadow-none flex items-center gap-3 p-3.5 min-w-0"
                            >
                                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white transition-transform duration-500 ease-[var(--spring-bounce)] group-hover:scale-110 group-hover:-rotate-6"
                                     style={{ background: tone.g, boxShadow: `0 10px 18px -10px ${tone.sc}` }}>
                                    <Icon size={18} />
                                </div>
                                <span className="text-sm text-ink font-bold leading-tight">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Decorativo: frase fija, no es un dato */}
                <div className="tip-card p-5 flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white">Recuerda</p>
                            <p className="font-bold leading-snug mt-1">Una cotización que sale rápido y clara ya es parte del servicio.</p>
                            <p className="text-sm text-white mt-1.5">Dar seguimiento a tiempo convierte una propuesta en un proyecto y a un cliente en uno que regresa.</p>
                        </div>
                    </div>
                    <Link to="/app/quotations" className="inline-flex items-center gap-1.5 text-sm font-bold text-white underline-offset-4 hover:underline w-fit">
                        Revisar cotizaciones <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Líneas de servicio de Grupo AC (texto fijo) */}
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                {SERVICE_LINES.map(({ icon: Icon, label, sub, tone }) => (
                    <li key={label} className="card !rounded-2xl flex items-center gap-3 px-4 py-3.5 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ background: tone.g, boxShadow: `0 10px 18px -10px ${tone.sc}` }}>
                            <Icon size={18} />
                        </div>
                        <div className="leading-tight min-w-0">
                            <p className="text-sm font-extrabold text-ink">{label}</p>
                            <p className="text-xs font-semibold text-ink-soft">{sub}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Últimas Cotizaciones (las más recientes primero) */}
            <div className="card overflow-hidden mt-4">
                <div className="px-6 pt-6 pb-4 flex justify-between items-center gap-3">
                    <div>
                        <h2 className="title-md">Últimas <span className="serif-accent">cotizaciones</span></h2>
                        <p className="text-ink-muted text-sm mt-0.5">Las más recientes de tu equipo</p>
                    </div>
                    <Link to="/app/quotations" className="btn btn-secondary !min-h-[38px] !text-[13px] shrink-0">
                        Ver todas <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[760px]">
                        <thead className="text-ink-soft border-y border-line bg-surface-base">
                            <tr>
                                <th className="px-6 py-3">Correlativo</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {loading ? (
                                [0, 1, 2].map((i) => (
                                    <tr key={i}><td colSpan="5" className="px-6 py-4"><div className="skeleton h-6 w-full" /></td></tr>
                                ))
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-ink-muted">No hay cotizaciones registradas.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-surface-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <Link to={`/app/quotations/${q.id}`} className="font-mono text-[13px] font-semibold text-info hover:underline underline-offset-4">
                                                {formatQuotationId(q.correlativo)}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 shrink-0 rounded-full bg-brand-soft flex items-center justify-center text-white text-xs font-extrabold">
                                                    {(q.client?.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-ink font-semibold">{q.client?.name || "Sin Nombre"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-extrabold text-ink text-right tabular">
                                            {formatCurrency(q.total)}
                                        </td>
                                        <td className="px-6 py-4 text-ink-muted font-medium">
                                            {formatDate(q.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ValidityPill validUntil={q.validUntil} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
