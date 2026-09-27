import { useEffect, useState } from "react";
import { quotationService } from "../services/quotation.service";
import { requestService } from "../services/request.service";
import { FileText, ClipboardList, ArrowRight, Plus, ShieldCheck, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const MONTH_LABEL = (key) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("es-GT", { month: "short", year: "2-digit" });
};

function PerformanceTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="bg-surface-hover border border-surface-border rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold text-white">{MONTH_LABEL(p.month)}</p>
            <p className="text-gray-300">{p.avgHours}h promedio para finalizar</p>
            <p className="text-gray-500 text-xs">{p.count} solicitud{p.count === 1 ? "" : "es"} finalizada{p.count === 1 ? "" : "s"}</p>
        </div>
    );
}

const QUICK_ACTIONS = [
    { to: "/app/quotations/new", icon: Plus, label: "Nueva Cotización", iconBg: "bg-blue-500/15", iconColor: "text-blue-400" },
    { to: "/app/clients", icon: Users, label: "Clientes", iconBg: "bg-purple-500/15", iconColor: "text-purple-400" },
    { to: "/app/requests", icon: ClipboardList, label: "Solicitudes", iconBg: "bg-orange-500/15", iconColor: "text-orange-400" },
    { to: "/app/warranties", icon: ShieldCheck, label: "Garantías", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400" },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [quotations, setQuotations] = useState([]);
    const [quotationCount, setQuotationCount] = useState(0);
    const [requestCount, setRequestCount] = useState(0);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    const firstName = user?.name?.split(" ")[0];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [listResponse, quotationStats, requestStats] = await Promise.all([
                    quotationService.getAll(1, 10),
                    quotationService.getStats(),
                    requestService.getStats()
                ]);

                setQuotations(listResponse.data || []);
                setQuotationCount(quotationStats.totalCount || 0);
                setRequestCount(requestStats.counts?.total || 0);
                setPerformance(requestStats.performance || []);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, iconBg, iconColor }) => (
        <div className="bg-surface-card p-6 rounded-2xl border border-surface-border flex items-center gap-4 transition-colors hover:border-surface-hover">
            <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            </div>
        </div>
    );

    return (
        <div>
            {/* Hero de bienvenida + acciones rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 mb-8">
                <div className="relative overflow-hidden rounded-3xl bg-surface-card border border-surface-border p-8 flex flex-col justify-center bg-brand-glow">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Plataforma Grupo AC</p>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                        {firstName ? `Hola, ${firstName}` : "Resumen General"}
                    </h1>
                    <p className="text-gray-400 mt-2 max-w-md">Esto es lo que está pasando en tu operación hoy.</p>
                    <Link
                        to="/app/quotations/new"
                        className="inline-flex items-center gap-2 mt-6 w-fit px-5 py-2.5 rounded-full text-white text-sm font-semibold bg-brand-gradient shadow-lg shadow-blue-500/10 hover:brightness-105 transition-all"
                    >
                        <Plus size={16} />
                        Nueva Cotización
                    </Link>
                </div>

                <div className="bg-surface-card border border-surface-border rounded-3xl p-6">
                    <p className="text-white font-semibold mb-4">Acciones rápidas</p>
                    <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map(({ to, icon: Icon, label, iconBg, iconColor }) => (
                            <Link
                                key={to}
                                to={to}
                                className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-base border border-surface-border hover:border-surface-hover hover:bg-surface-hover transition-colors"
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
                                    <Icon size={18} className={iconColor} />
                                </div>
                                <span className="text-sm text-gray-200 font-medium leading-tight">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    title="Total de Cotizaciones"
                    value={quotationCount}
                    icon={FileText}
                    iconBg="bg-blue-500/15"
                    iconColor="text-blue-400"
                />
                <StatCard
                    title="Total de Solicitudes"
                    value={requestCount}
                    icon={ClipboardList}
                    iconBg="bg-orange-500/15"
                    iconColor="text-orange-400"
                />
            </div>

            {/* Rendimiento de solicitudes */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} className="text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Rendimiento de solicitudes</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4 mt-1">Tiempo promedio para finalizar una solicitud, por mes</p>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-500">Cargando...</div>
                ) : performance.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                        Todavía no hay solicitudes finalizadas para medir el rendimiento.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                            <CartesianGrid vertical={false} stroke="#2A355F" />
                            <XAxis
                                dataKey="month"
                                tickFormatter={MONTH_LABEL}
                                tick={{ fontSize: 12, fill: "#8B93B8" }}
                                axisLine={{ stroke: "#2A355F" }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#8B93B8" }}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                                tickFormatter={(value) => `${value}h`}
                            />
                            <Tooltip content={<PerformanceTooltip />} cursor={{ fill: "#1C2650" }} />
                            <Bar dataKey="avgHours" fill="#1F8CFF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Últimas Cotizaciones */}
            <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
                <div className="p-6 border-b border-surface-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Últimas Cotizaciones</h2>
                    <Link
                        to="/app/quotations"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-blue-400 hover:bg-blue-500/10 text-sm font-medium transition-colors"
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
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-500">Cargando datos...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-500">No hay cotizaciones registradas.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-surface-hover transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-400">
                                            {formatQuotationId(q.correlativo)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 shrink-0 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                                                    {(q.client?.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-300">{q.client?.name || "Sin Nombre"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {formatCurrency(q.total)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {formatDate(q.createdAt)}
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
