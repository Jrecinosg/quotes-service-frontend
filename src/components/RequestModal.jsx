import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";
import { requestService } from "../services/request.service";
import { clientService } from "../services/client.service";
import Swal from "sweetalert2";

// clients: si se pasa (colaborador creando a nombre de un cliente), muestra
// el selector de empresa. Si se omite (cuenta CLIENT creando la suya), no.
export default function RequestModal({ isOpen, onClose, onSuccess, forStaff = false, defaultClientId = "" }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState(defaultClientId);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (forStaff && isOpen) {
      clientService.getAll().then(setClients).catch(() => {});
    }
  }, [forStaff, isOpen]);

  useEffect(() => {
    setClientId(defaultClientId || "");
  }, [defaultClientId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = forStaff ? { title, description, clientId } : { title, description };
      const created = await requestService.create(payload);
      Swal.fire("¡Enviada!", "La solicitud fue registrada.", "success");
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
        <div className="bg-brand-gradient px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Nueva solicitud</h2>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {forStaff && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Empresa cliente *</label>
              <select
                required
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Selecciona una empresa...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

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
              placeholder="Cuéntanos qué necesita con el mayor detalle posible."
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
              className="px-4 py-2 bg-brand-gradient text-white rounded-md hover:brightness-105 flex items-center gap-2 disabled:opacity-60"
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
