import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ImagePlus, Trash2, AlertTriangle, Plus, ListPlus } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { uploadPhotosSequentially } from "../utils/bitacoraUpload";
import { todayIso, toIsoDay, openPendings, isSupport, ORIGINS, formatShortDate } from "../utils/bitacora";
import BitacoraPhotoFlags from "./BitacoraPhotoFlags";
import { OriginChip } from "./BitacoraChips";
import { scanFields, confirmInternalData } from "../utils/bitacoraDetect";

const MAX_PHOTOS_PER_ENTRY = 60;

function PickedPhoto({ item, error, onChange, onRemove, disabled }) {
  // La URL se crea y se libera en el MISMO efecto y se asigna directo al <img>: así StrictMode
  // (monta, desmonta y vuelve a montar) nunca deja una URL ya revocada.
  const imgRef = useRef(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.file);
    if (imgRef.current) imgRef.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.file]);
  return (
    <li className="flex gap-3 items-start">
      <div className="w-20 h-[60px] rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center text-[10px] text-gray-400 text-center">
        {broken ? "Sin vista previa" : <img ref={imgRef} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />}
      </div>
      <div className="flex-1 min-w-0">
        <input
          className="field w-full py-1.5 text-sm"
          placeholder="¿Qué se ve? (pie de foto)"
          maxLength={500}
          aria-label={`Pie de foto de ${item.file.name}`}
          value={item.caption}
          disabled={disabled}
          onChange={(e) => onChange({ caption: e.target.value })}
        />
        <BitacoraPhotoFlags idPrefix={`pick-${item.id}`} stage={item.stage} includeInReport={item.includeInReport} disabled={disabled} onChange={onChange} />
        {error && (
          <p className="text-xs text-red-300 mt-1 flex gap-1.5" role="alert"><AlertTriangle size={14} className="shrink-0 mt-0.5" />{item.file.name}: {error}</p>
        )}
      </div>
      <button type="button" onClick={onRemove} disabled={disabled} className="btn btn-ghost btn-icon shrink-0" aria-label={`Quitar ${item.file.name}`}><Trash2 size={16} /></button>
    </li>
  );
}

/**
 * Agregar (o editar) el reporte del día / la visita: fecha, texto, personal, fotos con pie, etapa y
 * "no incluir en el informe", pendientes nuevos ("¿Faltó algo?") y pendientes que este reporte resolvió.
 * Orden: guarda la entrada primero; luego crea/resuelve pendientes y sube las fotos UNA A UNA.
 * Si algo falla, la entrada ya quedó guardada y se puede reintentar sin duplicar lo ya hecho.
 */
