// Utilidades de la Bitácora: fechas de calendario (el servidor las guarda a mediodía UTC,
// por eso se leen siempre en UTC para que no se corran un día), estado derivado y nombres de archivo.
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const parts = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Viernes 6 de noviembre de 2026" */
export const formatLongDate = (value) => {
  const p = parts(value);
  return p ? cap(`${DIAS[p.dow]} ${p.day} de ${MESES[p.month]} de ${p.year}`) : '---';
};

/** "vie 6 nov 2026" */
export const formatShortDate = (value, withYear = true) => {
  const p = parts(value);
  if (!p) return '---';
  const base = `${DIAS[p.dow].slice(0, 3)} ${p.day} ${MESES[p.month].slice(0, 3)}`;
  return withYear ? `${base} ${p.year}` : base;
};

/** "06/11/2026" */
export const formatNumericDate = (value) => {
  const p = parts(value);
  return p ? `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}` : '---';
};

/** "AAAA-MM-DD" de una fecha del servidor */
export const toIsoDay = (value) => {
  const p = parts(value);
  return p ? `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}` : '';
};

/** Hoy como "AAAA-MM-DD" en hora local */
export const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Rango "vie 6 nov 2026" o "mar 3 nov → vie 6 nov 2026" */
export const formatRange = (start, end) => {
  const s = toIsoDay(start);
  const e = toIsoDay(end);
  if (!e || s === e) return formatShortDate(start);
  return `${formatShortDate(start, false)} → ${formatShortDate(end)}`;
};

export const isOverdue = (pending, today = todayIso()) =>
  !pending.done && !!pending.dueDate && toIsoDay(pending.dueDate) < today;

export const openPendings = (project) => (project?.pendings || []).filter((p) => !p.done);

/**
 * Contadores del proyecto. La lista del servidor trae `counts`; el detalle trae `pendings`/`entries`.
 * Tolera que `counts` falte (backend viejo): en la lista queda todo en 0 y no se muestra el pie.
 */
export const projectCounts = (project) => {
  const c = project?.counts;
  if (c && typeof c === 'object') {
    return { photos: Number(c.photos) || 0, openPendings: Number(c.openPendings) || 0, overduePendings: Number(c.overduePendings) || 0, known: true };
  }
  if (Array.isArray(project?.pendings)) {
    const open = openPendings(project);
    const photos = Array.isArray(project.entries) ? project.entries.reduce((n, e) => n + (e.photos || []).length, 0) : 0;
    return { photos, openPendings: open.length, overduePendings: open.filter((p) => isOverdue(p)).length, known: true };
  }
  return { photos: 0, openPendings: 0, overduePendings: 0, known: false };
};

/**
 * Estado que se muestra: el servidor solo conoce EN_CURSO y TERMINADO.
 * "Con pendientes" = cerrado en campo pero con tareas abiertas (se deriva de `counts` o de `pendings`).
 */
export const displayStatus = (project) => {
  if (project.status === 'EN_CURSO') return 'EN_CURSO';
  if (projectCounts(project).openPendings > 0) return 'CON_PENDIENTES';
  return 'TERMINADO';
};

/** Sin tildes ni espacios (guion bajo) para nombres de archivo */
export const safeFilePart = (text) =>
  String(text || 'Cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Cliente';

/** Orden por fecha ascendente (para numerar "Día n de N") */
export const sortEntries = (entries) =>
  [...(entries || [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

/** Días distintos trabajados */
export const workedDays = (entries) => new Set((entries || []).map((e) => toIsoDay(e.date))).size;

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
