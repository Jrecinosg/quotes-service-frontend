import { useState } from "react";
import { Lock, Plus, Trash2, CornerDownRight } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { formatShortDate, isDone, isOverdue, openPendings, ORIGINS } from "../utils/bitacora";
import { OriginChip } from "./BitacoraChips";
import Swal from "sweetalert2";

// Pendientes del proyecto/soporte (checklist interno). Nunca salen en el informe del cliente.
// Cada pendiente muestra en qué reporte nació y en cuál se cerró (con vínculo a la entrada).
export default function BitacoraPendings({ project, entries = [], onChanged, onGoToEntry }) {
  const [text, setText] = useState("");
  const [origin, setOrigin] = useState("CLIENTE");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const pendings = project.pendings || [];
  const open = openPendings(project).length;
  const entryById = new Map(entries.map((e) => [e.id, e]));

  const run = async (fn, fallback) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || fallback, "error");
    } finally {
      setBusy(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    run(async () => {
      await bitacoraService.createPendingV2({
        clientId: project.client?.id ?? project.clientId,
        projectId: project.id,
        origin,
        text: text.trim(),
        ...(assignee.trim() ? { assignee: assignee.trim() } : {}),
        ...(dueDate ? { dueDate } : {}),
      });
      setText(""); setAssignee(""); setDueDate("");
    }, "No se pudo agregar el pendiente.");
  };

  const toggle = (p) => run(
    () => (isDone(p) ? bitacoraService.updatePending(p.id, { done: false }) : bitacoraService.resolvePending(p.id)),
    "No se pudo actualizar el pendiente."
  );

  const remove = async (p) => {
    const r = await Swal.fire({ title: "¿Quitar este pendiente?", text: p.text, icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Sí, quitar", cancelButtonText: "Cancelar" });
    if (r.isConfirmed) run(() => bitacoraService.deletePending(p.id), "No se pudo quitar el pendiente.");
  };

  const EntryLink = ({ id, prefix }) => {
    const entry = entryById.get(id);
    if (!entry) return null;
    return (
      <button type="button" className="inline-flex items-center gap-1 text-[#7DD3FF] hover:text-white underline-offset-2 hover:underline min-h-[24px]" onClick={() => onGoToEntry?.(id)}>
        <CornerDownRight size={11} aria-hidden="true" /> {prefix} {formatShortDate(entry.date, false)}
      </button>
    );
  };

  return (
    <section className="card p-5" aria-labelledby="bit-pend-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="bit-pend-title" className="text-white font-semibold text-base">Pendientes</h2>
        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,.07)", color: "#CBD5E1" }}>
          {open} {open === 1 ? "abierto" : "abiertos"}
        </span>
      </div>
      <p className="text-xs text-[#9FB0C4] mt-1 flex items-center gap-1.5"><Lock size={12} aria-hidden="true" /> Solo equipo · no sale en el informe del cliente</p>

      {pendings.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No hay pendientes. Agrega el primero abajo.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {pendings.map((p) => {
            const over = isOverdue(p);
            const done = isDone(p);
            return (
              <li key={p.id} className="flex items-start gap-1 py-2 min-h-[52px]">
                <button type="button" onClick={() => toggle(p)} disabled={busy} role="checkbox" aria-checked={done} aria-label={`Marcar «${p.text}» como ${done ? "abierto" : "hecho"}`} className="w-11 h-11 -ml-2 shrink-0 flex items-center justify-center">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors" style={{ borderColor: done ? "#2bb8ff" : "#6b7d92", background: done ? "#2bb8ff" : "transparent" }}>
                    {done && <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 5 9.5 10 3" stroke="#06101e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                </button>
                <div className="flex-1 min-w-0 pt-2.5">
                  <p className={`text-sm break-words ${done ? "line-through text-gray-500" : "text-white"}`}>{p.text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <OriginChip origin={p.origin} />
                    {p.assignee && <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,.07)", color: "#CBD5E1" }}>{p.assignee}</span>}
                    {p.dueDate && !done && (
                      <span style={{ color: over ? "#FCA5A5" : "#9FB0C4" }} className="tabular-nums">
                        {formatShortDate(p.dueDate, false)}{over ? " · Vencido" : ""}
                      </span>
                    )}
                  </div>
                  {(p.createdFromEntryId || p.resolvedInEntryId || (done && !p.resolvedInEntryId)) && (
                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-[#9FB0C4]">
                      {p.createdFromEntryId && <EntryLink id={p.createdFromEntryId} prefix="Nació en el reporte del" />}
                      {p.resolvedInEntryId
                        ? <EntryLink id={p.resolvedInEntryId} prefix="Se cerró en el reporte del" />
                        : done && <span>Cerrado sin reporte asociado</span>}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => remove(p)} disabled={busy} className="btn btn-ghost btn-icon w-11 h-11 shrink-0" aria-label={`Quitar pendiente «${p.text}»`}><Trash2 size={16} /></button>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={add} className="mt-3 pt-3 border-t border-white/10 space-y-2">
        <input className="field w-full text-sm" placeholder="Nuevo pendiente…" maxLength={1000} aria-label="Nuevo pendiente" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="grid grid-cols-1 gap-2">
          <select className="field text-sm w-full min-w-0" aria-label="Origen del pendiente" value={origin} onChange={(e) => setOrigin(e.target.value)}>
            {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>Origen: {v}</option>)}
          </select>
          <input className="field text-sm w-full min-w-0" placeholder="Responsable" maxLength={120} aria-label="Responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          <input type="date" className="field text-sm w-full min-w-0" aria-label="Fecha límite" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary px-4 py-2 w-full flex items-center justify-center gap-2" disabled={busy || !text.trim()}><Plus size={16} /> Agregar</button>
      </form>
    </section>
  );
}
