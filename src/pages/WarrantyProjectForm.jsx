import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Plus, Trash2, ArrowLeft, Package, FileText, Truck } from "lucide-react";
import { warrantyService } from "../services/warranty.service";
import { supplierService } from "../services/supplier.service";
import ClientSearch from "../components/ClientSearch";
import SupplierModal from "../components/SupplierModal";
import { toDateInputValue } from "../utils/formatters";
import Swal from "sweetalert2";

const emptyItem = () => ({
  supplierId: "",
  description: "",
  quantity: 1,
  purchaseDate: "",
  supplierInvoiceNumber: "",
  serialNumber: ""
});

export default function WarrantyProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [client, setClient] = useState(null);
  const [header, setHeader] = useState({
    title: "",
    clientInvoiceNumber: "",
    clientInvoiceDate: "" // opcional: se completa cuando de verdad se facture al cliente
  });
  const [items, setItems] = useState([emptyItem()]);

  const [suppliers, setSuppliers] = useState([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  // Fila que pidió crear el proveedor: al guardarlo se selecciona ahí mismo,
  // para no perder el hilo de lo que estaba capturando.
  const [supplierTargetIndex, setSupplierTargetIndex] = useState(null);

  useEffect(() => {
    supplierService.getAll().then(setSuppliers).catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    warrantyService.getById(id)
      .then((data) => {
        setClient(data.client);
        setHeader({
          title: data.title || "",
          clientInvoiceNumber: data.clientInvoiceNumber || "",
          clientInvoiceDate: toDateInputValue(data.clientInvoiceDate)
        });
        setItems(
          (data.items || []).map((i) => ({
            supplierId: String(i.supplierId),
            description: i.description || "",
            quantity: Number(i.quantity) || 1,
            purchaseDate: toDateInputValue(i.purchaseDate),
            supplierInvoiceNumber: i.supplierInvoiceNumber || "",
            serialNumber: i.serialNumber || ""
          }))
        );
      })
      .catch(() => {
        Swal.fire("Error", "No se pudo cargar el proyecto de garantía", "error");
        navigate("/app/warranties");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleItemChange = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const openSupplierModal = (index) => {
    setSupplierTargetIndex(index);
    setIsSupplierModalOpen(true);
  };

  const handleSupplierCreated = async (newSupplier) => {
    const fresh = await supplierService.getAll();
    setSuppliers(fresh);
    if (newSupplier && supplierTargetIndex !== null) {
      handleItemChange(supplierTargetIndex, "supplierId", String(newSupplier.id));
    }
    setSupplierTargetIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) return Swal.fire("Falta el cliente", "Selecciona a qué cliente pertenece este proyecto.", "warning");

    const payload = {
      clientId: client.id,
      title: header.title.trim(),
      clientInvoiceNumber: header.clientInvoiceNumber.trim(),
      clientInvoiceDate: header.clientInvoiceDate,
      items: items.map((item) => ({
        supplierId: Number(item.supplierId),
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        purchaseDate: item.purchaseDate,
        supplierInvoiceNumber: item.supplierInvoiceNumber.trim(),
        serialNumber: item.serialNumber.trim()
      }))
    };

    setSaving(true);
    try {
      if (isEditing) {
        await warrantyService.update(id, payload);
        Swal.fire("¡Actualizado!", "El proyecto de garantía se guardó correctamente.", "success");
        navigate(`/app/warranties/${id}`);
      } else {
        const created = await warrantyService.create(payload);
        Swal.fire("¡Registrado!", "El proyecto de garantía quedó guardado.", "success");
        navigate(`/app/warranties/${created.id}`);
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo guardar el proyecto.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Enter dentro de un input no debe enviar el formulario a medio capturar
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando proyecto...</div>;

  const inputClass = "w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("/app/warranties")}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">
            {isEditing ? "Editar proyecto de garantía" : "Nuevo proyecto de garantía"}
          </h1>
          <p className="text-gray-500 text-sm">
            Registra a quién se le facturó y de qué proveedor salió cada equipo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">

        {/* Datos del proyecto */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <h2 className="font-semibold text-gray-800">Datos del proyecto</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>Cliente *</label>
              <ClientSearch onSelect={setClient} selectedClient={client} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className={labelClass}>Título del proyecto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Instalación CCTV bodega 2"
                  className={inputClass}
                  value={header.title}
                  onChange={(e) => setHeader({ ...header, title: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>No. de factura emitida al cliente</label>
                <input
                  type="text"
                  placeholder="Se puede completar después, cuando factures"
                  className={inputClass}
                  value={header.clientInvoiceNumber}
                  onChange={(e) => setHeader({ ...header, clientInvoiceNumber: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Fecha de esa factura</label>
                <input
                  type="date"
                  className={inputClass}
                  value={header.clientInvoiceDate}
                  onChange={(e) => setHeader({ ...header, clientInvoiceDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Equipos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Equipos del proyecto</h2>
                <p className="text-xs text-gray-500">Cada equipo lleva su propio proveedor, compra y factura</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-400 sm:ml-auto">
              {items.length} equipo{items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Equipo #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    title={items.length === 1 ? "El proyecto necesita al menos un equipo" : "Quitar este equipo"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className={labelClass}>Proveedor *</label>
                    <select
                      required
                      className={`${inputClass} bg-white`}
                      value={item.supplierId}
                      onChange={(e) => handleItemChange(index, "supplierId", e.target.value)}
                    >
                      <option value="">Selecciona proveedor...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openSupplierModal(index)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <Truck size={13} /> Nuevo proveedor
                    </button>
                  </div>

                  <div className="md:col-span-6">
                    <label className={labelClass}>Descripción del equipo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Cámara IP domo 4MP DS-2CD1143G0"
                      className={inputClass}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className={`${inputClass} text-center`}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className={labelClass}>Fecha de compra *</label>
                    <input
                      type="date"
                      required
                      className={inputClass}
                      value={item.purchaseDate}
                      onChange={(e) => handleItemChange(index, "purchaseDate", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className={labelClass}>Factura del proveedor *</label>
                    <input
                      type="text"
                      required
                      placeholder="No. de factura que le dio el proveedor"
                      className={inputClass}
                      value={item.supplierInvoiceNumber}
                      onChange={(e) => handleItemChange(index, "supplierInvoiceNumber", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className={labelClass}>No. de serie</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      className={`${inputClass} font-mono`}
                      value={item.serialNumber}
                      onChange={(e) => handleItemChange(index, "serialNumber", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
          >
            <Plus size={16} /> Agregar equipo
          </button>
        </div>

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/warranties")}
            className="px-5 py-3 rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-brand-gradient hover:brightness-105 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 transition-all"
          >
            <Save size={18} />
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Registrar garantía"}
          </button>
        </div>
      </form>

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => { setIsSupplierModalOpen(false); setSupplierTargetIndex(null); }}
        onSuccess={handleSupplierCreated}
      />
    </div>
  );
}
