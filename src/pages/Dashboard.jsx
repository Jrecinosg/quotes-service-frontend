import { useEffect, useState } from "react";
import { quotationService } from "../services/quotation.service";
import { Banknote, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";

export default function Dashboard() {
    const [quotations, setQuotations] = useState([]);
    const [globalStats, setGlobalStats] = useState({ totalAmount: 0, totalCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [listResponse, statsResponse] = await Promise.all([
                    quotationService.getAll(1, 10),
                    quotationService.getStats()
                ]);

                setQuotations(listResponse.data || []);
                setGlobalStats(statsResponse);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Resumen General</h1>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    title="Monto Total Histórico"
                    // Usamos el monto total que viene del nuevo endpoint
                    value={formatCurrency((quotations || []).reduce((acc, curr) => acc + Number(curr.total), 0))}
                    icon={Banknote}
                    color="bg-green-500"
                />
                <StatCard
                    title="Total de Cotizaciones"
                    // Usamos el conteo total que viene del nuevo endpoint
                    value={globalStats.totalCount}
                    icon={FileText}
                    color="bg-blue-500"
                />
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