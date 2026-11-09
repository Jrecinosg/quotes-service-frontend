import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, FileText, Plus, Pencil, Trash2, ChevronRight, AlertCircle, CheckCircle2, RotateCcw, Users } from "lucide-react";
import Swal from "sweetalert2";
import { bitacoraService } from "../services/bitacora.service";
import { StatusChip, TypeChip } from "../components/BitacoraChips";
import BitacoraPhoto from "../components/BitacoraPhoto";
import BitacoraPendings from "../components/BitacoraPendings";
import BitacoraEntryModal from "../components/BitacoraEntryModal";
import BitacoraSummaryModal from "../components/BitacoraSummaryModal";
import BitacoraLightbox from "../components/BitacoraLightbox";
import { displayStatus, formatLongDate, formatRange, openPendings, sortEntries } from "../utils/bitacora";
import { downloadInformePdf, downloadPendientesPdf } from "../utils/bitacoraPdfExport";

const toast = (title) => Swal.fire({ toast: true, position: "bottom-end", icon: "success", title, showConfirmButton: false, timer: 2500 });

function EntryCard({ entry, number, total, onEdit, onDelete, onOpenPhoto }) {
  const people = Array.isArray(entry.personnel) ? entry.personnel : [];
  const photos = entry.photos || [];
  return (
    <article className="card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-base">{formatLongDate(entry.date)}</h3>
          <p className="text-xs text-[#9FB0C4] mt-0.5">Día {number} de {total}</p>
        </div>
        <div className="flex shrink-0 -mr-2 -mt-2">
          <button type="button" onClick={onEdit} className="btn btn-ghost btn-icon w-11 h-11" aria-label={`Editar ${formatLongDate(entry.date)}`}><Pencil size={16} /></button>
          <button type="button" onClick={onDelete} className="btn btn-ghost btn-icon w-11 h-11" aria-label={`Eliminar ${formatLongDate(entry.date)}`}><Trash2 size={16} /></button>
        </div>
      </header>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-100 whitespace-pre-line" style={{ maxWidth: "68ch" }}>{entry.body}</p>
      {people.length > 0 && (
        <p className="mt-3 text-xs text-[#9FB0C4] flex items-center gap-1.5"><Users size={13} aria-hidden="true" /> {people.join(", ")}</p>
      )}
      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {photos.map((ph, i) => (
            <li key={ph.id} className="min-w-0">
              <BitacoraPhoto photoId={ph.id} alt={ph.caption || `Foto ${i + 1}`} onClick={() => onOpenPhoto(i)} className="w-full aspect-[4/3] rounded-lg" />
              <p className="text-xs text-[#9FB0C4] mt-1 truncate" title={ph.caption || ""}>{ph.caption || "Sin pie de foto"}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function BitacoraDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entryModal, setEntryModal] = useState(null); // null | { entry? }
  const [summaryModal, setSummaryModal] = useState(null); // null | "close" | "edit"
  const [lightbox, setLightbox] = useState(null); // { photos, index }
  const [pdfBusy, setPdfBusy] = useState(null); // null | "informe" | "pendientes"
  const [pdfProgress, setPdfProgress] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await bitacoraService.getProject(id);
      setProject(data);
      setError("");
    } catch (err) {
      setError(err.response?.status === 404 ? "Este proyecto no existe o fue archivado." : "No se pudo cargar el proyecto.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const entriesAsc = useMemo(() => sortEntries(project?.entries), [project]);
  const entriesDesc = useMemo(() => [...entriesAsc].reverse(), [entriesAsc]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto" aria-busy="true">
        <div className="skeleton h-8 w-64 mb-3" /><div className="skeleton h-5 w-80 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-8 skeleton h-64" /><div className="lg:col-span-4 skeleton h-64" /></div>
      </div>
    );
  }
  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto card p-8 text-center">
        <AlertCircle className="mx-auto mb-2 text-red-300" size={32} />
        <p className="text-white font-semibold">{error || "No se pudo cargar el proyecto."}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button className="btn btn-primary px-4 py-2" onClick={() => { setLoading(true); load(); }}>Reintentar</button>
          <Link to="/app/bitacora" className="btn btn-secondary px-4 py-2">Volver a la bitácora</Link>
        </div>
      </div>
    );
  }

  const lightboxPhotos = lightbox ? (entriesAsc.find((e) => e.id === lightbox.entryId)?.photos || []) : [];
  const status = displayStatus(project);
  const open = openPendings(project).length;
  const hasText = entriesAsc.some((e) => e.body && e.body.trim());

  const deleteEntry = async (entry) => {
    const r = await Swal.fire({ title: `¿Eliminar ${formatLongDate(entry.date)}?`, text: "El día y sus fotos dejarán de verse en la bitácora y en el informe.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar" });
    if (!r.isConfirmed) return;
    try { await bitacoraService.deleteEntry(entry.id); await load(); } catch (err) { Swal.fire("Error", err.response?.data?.error || "No se pudo eliminar el día.", "error"); }
  };

  const reopen = async () => {
    try { await bitacoraService.reopenProject(project.id); await load(); toast("Proyecto reabierto"); } catch (err) { Swal.fire("Error", err.response?.data?.error || "No se pudo reabrir.", "error"); }
  };

  const runInforme = async () => {
    setPdfBusy("informe");
    setPdfProgress("Preparando…");
    try {
      await downloadInformePdf(project, ({ step, done, total }) => setPdfProgress(total ? `${step} ${done}/${total}` : step));
      toast("Informe descargado");
    } catch (err) {
      const r = await Swal.fire({ title: "No se pudo generar el PDF", text: err?.name === "PhotoDecodeError" ? err.message : "Revisa tu conexión e inténtalo de nuevo.", icon: "error", showCancelButton: true, confirmButtonText: "Reintentar", cancelButtonText: "Cerrar" });
      if (r.isConfirmed) { setPdfBusy(null); runInforme(); return; }
    } finally {
      setPdfBusy(null);
      setPdfProgress("");
    }
  };

  const runPendientes = async () => {
    setPdfBusy("pendientes");
    try {
      await downloadPendientesPdf(project);
      toast("Pendientes descargados");
    } catch {
      Swal.fire("No se pudo generar el PDF", "Inténtalo de nuevo.", "error");
    } finally {
      setPdfBusy(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Cabecera */}
      <nav aria-label="Migas" className="flex items-center gap-1 text-sm text-[#9FB0C4] mb-3">
        <Link to="/app/bitacora" className="hover:text-white">Bitácora</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="text-gray-300">{project.client?.name}</span>
      </nav>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight text-white break-words">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusChip status={status} />
            <TypeChip type={project.type} />
            <span className="text-[13px] text-[#9FB0C4]">{formatRange(project.startDate, project.endDate)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {project.status === "EN_CURSO" ? (
              <button type="button" className="btn btn-secondary px-3 py-1.5 text-sm flex items-center gap-2" onClick={() => setSummaryModal("close")}><CheckCircle2 size={16} /> Cerrar proyecto</button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary px-3 py-1.5 text-sm flex items-center gap-2" onClick={reopen}><RotateCcw size={16} /> Reabrir</button>
                <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm flex items-center gap-2" onClick={() => setSummaryModal("edit")}><Pencil size={16} /> Editar resumen</button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <button
            type="button"
            className="btn btn-primary px-4 py-2.5 flex items-center justify-center gap-2"
            onClick={runInforme}
            disabled={!hasText || !!pdfBusy}
            aria-busy={pdfBusy === "informe"}
            title={!hasText ? "Agrega al menos un día con texto" : undefined}
          >
            <Download size={18} /> Descargar informe del cliente (PDF)
          </button>
          <button
            type="button"
            className="btn btn-secondary px-4 py-2.5 flex items-center justify-center gap-2"
            onClick={runPendientes}
            disabled={open === 0 || !!pdfBusy}
            aria-busy={pdfBusy === "pendientes"}
            title={open === 0 ? "No hay pendientes abiertos" : undefined}
          >
            <FileText size={18} /> Descargar pendientes del personal (PDF)
          </button>
          {pdfBusy === "informe" && <p className="text-xs text-[#9FB0C4] text-center" role="status" aria-live="polite">{pdfProgress} · no cierres la página</p>}
        </div>
      </div>

      {project.finalSummary && (
        <section className="card p-5 mb-6" aria-label="Resumen del informe">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9FB0C4] mb-2">Resumen del informe</h2>
          <p className="text-[15px] leading-relaxed text-gray-100 whitespace-pre-line" style={{ maxWidth: "68ch" }}>{project.finalSummary}</p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Línea de tiempo */}
        <section className="lg:col-span-8" aria-label="Línea de tiempo diaria">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">Trabajo por día</h2>
            <button type="button" className="btn btn-secondary px-4 py-2 flex items-center gap-2" onClick={() => setEntryModal({})}><Plus size={16} /> Agregar día</button>
          </div>
          {entriesDesc.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-white font-medium">Aún no hay días registrados</p>
              <p className="text-sm text-gray-400 mt-1">Registra lo que se hizo y sube las fotos de la visita.</p>
              <button type="button" className="btn btn-primary px-4 py-2 mt-4" onClick={() => setEntryModal({})}>Agregar el primer día</button>
            </div>
          ) : (
            <ol className="relative space-y-4 pl-8">
              <span className="absolute left-3 top-2 bottom-2 w-0.5 -translate-x-1/2" style={{ background: "rgba(255,255,255,.14)" }} aria-hidden="true" />
              {entriesDesc.map((entry) => {
                const number = entriesAsc.findIndex((e) => e.id === entry.id) + 1;
                return (
                  <li key={entry.id} className="relative">
                    <span className="absolute top-6 w-3 h-3 rounded-full" style={{ left: "-20px", background: "#2bb8ff", boxShadow: "0 0 0 4px rgba(43,184,255,.25)", transform: "translateX(-50%)" }} aria-hidden="true" />
                    <EntryCard
                      entry={entry}
                      number={number}
                      total={entriesAsc.length}
                      onEdit={() => setEntryModal({ entry })}
                      onDelete={() => deleteEntry(entry)}
                      onOpenPhoto={(i) => setLightbox({ entryId: entry.id, index: i })}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Pendientes */}
        <aside className="lg:col-span-4"><BitacoraPendings project={project} onChanged={load} /></aside>
      </div>

      {entryModal && (
        <BitacoraEntryModal
          projectId={project.id}
          entry={entryModal.entry}
          onClose={() => setEntryModal(null)}
          onSaved={async () => { setEntryModal(null); await load(); toast("Día guardado"); }}
        />
      )}
      {summaryModal && (
        <BitacoraSummaryModal
          project={project}
          mode={summaryModal}
          onClose={() => setSummaryModal(null)}
          onSaved={async () => { setSummaryModal(null); await load(); toast(summaryModal === "close" ? "Proyecto cerrado" : "Resumen guardado"); }}
        />
      )}
      {lightbox && (lightboxPhotos.length > 0) && (
        <BitacoraLightbox photos={lightboxPhotos} startIndex={Math.min(lightbox.index, lightboxPhotos.length - 1)} onClose={() => setLightbox(null)} onChanged={load} />
      )}
    </div>
  );
}
