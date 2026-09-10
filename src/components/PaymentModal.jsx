import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Save } from "lucide-react";
import { quotationService } from "../services/quotation.service";
import { roundCurrency } from "../utils/formatters";
import Swal from "sweetalert2";

const todayInputValue = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const EMPTY = {
  type: "ANTICIPO",
  receivedDate: "",
  amount: "",
  taxWithholdingPercent: "",
  taxWithholdingAmount: "",
  notes: ""
};

export default function PaymentModal({ isOpen, onClose, quotationId, onSuccess }) {
  const [formData, setFormData] = useState(() => ({ ...EMPTY, receivedDate: todayInputValue() }));
  const [saving, setSaving] = useState(false);

  // El % es solo de apoyo: calcula el monto retenido solo, pero se puede
  // editar el monto a mano si el % no calza exacto (redondeos, etc).
  const handlePercentChange = (value) => {
    const percent = Number(value);
    const amount = Number(formData.amount) || 0;
    const withheld = value && amount > 0 ? roundCurrency(amount * (percent / 100)) : "";
    setFormData({ ...formData, taxWithholdingPercent: value, taxWithholdingAmount: withheld === "" ? "" : String(withheld) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: formData.type,
        receivedDate: formData.receivedDate,
        amount: Number(formData.amount),
        taxWithholdingPercent: formData.taxWithholdingPercent ? Number(formData.taxWithholdingPercent) : null,
        taxWithholdingAmount: formData.taxWithholdingAmount ? Number(formData.taxWithholdingAmount) : null,
        notes: formData.notes.trim()
      };
      const created = await quotationService.addPayment(quotationId, payload);
      Swal.fire("¡Registrado!", "El pago quedó guardado.", "success");
      onSuccess(created);
      onClose();
      setFormData({ ...EMPTY, receivedDate: todayInputValue() });
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo registrar el pago.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="bg-brand-gradient px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Registrar pago recibido</h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de pago *</label>
            <select
              required
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="ANTICIPO">Anticipo</option>
              <option value="FINAL">Pago final</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha en que se recibió *</label>
              <input
                type="date"
                required
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto acordado *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ej. 5000.00"
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Retención de impuesto (opcional)</p>
            <p className="text-xs text-gray-400 mb-3">Solo si el cliente retiene -algunas empresas lo hacen, otras no.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">% Retenido</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ej. 5"
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.taxWithholdingPercent}
                  onChange={(e) => handlePercentChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto retenido</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Se calcula solo"
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.taxWithholdingAmount}
                  onChange={(e) => setFormData({ ...formData, taxWithholdingAmount: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <input
              type="text"
              placeholder="Opcional -ej. número de depósito"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-gradient text-white rounded-lg hover:brightness-105 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
