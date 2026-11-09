import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, AlertCircle, FileText, Plus, Lock, ListChecks } from "lucide-react";
import Swal from "sweetalert2";
import { bitacoraService } from "../services/bitacora.service";
import { KindChip, OriginChip } from "../components/BitacoraChips";
import { formatShortDate, groupPendings, isDone, isOverdue, ORIGINS } from "../utils/bitacora";
import { downloadPendientesPdf } from "../utils/bitacoraPdfExport";

const STATUS = [
  { key: "abiertos", label: "Abiertos" },
  { key: "hechos", label: "Hechos" },
  { key: "todos", label: "Todos" },
];

const PAGE_SIZE = 200; // pendientes por página en pantalla; "Ver más" trae la siguiente

const toast = (title) => Swal.fire({ toast: true, position: "bottom-end", icon: "success", title, showConfirmButton: false, timer: 2500 });

/**
 * Pantalla "Pendientes" de la Bitácora: por cliente y, dentro, por proyecto / soporte / sueltos.
 * Filtros: cliente -> proyecto (o sueltos), estado y origen. Crear pendientes con origen, responsable,
 * fecha límite y proyecto opcional. PDF para el personal con los filtros activos (cliente obligatorio).
 */
export default function BitacoraPendientes() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState(""); // "" todos | "none" sueltos | id
  const [status, setStatus] = useState("abiertos");
  const [origin, setOrigin] = useState("");
  const [pendings, setPendings] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ text: "", origin: "CLIENTE", projectId: "", assignee: "", dueDate: "" });

  useEffect(() => { bitacoraService.getClients().then(setClients).catch(() => setError(true)); }, []);

  useEffect(() => {
    let alive = true;
    if (!clientId) { setProjects([]); return undefined; }
    bitacoraService.getProjects({ clientId }).then((list) => { if (alive) setProjects(list); }).catch(() => { if (alive) setProjects([]); });
    return () => { alive = false; };
  }, [clientId]);

  // `keep`: recarga conservando lo ya mostrado (tras marcar un pendiente no se pierde el "Ver más").
  const load = useCallback(async (keep = 0) => {
    setLoading(true);
    setError(false);
    try {
      const page = await bitacoraService.getPendings({ clientId, projectId, status, origin, limit: Math.min(1000, Math.max(PAGE_SIZE, keep)) });
      setPendings(page.items);
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [clientId, projectId, status, origin]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await bitacoraService.getPendings({ clientId, projectId, status, origin, limit: PAGE_SIZE, offset: pendings.length });
      setPendings((prev) => [...prev, ...page.items]);
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch {
      Swal.fire("Error", "No se pudieron cargar más pendientes.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const clientName = useMemo(() => new Map(clients.map((c) => [String(c.id), c.name])), [clients]);
  const byClient = useMemo(() => {
    const map = new Map();
    pendings.forEach((p) => {
      const key = String(p.clientId ?? clientId ?? "");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()]
      .map(([key, list]) => ({ key, name: clientName.get(key) || "Cliente", groups: groupPendings(list) }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [pendings, clientName, clientId]);

  const run = async (fn, fallback, done) => {
    setBusy(true);
    try { await fn(); await load(pendings.length); if (done) toast(done); } catch (err) { Swal.fire("Error", err.response?.data?.error || fallback, "error"); } finally { setBusy(false); }
  };

  const toggle = (p) => run(() => (isDone(p) ? bitacoraService.updatePending(p.id, { done: false }) : bitacoraService.resolvePending(p.id)), "No se pudo actualizar el pendiente.");

  const add = (e) => {
    e.preventDefault();
    if (!clientId || !form.text.trim()) return;
    run(async () => {
      await bitacoraService.createPendingV2({
        clientId: Number(clientId),
        projectId: form.projectId ? Number(form.projectId) : null,
        origin: form.origin,
        text: form.text.trim(),
        ...(form.assignee.trim() ? { assignee: form.assignee.trim() } : {}),
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      });
      setForm((f) => ({ ...f, text: "", assignee: "", dueDate: "" }));
    }, "No se pudo agregar el pendiente.", "Pendiente agregado");
  };

  const pdf = async () => {
    setBusy(true);
    try {
      const proj = projectId === "none" ? "Pendientes sin proyecto" : projects.find((p) => String(p.id) === projectId)?.name || "";
      // El PDF trae TODAS las páginas de la lista filtrada (nunca sale incompleto aunque en pantalla haya "Ver más").
      const all = hasMore ? await bitacoraService.getAllPendings({ clientId, projectId, status, origin }) : pendings;
      await downloadPendientesPdf({ clientName: clientName.get(clientId), filterLabel: proj, pendings: all, includeDone: status !== "abiertos" });
      toast("Pendientes descargados");
    } catch {
      Swal.fire("No se pudo generar el PDF", "Inténtalo de nuevo.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <nav aria-label="Migas" className="flex items-center gap-1 text-sm text-[#9FB0C4] mb-3">
        <Link to="/app/bitacora" className="hover:text-white">Bitácora</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="text-gray-300">Pendientes</span>
      </nav>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight text-white">Pendientes por cliente</h1>
          <p className="text-gray-400 text-sm flex items-center gap-1.5"><Lock size={13} aria-hidden="true" /> Solo equipo · nunca sale en el informe al cliente</p>
        </div>
        <button type="button" className="btn btn-primary px-4 py-2 flex items-center justify-center gap-2" onClick={pdf} disabled={!clientId || busy || pendings.length === 0}
          title={!clientId ? "Elige un cliente para descargar su PDF" : pendings.length === 0 ? "No hay pendientes con estos filtros" : undefined}>
          <FileText size={18} /> Descargar PDF para el personal
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select className="field h-11 w-full sm:w-60" aria-label="Cliente" value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(""); setForm((f) => ({ ...f, projectId: "" })); }}>
          <option value="">Todos los clientes</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="field h-11 w-full sm:w-72" aria-label="Proyecto, soporte o sueltos" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!clientId}>
          <option value="">{clientId ? "Todos (proyectos, soportes y sueltos)" : "Elige primero un cliente"}</option>
          <option value="none">Sueltos (sin proyecto)</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.kind === "SOPORTE" ? "Soporte · " : ""}{p.name}</option>)}
        </select>
        <div className="seg self-start" role="group" aria-label="Estado">
          {STATUS.map((s) => <button key={s.key} type="button" className="seg-item" aria-pressed={status === s.key} onClick={() => setStatus(s.key)}>{s.label}</button>)}
        </div>
        <select className="field h-11 w-full sm:w-44" aria-label="Origen" value={origin} onChange={(e) => setOrigin(e.target.value)}>
          <option value="">Todos los orígenes</option>
          {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8" aria-label="Lista de pendientes">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Cargando pendientes">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
          ) : error ? (
            <div className="card p-10 text-center">
              <AlertCircle className="mx-auto mb-2 text-red-300" size={32} />
              <p className="text-white font-semibold">No se pudieron cargar los pendientes</p>
              <button type="button" className="btn btn-primary px-4 py-2 mt-4" onClick={() => load()}>Reintentar</button>
            </div>
          ) : pendings.length === 0 ? (
            <div className="card p-12 text-center">
              <ListChecks className="mx-auto mb-3 text-gray-400" size={36} />
              <p className="text-white font-medium">No hay pendientes con estos filtros</p>
              <p className="text-sm text-gray-400 mt-1">Agrega uno desde el formulario o cambia el filtro.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-xs text-[#9FB0C4] tabular-nums" role="status">Mostrando {pendings.length} de {total}</p>
              {byClient.map((c) => (
                <div key={c.key}>
                  {(!clientId) && <h2 className="text-white font-semibold text-base mb-3">{c.name}</h2>}
                  <div className="space-y-4">
                    {c.groups.map((g) => (
                      <article key={g.key} className="card p-5" aria-label={g.title}>
                        <header className="flex flex-wrap items-center gap-2">
                          <h3 className="text-white font-semibold text-sm break-words">{g.title}</h3>
                          {g.kind === "SOPORTE" && <KindChip kind="SOPORTE" />}
                          {g.quotationNumber && <span className="text-xs text-[#9FB0C4]">{g.quotationNumber}</span>}
                          {g.kind !== "SUELTOS" && <Link to={`/app/bitacora/${g.key}`} className="ml-auto text-xs text-[#7DD3FF] hover:text-white">Abrir</Link>}
                        </header>
                        <ul className="mt-2 divide-y divide-white/10">
                          {g.pendings.map((p) => {
                            const done = isDone(p);
                            const over = isOverdue(p);
                            return (
                              <li key={p.id} className="flex items-start gap-1 py-2 min-h-[52px]">
                                <button type="button" onClick={() => toggle(p)} disabled={busy} role="checkbox" aria-checked={done} aria-label={`Marcar «${p.text}» como ${done ? "abierto" : "hecho"}`} className="w-11 h-11 -ml-2 shrink-0 flex items-center justify-center">
                                  <span className="w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors" style={{ borderColor: done ? "#2bb8ff" : "#6b7d92", background: done ? "#2bb8ff" : "transparent" }}>
                                    {done && <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 5 9.5 10 3" stroke="#06101e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                  </span>
                                </button>
                                <div className="flex-1 min-w-0 pt-2.5">
                                  <p className={`text-sm break-words ${done ? "line-through text-gray-500" : "text-white"}`}>{p.text}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                    <OriginChip origin={p.origin} />
                                    {p.assignee && <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,.07)", color: "#CBD5E1" }}>{p.assignee}</span>}
                                    {p.dueDate && !done && <span style={{ color: over ? "#FCA5A5" : "#9FB0C4" }} className="tabular-nums">{formatShortDate(p.dueDate, false)}{over ? " · Vencido" : ""}</span>}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="text-center">
                  <button type="button" className="btn btn-secondary px-5 py-2" onClick={loadMore} disabled={loadingMore} aria-busy={loadingMore}>
                    {loadingMore ? "Cargando…" : `Ver más (${total - pendings.length} restantes)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="lg:col-span-4">
          <form onSubmit={add} className="card p-5 space-y-2" aria-labelledby="bit-newp-title">
            <h2 id="bit-newp-title" className="text-white font-semibold text-base">Nuevo pendiente</h2>
            {!clientId && <p className="text-xs text-[#9FB0C4]">Elige un cliente arriba para poder agregar.</p>}
            <input className="field w-full text-sm" placeholder="Qué falta hacer…" maxLength={1000} aria-label="Nuevo pendiente" value={form.text} disabled={!clientId} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <select className="field w-full text-sm" aria-label="Proyecto o soporte (opcional)" value={form.projectId} disabled={!clientId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">Sin proyecto (pendiente del cliente)</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.kind === "SOPORTE" ? "Soporte · " : ""}{p.name}</option>)}
            </select>
            <select className="field w-full text-sm" aria-label="Origen" value={form.origin} disabled={!clientId} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
              {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>Origen: {v}</option>)}
            </select>
            <input className="field w-full text-sm" placeholder="Responsable" maxLength={120} aria-label="Responsable" value={form.assignee} disabled={!clientId} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
            <input type="date" className="field w-full text-sm" aria-label="Fecha límite" value={form.dueDate} disabled={!clientId} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <button type="submit" className="btn btn-secondary px-4 py-2 w-full flex items-center justify-center gap-2" disabled={busy || !clientId || !form.text.trim()}><Plus size={16} /> Agregar</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
