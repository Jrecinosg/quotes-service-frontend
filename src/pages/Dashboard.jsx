import { useEffect, useState } from "react";
import { quotationService } from "../services/quotation.service";
import { requestService } from "../services/request.service";
import { FileText, ClipboardList, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";

const MONTH_LABEL = (key) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("es-GT", { month: "short", year: "2-digit" });
};

function PerformanceTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-semibold text-gray-800">{MONTH_LABEL(p.month)}</p>
            <p className="text-gray-600">{p.avgHours}h promedio para finalizar</p>
            <p className="text-gray-400 text-xs">{p.count} solicitud{p.count === 1 ? "" : "es"} finalizada{p.count === 1 ? "" : "s"}</p>
        </div>
    );
}

export default function Dashboard() {
    const [quotations, setQuotations] = useState([]);
    const [quotationCount, setQuotationCount] = useState(0);
    const [requestCount, setRequestCount] = useState(0);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="font-display text-3xl font-bold text-gray-800 mb-8">Resumen General</h1>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    title="Total de Cotizaciones"
                    value={quotationCount}
                    icon={FileText}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total de Solicitudes"
                    value={requestCount}
                    icon={ClipboardList}
                    color="bg-orange-500"
                />
            </div>

            {/* Rendimiento de solicitudes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800">Rendimiento de solicitudes</h2>
                <p className="text-gray-500 text-sm mb-4">Tiempo promedio para finalizar una solicitud, por mes</p>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Cargando...</div>
                ) : performance.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        Todavía no hay solicitudes finalizadas para medir el rendimiento.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                            <CartesianGrid vertical={false} stroke="#CBD5E1" />
                            <XAxis
                                dataKey="month"
                                tickFormatter={MONTH_LABEL}
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={{ stroke: "#94A3B8" }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                                tickFormatter={(value) => `${value}h`}
                            />
                            <Tooltip content={<PerformanceTooltip />} cursor={{ fill: "#F1F5F9" }} />
                            <Bar dataKey="avgHours" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Últimas Cotizaciones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Últimas Cotizaciones</h2>
                    <Link to="/app/quotations" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                        Ver todas <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-3">Correlativo</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-400">Cargando datos...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-400">No hay cotizaciones registradas.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-600">
                                            {formatQuotationId(q.correlativo)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {q.client?.name || "Sin Nombre"}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
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
