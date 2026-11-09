// Aviso al guardar una entrada: ¿el texto trae datos internos (fechas, horas de trabajo, montos)?
// El informe al cliente publica el texto tal cual, así que esto AVISA (no bloquea). Está pensado para NO marcar
// medidas, cantidades ni modelos: "2 agujeros", "1 pulgada", "DS-2CD2043", "40 mm", "220 V", "viga H", "35 metros".
const MONTH = "(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
const WEEKDAY = "(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)";

const INTERNAL_PATTERNS = [
  { kind: "fecha", rx: new RegExp(`\\b\\d{1,2}\\s+de\\s+${MONTH}\\b`, "gi") },
  { kind: "fecha", rx: new RegExp(`\\b${MONTH}\\s+(?:de\\s+)?\\d{4}\\b`, "gi") },
  { kind: "fecha", rx: /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g },
  { kind: "fecha", rx: /\b\d{4}-\d{2}-\d{2}\b/g },
  { kind: "fecha", rx: new RegExp(`\\b(?:el|del|este|pasado|próximo)\\s+${WEEKDAY}\\b`, "gi") },
  { kind: "fecha", rx: new RegExp(`\\b(?:en|de|durante)\\s+${MONTH}\\b`, "gi") },
  { kind: "hora", rx: /\b\d{1,2}:\d{2}\b/g },
  { kind: "hora", rx: /\b\d{1,2}\s?(?:a\.\s?m\.|p\.\s?m\.|am|pm)(?![a-záéíóúñ])/gi },
  { kind: "tiempo", rx: /\b\d+(?:[.,]\d+)?\s*(?:horas?|hrs?|minutos?|mins?)(?![a-záéíóúñ])/gi },
  { kind: "tiempo", rx: /\b(?:una|media|dos|tres|cuatro|cinco|seis|siete|ocho)\s+horas?(?![a-záéíóúñ])/gi },
  { kind: "tiempo", rx: /\b\d+\s+d[ií]as\b/gi },
  { kind: "dinero", rx: /(?:\bQ\.?|\bGTQ|\bUSD|\$)\s?\d[\d.,]*/g },
  { kind: "dinero", rx: /\b\d[\d.,]*\s?(?:quetzales|d[oó]lares)\b/gi },
];

/** Fragmentos del texto que parecen fechas, horas de trabajo o montos. [] si no hay nada. */
export const detectInternalData = (text) => {
  const src = String(text || "");
  const found = [];
  INTERNAL_PATTERNS.forEach(({ kind, rx }) => {
    rx.lastIndex = 0;
    let m = rx.exec(src);
    while (m !== null) {
      found.push({ kind, text: m[0].trim() });
      m = rx.exec(src);
    }
  });
  const seen = new Set();
  return found.filter((f) => { const k = f.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
};
