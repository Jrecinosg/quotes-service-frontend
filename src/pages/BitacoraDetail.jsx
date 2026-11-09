import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, Plus, Pencil, Trash2, ChevronRight, AlertCircle, CheckCircle2, RotateCcw, Users, Flag, CornerDownRight } from "lucide-react";
import Swal from "sweetalert2";
import { bitacoraService } from "../services/bitacora.service";
import { StatusChip, TypeChip, KindChip, QuotationChip, StaleChip } from "../components/BitacoraChips";
import BitacoraInformeMenu from "../components/BitacoraInformeMenu";
import BitacoraPhoto from "../components/BitacoraPhoto";
import BitacoraPendings from "../components/BitacoraPendings";
import BitacoraEntryModal from "../components/BitacoraEntryModal";
import BitacoraProjectModal from "../components/BitacoraProjectModal";
import BitacoraSummaryModal from "../components/BitacoraSummaryModal";
import BitacoraLightbox from "../components/BitacoraLightbox";
import { STAGES, displayStatus, formatLongDate, formatRange, formatShortDate, isDone, isStale, isSupport, quotationNumber, sortEntries } from "../utils/bitacora";

const toast = (title) => Swal.fire({ toast: true, position: "bottom-end", icon: "success", title, showConfirmButton: false, timer: 2500 });

