// COMPRAS dentro de los pendientes: un pendiente es "de compra" SOLO si su texto EMPIEZA con COMPRA, COMPRAR o COMPRAS
// (sin importar mayúsculas ni tildes, con o sin dos puntos). "Revisar la compra de la cámara" NO es compra.
import { groupPendings, isDone } from "./bitacora";

const PREFIX = /^\s*compra(?:r|s)?(?![a-záéíóúñ0-9])\s*(:)?\s*/i;

/** { isPurchase, text }: `text` sin el prefijo (y sin un "de " suelto cuando no había dos puntos). */
export const parsePurchase = (raw) => {
  const original = String(raw || "");
  const m = original.match(PREFIX);
  if (!m) return { isPurchase: false, text: original.trim() };
  let rest = original.slice(m[0].length);
  if (!m[1]) rest = rest.replace(/^de\s+/i, "");
  rest = rest.trim();
  return rest ? { isPurchase: true, text: rest } : { isPurchase: false, text: original.trim() };
};

/**
 * Arma las empresas del PDF de pendientes: por empresa (orden alfabético) sus PENDIENTES agrupados por
 * proyecto / soporte / sueltos y sus COMPRAS aparte. Las empresas sin nada no aparecen.
 * `companyName(p)` devuelve el nombre de la empresa de un pendiente.
 */
export function buildCompanies(pendings, companyName, { includeDone = false } = {}) {
  const byCompany = new Map();
  (pendings || []).forEach((p) => {
    if (!includeDone && isDone(p)) return;
    const name = companyName(p) || "Empresa";
    if (!byCompany.has(name)) byCompany.set(name, { name, normal: [], purchases: [] });
    const entry = byCompany.get(name);
    const parsed = parsePurchase(p.text);
    const row = { text: parsed.text, assignee: p.assignee, dueDate: p.dueDate, done: isDone(p), origin: p.origin, projectTitle: p.project?.name || "" };
    if (parsed.isPurchase) entry.purchases.push(row); else entry.normal.push({ ...p, text: parsed.text });
  });
  return [...byCompany.values()]
    .map((c) => ({
      name: c.name,
      groups: groupPendings(c.normal).map((g) => ({
        title: g.title, kind: g.kind, quotationNumber: g.quotationNumber,
        pendings: g.pendings.map((p) => ({ text: p.text, assignee: p.assignee, dueDate: p.dueDate, done: isDone(p), origin: p.origin })),
      })),
      purchases: c.purchases,
      counts: { pendientes: c.normal.length, compras: c.purchases.length },
    }))
    .filter((c) => c.counts.pendientes + c.counts.compras > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
