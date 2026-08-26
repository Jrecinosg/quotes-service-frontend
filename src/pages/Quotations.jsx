import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { quotationService } from "../services/quotation.service";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";
import Swal from "sweetalert2";

export default function Quotations() {
    const [quotations, setQuotations] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            loadQuotations(1, true);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const loadQuotations = async (pageNum, isNewSearch = false) => {
        setLoading(true);
        try {
            const response = await quotationService.getAll(pageNum, 10, searchTerm);

            if (isNewSearch) {
                setQuotations(response.data);
            } else {
                setQuotations(prev => [...prev, ...response.data]);
            }

            setHasMore(pageNum < response.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (quotation) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar la cotización ${formatQuotationId(quotation.correlativo)}. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await quotationService.delete(quotation.id);
                setQuotations(prevQuotations => prevQuotations.filter(q => q.id !== quotation.id));
                Swal.fire('¡Eliminado!', 'La cotización ha sido borrada.', 'success');
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar la cotización.', 'error');
            }
        }
    };

    return (
        <div>
            {/* 1. Cabecera (Título e Izquierda, Botón Derecha) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-gray-800">Cotizaciones</h1>
                    <p className="text-gray-500 text-sm">Gestiona y genera tus presupuestos</p>
                </div>
                <Link
                    to="/app/quotations/new"
                    className="bg-brand-gradient hover:brightness-105 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-center justify-center"
                >
                    <Plus size={20} />
                    Nueva Cotización
                </Link>
            </div>

            {/* 2. Barra de Búsqueda (Ancho Completo como en Clientes) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o correlativo (ej: CO00001)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 3. Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Correlativo</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && quotations.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Cargando cotizaciones...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay cotizaciones que coincidan con la búsqueda.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-blue-600 font-mono font-bold">
                                            {formatQuotationId(q.correlativo)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {q.client?.name || "Cliente no disponible"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {formatDate(q.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {formatCurrency(q.total)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    to={`/app/quotations/${q.id}`}
                                                    className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all"
                                                    title="Ver Detalles y PDF"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <Link
                                                    to={`/app/quotations/edit/${q.id}`}
                                                    className="p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(q)}
                                                    className="p-2 text-gray-400 hover:bg-white hover:text-red-600 rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BOTÓN CARGAR MÁS */}
            {hasMore && !loading && (
                <div className="flex justify-center mt-8 pb-8">
                    <button
                        onClick={() => {
                            const nextPage = page + 1;
                            setPage(nextPage);
                            loadQuotations(nextPage);
                        }}
                        className="px-6 py-2 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                    >
                        Cargar más cotizaciones
                    </button>
                </div>
            )}
            
            {loading && quotations.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">Cargando más resultados...</div>
            )}
        </div>
    );
}