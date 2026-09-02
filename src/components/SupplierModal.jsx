import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save } from "lucide-react";
import { supplierService } from "../services/supplier.service";
import Swal from "sweetalert2";

const EMPTY = { name: "", contactName: "", phone: "", email: "" };

export default function SupplierModal({ isOpen, onClose, supplierToEdit, onSuccess }) {
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name || "",
        contactName: supplierToEdit.contactName || "",
        phone: supplierToEdit.phone || "",
        email: supplierToEdit.email || ""
      });
    } else {
      setFormData(EMPTY);
    }
  }, [supplierToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let saved;
      if (supplierToEdit) {
        saved = await supplierService.update(supplierToEdit.id, formData);
        Swal.fire("¡Actualizado!", "El proveedor ha sido modificado.", "success");
      } else {
        saved = await supplierService.create(formData);
        Swal.fire("¡Creado!", "El proveedor ha sido registrado.", "success");
      }
      onSuccess(saved);
      onClose();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo guardar el proveedor.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-brand-gradient px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">
            {supplierToEdit ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del proveedor *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Distribuidora Tecnológica S.A."
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del contacto</label>
            <input
              type="text"
              placeholder="Persona con quien se gestiona la garantía"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Footer del Form */}
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
              disabled={saving || !formData.name.trim()}
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
