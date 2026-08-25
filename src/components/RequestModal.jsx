import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";
import { requestService } from "../services/request.service";
import Swal from "sweetalert2";

export default function RequestModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await requestService.create({ title, description });
      Swal.fire("¡Enviada!", "Tu solicitud fue registrada.", "success");
      setTitle("");
      setDescription("");
      onSuccess(created);
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.response?.data?.error || "No se pudo enviar la solicitud.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Nueva solicitud</h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título *</label>
            <input
              type="text"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. Cámara sin señal en bodega 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción *</label>
            <textarea
              required
              rows={4}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cuéntanos qué necesitas con el mayor detalle posible."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={18} />
              {saving ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
