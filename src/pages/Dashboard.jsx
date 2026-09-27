import { useEffect, useState } from "react";
import { quotationService } from "../services/quotation.service";
import { requestService } from "../services/request.service";
import { dashboardService } from "../services/dashboard.service";
import {
    FileText, ClipboardList, ArrowRight, Plus, ShieldCheck, Users, TrendingUp,
    ArrowUpRight, ArrowDownRight, Sparkles, Video, KeyRound, Wifi, Network, Activity, Quote
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend
} from "recharts";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const AXIS_TICK = { fontSize: 12, fill: "#8B93B8" };
const GRID_STROKE = "#2A355F";
const SERIES_BLUE = "#1F8CFF";
const SERIES_ORANGE = "#FF6A00";

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

function PerformanceTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="bg-surface-hover border border-surface-border rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold text-white">{MONTH_LABEL(p.month)}</p>
            <p className="text-gray-300">{p.avgHours}h promedio para finalizar</p>
            <p className="text-gray-400 text-xs">{p.count} solicitud{p.count === 1 ? "" : "es"} finalizada{p.count === 1 ? "" : "s"}</p>
        </div>
    );
}

function WeekTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="bg-surface-hover border border-surface-border rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold text-white capitalize">{DAY_LABEL_LONG(p.date)}</p>
            <p className="text-gray-300"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: SERIES_BLUE }} />{p.quotations} cotizaci{p.quotations === 1 ? "ón" : "ones"}</p>
            <p className="text-gray-300"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: SERIES_ORANGE }} />{p.clients} cliente{p.clients === 1 ? "" : "s"} nuevo{p.clients === 1 ? "" : "s"}</p>
        </div>
    );
}

const QUICK_ACTIONS = [
    { to: "/app/quotations/new", icon: Plus, label: "Nueva Cotización", iconBg: "bg-brand-blue", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(0,123,255,0.6)]" },
    { to: "/app/clients", icon: Users, label: "Clientes", iconBg: "bg-purple-500", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(168,85,247,0.55)]" },
    { to: "/app/requests", icon: ClipboardList, label: "Solicitudes", iconBg: "bg-brand-orange", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(255,138,0,0.6)]" },
    { to: "/app/warranties", icon: ShieldCheck, label: "Garantías", iconBg: "bg-emerald-500", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(16,185,129,0.55)]" },
];

// Líneas de servicio reales de Grupo AC (texto fijo, no es un dato)
const SERVICE_LINES = [
    { icon: Video, label: "Videovigilancia", sub: "Mayor seguridad", color: "text-white", bg: "bg-brand-blue", glow: "shadow-[0_0_16px_rgba(0,123,255,0.6)]" },
    { icon: KeyRound, label: "Control de acceso", sub: "Protege lo importante", color: "text-white", bg: "bg-purple-500", glow: "shadow-[0_0_16px_rgba(168,85,247,0.55)]" },
    { icon: Wifi, label: "Enlaces y conectividad", sub: "Sin límites", color: "text-white", bg: "bg-brand-orange", glow: "shadow-[0_0_16px_rgba(255,138,0,0.6)]" },
    { icon: Network, label: "Redes estructuradas", sub: "Tu infraestructura", color: "text-white", bg: "bg-emerald-500", glow: "shadow-[0_0_16px_rgba(16,185,129,0.55)]" },
];

const STAT_CARDS = [
    { key: "quotations", title: "Cotizaciones", icon: FileText, iconBg: "bg-brand-blue", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(0,123,255,0.6)]" },
    { key: "clients", title: "Clientes", icon: Users, iconBg: "bg-purple-500", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(168,85,247,0.55)]" },
    { key: "requests", title: "Solicitudes", icon: ClipboardList, iconBg: "bg-brand-orange", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(255,138,0,0.6)]" },
    { key: "warranties", title: "Garantías", icon: ShieldCheck, iconBg: "bg-emerald-500", iconColor: "text-white", glow: "shadow-[0_0_16px_rgba(16,185,129,0.55)]" },
];

// Tendencia real: este mes vs. el mes anterior (conteos del servidor)
function TrendBadge({ thisMonth, lastMonth }) {
    if (!thisMonth && !lastMonth) return null;
    if (!lastMonth) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                <Sparkles size={12} /> Nuevo
            </span>
        );
    }
    const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    if (pct === 0) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-600 text-gray-200">Igual que el mes pasado</span>;
    }
    const up = pct > 0;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${up ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            <Icon size={13} /> {up ? "+" : ""}{pct}%
        </span>
    );
}

