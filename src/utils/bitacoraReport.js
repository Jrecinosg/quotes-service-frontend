// Armado de los datos del INFORME AL CLIENTE (funciones puras, sin React ni red: se prueban solas).
// Regla del dueño: el informe solo lleva trabajo realizado y fotos. NO viajan fechas del servicio, horas,
// tiempos, pendientes ni datos de control interno: el objeto resultante es una lista blanca y su única
// fecha es `issuedOn` (hoy, zona Guatemala).
import { sortEntries, toIsoDay, todayGuatemala } from "./bitacora";

/** Decisión pendiente del dueño: ¿el informe al cliente lista "Personal que participó"? Ponlo en true para activarlo. */
export const SHOW_PERSONNEL_IN_CLIENT_REPORT = false;

export const VARIANTS = {
  dia: { label: "Informe del día", kicker: "INFORME DEL DÍA", short: "dia" },
  avance: { label: "Informe de avance", kicker: "INFORME DE AVANCE", short: "avance" },
  final: { label: "Informe final", kicker: "INFORME FINAL", short: "final" },
};

/** Entradas que entran al informe: las del día elegido (variante "dia") o todas hasta hoy. */
export const selectEntries = (project, { variant, day }) => {
  const all = sortEntries(project?.entries);
  if (variant === "dia") return all.filter((e) => toIsoDay(e.date) === day);
  return all;
};

/** ¿Todas las fotos del proyecto traen el campo `includeInReport` (booleano)? Si no, el servidor es de versión vieja. */
export const photoFlagsComplete = (project) => {
  const photos = (project?.entries || []).flatMap((e) => e.photos || []);
  return photos.every((p) => typeof p.includeInReport === "boolean");
};

/**
 * Fotos de una entrada que van al informe. Con el campo en todas las fotos se usa `=== true` (estricto: solo entra
 * lo marcado). Si el servidor no lo trae (versión vieja) no se excluye nada; la pantalla avisa.
 */
export const reportPhotos = (entry, strict = true) => (entry?.photos || []).filter((p) => (strict ? p.includeInReport === true : true));

/** Conteo de fotos de las entradas elegidas: cuántas van y cuántas se excluyen. */
export const photoCounts = (project, opts) => {
  const strict = photoFlagsComplete(project);
  const entries = selectEntries(project, opts);
  const all = entries.reduce((n, e) => n + (e.photos || []).length, 0);
  const included = entries.reduce((n, e) => n + reportPhotos(e, strict).length, 0);
  return { included, excluded: all - included, strict };
};

/** Días (AAAA-MM-DD) que tienen entradas, para elegir en "Informe del día". */
export const entryDays = (project) => [...new Set(sortEntries(project?.entries).map((e) => toIsoDay(e.date)))].reverse();

/**
 * Lista blanca del informe. `photoData`: Map(photoId -> { src, width, height }) con las fotos ya cargadas.
 * No copia fechas de entradas, ni personal, ni pendientes.
 */
export function assembleInformeReport({ project, variant, day, today = todayGuatemala(), photoData = new Map() }) {
  const entries = selectEntries(project, { variant, day });
  const strict = photoFlagsComplete(project);
  let number = 0;
  const photos = [];
  entries.forEach((e) => {
    reportPhotos(e, strict).forEach((ph) => {
      const data = photoData.get(ph.id);
      if (!data) return;
      number += 1;
      photos.push({ number, src: data.src, width: data.width, height: data.height, caption: ph.caption || "", stage: ph.stage || "" });
    });
  });
  const qn = project?.quotation?.number || "";
  return {
    variant,
    clientName: project?.client?.name || "Cliente",
    title: project?.name || "",
    quotationNumber: qn && !String(project?.name || "").includes(qn) ? qn : "",
    summary: variant === "dia" ? "" : project?.finalSummary || "",
    technicianName: String(project?.technicianName || "").trim(),
    issuedOn: today,
    personnel: SHOW_PERSONNEL_IN_CLIENT_REPORT
      ? [...new Set(entries.flatMap((e) => (Array.isArray(e.personnel) ? e.personnel : [])).map((n) => String(n).trim()).filter(Boolean))]
      : [],
    texts: entries.map((e) => String(e.body || "")).filter((t) => t.trim()),
    photos,
  };
}

// Frase corta de "qué se hizo" para el mensaje de WhatsApp: la primera oración del resumen o del último trabajo.
// Si trae fechas, horas, montos o es muy larga, se usa una frase genérica (nunca se cuelan datos internos).
const RISKY = /\d{1,2}[:/.-]\d{1,2}|\b\d{4}\b|\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|inicio|fin|horas?|d[ií]as?)\b|[Qq$]\s?\d|\bGTQ\b|\bUSD\b|\bprecio|\bcosto/i;

const firstSentence = (text) => {
  const clean = String(text || "").replace(/^[-*•]\s+/gm, "").replace(/\s+/g, " ").trim();
  const m = clean.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : clean).replace(/[.!?]+$/, "").trim();
};

export function whatsappText({ project, variant, entries }) {
  const name = project?.name || "el servicio";
  // día: el reporte de ESE día. final: el resumen del proyecto. avance: solo el resumen si existe (nunca el último reporte suelto).
  const source = variant === "dia" ? entries[entries.length - 1]?.body : project?.finalSummary;
  let line = firstSentence(source);
  if (!line || line.length > 160 || RISKY.test(line)) line = "";
  const what = line ? `${line.charAt(0).toLowerCase()}${line.slice(1)}` : "";
  const doc = variant === "final" ? "el informe final" : variant === "avance" ? "el informe de avance" : "el informe del trabajo realizado";
  const subject = variant === "final" ? `Ya terminamos ${name}.` : variant === "avance" ? `Te comparto cómo vamos con ${name}.` : `Te comparto lo realizado en ${name}.`;
  return [
    "Hola, buen día.",
    what ? `${subject} En resumen: ${what}.` : subject,
    `Te adjunto ${doc} con las fotos.`,
    "Quedo atento a cualquier duda. ¡Gracias!",
  ].join("\n");
}

/** Todo texto que irá al PDF, para el chequeo final de datos internos: [{ label, text }]. */
export const reportTexts = (report) => [
  { label: "Título", text: report.title },
  { label: "Resumen", text: report.summary },
  { label: "Responsable técnico", text: report.technicianName },
  ...(report.texts || []).map((t, i) => ({ label: `Trabajos realizados (${i + 1})`, text: t })),
  ...(report.photos || []).map((p) => ({ label: `Pie de la foto ${p.number}`, text: p.caption })),
];

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    document.body.removeChild(area);
    return ok;
  }
}

