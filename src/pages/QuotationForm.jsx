import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Plus, Trash2, ArrowLeft, Calendar } from "lucide-react";
import { quotationService } from "../services/quotation.service";
import { useAuth } from "../context/AuthContext";
import ClientSearch from "../components/ClientSearch";
import Swal from "sweetalert2";
import { formatCurrency } from "../utils/formatters";

export default function QuotationForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // --- ESTADOS ---
    const [client, setClient] = useState(null);

    // 2. Orden de columnas cambiado: Cantidad primero
    const [items, setItems] = useState([
        // Cambiamos unitPrice por listPrice y total por subtotalItem
        { quantity: 1, description: "", listPrice: 0, discount: 0, subtotalItem: 0 }
    ]);

    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

    // 3. Textos del Pie de Página (Con valores por defecto de tu imagen)
    const [terms, setTerms] = useState({
        warranty: "ÚNICAMENTE EN EQUIPOS, 12 MESES SOBRE DESPERFECTOS DE FÁBRICA EN DISPOSITIVOS.",
        deliveryTime: "1-2 DÍAS HÁBILES",
        paymentMethod: "50% Anticipo - 50% Contra entrega",
        validity: "15 días hábiles o hasta agotar existencias.",
        elaboratedBy: user?.name || "Nombre del Vendedor",
        observations: "No se cubre garantía por daños provocados por energía eléctrica si no cuenta con la protección adecuada, vandalismo, mal manejo de los equipos, o intervención de personal ajeno a Grupo AC. INCLUYE INSTALACIÓN DE EQUIPOS."
    });

    // --- CÁLCULOS ---
    useEffect(() => {
        const total = items.reduce((acc, item) => {
            const price = Number(item.listPrice) || 0;
            const disc = Number(item.discount) || 0;
            const qty = Number(item.quantity) || 0;

            const priceWithDiscount = price * (1 - disc / 100);
            return acc + (qty * priceWithDiscount);
        }, 0);
        const subtotal = total / 1.12;
        const tax = total - subtotal;
        setTotals({ subtotal, tax, total });
    }, [items]);

    useEffect(() => {
        if (id) {
            setLoading(true);
            quotationService.getById(id)
                .then(data => {
                    setClient(data.client);

                    const formattedItems = data.items.map(i => ({
                        quantity: Number(i.quantity),
                        description: i.description,
                        listPrice: Number(i.listPrice),
                        discount: Number(i.discountPercent || 0),
                        subtotalItem: Number(i.subtotalItem)
                    }));
                    setItems(formattedItems);

                    setTerms({
                        warranty: data.warranty || "",
                        deliveryTime: data.deliveryTime || "",
                        paymentMethod: data.paymentMethod || "",
                        validity: data.validity || "",
                        elaboratedBy: data.elaboratedBy || "",
                        observations: data.observations || ""
                    });
                })
                .catch(error => {
                    console.error(error);
                    Swal.fire("Error", "No se pudo cargar la cotización", "error");
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    // --- LÓGICA DE ÍTEMS ---
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        const qty = Number(newItems[index].quantity) || 0;
        const price = Number(newItems[index].listPrice) || 0;
        const disc = Number(newItems[index].discount) || 0;

        const priceWithDiscount = price * (1 - disc / 100);
        newItems[index].subtotalItem = qty * priceWithDiscount;

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { quantity: 1, description: "", listPrice: 0, discount: 0, subtotalItem: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    // --- GUARDAR ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!client) return Swal.fire("Error", "Debes seleccionar un cliente", "error");
        if (totals.total === 0) return Swal.fire("Error", "La cotización no puede estar vacía", "error");

        setLoading(true);
        const payload = {
            clientId: client.id,
            items: items.map(item => ({
                quantity: item.quantity,
                description: item.description,
                listPrice: item.listPrice,
                discountPercent: item.discount,
                subtotalItem: item.subtotalItem
            })),
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            ...terms
        };

        try {
            /*if (id) {
                await quotationService.update(id, payload);
                Swal.fire("¡Actualizado!", "La cotización ha sido modificada", "success");
            } else {
                await quotationService.create(payload);
                Swal.fire("¡Creado!", "Cotización guardada exitosamente", "success");
            }*/
            await quotationService.create(payload);

            Swal.fire(
                "¡Cotización Guardada!",
                id ? "Se ha generado una nueva versión con un nuevo correlativo." : "Cotización creada exitosamente",
                "success"
            );
            navigate("/quotations");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
        }
    };

    // Fecha actual para mostrar en el encabezado
    const today = new Date().toLocaleDateString();

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Botón Volver */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {id ? `Editar Cotización` : "Nueva Cotización"}
                </h1>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">

                {/* === SECCIÓN 1: ENCABEZADO (Estructura de la Imagen 1) === */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between gap-8">

                        {/* Izquierda: Datos del Cliente */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <label className="font-bold text-gray-700 w-24">Fecha:</label>
                                <span className="text-gray-600 flex items-center gap-2 bg-gray-50 px-3 py-1 rounded">
                                    <Calendar size={16} /> {today}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-700">Cliente:</label>
                                <ClientSearch onSelect={setClient} selectedClient={client} />
                            </div>

                            {client && (
                                <>
                                    <div className="flex gap-2">
                                        <label className="font-bold text-gray-700 w-24">Dirección:</label>
                                        <span className="text-gray-600 border-b border-gray-200 flex-1">{client.address || "---"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <label className="font-bold text-gray-700 w-24">NIT:</label>
                                        <span className="text-gray-600 border-b border-gray-200 flex-1">{client.taxId || "---"}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Derecha/Centro: Título del Proyecto y Logo */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                            {/* Aquí iría el Logo de empresa */}
                            {/* <img src="/logo.png" className="h-16 mb-2" /> */}

                        </div>
                    </div>
                </div>

                {/* === SECCIÓN 2: TABLA DE ÍTEMS (Cantidad Primero) === */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-orange-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 w-[10%] text-center font-bold">Cantidad</th>
                                    <th className="px-4 py-3 w-[50%] font-bold text-center">Descripción</th>
                                    <th className="px-4 py-3 w-[15%] text-right font-bold">P. Unitario</th>
                                    <th className="px-4 py-3 w-[10%] text-center font-bold">% Desc.</th>
                                    <th className="px-4 py-3 w-[10%] text-right font-bold">P. Oferta</th>
                                    <th className="px-4 py-3 w-[15%] text-right font-bold">P. Total</th>
                                    <th className="px-4 py-3 w-[5%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => {
                                    // Calculamos el precio con descuento por unidad solo para mostrarlo
                                    const listPrice = Number(item.listPrice) || 0;
                                    const discount = Number(item.discount) || 0;
                                    const discountedUnitPrice = listPrice * (1 - discount / 100);

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            {/* 1. Cantidad */}
                                            <td className="p-2">
                                                <input
                                                    type="number" min="1"
                                                    className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                />
                                            </td>

                                            {/* 2. Descripción */}
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="Descripción del producto..."
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                />
                                            </td>

                                            {/* 3. Precio Lista (El precio base) */}
                                            <td className="p-2">
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    className="w-full p-2 border border-gray-300 rounded text-right focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={item.listPrice}
                                                    onChange={(e) => handleItemChange(index, 'listPrice', Number(e.target.value))}
                                                />
                                            </td>

                                            {/* 4. % Descuento */}
                                            <td className="p-2">
                                                <input
                                                    type="number" min="0" max="100"
                                                    className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50 font-bold text-orange-700"
                                                    value={item.discount}
                                                    onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                                                />
                                            </td>

                                            {/* 5. Precio Unitario Oferta (Solo lectura) */}
                                            <td className="p-2 text-right font-medium text-blue-700 bg-blue-50/30">
                                                {formatCurrency(discountedUnitPrice)}
                                            </td>

                                            {/* 6. Total Calculado de la línea (SubtotalItem) */}
                                            <td className="p-2 text-right font-bold text-gray-800">
                                                {formatCurrency(item.subtotalItem)}
                                            </td>

                                            {/* 7. Botón Borrar */}
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>


                    <div className="p-2 bg-gray-50 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-2 text-orange-600 hover:text-orange-800 font-bold text-sm px-4 py-2"
                        >
                            <Plus size={16} /> Agregar Fila
                        </button>
                    </div>
                </div>

                {/* === SECCIÓN 3: TOTALES Y PIE DE PÁGINA (Estructura de la Imagen 2) === */}
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Izquierda: Términos y Condiciones (Editable) */}
                    <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-3 text-sm">

                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800">Garantía:</label>
                            <input
                                className="w-full p-1 border-b border-gray-300 focus:border-orange-500 outline-none text-gray-600"
                                value={terms.warranty}
                                onChange={(e) => setTerms({ ...terms, warranty: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800">Entrega:</label>
                            <input
                                className="w-full p-1 border-b border-gray-300 focus:border-orange-500 outline-none text-gray-600"
                                value={terms.deliveryTime}
                                onChange={(e) => setTerms({ ...terms, deliveryTime: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800">Forma de pago:</label>
                            <input
                                className="w-full p-1 border-b border-gray-300 focus:border-orange-500 outline-none text-gray-600 italic"
                                value={terms.paymentMethod}
                                onChange={(e) => setTerms({ ...terms, paymentMethod: e.target.value })}
                            />
                        </div>

                        {/* Campo de Validez en la Interfaz */}
                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800">Validez:</label>
                            <input
                                className="w-full p-1 border-b border-gray-300 focus:border-orange-500 outline-none text-gray-600"
                                value={terms.validity}
                                onChange={(e) => setTerms({ ...terms, validity: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800">Elaborado por:</label>
                            <input
                                className="w-full p-1 border-b border-gray-300 focus:border-orange-500 outline-none text-blue-600"
                                value={terms.elaboratedBy}
                                onChange={(e) => setTerms({ ...terms, elaboratedBy: e.target.value })}
                            />
                        </div>

                        <div className="pt-2">
                            <label className="font-bold text-gray-800 block mb-1">Observaciones:</label>
                            <textarea
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded focus:border-orange-500 outline-none text-gray-600 text-xs resize-none"
                                value={terms.observations}
                                onChange={(e) => setTerms({ ...terms, observations: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Derecha: Totales y Botón Guardar */}
                    <div className="flex flex-col gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between py-2 text-gray-600">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-100">
                                <span>IVA (12%):</span>
                                <span>{formatCurrency(totals.tax)}</span>
                            </div>

                            <div className="flex justify-between items-center bg-orange-600 text-white p-3 rounded mt-2">
                                <span className="font-bold text-lg">TOTAL</span>
                                <span className="font-bold text-xl">{formatCurrency(totals.total)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            <Save size={20} />
                            {loading ? "Generando..." : "Guardar Cotización"}
                        </button>
                    </div>

                </div>

            </form>
        </div>
    );
}