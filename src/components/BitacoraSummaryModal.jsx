import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { toIsoDay, openPendings, isSupport } from "../utils/bitacora";
import { OriginChip } from "./BitacoraChips";
import { scanFields, confirmInternalData } from "../utils/bitacoraDetect";

// Cerrar el proyecto con su resumen final (mode="close") o solo editar el resumen (mode="edit").
// El resumen es lo primero que lee el cliente en el informe.
// Al cerrar, si quedan pendientes abiertos hay un paso previo: dejarlos como pendientes del cliente
// (sueltos, sin proyecto) o resolverlos ahora.
export default function BitacoraSummaryModal({ project, mode, onClose, onSaved }) {
  const closing = mode === "close";
  const support = isSupport(project);
  const open = closing ? openPendings(project) : [];
  const [summary, setSummary] = useState(project.finalSummary || "");
  const [endDate, setEndDate] = useState(toIsoDay(project.endDate));
  const [choices, setChoices] = useState(() => Object.fromEntries(open.map((p) => [p.id, "SUELTO"])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setAll = (value) => setChoices(Object.fromEntries(open.map((p) => [p.id, value])));
  const remaining = open.filter((p) => choices[p.id]); // los ya procesados se quitan de `choices`

  const submit = async (e) => {
    e.preventDefault();
    if (!(await confirmInternalData(scanFields([{ label: "Resumen final", text: summary }]), "Guardar así"))) return;
    setSaving(true);
    setError("");
    try {
      const finalSummary = summary.trim();
      let updated;
      if (closing) {
        // 1) Pendientes abiertos: resolver o dejar como del cliente. Si uno falla, el proyecto NO se cierra y se puede reintentar.
        for (const p of remaining) {
          try {
            if (choices[p.id] === "RESOLVER") await bitacoraService.resolvePending(p.id);
            else await bitacoraService.updatePending(p.id, { projectId: null });
            setChoices((prev) => { const next = { ...prev }; delete next[p.id]; return next; });
          } catch (err) {
            setError(err.response?.data?.error || `No se pudo procesar el pendiente «${p.text}». El proyecto sigue abierto; inténtalo de nuevo.`);
            return;
          }
        }
        // 2) Cierre
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

  const title = closing ? (support ? "Cerrar soporte" : "Cerrar proyecto") : "Resumen del informe";

  return createPortal(
    <div className="modal-overlay animate-overlay-in fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="bit-sum-title">
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/10">
          <h2 id="bit-sum-title" className="text-white font-semibold text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label htmlFor="bit-summary" className="block text-sm font-medium text-gray-300">Resumen final (lo lee el cliente)</label>
            <textarea id="bit-summary" rows={5} maxLength={5000} className="field mt-1 w-full" placeholder="Qué se pidió, qué se hizo y en qué estado quedó. Sin fechas ni horas." value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          {closing && (
            <div>
              <label htmlFor="bit-endd" className="block text-sm font-medium text-gray-300">Fecha de fin (opcional, uso interno)</label>
              <input id="bit-endd" type="date" min={toIsoDay(project.startDate)} className="field mt-1 w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Si la dejas vacía se usa hoy (o la fecha de inicio en proyectos de 1 día). No sale en el informe al cliente.</p>
            </div>
          )}

          {closing && open.length > 0 && (
            <fieldset className="rounded-xl p-4" style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.25)" }}>
              <legend className="px-1 text-sm font-semibold flex items-center gap-1.5" style={{ color: "#FCD34D" }}>
                <AlertTriangle size={14} aria-hidden="true" /> Quedan {open.length} {open.length === 1 ? "pendiente abierto" : "pendientes abiertos"}
              </legend>
              <p className="text-xs text-[#CBD5E1]">Elige qué pasa con cada uno. «Pendiente del cliente» lo deja suelto, sin proyecto, para atenderlo después.</p>
              <div className="flex gap-3 mt-2 text-xs">
                <button type="button" className="underline text-white" onClick={() => setAll("SUELTO")}>Todos al cliente</button>
                <button type="button" className="underline text-white" onClick={() => setAll("RESOLVER")}>Todos resueltos</button>
              </div>
              <ul className="mt-3 space-y-3">
                {remaining.map((p) => (
                  <li key={p.id}>
                    <p className="text-sm text-white break-words">{p.text} <span className="inline-flex align-middle ml-1"><OriginChip origin={p.origin} /></span></p>
                    <div className="seg mt-1.5" role="group" aria-label={`Qué hacer con «${p.text}»`}>
                      <button type="button" className="seg-item" aria-pressed={choices[p.id] === "SUELTO"} onClick={() => setChoices((c) => ({ ...c, [p.id]: "SUELTO" }))}>Pendiente del cliente</button>
                      <button type="button" className="seg-item" aria-pressed={choices[p.id] === "RESOLVER"} onClick={() => setChoices((c) => ({ ...c, [p.id]: "RESOLVER" }))}>Resolver ahora</button>
                    </div>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2">Cancelar</button>
            <button type="submit" className="btn btn-primary px-5 py-2" aria-busy={saving} disabled={saving}>{closing ? title : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
