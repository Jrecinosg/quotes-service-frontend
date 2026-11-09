import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, BookOpen, AlertCircle, AlertTriangle, X, ListChecks } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { StatusChip, TypeChip, KindChip, QuotationChip, StaleChip } from "../components/BitacoraChips";
import BitacoraProjectModal from "../components/BitacoraProjectModal";
import { displayStatus, formatRange, formatShortDate, isStale, isSupport, projectCounts, quotationNumber } from "../utils/bitacora";

const FILTERS = [
  { key: "ALL", label: "Todos" },
  { key: "EN_CURSO", label: "En curso" },
  { key: "CON_PENDIENTES", label: "Con pendientes" },
  { key: "TERMINADO", label: "Cerrados" },
];

const KINDS = [
  { key: "ALL", label: "Todo" },
  { key: "PROYECTO", label: "Proyectos" },
  { key: "SOPORTE", label: "Soportes" },
];

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function ProjectCard({ project }) {
  // El servidor guarda EN_CURSO/TERMINADO; "Con pendientes" se deriva de counts.openPendings.
  const counts = projectCounts(project);
  return (
    <Link
      to={`/app/bitacora/${project.id}`}
      className="card card-hover block p-5 min-h-[112px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00c2ff]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-semibold text-base line-clamp-2">{project.name}</h3>
        <StatusChip status={displayStatus(project)} />
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <KindChip kind={project.kind} />
        {!isSupport(project) && <TypeChip type={project.type} />}
        <QuotationChip number={quotationNumber(project)} />
        {isStale(project) && <StaleChip />}
      </div>
      <div className="mt-2">
        <span className="text-[13px] text-[#9FB0C4] tabular-nums">{isSupport(project) ? `Desde ${formatShortDate(project.startDate)}` : formatRange(project.startDate, project.endDate)}</span>
      </div>
      {counts.known && (
        <p className="mt-3 pt-3 border-t border-white/[0.07] text-xs text-[#9FB0C4] tabular-nums">
          {plural(counts.photos, "foto", "fotos")} · {plural(counts.openPendings, "pendiente abierto", "pendientes abiertos")}
          {counts.overduePendings > 0 && <span className="text-[#FCA5A5] font-semibold"> · {plural(counts.overduePendings, "vencido", "vencidos")}</span>}
        </p>
      )}
    </Link>
  );
}

export default function Bitacora() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setProjects(await bitacoraService.getProjects());
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clients = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => p.client && map.set(p.client.id, p.client.name));
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [projects]);

  const overdueProjects = useMemo(() => projects.filter((p) => projectCounts(p).overduePendings > 0).length, [projects]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      if (overdueOnly && projectCounts(p).overduePendings === 0) return false;
      if (filter === "CON_PENDIENTES") { if (projectCounts(p).openPendings === 0) return false; }
      else if (filter === "TERMINADO") { if (p.status !== "TERMINADO") return false; }
      else if (filter !== "ALL" && p.status !== filter) return false;
      if (kindFilter !== "ALL" && (p.kind || "PROYECTO") !== kindFilter) return false;
      if (clientId && String(p.client?.id) !== clientId) return false;
      if (term && !`${p.name} ${p.client?.name || ""} ${quotationNumber(p)}`.toLowerCase().includes(term)) return false;
      return true;
    });
    const byClient = new Map();
    filtered.forEach((p) => {
      const key = p.client?.id ?? 0;
      if (!byClient.has(key)) byClient.set(key, { name: p.client?.name || "Sin cliente", items: [] });
      byClient.get(key).items.push(p);
    });
    return [...byClient.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [projects, filter, kindFilter, clientId, search, overdueOnly]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight text-white">Bitácora de proyectos</h1>
          <p className="text-gray-400 text-sm">Proyectos y soportes por cliente: qué se hizo, con qué fotos y qué falta</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/app/bitacora/pendientes" className="btn btn-secondary px-4 py-2 flex items-center justify-center gap-2"><ListChecks size={18} /> Pendientes por cliente</Link>
          <button type="button" className="btn btn-primary px-4 py-2 flex items-center justify-center gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={20} /> Nuevo proyecto o soporte
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" aria-hidden="true" />
          <input type="search" className="field w-full pl-10 pr-4 h-11" placeholder="Buscar proyecto, cotización o cliente…" aria-label="Buscar proyecto, cotización o cliente" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="field h-11 w-full sm:w-60" aria-label="Filtrar por cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="seg self-start" role="group" aria-label="Filtrar por tipo">
          {KINDS.map((f) => (
            <button key={f.key} type="button" className="seg-item" aria-pressed={kindFilter === f.key} onClick={() => setKindFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="seg self-start" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="seg-item" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

      {!loading && !error && overdueProjects > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 rounded-2xl px-4 py-3" style={{ background: "rgba(251,191,36,.10)" }} role="status">
          <AlertTriangle size={16} aria-hidden="true" style={{ color: "#FCD34D" }} />
          <span className="text-sm font-semibold" style={{ color: "#FCD34D" }}>
            {overdueProjects === 1 ? "1 proyecto con pendientes vencidos" : `${overdueProjects} proyectos con pendientes vencidos`}
          </span>
          <button type="button" className="text-sm text-white underline underline-offset-2 hover:no-underline min-h-[32px] flex items-center gap-1" aria-pressed={overdueOnly} onClick={() => setOverdueOnly((v) => !v)}>
            {overdueOnly ? <><X size={14} aria-hidden="true" /> Quitar filtro</> : "Ver solo esos"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-busy="true" aria-label="Cargando bitácora">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[112px] rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-300" size={32} />
          <p className="text-white font-semibold">No se pudo cargar la bitácora</p>
          <button type="button" className="btn btn-primary px-4 py-2 mt-4" onClick={load}>Reintentar</button>
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="mx-auto mb-3 text-gray-400" size={36} />
          <p className="text-white font-medium">Aún no hay proyectos</p>
          <p className="text-sm text-gray-400 mt-1">Crea el primero cuando regreses de una visita.</p>
          <button type="button" className="btn btn-primary px-4 py-2 mt-4" onClick={() => setModalOpen(true)}>Nuevo proyecto o soporte</button>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center text-gray-400 py-14">Ningún proyecto coincide con ese filtro.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.name} aria-label={g.name}>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-white font-semibold text-base">{g.name}</h2>
                <span className="text-xs text-[#9FB0C4]">{g.items.length} {g.items.length === 1 ? "registro" : "registros"}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {g.items.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {modalOpen && <BitacoraProjectModal
        isOpen
        defaultClientId={clientId}
        onClose={() => setModalOpen(false)}
        onCreated={(created) => { setModalOpen(false); navigate(`/app/bitacora/${created.id}`); }}
      />}
    </div>
  );
}
