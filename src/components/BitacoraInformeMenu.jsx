import { useMemo, useState } from "react";
import { Download, FileText, MessageCircle, Lock } from "lucide-react";
import Swal from "sweetalert2";
import { downloadInformePdf, downloadPendientesPdf } from "../utils/bitacoraPdfExport";
import { entryDays, selectEntries, whatsappText, copyText, VARIANTS } from "../utils/bitacoraReport";
import { formatShortDate, openPendings } from "../utils/bitacora";

const toast = (title, icon = "success") => Swal.fire({ toast: true, position: "bottom-end", icon, title, showConfirmButton: false, timer: 2500 });

/**
 * Descargas del proyecto: 3 variantes del informe al cliente (día, avance, final), cada una con su botón
 * "Copiar texto para WhatsApp", y la hoja de pendientes del personal. Al cliente solo viaja trabajo realizado y fotos.
 */
export default function BitacoraInformeMenu({ project }) {
  const days = useMemo(() => entryDays(project), [project]);
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(null); // null | "dia" | "avance" | "final" | "pendientes"
  const [progress, setProgress] = useState("");
  const chosenDay = day || days[0] || "";
  const open = openPendings(project).length;

  const hasText = (variant) => selectEntries(project, { variant, day: chosenDay }).some((e) => e.body && e.body.trim());

  const download = async (variant) => {
    setBusy(variant);
    setProgress("Preparando…");
    try {
      await downloadInformePdf(project, { variant, day: chosenDay }, ({ step, done, total }) => setProgress(total ? `${step} ${done}/${total}` : step));
      toast("Informe descargado");
    } catch (err) {
      const r = await Swal.fire({ title: "No se pudo generar el PDF", text: err?.name === "PhotoDecodeError" ? err.message : "Revisa tu conexión e inténtalo de nuevo.", icon: "error", showCancelButton: true, confirmButtonText: "Reintentar", cancelButtonText: "Cerrar" });
      if (r.isConfirmed) { setBusy(null); download(variant); return; }
    } finally {
      setBusy(null);
      setProgress("");
    }
  };

  const copy = async (variant) => {
    const text = whatsappText({ project, variant, entries: selectEntries(project, { variant, day: chosenDay }) });
    const ok = await copyText(text);
    toast(ok ? "Texto copiado, pégalo en WhatsApp" : "No se pudo copiar el texto", ok ? "success" : "error");
  };

  const pendientes = async () => {
    setBusy("pendientes");
    try {
      const list = (project.pendings || []).map((p) => ({ ...p, project: { id: project.id, name: project.name, kind: project.kind, quotation: project.quotation } }));
      await downloadPendientesPdf({ clientName: project.client?.name, filterLabel: project.name, pendings: list });
      toast("Pendientes descargados");
    } catch {
      Swal.fire("No se pudo generar el PDF", "Inténtalo de nuevo.", "error");
    } finally {
      setBusy(null);
    }
  };

  const row = (variant, extra = null) => {
    const disabled = !!busy || !hasText(variant);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button type="button" className={`btn ${variant === "final" ? "btn-primary" : "btn-secondary"} px-3 py-2 text-sm flex-1 flex items-center justify-center gap-2`} onClick={() => download(variant)} disabled={disabled} aria-busy={busy === variant}
            title={!hasText(variant) ? "Agrega al menos un reporte con texto" : undefined}>
            <Download size={16} /> {VARIANTS[variant].label}
          </button>
          <button type="button" className="btn btn-ghost btn-icon w-11 h-11 shrink-0 border border-white/10" onClick={() => copy(variant)} disabled={!hasText(variant)}
            aria-label={`Copiar texto para WhatsApp (${VARIANTS[variant].label})`} title="Copiar texto para WhatsApp">
            <MessageCircle size={17} />
          </button>
        </div>
        {extra}
      </div>
    );
  };

  return (
    <section className="card p-4 w-full lg:w-[320px]" aria-label="Descargas">
      <h2 className="text-white font-semibold text-sm">Informe al cliente (PDF)</h2>
      <p className="text-xs text-[#9FB0C4] mt-0.5 flex items-center gap-1.5"><Lock size={11} aria-hidden="true" /> Solo trabajo realizado y fotos</p>
      <div className="mt-3 space-y-3">
        {row("dia", days.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-300">
            Día
            <select className="field h-9 py-1 text-sm flex-1" aria-label="Día del informe" value={chosenDay} onChange={(e) => setDay(e.target.value)} disabled={!!busy}>
              {days.map((d) => <option key={d} value={d}>{formatShortDate(`${d}T12:00:00Z`)}</option>)}
            </select>
          </label>
        ))}
        {row("avance")}
        {row("final")}
      </div>
      {busy && busy !== "pendientes" && <p className="text-xs text-[#9FB0C4] text-center mt-3" role="status" aria-live="polite">{progress} · no cierres la página</p>}
      <div className="mt-4 pt-3 border-t border-white/10">
        <button type="button" className="btn btn-ghost px-3 py-2 text-sm w-full flex items-center justify-center gap-2" onClick={pendientes} disabled={open === 0 || !!busy} aria-busy={busy === "pendientes"}
          title={open === 0 ? "No hay pendientes abiertos" : undefined}>
          <FileText size={16} /> Pendientes del personal (PDF)
        </button>
      </div>
    </section>
  );
}