function EntryCard({ entry, number, total, support, born, closed, onEdit, onDelete, onOpenPhoto, onGoToEntry, entriesById }) {
  const people = Array.isArray(entry.personnel) ? entry.personnel : [];
  const photos = entry.photos || [];
  return (
    <article className="card p-5" id={`bitacora-entry-${entry.id}`} style={{ scrollMarginTop: "88px" }}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-base">{formatLongDate(entry.date)}</h3>
          <p className="text-xs text-[#9FB0C4] mt-0.5">{support ? `Visita ${number} de ${total}` : `Día ${number} de ${total}`}</p>
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
      {(born.length > 0 || closed.length > 0) && (
        <div className="mt-3 pt-3 border-t border-white/[0.07] space-y-1.5 text-xs">
          {born.map((p) => (
            <p key={`b${p.id}`} className="flex items-start gap-1.5" style={{ color: "#FCD34D" }}><Flag size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> <span className="break-words">Pendiente que nació aquí: <span className="text-gray-100">{p.text}</span>{isDone(p) ? <span className="text-[#6EE7B7]"> · ya cerrado</span> : null}</span></p>
          ))}
          {closed.map((p) => (
            <p key={`c${p.id}`} className="flex items-start gap-1.5 text-[#6EE7B7]"><CheckCircle2 size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> <span className="break-words">Pendiente que se cerró aquí: <span className="text-gray-100">{p.text}</span>
              {p.createdFromEntryId && entriesById.get(p.createdFromEntryId) && (
                <button type="button" className="ml-2 inline-flex items-center gap-1 text-[#7DD3FF] hover:text-white underline-offset-2 hover:underline" onClick={() => onGoToEntry(p.createdFromEntryId)}><CornerDownRight size={11} aria-hidden="true" /> nació el {formatShortDate(entriesById.get(p.createdFromEntryId).date, false)}</button>
              )}</span></p>
          ))}
        </div>
      )}
      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {photos.map((ph, i) => (
            <li key={ph.id} className="min-w-0">
              <BitacoraPhoto photoId={ph.id} alt={ph.caption || `Foto ${i + 1}`} onClick={() => onOpenPhoto(i)} className="w-full aspect-[4/3] rounded-lg" />
              <p className="text-xs text-[#9FB0C4] mt-1 truncate" title={ph.caption || ""}>{ph.stage && STAGES[ph.stage] ? `${STAGES[ph.stage]} · ` : ""}{ph.caption || "Sin pie de foto"}</p>
              {ph.includeInReport === false && <p className="text-[11px] mt-0.5" style={{ color: "#FDBA74" }}>No va en el informe</p>}
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
  const [projectModal, setProjectModal] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { photos, index }

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
  const entriesById = useMemo(() => new Map(entriesAsc.map((e) => [e.id, e])), [entriesAsc]);

  // Vinculo "nacio en / se cerro en": lleva a la entrada y la resalta un momento (HashRouter: no se usan anclas #).
  const goToEntry = useCallback((entryId) => {
    const el = document.getElementById(`bitacora-entry-${entryId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    el.style.transition = "box-shadow 240ms ease-out";
    el.style.boxShadow = "0 0 0 2px #2bb8ff";
    setTimeout(() => { el.style.boxShadow = ""; }, 1600);
  }, []);

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
  const support = isSupport(project);

  const deleteEntry = async (entry) => {
    const r = await Swal.fire({ title: `¿Eliminar ${formatLongDate(entry.date)}?`, text: "El día y sus fotos dejarán de verse en la bitácora y en el informe.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar" });
    if (!r.isConfirmed) return;
    try { await bitacoraService.deleteEntry(entry.id); await load(); } catch (err) { Swal.fire("Error", err.response?.data?.error || "No se pudo eliminar el día.", "error"); }
  };

  const reopen = async () => {
    try { await bitacoraService.reopenProject(project.id); await load(); toast("Proyecto reabierto"); } catch (err) { Swal.fire("Error", err.response?.data?.error || "No se pudo reabrir.", "error"); }
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
            <KindChip kind={project.kind} />
            {!support && <TypeChip type={project.type} />}
            <QuotationChip number={quotationNumber(project)} />
            {isStale(project) && <StaleChip />}
            {/* Bitacora interna: aqui si se ven las fechas. En el informe al cliente no salen. */}
            <span className="text-[13px] text-[#9FB0C4]">{support ? `Desde ${formatShortDate(project.startDate)}` : formatRange(project.startDate, project.endDate)}</span>
          </div>
          {project.technicianName && <p className="text-[13px] text-[#9FB0C4] mt-2">Responsable técnico: <span className="text-gray-200">{project.technicianName}</span></p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm flex items-center gap-2" onClick={() => setProjectModal(true)}><Pencil size={16} /> Editar proyecto</button>
            {project.status === "EN_CURSO" ? (
              <button type="button" className="btn btn-secondary px-3 py-1.5 text-sm flex items-center gap-2" onClick={() => setSummaryModal("close")}><CheckCircle2 size={16} /> {support ? "Cerrar soporte" : "Cerrar proyecto"}</button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary px-3 py-1.5 text-sm flex items-center gap-2" onClick={reopen}><RotateCcw size={16} /> Reabrir</button>
                <button type="button" className="btn btn-ghost px-3 py-1.5 text-sm flex items-center gap-2" onClick={() => setSummaryModal("edit")}><Pencil size={16} /> Editar resumen</button>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0"><BitacoraInformeMenu project={project} /></div>
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
            <h2 className="text-white font-semibold text-base">{support ? "Visitas" : "Trabajo por día"}</h2>
            <button type="button" className="btn btn-secondary px-4 py-2 flex items-center gap-2" onClick={() => setEntryModal({})}><Plus size={16} /> {support ? "Agregar visita" : "Agregar día"}</button>
          </div>
          {entriesDesc.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-white font-medium">{support ? "Aún no hay visitas registradas" : "Aún no hay días registrados"}</p>
              <p className="text-sm text-gray-400 mt-1">Registra lo que se hizo y sube las fotos de la visita.</p>
              <button type="button" className="btn btn-primary px-4 py-2 mt-4" onClick={() => setEntryModal({})}>{support ? "Agregar la primera visita" : "Agregar el primer día"}</button>
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
                      support={support}
                      born={(project.pendings || []).filter((p) => p.createdFromEntryId === entry.id)}
                      closed={(project.pendings || []).filter((p) => p.resolvedInEntryId === entry.id)}
                      entriesById={entriesById}
                      onGoToEntry={goToEntry}
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
        <aside className="lg:col-span-4"><BitacoraPendings project={project} entries={entriesAsc} onChanged={load} onGoToEntry={goToEntry} /></aside>
      </div>

      {entryModal && (
        <BitacoraEntryModal
          project={project}
          entry={entryModal.entry}
          onClose={() => setEntryModal(null)}
          onSaved={async () => { setEntryModal(null); await load(); toast(support ? "Visita guardada" : "Día guardado"); }}
        />
      )}
      {projectModal && (
        <BitacoraProjectModal isOpen project={project} onClose={() => setProjectModal(false)} onCreated={async () => { setProjectModal(false); await load(); toast("Proyecto actualizado"); }} />
      )}
      {summaryModal && (
        <BitacoraSummaryModal
          project={project}
          mode={summaryModal}
          onClose={() => setSummaryModal(null)}
          onSaved={async () => { setSummaryModal(null); await load(); toast(summaryModal === "close" ? (support ? "Soporte cerrado" : "Proyecto cerrado") : "Resumen guardado"); }}
        />
      )}
      {lightbox && (lightboxPhotos.length > 0) && (
        <BitacoraLightbox photos={lightboxPhotos} startIndex={Math.min(lightbox.index, lightboxPhotos.length - 1)} onClose={() => setLightbox(null)} onChanged={load} />
      )}
    </div>
  );
}
