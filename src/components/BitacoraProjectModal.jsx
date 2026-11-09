import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { toIsoDay, todayIso } from "../utils/bitacora";

// Ventana "Nuevo proyecto" / "Editar proyecto" de la Bitácora (edición: se pasa `project`; el cliente no se cambia)
export default function BitacoraProjectModal({ isOpen, onClose, onCreated, project = null, defaultClientId = "" }) {
  const editing = !!project;
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(() => (project
    ? { clientId: String(project.client?.id ?? project.clientId ?? ""), name: project.name || "", type: project.type || "UN_DIA", startDate: toIsoDay(project.startDate), endDate: project.type === "VARIOS_DIAS" ? toIsoDay(project.endDate) : "", technicianName: project.technicianName || "" }
    : { clientId: defaultClientId, name: "", type: "UN_DIA", startDate: todayIso(), endDate: "", technicianName: "" }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isOpen || editing) return undefined;
    let alive = true;
    bitacoraService.getClients().then((c) => { if (alive) setClients(c); }).catch(() => { if (alive) setServerError("No se pudo cargar la lista de clientes."); });
    return () => { alive = false; };
  }, [isOpen, editing]);

  if (!isOpen) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.clientId) next.clientId = "Elige el cliente.";
    if (!form.name.trim()) next.name = "Escribe el título del proyecto.";
    if (!form.startDate) next.startDate = "Indica la fecha de inicio.";
    if (form.type === "VARIOS_DIAS" && form.endDate && form.endDate < form.startDate) next.endDate = "La fecha de fin no puede ser anterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setServerError("");
    try {
      const technicianName = form.technicianName.trim();
      const common = {
        name: form.name.trim(),
        type: form.type,
        startDate: form.startDate,
        ...(form.type === "VARIOS_DIAS" && form.endDate ? { endDate: form.endDate } : {}),
      };
      const saved = editing
        ? await bitacoraService.updateProject(project.id, { ...common, technicianName })
        : await bitacoraService.createProject({ clientId: Number(form.clientId), ...common, ...(technicianName ? { technicianName } : {}) });
      onCreated(saved);
    } catch (error) {
      setServerError(error.response?.data?.error || "No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  const err = (k) => (errors[k] ? <p className="text-xs text-red-300 mt-1" role="alert">{errors[k]}</p> : null);

  return createPortal(
    <div className="modal-overlay animate-overlay-in fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="bit-new-title">
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/10">
          <h2 id="bit-new-title" className="text-white font-semibold text-lg">{editing ? "Editar proyecto" : "Nuevo proyecto"}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4" noValidate>
          <div>
            <label htmlFor="bit-client" className="block text-sm font-medium text-gray-300">Cliente *</label>
            <select id="bit-client" className="field mt-1 w-full" disabled={editing} value={form.clientId} onChange={(e) => set({ clientId: e.target.value })}>
              {editing && <option value={form.clientId}>{project.client?.name}</option>}
              <option value="">Selecciona un cliente…</option>
              {clients.filter((c) => !editing || String(c.id) !== form.clientId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err("clientId")}
          </div>
          <div>
            <label htmlFor="bit-name" className="block text-sm font-medium text-gray-300">Título del proyecto *</label>
            <input id="bit-name" className="field mt-1 w-full" maxLength={200} placeholder="Ej. Instalación de base de cámara en bodega" value={form.name} onChange={(e) => set({ name: e.target.value })} />
            {err("name")}
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-300 mb-1">Tipo</span>
            <div className="seg" role="group" aria-label="Tipo de proyecto">
              <button type="button" className="seg-item" aria-pressed={form.type === "UN_DIA"} onClick={() => set({ type: "UN_DIA", endDate: "" })}>1 día</button>
              <button type="button" className="seg-item" aria-pressed={form.type === "VARIOS_DIAS"} onClick={() => set({ type: "VARIOS_DIAS" })}>Varios días</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bit-start" className="block text-sm font-medium text-gray-300">Fecha de inicio *</label>
              <input id="bit-start" type="date" className="field mt-1 w-full" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
              {err("startDate")}
            </div>
            {form.type === "VARIOS_DIAS" && (
              <div>
                <label htmlFor="bit-end" className="block text-sm font-medium text-gray-300">Fecha de fin (opcional)</label>
                <input id="bit-end" type="date" min={form.startDate} className="field mt-1 w-full" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
                {err("endDate")}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="bit-tech" className="block text-sm font-medium text-gray-300">Responsable técnico (opcional)</label>
            <input id="bit-tech" className="field mt-1 w-full" maxLength={120} placeholder="Ej. Carlos Pérez" value={form.technicianName} onChange={(e) => set({ technicianName: e.target.value })} aria-describedby="bit-tech-help" />
            <p id="bit-tech-help" className="text-xs text-[#9FB0C4] mt-1">Aparece en la portada y como firma del informe al cliente.</p>
          </div>
          {serverError && <p className="text-sm text-red-300" role="alert">{serverError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2">Cancelar</button>
            <button type="submit" className="btn btn-primary px-5 py-2" aria-busy={saving} disabled={saving}>{editing ? "Guardar cambios" : "Crear proyecto"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
