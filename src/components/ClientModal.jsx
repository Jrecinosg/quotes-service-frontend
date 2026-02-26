import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save } from "lucide-react";
import { clientService } from "../services/client.service";
import Swal from "sweetalert2";

export default function ClientModal({ isOpen, onClose, clientToEdit, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    email: "",
    phone: "",
    address: "",
    contactName: ""
  });

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || "",
        taxId: clientToEdit.taxId || "",
        email: clientToEdit.email || "",
        phone: clientToEdit.phone || "",
        address: clientToEdit.address || "",
        contactName: clientToEdit.contactName || ""
      });
    } else {
      setFormData({ name: "", taxId: "", email: "", phone: "", address: "", contactName: "" });
    }
  }, [clientToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedClient;

      if (clientToEdit) {
        savedClient = await clientService.update(clientToEdit.id, formData);
        Swal.fire("¡Actualizado!", "El cliente ha sido modificado.", "success");
      } else {
        savedClient = await clientService.create(formData);
        Swal.fire("¡Creado!", "El cliente ha sido registrado.", "success");
      }

      // Envía el cliente guardado a la función onSuccess
      onSuccess(savedClient);
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar el cliente.", "error");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">
            {clientToEdit ? "Editar Cliente" : "Nuevo Cliente"}
          </h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre / Razón Social *</label>
            <input
              type="text"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">NIT *</label>
              <input
                type="text"
                required
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del contacto</label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />
          </div>

          {/* Footer del Form */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={18} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}