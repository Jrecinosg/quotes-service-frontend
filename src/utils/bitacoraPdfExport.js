import React from "react";
import { pdf } from "@react-pdf/renderer";
import { BitacoraInformeDocument } from "../components/BitacoraInformePDF";
import { BitacoraPendientesDocument } from "../components/BitacoraPendientesPDF";
import { bitacoraService } from "../services/bitacora.service";
import { resizeImage, blobToDataUrl } from "./imageResize";
import { downloadBlob, safeFilePart, todayGuatemala } from "./bitacora";
import { buildCompanies } from "./bitacoraCompras";
import { assembleInformeReport, reportPhotos, reportTexts, selectEntries, photoCounts, photoFlagsComplete, VARIANTS } from "./bitacoraReport";
import { scanFields, confirmInternalData } from "./bitacoraDetect";

/**
 * INFORME AL CLIENTE (variante "dia" | "avance" | "final"). El documento se arma con una lista blanca
 * (assembleInformeReport): sin fechas del servicio, horas, tiempos, pendientes ni notas internas.
 * Carga solo las fotos que van al informe (una a una, con la sesión), las reduce a <=1200 px / JPEG 0.8 y avisa el avance.
 */
export async function downloadInformePdf(project, { variant = "final", day } = {}, onProgress = () => {}) {
  const entries = selectEntries(project, { variant, day });
  const strict = photoFlagsComplete(project);
  const wanted = entries.flatMap((e) => reportPhotos(e, strict));

  // Chequeo final (solo aviso) de TODO texto que irá al PDF, antes de gastar tiempo en las fotos.
  const dummy = new Map(wanted.map((ph) => [ph.id, { src: "", width: 1, height: 1 }]));
  const draft = assembleInformeReport({ project, variant, day, photoData: dummy });
  if (!(await confirmInternalData(scanFields(reportTexts(draft)), "Generar así"))) return { cancelled: true };

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
  return { cancelled: false, ...photoCounts(project, { variant, day }) };
}

/** PENDIENTES PARA EL PERSONAL de un cliente (uso interno): PENDIENTES (por proyecto/soporte/sueltos) y COMPRAS aparte. */
export async function downloadPendientesPdf({ clientName, filterLabel, pendings, includeDone = false }) {
  const name = clientName || "Cliente";
  const data = {
    mode: "cliente",
    clientName: name,
    filterLabel: filterLabel || "",
    companies: buildCompanies(pendings, () => name, { includeDone }),
    generatedAt: new Date(),
  };
  const blob = await pdf(React.createElement(BitacoraPendientesDocument, { data })).toBlob();
  downloadBlob(blob, `Pendientes_${safeFilePart(name)}_${todayGuatemala()}.pdf`);
}

/**
 * PENDIENTES DE TODAS LAS EMPRESAS (o de una selección): resumen por empresa, una sección por empresa en orden
 * alfabético (PENDIENTES por proyecto/soporte/sueltos y COMPRAS aparte) y lista de compras consolidada al final.
 * `selectionCount`: si viene, el encabezado dice "Selección de N pendientes" (los hechos se marcan como hechos).
 */
export async function downloadPendientesTodosPdf({ pendings, companyName, selectionCount = null }) {
  const includeDone = selectionCount !== null;
  const data = {
    mode: "todos",
    title: selectionCount !== null ? `Selección de ${selectionCount} ${selectionCount === 1 ? "pendiente" : "pendientes"}` : "Pendientes de todas las empresas",
    subtitle: selectionCount !== null ? "Solo los pendientes elegidos, ordenados por empresa" : "Todos los pendientes abiertos, ordenados por empresa",
    companies: buildCompanies(pendings, companyName, { includeDone }),
    generatedAt: new Date(),
  };
  const blob = await pdf(React.createElement(BitacoraPendientesDocument, { data })).toBlob();
  downloadBlob(blob, `Pendientes_${selectionCount !== null ? "seleccion" : "todas_las_empresas"}_${todayGuatemala()}.pdf`);
}
