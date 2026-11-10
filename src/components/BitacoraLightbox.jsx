import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Trash2, Save } from "lucide-react";
import BitacoraPhoto from "./BitacoraPhoto";
import BitacoraPhotoFlags from "./BitacoraPhotoFlags";
import { bitacoraService } from "../services/bitacora.service";
import Swal from "sweetalert2";
import { scanFields, confirmInternalData } from "../utils/bitacoraDetect";

// Visor de fotos de un día: flechas, Esc para cerrar, pie editable y quitar foto.
export default function BitacoraLightbox({ photos, startIndex, onClose, onChanged }) {
  const [index, setIndex] = useState(startIndex);
  const photo = photos[index];
  const [caption, setCaption] = useState(photo?.caption || "");
  const [busy, setBusy] = useState(false);

  const go = (delta) => {
    const next = (index + delta + photos.length) % photos.length;
    setIndex(next);
    setCaption(photos[next].caption || "");
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => { const n = (i - 1 + photos.length) % photos.length; setCaption(photos[n].caption || ""); return n; });
      if (e.key === "ArrowRight") setIndex((i) => { const n = (i + 1) % photos.length; setCaption(photos[n].caption || ""); return n; });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos]);

  if (!photo) return null;

  const saveCaption = async () => {
    if (!(await confirmInternalData(scanFields([{ label: "Pie de foto", text: caption }]), "Guardar así"))) return;
    setBusy(true);
    try {
      await bitacoraService.updatePhoto(photo.id, { caption: caption.trim() });
      await onChanged();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo guardar el pie de foto.", "error");
    } finally {
      setBusy(false);
    }
  };

  const saveFlags = async (patch) => {
    setBusy(true);
    try {
      await bitacoraService.updatePhoto(photo.id, patch);
      await onChanged();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo guardar el cambio de la foto.", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const r = await Swal.fire({ title: "¿Quitar esta foto?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Sí, quitar", cancelButtonText: "Cancelar" });
    if (!r.isConfirmed) return;
    setBusy(true);
    try {
      await bitacoraService.deletePhoto(photo.id);
      await onChanged();
      onClose();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo quitar la foto.", "error");
      setBusy(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex flex-col items-center justify-center p-4 gap-3" role="dialog" aria-modal="true" aria-label="Visor de fotos">
      <button type="button" onClick={onClose} className="btn btn-ghost btn-icon absolute top-3 right-3 w-11 h-11" aria-label="Cerrar visor"><X size={22} /></button>
      <div className="relative w-full max-w-4xl flex-1 min-h-0 flex items-center">
        {photos.length > 1 && <button type="button" onClick={() => go(-1)} className="btn btn-secondary btn-icon w-11 h-11 absolute left-0 z-10" aria-label="Foto anterior"><ChevronLeft size={22} /></button>}
        <BitacoraPhoto key={photo.id} photoId={photo.id} alt={photo.caption} eager contain className="w-full h-full max-h-[68vh] rounded-lg" />
        {photos.length > 1 && <button type="button" onClick={() => go(1)} className="btn btn-secondary btn-icon w-11 h-11 absolute right-0 z-10" aria-label="Foto siguiente"><ChevronRight size={22} /></button>}
      </div>
      <div className="w-full max-w-4xl -mb-1">
        <BitacoraPhotoFlags key={photo.id} idPrefix={`lb-${photo.id}`} stage={photo.stage} includeInReport={photo.includeInReport !== false} disabled={busy} onChange={saveFlags} />
      </div>
      <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <span className="text-xs text-gray-300 tabular-nums shrink-0">Foto {index + 1} de {photos.length}</span>
        <input className="field flex-1 text-sm" placeholder="Pie de foto" aria-label="Pie de foto" maxLength={500} value={caption} onChange={(e) => setCaption(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveCaption(); }} />
        <button type="button" onClick={saveCaption} disabled={busy || caption.trim() === (photo.caption || "")} className="btn btn-secondary px-3 py-2 flex items-center justify-center gap-2"><Save size={16} /> Guardar pie</button>
        <button type="button" onClick={remove} disabled={busy} className="btn btn-danger px-3 py-2 flex items-center justify-center gap-2"><Trash2 size={16} /> Quitar</button>
      </div>
    </div>,
    document.body
  );
}
