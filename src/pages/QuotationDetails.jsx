import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, FileText, Wallet, Plus, Trash2 } from "lucide-react";
import { quotationService } from "../services/quotation.service";
import { pdf } from '@react-pdf/renderer';
import { QuotationDocument } from "../components/QuotationPDF";
import PaymentModal from "../components/PaymentModal";
import Swal from "sweetalert2";
// Importamos los formatters
import { formatQuotationId, formatCurrency, formatDate } from "../utils/formatters";

const PAYMENT_TYPE_LABEL = { ANTICIPO: "Anticipo", FINAL: "Pago final" };
const PAYMENT_TYPE_STYLE = { ANTICIPO: "bg-blue-500 text-white", FINAL: "bg-emerald-500 text-white" };

export default function QuotationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const fetchQuotation = () => {
        return quotationService.getById(id)
            .then(setQuotation)
            .catch(() => navigate("/app/quotations"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchQuotation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    const payments = quotation?.payments || [];
    // Se cuadra con montos brutos (lo pactado) y netos (lo que de verdad
    // entró al banco despues de la retencion) por separado -para eso es
    // justo este resumen.
    const paymentTotals = useMemo(() => {
        const gross = payments.reduce((acc, p) => acc + Number(p.amount), 0);
        const withheld = payments.reduce((acc, p) => acc + Number(p.taxWithholdingAmount || 0), 0);
        return {
            gross,
            withheld,
            net: gross - withheld,
            pending: quotation ? Number(quotation.total) - gross : 0
        };
    }, [payments, quotation]);

    const handleDeletePayment = async (payment) => {
        const result = await Swal.fire({
            title: '¿Eliminar este pago?',
            text: `Se borrará el registro de ${formatCurrency(payment.amount)} del ${formatDate(payment.receivedDate)}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;

        try {
            await quotationService.deletePayment(id, payment.id);
            fetchQuotation();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo eliminar el pago.', 'error');
        }
    };

    const handleOpenPdf = async () => {
        const blob = await pdf(<QuotationDocument quotation={quotation} />).toBlob();
        const url = URL.createObjectURL(blob);
        // Se fuerza la descarga (no solo abrir en pestaña) para que el archivo
        // quede guardado con el número real de la cotización, no un nombre
        // genérico tipo "blob".
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formatQuotationId(quotation.correlativo)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Cargando detalles de la cotización...</div>;
    if (!quotation) return null;

    return (
        <div className="max-w-4xl mx-auto pb-10">

            {/* Cabecera de Navegación */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <button onClick={() => navigate("/app/quotations")} className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                    <ArrowLeft size={20} /> Volver al listado
                </button>

                <div className="flex gap-3">
                    <Link
                        to={`/app/quotations/edit/${id}`}
                        className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-lg text-gray-200 hover:bg-surface-hover transition-all shadow-sm"
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
            <div className="bg-surface-card rounded-xl shadow-xl border border-surface-border overflow-hidden">
                
                {/* Encabezado Documento */}
                <div className="bg-surface-base px-4 md:px-8 py-6 border-b border-surface-border">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="font-display text-3xl font-extrabold text-white">
                                {formatQuotationId(quotation.correlativo)}
                            </h1>
                            <p className="text-gray-400 mt-1 font-medium">
                                Emitida el {formatDate(quotation.createdAt)}
                            </p>
                            {quotation.projectReference && (
                                <p className="text-sm text-orange-400 font-semibold mt-1">
                                    {quotation.projectReference}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Registrada
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8">
                    {/* Datos Cliente y Vendedor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Información del Cliente</h3>
                            <p className="font-bold text-xl text-white mb-1">{quotation.client.name}</p>
                            <p className="text-gray-300 leading-relaxed">{quotation.client.address}</p>
                            <p className="text-gray-400 mt-2 font-medium">NIT: {quotation.client.taxId || 'C/F'}</p>
                        </div>
                        <div className="md:text-right">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Elaborado por</h3>
                            <p className="text-lg font-semibold text-white">{quotation.elaboratedBy || "No especificado"}</p>
                            <p className="text-sm text-gray-400 italic mt-1">Representante de Ventas</p>
                        </div>
                    </div>

                    {/* --- TABLA DE ÍTEMS ACTUALIZADA --- */}
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="border-b-2 border-surface-border text-gray-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-center w-16">Cant.</th>
                                    <th className="px-4 py-3">Descripción</th>
                                    <th className="px-4 py-3 text-right">P. Lista</th>
                                    <th className="px-4 py-3 text-center">% Desc.</th>
                                    <th className="px-4 py-3 text-right">P. Oferta</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {quotation.items.map((item, i) => {
                                    // Extraemos y calculamos los valores
                                    const listPrice = Number(item.listPrice) || 0;
                                    const discount = Number(item.discountPercent) || 0;
                                    const discountedUnitPrice = listPrice * (1 - discount / 100);

                                    return (
                                        <tr key={i} className="hover:bg-surface-hover transition-colors">
                                            <td className="px-4 py-4 text-center font-medium text-gray-300">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-white">
                                                {item.description}
                                            </td>
                                            
                                            {/* P. Lista (Tachado si hay descuento) */}
                                            <td className={`px-4 py-4 text-right ${discount > 0 ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                                                {discount > 0 ? formatCurrency(listPrice) : '-'}
                                            </td>
                                            
                                            {/* % Descuento (Con un badge resaltado) */}
                                            <td className="px-4 py-4 text-center text-gray-400">
                                                {discount > 0 ? (
                                                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                        -{discount}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            
                                            {/* P. Oferta (Azul para resaltar) */}
                                            <td className="px-4 py-4 text-right font-medium text-blue-400">
                                                {formatCurrency(discountedUnitPrice)}
                                            </td>
                                            
                                            {/* Total de línea (subtotalItem) */}
                                            <td className="px-4 py-4 text-right font-bold text-white">
                                                {formatCurrency(item.subtotalItem)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Sección de Totales */}
                    <div className="flex justify-end border-t border-surface-border pt-6">
                        <div className="w-72 space-y-3">
                            <div className="flex justify-between text-gray-400 font-medium">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium">
                                <span>IVA (12%):</span>
                                <span>{formatCurrency(quotation.tax)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black text-orange-400 border-t-2 border-orange-500/30 pt-3 mt-3">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(quotation.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Condiciones Comerciales */}
                    <div className="mt-12 bg-surface-base rounded-xl p-6 border border-surface-border">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Condiciones y Observaciones</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                                <p><span className="font-bold text-gray-200">Garantía:</span> <span className="text-gray-300">{quotation.warranty}</span></p>
                                <p><span className="font-bold text-gray-200">Tiempo de Entrega:</span> <span className="text-gray-300">{quotation.deliveryTime}</span></p>
                            </div>
                            <div className="space-y-2 md:text-right">
                                <p><span className="font-bold text-gray-200">Forma de Pago:</span> <span className="text-gray-300">{quotation.paymentMethod}</span></p>
                                <p><span className="font-bold text-gray-200">Validez:</span> <span className="text-gray-300">{quotation.validity || 'No especificada'}</span></p>
                            </div>
                        </div>
                        {quotation.observations && (
                            <div className="mt-4 pt-4 border-t border-surface-border">
                                <p className="text-gray-300 text-sm italic">
                                    <span className="font-bold not-italic text-gray-200">Notas:</span> {quotation.observations}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- PAGOS RECIBIDOS (solo dentro del sistema, no sale en el PDF) --- */}
            <div className="bg-surface-card rounded-xl shadow-sm border border-surface-border overflow-hidden mt-6">
                <div className="px-4 md:px-8 py-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Pagos recibidos</h2>
                            <p className="text-xs text-gray-400">Anticipos y pagos finales, para cuadrar contra el total cotizado</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-gradient hover:brightness-105 text-white rounded-lg font-semibold text-sm shadow-sm transition-all"
                    >
                        <Plus size={16} /> Registrar pago
                    </button>
                </div>

                {/* Resumen de cuadre */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-8 py-5 bg-surface-base border-b border-surface-border text-sm">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Recibido (bruto)</p>
                        <p className="font-bold text-white">{formatCurrency(paymentTotals.gross)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Retenido</p>
                        <p className="font-bold text-white">{formatCurrency(paymentTotals.withheld)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Neto recibido</p>
                        <p className="font-bold text-white">{formatCurrency(paymentTotals.net)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Saldo pendiente</p>
                        <p className={`font-bold ${paymentTotals.pending > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                            {formatCurrency(paymentTotals.pending)}
                        </p>
                    </div>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        Todavía no se ha registrado ningún pago para esta cotización.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-surface-base text-gray-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-4 md:px-8 py-3">Tipo</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3 text-right">Monto</th>
                                    <th className="px-4 py-3 text-right">Retención</th>
                                    <th className="px-4 py-3 text-right">Neto</th>
                                    <th className="px-4 py-3">Registrado por</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {payments.map((p) => {
                                    const withheld = Number(p.taxWithholdingAmount || 0);
                                    const net = Number(p.amount) - withheld;
                                    return (
                                        <tr key={p.id} className="hover:bg-surface-hover transition-colors group">
                                            <td className="px-4 md:px-8 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${PAYMENT_TYPE_STYLE[p.type]}`}>
                                                    {PAYMENT_TYPE_LABEL[p.type]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-300">{formatDate(p.receivedDate)}</td>
                                            <td className="px-4 py-4 text-right font-medium text-white">{formatCurrency(p.amount)}</td>
                                            <td className="px-4 py-4 text-right text-gray-400">
                                                {withheld > 0 ? (
                                                    <>
                                                        {formatCurrency(withheld)}
                                                        {p.taxWithholdingPercent && (
                                                            <span className="text-xs text-gray-400"> ({Number(p.taxWithholdingPercent)}%)</span>
                                                        )}
                                                    </>
                                                ) : "—"}
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-green-400">{formatCurrency(net)}</td>
                                            <td className="px-4 py-4 text-gray-400 text-sm">{p.createdBy?.name || p.createdBy?.email || "—"}</td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeletePayment(p)}
                                                    className="p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                                                    title="Eliminar pago"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                quotationId={id}
                onSuccess={fetchQuotation}
            />
        </div>
    );
}