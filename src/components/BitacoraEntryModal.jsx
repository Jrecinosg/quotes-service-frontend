import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ImagePlus, Trash2, AlertTriangle } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { uploadPhotosSequentially } from "../utils/bitacoraUpload";
import { todayIso, toIsoDay } from "../utils/bitacora";

const MAX_PHOTOS_PER_ENTRY = 60;

function PickedPhoto({ item, error, onCaption, onRemove, disabled }) {
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
          onChange={(e) => onCaption(e.target.value)}
        />
        {error && (
          <p className="text-xs text-red-300 mt-1 flex gap-1.5" role="alert"><AlertTriangle size={14} className="shrink-0 mt-0.5" />{item.file.name}: {error}</p>
        )}
      </div>
      <button type="button" onClick={onRemove} disabled={disabled} className="btn btn-ghost btn-icon shrink-0" aria-label={`Quitar ${item.file.name}`}><Trash2 size={16} /></button>
    </li>
  );
}

/**
 * Agregar (o editar) el día de trabajo: fecha, texto, personal y fotos con pie.
 * Orden: guarda la entrada primero y luego sube las fotos UNA A UNA (reducidas en el navegador),
 * con barra de progreso. Si alguna foto falla, la entrada ya quedó guardada y se puede reintentar.
 */
export default function BitacoraEntryModal({ projectId, entry, onClose, onSaved }) {
  const editing = !!entry;
  const [date, setDate] = useState(entry ? toIsoDay(entry.date) : todayIso());
  const [body, setBody] = useState(entry?.body || "");
  const [personnel, setPersonnel] = useState(Array.isArray(entry?.personnel) ? entry.personnel.join(", ") : "");
  const [items, setItems] = useState([]);
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

  const addFiles = (fileList) => {
    const room = MAX_PHOTOS_PER_ENTRY - existingPhotos - items.length;
    const files = Array.from(fileList || []).slice(0, Math.max(0, room));
    if (!files.length) return;
    setItems((prev) => [...prev, ...files.map((file) => ({ id: ++counter.current, file, caption: "" }))]);
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!date) next.date = "Indica la fecha.";
    if (!body.trim()) next.body = "Escribe qué se hizo ese día.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setServerError("");
    try {
      let entryId = savedEntryId || entry?.id;
      if (!entryId) {
        const names = personnel.split(",").map((n) => n.trim()).filter(Boolean);
        const created = await bitacoraService.createEntry(projectId, { date, body: body.trim(), ...(names.length ? { personnel: names } : {}) });
        entryId = created.id;
        setSavedEntryId(entryId);
      } else if (editing && !savedEntryId) {
        const names = personnel.split(",").map((n) => n.trim()).filter(Boolean);
        await bitacoraService.updateEntry(entryId, { date, body: body.trim(), personnel: names });
        setSavedEntryId(entryId);
      }
      if (items.length) {
        setProgress({ done: 0, total: items.length, current: "", step: "" });
        const { uploaded, failed } = await uploadPhotosSequentially(entryId, items, setProgress, existingPhotos);
        setItems((prev) => prev.filter((i) => !uploaded.includes(i.id)));
        setFailures(Object.fromEntries(failed.map((f) => [f.id, f.message])));
        if (failed.length) {
          setServerError(`El día quedó guardado, pero ${failed.length} foto(s) no se pudieron subir. Corrige o quita las marcadas y reintenta.`);
          return;
        }
      }
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.error || "No se pudo guardar el día.");
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
          <h2 id="bit-entry-title" className="text-white font-semibold text-lg">{editing ? "Editar día" : "Agregar día"}</h2>
          <button type="button" onClick={savedEntryId ? onSaved : onClose} disabled={busy} className="btn btn-ghost btn-icon" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bit-date" className="block text-sm font-medium text-gray-300">Fecha *</label>
              <input id="bit-date" type="date" className="field mt-1 w-full" value={date} disabled={busy || !!savedEntryId} onChange={(e) => setDate(e.target.value)} />
              {errors.date && <p className="text-xs text-red-300 mt-1" role="alert">{errors.date}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bit-people" className="block text-sm font-medium text-gray-300">Personal que participó</label>
              <input id="bit-people" className="field mt-1 w-full" placeholder="Nombres separados por coma" value={personnel} disabled={busy || !!savedEntryId} onChange={(e) => setPersonnel(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="bit-body" className="block text-sm font-medium text-gray-300">Trabajo realizado *</label>
            <textarea id="bit-body" rows={6} maxLength={20000} className="field mt-1 w-full" placeholder="Redáctalo como lo leerá el cliente. Las líneas que empiezan con «- » salen como viñetas." value={body} disabled={busy || !!savedEntryId} onChange={(e) => setBody(e.target.value)} />
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
            <p className="text-xs text-gray-400 mt-1">Se reducen en tu navegador antes de subir (máx. 1600 px). En celular puedes usar la cámara o la galería.</p>
            {items.length > 0 && (
              <ul className="mt-3 space-y-3">
                {items.map((it) => (
                  <PickedPhoto
                    key={it.id}
                    item={it}
                    error={failures[it.id]}
                    disabled={busy}
                    onCaption={(v) => setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, caption: v } : p)))}
                    onRemove={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                  />
                ))}
              </ul>
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
              {savedEntryId ? "Reintentar fotos" : editing ? "Guardar cambios" : "Guardar día"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
