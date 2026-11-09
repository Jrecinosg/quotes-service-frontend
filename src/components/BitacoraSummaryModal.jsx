import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { toIsoDay } from "../utils/bitacora";

// Cerrar el proyecto con su resumen final (mode="close") o solo editar el resumen (mode="edit").
// El resumen es lo primero que lee el cliente en el informe.
export default function BitacoraSummaryModal({ project, mode, onClose, onSaved }) {
  const closing = mode === "close";
  const [summary, setSummary] = useState(project.finalSummary || "");
  const [endDate, setEndDate] = useState(toIsoDay(project.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const finalSummary = summary.trim();
      let updated;
      if (closing) {
        updated = await bitacoraService.closeProject(project.id, { ...(finalSummary ? { finalSummary } : {}), ...(endDate ? { endDate } : {}) });
      } else {
        updated = await bitacoraService.updateProject(project.id, { finalSummary });
      }
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay animate-overlay-in fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="bit-sum-title">
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/10">
          <h2 id="bit-sum-title" className="text-white font-semibold text-lg">{closing ? "Cerrar proyecto" : "Resumen del informe"}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label htmlFor="bit-summary" className="block text-sm font-medium text-gray-300">Resumen final (lo lee el cliente)</label>
            <textarea id="bit-summary" rows={5} maxLength={5000} className="field mt-1 w-full" placeholder="Qué se pidió, qué se hizo y en qué estado quedó." value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          {closing && (
            <div>
              <label htmlFor="bit-endd" className="block text-sm font-medium text-gray-300">Fecha de fin (opcional)</label>
              <input id="bit-endd" type="date" min={toIsoDay(project.startDate)} className="field mt-1 w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Si la dejas vacía se usa hoy (o la fecha de inicio en proyectos de 1 día).</p>
            </div>
          )}
          {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2">Cancelar</button>
            <button type="submit" className="btn btn-primary px-5 py-2" aria-busy={saving} disabled={saving}>{closing ? "Cerrar proyecto" : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
