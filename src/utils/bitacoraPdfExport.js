import React from "react";
import { pdf } from "@react-pdf/renderer";
import { BitacoraInformeDocument } from "../components/BitacoraInformePDF";
import { BitacoraPendientesDocument } from "../components/BitacoraPendientesPDF";
import { bitacoraService } from "../services/bitacora.service";
import { resizeImage, blobToDataUrl } from "./imageResize";
import { downloadBlob, safeFilePart, groupPendings, isDone, todayGuatemala } from "./bitacora";
import { assembleInformeReport, reportPhotos, selectEntries, VARIANTS } from "./bitacoraReport";

/**
 * INFORME AL CLIENTE (variante "dia" | "avance" | "final"). El documento se arma con una lista blanca
 * (assembleInformeReport): sin fechas del servicio, horas, tiempos, pendientes ni notas internas.
 * Carga solo las fotos que van al informe (una a una, con la sesión), las reduce a <=1200 px / JPEG 0.8 y avisa el avance.
 */
export async function downloadInformePdf(project, { variant = "final", day } = {}, onProgress = () => {}) {
  const entries = selectEntries(project, { variant, day });
  const wanted = entries.flatMap((e) => reportPhotos(e));
  const photoData = new Map();
  let loaded = 0;
  for (const ph of wanted) {
    onProgress({ step: "Preparando fotos", done: loaded, total: wanted.length });
    const raw = await bitacoraService.getPhotoBlob(ph.id, ({ waitMs }) =>
      onProgress({ step: `Servidor ocupado, reintentando (${Math.ceil(waitMs / 1000)} s)`, done: loaded, total: wanted.length }));
    const { blob, width, height } = await resizeImage(raw, { maxSide: 1200, quality: 0.8 });
    photoData.set(ph.id, { src: await blobToDataUrl(blob), width, height });
    loaded += 1;
  }
  onProgress({ step: "Generando PDF", done: wanted.length, total: wanted.length });

  const report = assembleInformeReport({ project, variant, day, photoData });
  const blob = await pdf(React.createElement(BitacoraInformeDocument, { report })).toBlob();
  downloadBlob(blob, `Informe_${VARIANTS[variant].short}_${safeFilePart(report.clientName)}_${safeFilePart(project.name).slice(0, 40)}_${report.issuedOn}.pdf`);
}

/** PENDIENTES PARA EL PERSONAL por cliente (uso interno), agrupados por proyecto / soporte / sueltos. */
export async function downloadPendientesPdf({ clientName, filterLabel, pendings, includeDone = false }) {
  const data = {
    clientName: clientName || "Cliente",
    filterLabel: filterLabel || "",
    groups: groupPendings(pendings).map((g) => ({
      title: g.title, kind: g.kind, quotationNumber: g.quotationNumber,
      pendings: g.pendings.map((p) => ({ text: p.text, assignee: p.assignee, dueDate: p.dueDate, done: isDone(p), origin: p.origin })),
    })),
    generatedAt: new Date(),
    includeDone,
  };
  const blob = await pdf(React.createElement(BitacoraPendientesDocument, { data })).toBlob();
  downloadBlob(blob, `Pendientes_${safeFilePart(data.clientName)}_${todayGuatemala()}.pdf`);
}