export default function BitacoraEntryModal({ project, entry, onClose, onSaved }) {
  const editing = !!entry;
  const support = isSupport(project);
  const word = support ? "visita" : "día";
  const [date, setDate] = useState(entry ? toIsoDay(entry.date) : todayIso());
  const [body, setBody] = useState(entry?.body || "");
  const [personnel, setPersonnel] = useState(Array.isArray(entry?.personnel) ? entry.personnel.join(", ") : "");
  const [items, setItems] = useState([]);
  const [newPendings, setNewPendings] = useState([]);
  const [draft, setDraft] = useState({ text: "", origin: "CLIENTE", assignee: "", dueDate: "" });
  const [resolveIds, setResolveIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [failures, setFailures] = useState({});
  const [savedEntryId, setSavedEntryId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [serverError, setServerError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const counter = useRef(0);
  const existingPhotos = entry?.photos?.length || 0;
  const openList = openPendings(project).filter((p) => !(entry && p.resolvedInEntryId === entry.id));
  const locked = busy || !!savedEntryId;

  const addFiles = (fileList) => {
    const room = MAX_PHOTOS_PER_ENTRY - existingPhotos - items.length;
    const files = Array.from(fileList || []).slice(0, Math.max(0, room));
    if (!files.length) return;
    setItems((prev) => [...prev, ...files.map((file) => ({ id: ++counter.current, file, caption: "", includeInReport: true, stage: null }))]);
  };

  const addDraft = () => {
    if (!draft.text.trim()) return;
    setNewPendings((prev) => [...prev, { id: ++counter.current, text: draft.text.trim(), origin: draft.origin, assignee: draft.assignee.trim(), dueDate: draft.dueDate }]);
    setDraft((d) => ({ ...d, text: "", assignee: "", dueDate: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!date) next.date = "Indica la fecha.";
    if (!body.trim()) next.body = support ? "Escribe qué se hizo en la visita." : "Escribe qué se hizo ese día.";
    setErrors(next);
    if (Object.keys(next).length) return;
    // Aviso (no bloqueo): el texto y los pies de foto salen tal cual en el informe al cliente.
    if (!savedEntryId) {
      const groups = scanFields([
        { label: "Trabajo realizado", text: body },
        ...items.map((it) => ({ label: `Pie de foto (${it.file.name})`, text: it.caption })),
      ]);
      if (!(await confirmInternalData(groups, "Guardar así"))) return;
    }
    setBusy(true);
    setServerError("");
    try {
      let entryId = savedEntryId || entry?.id;
      if (!entryId) {
        const names = personnel.split(",").map((n) => n.trim()).filter(Boolean);
        const created = await bitacoraService.createEntry(project.id, { date, body: body.trim(), ...(names.length ? { personnel: names } : {}) });
        entryId = created.id;
        setSavedEntryId(entryId);
      } else if (editing && !savedEntryId) {
        const names = personnel.split(",").map((n) => n.trim()).filter(Boolean);
        await bitacoraService.updateEntry(entryId, { date, body: body.trim(), personnel: names });
        setSavedEntryId(entryId);
      }

      // Pendientes: los que nacieron en este reporte y los que este reporte cerró.
      let pendingFailures = 0;
      for (const np of newPendings) {
        try {
          await bitacoraService.createPendingV2({
            clientId: project.client?.id ?? project.clientId,
            projectId: project.id,
            origin: np.origin,
            text: np.text,
            createdFromEntryId: entryId,
            ...(np.assignee ? { assignee: np.assignee } : {}),
            ...(np.dueDate ? { dueDate: np.dueDate } : {}),
          });
          setNewPendings((prev) => prev.filter((x) => x.id !== np.id));
        } catch { pendingFailures += 1; }
      }
      for (const pid of resolveIds) {
        try {
          await bitacoraService.resolvePending(pid, { resolvedInEntryId: entryId });
          setResolveIds((prev) => prev.filter((x) => x !== pid));
        } catch { pendingFailures += 1; }
      }

      let photoFailures = 0;
      if (items.length) {
        setProgress({ done: 0, total: items.length, current: "", step: "" });
        const { uploaded, failed } = await uploadPhotosSequentially(entryId, items, setProgress, existingPhotos);
        setItems((prev) => prev.filter((i) => !uploaded.includes(i.id)));
        setFailures(Object.fromEntries(failed.map((f) => [f.id, f.message])));
        photoFailures = failed.length;
      }
      if (pendingFailures || photoFailures) {
        const parts = [];
        if (pendingFailures) parts.push(`${pendingFailures} pendiente(s) no se pudieron guardar`);
        if (photoFailures) parts.push(`${photoFailures} foto(s) no se pudieron subir`);
        setServerError(`El ${word} quedó guardado, pero ${parts.join(" y ")}. Corrige o quita lo marcado y reintenta.`);
        return;
      }
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.error || `No se pudo guardar el ${word}.`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return createPortal(
    <div className="modal-overlay animate-overlay-in fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-2xl max-h-[92vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="bit-entry-title">
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/10">
          <h2 id="bit-entry-title" className="text-white font-semibold text-lg">{editing ? `Editar ${word}` : support ? "Agregar visita" : "Agregar día"}</h2>
          <button type="button" onClick={savedEntryId ? onSaved : onClose} disabled={busy} className="btn btn-ghost btn-icon" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bit-date" className="block text-sm font-medium text-gray-300">Fecha *</label>
              <input id="bit-date" type="date" className="field mt-1 w-full" value={date} disabled={locked} onChange={(e) => setDate(e.target.value)} />
              {errors.date && <p className="text-xs text-red-300 mt-1" role="alert">{errors.date}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bit-people" className="block text-sm font-medium text-gray-300">Personal que participó</label>
              <input id="bit-people" className="field mt-1 w-full" placeholder="Nombres separados por coma" value={personnel} disabled={locked} onChange={(e) => setPersonnel(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="bit-body" className="block text-sm font-medium text-gray-300">Trabajo realizado *</label>
            <textarea id="bit-body" rows={6} maxLength={20000} className="field mt-1 w-full" placeholder="Redáctalo como lo leerá el cliente, sin fechas ni horas. Las líneas que empiezan con «- » salen como viñetas." value={body} disabled={locked} onChange={(e) => setBody(e.target.value)} />
            {errors.body && <p className="text-xs text-red-300 mt-1" role="alert">{errors.body}</p>}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-300 mb-2">Fotos</span>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) addFiles(e.dataTransfer.files); }}
              className="flex items-center justify-center gap-2 h-[72px] rounded-lg text-sm text-gray-300 transition-colors"
              style={{ border: `1.5px dashed ${dragging ? "#2bb8ff" : "rgba(255,255,255,.2)"}` }}
            >
              <ImagePlus size={18} aria-hidden="true" />
              <span>Arrastra fotos aquí o</span>
              <button type="button" className="btn btn-secondary px-3 py-1.5 text-sm" disabled={busy} onClick={() => fileInput.current?.click()}>elegir archivos</button>
              <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Se reducen en tu navegador antes de subir (máx. 1600 px). Marca «No incluir en el informe» en las que son solo de control interno.</p>
            {items.length > 0 && (
              <ul className="mt-3 space-y-4">
                {items.map((it) => (
                  <PickedPhoto
                    key={it.id}
                    item={it}
                    error={failures[it.id]}
                    disabled={busy}
                    onChange={(patch) => setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, ...patch } : p)))}
                    onRemove={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Pendientes: lo que faltó y lo que este reporte resolvió */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><ListPlus size={16} aria-hidden="true" /> ¿Faltó algo? Agregar pendientes</h3>
            <p className="text-xs text-[#9FB0C4] mt-1">Quedan ligados a este reporte y solo los ve el equipo.</p>
            {newPendings.length > 0 && (
              <ul className="mt-3 space-y-2">
                {newPendings.map((np) => (
                  <li key={np.id} className="flex items-start gap-2 text-sm text-white">
                    <span className="flex-1 min-w-0 break-words">{np.text}
                      <span className="ml-2 inline-flex align-middle"><OriginChip origin={np.origin} /></span>
                      {(np.assignee || np.dueDate) && <span className="block text-xs text-[#9FB0C4]">{[np.assignee, np.dueDate && formatShortDate(`${np.dueDate}T12:00:00Z`, false)].filter(Boolean).join(" · ")}</span>}
                    </span>
                    <button type="button" className="btn btn-ghost btn-icon shrink-0" disabled={busy} onClick={() => setNewPendings((prev) => prev.filter((x) => x.id !== np.id))} aria-label={`Quitar «${np.text}»`}><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input className="field text-sm sm:col-span-6" placeholder="Qué faltó…" maxLength={1000} aria-label="Pendiente nuevo" value={draft.text} disabled={busy}
                onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDraft(); } }} />
              <select className="field text-sm sm:col-span-2" aria-label="Origen del pendiente" value={draft.origin} disabled={busy} onChange={(e) => setDraft((d) => ({ ...d, origin: e.target.value }))}>
                {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>Origen: {v}</option>)}
              </select>
              <input className="field text-sm sm:col-span-2" placeholder="Responsable" maxLength={120} aria-label="Responsable" value={draft.assignee} disabled={busy} onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value }))} />
              <input type="date" className="field text-sm sm:col-span-2" aria-label="Fecha límite" value={draft.dueDate} disabled={busy} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} />
              <button type="button" className="btn btn-secondary px-3 py-2 text-sm sm:col-span-6 flex items-center justify-center gap-2" disabled={busy || !draft.text.trim()} onClick={addDraft}><Plus size={15} /> Agregar a la lista</button>
            </div>

            {openList.length > 0 && (
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold text-white">¿Este reporte resolvió algún pendiente abierto?</legend>
                <ul className="mt-2 space-y-1">
                  {openList.map((p) => (
                    <li key={p.id}>
                      <label className="flex items-start gap-2 text-sm text-gray-100 min-h-[32px] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 mt-1 accent-[#2bb8ff]" checked={resolveIds.includes(p.id)} disabled={busy}
                          onChange={(e) => setResolveIds((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)))} />
                        <span className="break-words">{p.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </div>

          {progress && (
            <div role="status" aria-live="polite">
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{progress.step ? `${progress.step} ${progress.current}` : "Terminando…"}</span>
                <span className="tabular-nums">{progress.done} de {progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#2bb8ff] transition-all duration-300" style={{ width: `${pct}%` }} /></div>
              <p className="text-xs text-gray-400 mt-1">No cierres esta ventana hasta que termine.</p>
            </div>
          )}
          {serverError && <p className="text-sm text-red-300" role="alert">{serverError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            {savedEntryId ? (
              <button type="button" onClick={onSaved} disabled={busy} className="btn btn-secondary px-4 py-2">Cerrar</button>
            ) : (
              <button type="button" onClick={onClose} disabled={busy} className="btn btn-secondary px-4 py-2">Cancelar</button>
            )}
            <button type="submit" className="btn btn-primary px-5 py-2" aria-busy={busy} disabled={busy}>
              {savedEntryId ? "Reintentar" : editing ? "Guardar cambios" : support ? "Guardar visita" : "Guardar día"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