function StatCard({ title, stat, icon: Icon, iconBg, iconColor, glow, loading }) {
    return (
        <div className="bg-surface-card p-5 rounded-2xl border border-surface-border transition-colors hover:bg-surface-hover">
            <div className="flex items-center justify-between gap-3">
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${iconBg} ${glow}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight mt-2">
                {loading ? <span className="inline-block w-16 h-8 rounded-lg bg-surface-hover animate-pulse align-middle" /> : stat ? stat.total : "—"}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 min-h-[22px]">
                {!loading && stat && (
                    <>
                        <TrendBadge thisMonth={stat.thisMonth} lastMonth={stat.lastMonth} />
                        {(stat.thisMonth > 0 || stat.lastMonth > 0) && (
                            <span className="text-xs text-gray-400">{stat.thisMonth} este mes · {stat.lastMonth} el anterior</span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Vigencia derivada del campo real validUntil. Si la cotización no tiene
// fecha de vencimiento guardada, se dice tal cual -no se asume "vigente".
function ValidityPill({ validUntil }) {
    if (!validUntil) {
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-600 text-gray-200 whitespace-nowrap">Sin fecha</span>;
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const expired = new Date(validUntil) < startOfToday;
    return expired ? (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white whitespace-nowrap">Vencida</span>
    ) : (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white whitespace-nowrap">Vigente</span>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
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
            {/* Hero de bienvenida + acciones rápidas */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 mb-8">
                <div className="relative overflow-hidden rounded-3xl bg-surface-card border border-surface-border min-h-[420px] bg-brand-glow">
                    {/* Línea de energía diagonal -mismo recurso visual que la referencia */}
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 800 420"
                        preserveAspectRatio="none"
                        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
                    >
                        <defs>
                            <linearGradient id="heroStreak1" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00C2FF" stopOpacity="0" />
                                <stop offset="20%" stopColor="#00C2FF" stopOpacity="1" />
                                <stop offset="55%" stopColor="#007BFF" stopOpacity="1" />
                                <stop offset="85%" stopColor="#FF8A00" stopOpacity="1" />
                                <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0" />
                            </linearGradient>
                            <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="7" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <g filter="url(#heroGlow)" strokeLinecap="round" fill="none">
                            <path d="M -80 460 C 200 420, 380 340, 520 260 S 780 60, 900 -40" stroke="url(#heroStreak1)" strokeWidth="4.5" opacity="0.95" />
                            <path d="M -80 500 C 220 470, 400 380, 540 300 S 800 100, 920 0" stroke="url(#heroStreak1)" strokeWidth="2" opacity="0.5" />
                        </g>
                    </svg>

                    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center p-6 md:p-8 min-h-[420px]">
                        <div className="max-w-md">
                            <p className="text-brand-cyan text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]">Plataforma Grupo AC</p>
                            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                                {firstName ? `Hola, ${firstName}` : "Resumen General"}
                            </h1>
                            <p className="text-gray-300 mt-2">Esto es lo que está pasando en tu operación hoy.</p>
                            <Link
                                to="/app/quotations/new"
                                className="inline-flex items-center gap-2 mt-6 w-fit px-5 py-2.5 rounded-full text-white text-sm font-semibold bg-brand-gradient shadow-[0_0_24px_rgba(0,123,255,0.55)] hover:brightness-110 hover:shadow-[0_0_32px_rgba(255,138,0,0.55)] transition-all"
                            >
                                <Plus size={16} />
                                Nueva Cotización
                            </Link>
                        </div>

                        <ul className="relative grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4 lg:w-44 lg:justify-self-end lg:self-start lg:mt-0">
                            {SERVICE_LINES.map(({ icon: Icon, label, sub, color, bg, glow }) => (
                                <li key={label} className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${bg} ${glow}`}>
                                        <Icon size={15} className={color} />
                                    </div>
                                    <div className="leading-tight min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">{label}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{sub}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-surface-card border border-surface-border rounded-3xl p-6">
                    <p className="text-white font-semibold mb-4">Acciones rápidas</p>
                    <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map(({ to, icon: Icon, label, iconBg, iconColor, glow }) => (
                            <Link
                                key={to}
                                to={to}
                                className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-base border border-surface-border hover:bg-surface-hover transition-colors"
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg} ${glow}`}>
                                    <Icon size={18} className={iconColor} />
                                </div>
                                <span className="text-sm text-gray-200 font-medium leading-tight">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Estadísticas con tendencia (este mes vs. mes anterior) */}
            {statsError && (
                <p className="mb-4 text-sm text-red-400">No se pudieron cargar las estadísticas en este momento. Recarga la página para intentarlo de nuevo.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                {STAT_CARDS.map(({ key, ...card }) => (
                    <StatCard key={key} {...card} stat={stats?.[key]} loading={loading} />
                ))}
            </div>

            {/* Últimos 7 días + tarjeta "Recuerda" */}
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-8">
                <div className="bg-surface-card rounded-2xl border border-surface-border p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                                    <Activity size={16} className="text-white" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Cotizaciones y clientes de los últimos 7 días</h2>
                            </div>
                            {!loading && stats && (
                                <p className="text-gray-400 text-sm mt-1">
                                    {weekQuotations} cotizaci{weekQuotations === 1 ? "ón" : "ones"} y {weekClients} cliente{weekClients === 1 ? "" : "s"} nuevo{weekClients === 1 ? "" : "s"} en los últimos 7 días
                                </p>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Cargando...</div>
                    ) : !stats ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No hay datos disponibles.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillQuotations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={SERIES_BLUE} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={SERIES_BLUE} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="fillClients" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={SERIES_ORANGE} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={SERIES_ORANGE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={DAY_LABEL}
                                    tick={AXIS_TICK}
                                    axisLine={{ stroke: GRID_STROKE }}
                                    tickLine={false}
                                />
                                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                                <Tooltip content={<WeekTooltip />} cursor={{ stroke: GRID_STROKE }} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    height={32}
                                    iconType="circle"
                                    iconSize={8}
                                    itemSorter={(item) => (item.dataKey === "quotations" ? 0 : 1)}
                                    formatter={(value) => <span className="text-sm text-gray-300">{value}</span>}
                                />
                                <Area type="monotone" dataKey="quotations" name="Cotizaciones" stroke={SERIES_BLUE} strokeWidth={2} fill="url(#fillQuotations)" dot={{ r: 3, fill: SERIES_BLUE }} activeDot={{ r: 5 }} />
                                <Area type="monotone" dataKey="clients" name="Clientes nuevos" stroke={SERIES_ORANGE} strokeWidth={2} fill="url(#fillClients)" dot={{ r: 3, fill: SERIES_ORANGE }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Decorativo: frase fija, no es un dato */}
                <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-6 flex flex-col">
                    <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mb-4">
                        <Quote size={18} className="text-white" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Recuerda</p>
                    <p className="text-white text-lg font-semibold leading-snug">
                        Una cotización que sale rápido y clara ya es parte del servicio.
                    </p>
                    <p className="text-gray-400 text-sm mt-3">
                        Dar seguimiento a tiempo convierte una propuesta en un proyecto y a un cliente en uno que regresa.
                    </p>
                    <Link
                        to="/app/quotations"
                        className="mt-auto pt-6 inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 w-fit"
                    >
                        Revisar cotizaciones <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Rendimiento de solicitudes */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} className="text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Rendimiento de solicitudes</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4 mt-1">Tiempo promedio para finalizar una solicitud, por mes</p>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Cargando...</div>
                ) : performance.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        Todavía no hay solicitudes finalizadas para medir el rendimiento.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                            <XAxis
                                dataKey="month"
                                tickFormatter={MONTH_LABEL}
                                tick={AXIS_TICK}
                                axisLine={{ stroke: GRID_STROKE }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={AXIS_TICK}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                                tickFormatter={(value) => `${value}h`}
                            />
                            <Tooltip content={<PerformanceTooltip />} cursor={{ fill: "#1C2650" }} />
                            <Bar dataKey="avgHours" fill={SERIES_BLUE} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Últimas Cotizaciones (las más recientes primero) */}
            <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
                <div className="p-6 border-b border-surface-border flex justify-between items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">Últimas Cotizaciones</h2>
                    <Link
                        to="/app/quotations"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-blue-400 hover:bg-blue-500/10 text-sm font-medium transition-colors shrink-0"
                    >
                        Ver todas <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-surface-base text-gray-400 text-xs font-semibold uppercase tracking-wide">
                            <tr>
                                <th className="px-6 py-3">Correlativo</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400">Cargando datos...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400">No hay cotizaciones registradas.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-surface-hover transition-colors">
                                        <td className="px-6 py-4 font-bold">
                                            <Link to={`/app/quotations/${q.id}`} className="text-blue-400 hover:text-blue-300">
                                                {formatQuotationId(q.correlativo)}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 shrink-0 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                                                    {(q.client?.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-300">{q.client?.name || "Sin Nombre"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white text-right">
                                            {formatCurrency(q.total)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
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
