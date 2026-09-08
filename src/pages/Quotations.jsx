import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Search, ChevronDown, Building2 } from "lucide-react";
import { quotationService } from "../services/quotation.service";
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";
import Swal from "sweetalert2";

export default function Quotations() {
    const [quotations, setQuotations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    // Empresas con su acordeón abierto -por defecto todo cerrado, para que
    // la lista sea ojeable aunque haya muchos clientes.
    const [expanded, setExpanded] = useState(() => new Set());

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadQuotations();
        }, 400);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    // Se trae un lote grande de una vez (no paginado): agrupar por empresa
    // solo tiene sentido si se ve el conjunto completo, no una pagina a la vez.
    const loadQuotations = async () => {
        setLoading(true);
        try {
            const response = await quotationService.getAll(1, 500, searchTerm);
            setQuotations(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = (clientId) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(clientId)) next.delete(clientId);
            else next.add(clientId);
            return next;
        });
    };

    // Agrupadas por empresa (el backend ya las manda ordenadas por cliente).
    // Mientras se busca algo, los grupos con resultado se muestran ya
    // desplegados -no tiene sentido buscar una cotización puntual y encima
    // tener que hacer clic para verla.
    const isSearching = searchTerm.trim().length > 0;
    const groups = useMemo(() => {
        const byClient = [];
        const index = new Map();
        for (const q of quotations) {
            const key = q.clientId;
            if (!index.has(key)) {
                index.set(key, byClient.length);
                byClient.push({ client: q.client, items: [] });
            }
            byClient[index.get(key)].items.push(q);
        }
        return byClient;
    }, [quotations]);

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
                setQuotations(prev => prev.filter(q => q.id !== quotation.id));
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
                        placeholder="Buscar por cliente, correlativo o referencia de proyecto..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 3. Empresas agrupadas (acordeón) */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-10 text-gray-400">Cargando cotizaciones...</div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-10 text-gray-500">No hay cotizaciones que coincidan con la búsqueda.</div>
            ) : (
                <div className="space-y-3">
                    {groups.map(({ client, items }) => {
                        const isOpen = isSearching || expanded.has(client?.id);
                        return (
                            <div key={client?.id || 'sin-cliente'} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleExpanded(client?.id)}
                                    className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                            <Building2 size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{client?.name || "Cliente no disponible"}</p>
                                            <p className="text-xs text-gray-400">{items.length} cotización{items.length === 1 ? '' : 'es'}</p>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        size={20}
                                        className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {isOpen && (
                                    <div className="overflow-x-auto border-t border-gray-100">
                                        <table className="w-full text-left min-w-[700px]">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Correlativo</th>
                                                    <th className="px-6 py-3">Referencia</th>
                                                    <th className="px-6 py-3">Fecha</th>
                                                    <th className="px-6 py-3">Total</th>
                                                    <th className="px-6 py-3 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {items.map((q) => (
                                                    <tr key={q.id} className="hover:bg-blue-50/50 transition-colors group">
                                                        <td className="px-6 py-4 text-blue-600 font-mono font-bold">
                                                            {formatQuotationId(q.correlativo)}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                                            {q.projectReference || "—"}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {formatDate(q.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-900">
                                                            {formatCurrency(q.total)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
