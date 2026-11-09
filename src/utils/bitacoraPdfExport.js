import React from "react";
import { pdf } from "@react-pdf/renderer";
import { BitacoraInformeDocument } from "../components/BitacoraInformePDF";
import { BitacoraPendientesDocument } from "../components/BitacoraPendientesPDF";
import { bitacoraService } from "../services/bitacora.service";
import { resizeImage, blobToDataUrl } from "./imageResize";
import { downloadBlob, safeFilePart, sortEntries, toIsoDay } from "./bitacora";

/**
 * INFORME AL CLIENTE. Arma una lista blanca de campos (nunca pasa el proyecto completo):
 * los pendientes y notas internas no llegan al documento.
 * Carga las fotos (una a una, con la sesión), las reduce a <=1200 px / JPEG 0.8 y avisa el avance.
 */
export async function downloadInformePdf(project, onProgress = () => {}) {
  const entries = sortEntries(project.entries);
  const allPhotos = entries.flatMap((e) => e.photos || []);
  let loaded = 0;
  let number = 0;
  const days = [];
  for (const entry of entries) {
    const photos = [];
    for (const ph of entry.photos || []) {
      onProgress({ step: "Preparando fotos", done: loaded, total: allPhotos.length });
      const raw = await bitacoraService.getPhotoBlob(ph.id);
      const { blob } = await resizeImage(raw, { maxSide: 1200, quality: 0.8 });
      number += 1;
      photos.push({ number, src: await blobToDataUrl(blob), caption: ph.caption || "" });
      loaded += 1;
    }
    days.push({ date: entry.date, body: entry.body, photos });
  }
  onProgress({ step: "Generando PDF", done: allPhotos.length, total: allPhotos.length });

  const personnel = [...new Set(entries.flatMap((e) => (Array.isArray(e.personnel) ? e.personnel : [])).map((n) => String(n).trim()).filter(Boolean))];
  const lastDay = entries.length ? entries[entries.length - 1].date : null;
  const report = {
    clientName: project.client?.name || "Cliente",
    title: project.name,
    summary: project.finalSummary || "",
    type: project.type,
    startDate: project.startDate,
    endDate: project.endDate || lastDay,
    finished: project.status === "TERMINADO",
    issuedAt: new Date().toISOString(),
    personnel,
    days,
  };
  const blob = await pdf(React.createElement(BitacoraInformeDocument, { report })).toBlob();
  downloadBlob(blob, `Informe_${safeFilePart(report.clientName)}_${toIsoDay(project.startDate)}.pdf`);
}

/** PENDIENTES PARA EL PERSONAL (una hoja, uso interno). */
export async function downloadPendientesPdf(project, { includeDone = false } = {}) {
  const data = {
    clientName: project.client?.name || "Cliente",
    projectName: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    pendings: (project.pendings || []).map((p) => ({ text: p.text, assignee: p.assignee, dueDate: p.dueDate, done: p.done })),
    generatedAt: new Date(),
    includeDone,
  };
  const blob = await pdf(React.createElement(BitacoraPendientesDocument, { data })).toBlob();
  downloadBlob(blob, `Pendientes_${safeFilePart(data.clientName)}_${toIsoDay(project.startDate)}.pdf`);
}
