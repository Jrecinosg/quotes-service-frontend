import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, FileText } from "lucide-react";
import { quotationService } from "../services/quotation.service";
import { pdf } from '@react-pdf/renderer';
import { QuotationDocument } from "../components/QuotationPDF";
// Importamos los formatters
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";

export default function QuotationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        quotationService.getById(id)
            .then(setQuotation)
            .catch(() => navigate("/quotations"))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const handleOpenPdf = async () => {
        const blob = await pdf(<QuotationDocument quotation={quotation} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles de la cotización...</div>;
    if (!quotation) return null;

    return (
        <div className="max-w-4xl mx-auto pb-10">

            {/* Cabecera de Navegación */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate("/quotations")} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <ArrowLeft size={20} /> Volver al listado
                </button>

                <div className="flex gap-3">
                    <Link
                        to={`/quotations/edit/${id}`}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Pencil size={18} /> Editar
                    </Link>

                    <button
                        onClick={handleOpenPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-md transition-all font-semibold"
                    >
                        <FileText size={18} /> Ver PDF
                    </button>
                </div>
            </div>

            {/* --- VISTA DE SOLO LECTURA --- */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                
                {/* Encabezado Documento */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">
                                {formatQuotationId(quotation.correlativo)}
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                Emitida el {formatDate(quotation.createdAt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Registrada
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Datos Cliente y Vendedor */}
                    <div className="grid grid-cols-2 gap-12 mb-10">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Información del Cliente</h3>
                            <p className="font-bold text-xl text-gray-800 mb-1">{quotation.client.name}</p>
                            <p className="text-gray-600 leading-relaxed">{quotation.client.address}</p>
                            <p className="text-gray-500 mt-2 font-medium">NIT: {quotation.client.taxId || 'C/F'}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Elaborado por</h3>
                            <p className="text-lg font-semibold text-gray-800">{quotation.elaboratedBy || "No especificado"}</p>
                            <p className="text-sm text-gray-500 italic mt-1">Representante de Ventas</p>
                        </div>
                    </div>

                    {/* --- TABLA DE ÍTEMS ACTUALIZADA --- */}
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-center w-16">Cant.</th>
                                    <th className="px-4 py-3">Descripción</th>
                                    <th className="px-4 py-3 text-right">P. Lista</th>
                                    <th className="px-4 py-3 text-center">% Desc.</th>
                                    <th className="px-4 py-3 text-right">P. Oferta</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {quotation.items.map((item, i) => {
                                    // Extraemos y calculamos los valores
                                    const listPrice = Number(item.listPrice) || 0;
                                    const discount = Number(item.discountPercent) || 0;
                                    const discountedUnitPrice = listPrice * (1 - discount / 100);

                                    return (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 text-center font-medium text-gray-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-gray-800">
                                                {item.description}
                                            </td>
                                            
                                            {/* P. Lista (Tachado si hay descuento) */}
                                            <td className={`px-4 py-4 text-right ${discount > 0 ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                                {discount > 0 ? formatCurrency(listPrice) : '-'}
                                            </td>
                                            
                                            {/* % Descuento (Con un badge resaltado) */}
                                            <td className="px-4 py-4 text-center">
                                                {discount > 0 ? (
                                                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold">
                                                        -{discount}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            
                                            {/* P. Oferta (Azul para resaltar) */}
                                            <td className="px-4 py-4 text-right font-medium text-blue-700">
                                                {formatCurrency(discountedUnitPrice)}
                                            </td>
                                            
                                            {/* Total de línea (subtotalItem) */}
                                            <td className="px-4 py-4 text-right font-bold text-gray-900">
                                                {formatCurrency(item.subtotalItem)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Sección de Totales */}
                    <div className="flex justify-end border-t border-gray-100 pt-6">
                        <div className="w-72 space-y-3">
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>IVA (12%):</span>
                                <span>{formatCurrency(quotation.tax)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black text-orange-600 border-t-2 border-orange-50 pt-3 mt-3">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(quotation.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Condiciones Comerciales */}
                    <div className="mt-12 bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Condiciones y Observaciones</h3>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                                <p><span className="font-bold text-gray-700">Garantía:</span> <span className="text-gray-600">{quotation.warranty}</span></p>
                                <p><span className="font-bold text-gray-700">Tiempo de Entrega:</span> <span className="text-gray-600">{quotation.deliveryTime}</span></p>
                            </div>
                            <div className="space-y-2 text-right">
                                <p><span className="font-bold text-gray-700">Forma de Pago:</span> <span className="text-gray-600">{quotation.paymentMethod}</span></p>
                                <p><span className="font-bold text-gray-700">Validez:</span> <span className="text-gray-600">{quotation.validity || 'No especificada'}</span></p>
                            </div>
                        </div>
                        {quotation.observations && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-gray-600 text-sm italic">
                                    <span className="font-bold not-italic text-gray-700">Notas:</span> {quotation.observations}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}