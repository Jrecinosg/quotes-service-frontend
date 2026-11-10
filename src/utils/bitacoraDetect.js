import Swal from "sweetalert2";

// Aviso de datos internos: ¿el texto trae fechas, horas de trabajo, tiempos o montos?
// El informe al cliente publica los textos tal cual, así que esto SOLO AVISA (nunca bloquea). Está pensado para NO
// marcar medidas, cantidades ni modelos: "2 agujeros", "1 pulgada", "DS-2CD2043", "40 mm", "220 V", "viga H", y
// "mañana" como sustantivo ("en la mañana", "por la mañana").
const MONTH = "(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
const MONTH_ABBR = "(?:ene|feb|mar|abr|may|jun|jul|ago|sept?|set|oct|nov|dic)";
const MONTH_ABBR_SAFE = "(?:ene|feb|abr|jun|jul|ago|sept?|oct|nov|dic)"; // sin mar/may/set: chocan con palabras comunes
const WEEKDAY = "(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)";
const NUM_WORD = "(?:un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|medio|media)";
const END = "(?![a-záéíóúñ])";

const INTERNAL_PATTERNS = [
  // fechas
  { kind: "fecha", rx: new RegExp(`\\b\\d{1,2}\\s+de\\s+${MONTH}\\b`, "gi") },
  { kind: "fecha", rx: new RegExp(`\\b\\d{1,2}\\s+de\\s+${MONTH_ABBR}\\b\\.?`, "gi") },
  { kind: "fecha", rx: new RegExp(`\\b${MONTH_ABBR_SAFE}\\.?\\s+\\d{1,2}\\b(?!\\s*(?:mm|cm|m\\b|v\\b|a\\b))`, "gi") },
  { kind: "fecha", rx: new RegExp(`\\b${MONTH}\\s+(?:de\\s+)?\\d{4}\\b`, "gi") },
  { kind: "fecha", rx: /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g },
  { kind: "fecha", rx: /\b\d{4}-\d{2}-\d{2}\b/g },
  { kind: "fecha", rx: new RegExp(`\\b(?:el|del|este|pasado|próximo)\\s+${WEEKDAY}\\b`, "gi") },
  { kind: "fecha", rx: new RegExp(`\\b(?:en|de|durante)\\s+${MONTH}\\b`, "gi") },
  // referencias relativas al calendario
  { kind: "fecha", rx: /(?<![-\w])(?:ayer|anteayer|anoche|hoy)(?![-\w])/gi },
  { kind: "fecha", rx: /(?<!\b(?:la|esta|una|toda\s+la|cada|de\s+la|en\s+la|por\s+la|a\s+la)\s)(?<![-\w])ma[ñn]ana(?![-\w])/gi },
  { kind: "fecha", rx: /\bpasado\s+ma[ñn]ana\b/gi },
  { kind: "fecha", rx: /\b(?:la|esta|el|este)\s+(?:semana|mes|a[ñn]o)\s+(?:pasad[oa]|que\s+viene|próxim[oa])\b/gi },
  { kind: "fecha", rx: /\b(?:esta|la)\s+semana\b/gi },
  // horas del reloj
  { kind: "hora", rx: /\b\d{1,2}:\d{2}\b/g },
  { kind: "hora", rx: /\b\d{1,2}\s?(?:a\.\s?m\.|p\.\s?m\.|am|pm)(?![a-záéíóúñ])/gi },
  // tiempos de trabajo
  { kind: "tiempo", rx: new RegExp(`\\b\\d+(?:[.,]\\d+)?\\s*(?:horas?|hrs?|minutos?|mins?)${END}`, "gi") },
  { kind: "tiempo", rx: /\b\d+(?:[.,]\d+)?h(?![a-záéíóúñ\d])/g },
  { kind: "tiempo", rx: new RegExp(`\\b${NUM_WORD}\\s+(?:horas?|minutos?|d[ií]as?|semanas?|meses|mes)${END}`, "gi") },
  { kind: "tiempo", rx: /\b\d+\s+(?:d[ií]as|semanas?|meses)\b/gi },
  // dinero
  { kind: "dinero", rx: /(?:\bQ\.?|\bGTQ|\bUSD|\$)\s?\d[\d.,]*/g },
  { kind: "dinero", rx: /\b\d[\d.,]*\s?(?:quetzales|d[oó]lares)\b/gi },
  { kind: "dinero", rx: /\b[a-záéíóúñ]+\s+(?:quetzales?|d[oó]lares?)\b/gi },
];

/** Fragmentos del texto que parecen fechas, horas de trabajo, tiempos o montos. [] si no hay nada. */
export const detectInternalData = (text) => {
  const src = String(text || "");
  const found = [];
  INTERNAL_PATTERNS.forEach(({ kind, rx }) => {
    rx.lastIndex = 0;
    let m = rx.exec(src);
    while (m !== null) {
      found.push({ kind, text: m[0].trim() });
      if (m[0] === "") rx.lastIndex += 1;
      m = rx.exec(src);
    }
  });
  const seen = new Set();
  return found.filter((f) => { const k = f.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
};

/** fields: [{ label, text }] -> [{ label, hits }] solo con los que traen hallazgos. */
export const scanFields = (fields) =>
  fields.map((f) => ({ label: f.label, hits: detectInternalData(f.text) })).filter((g) => g.hits.length > 0);

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Confirmación (SOLO AVISO, nunca bloqueo). Devuelve true si no hay hallazgos o si la persona elige seguir.
 * `proceedText`: "Guardar así" / "Generar así".
 */
export async function confirmInternalData(groups, proceedText = "Guardar así") {
  if (!groups.length) return true;
  const list = groups.slice(0, 8).map((g) => `<li style="margin-bottom:4px"><b>${esc(g.label)}:</b> ${g.hits.slice(0, 5).map((h) => esc(h.text)).join(", ")}</li>`).join("");
  const r = await Swal.fire({
    icon: "warning",
    title: "Este texto saldrá tal cual en el informe al cliente",
    html: `<p style="margin-bottom:8px">Parece incluir fechas, horas, tiempos o montos:</p><ul style="text-align:left;padding-left:18px">${list}</ul><p style="margin-top:8px">¿Quitar fechas/horas? <i>Es solo un aviso: no se bloquea nada.</i></p>`,
    showCancelButton: true,
    confirmButtonText: proceedText,
    cancelButtonText: "Editar",
    reverseButtons: true,
    focusCancel: true,
  });
  return r.isConfirmed;
}
