import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, BookOpen, AlertCircle } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";
import { StatusChip, TypeChip } from "../components/BitacoraChips";
import BitacoraProjectModal from "../components/BitacoraProjectModal";
import { formatRange } from "../utils/bitacora";

const FILTERS = [
  { key: "ALL", label: "Todos" },
  { key: "EN_CURSO", label: "En curso" },
  { key: "TERMINADO", label: "Cerrados" },
];

function ProjectCard({ project }) {
  // La lista del servidor trae solo EN_CURSO/TERMINADO; "Con pendientes" se ve en el detalle.
  return (
    <Link
      to={`/app/bitacora/${project.id}`}
      className="card card-hover block p-5 min-h-[112px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00c2ff]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-semibold text-base line-clamp-2">{project.name}</h3>
        <StatusChip status={project.status} />
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <TypeChip type={project.type} />
        <span className="text-[13px] text-[#9FB0C4] tabular-nums">{formatRange(project.startDate, project.endDate)}</span>
      </div>
    </Link>
  );
}

export default function Bitacora() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
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

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      if (filter !== "ALL" && p.status !== filter) return false;
      if (clientId && String(p.client?.id) !== clientId) return false;
      if (term && !`${p.name} ${p.client?.name || ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
    const byClient = new Map();
    filtered.forEach((p) => {
      const key = p.client?.id ?? 0;
      if (!byClient.has(key)) byClient.set(key, { name: p.client?.name || "Sin cliente", items: [] });
      byClient.get(key).items.push(p);
    });
    return [...byClient.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [projects, filter, clientId, search]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight text-white">Bitácora de proyectos</h1>
          <p className="text-gray-400 text-sm">Qué se hizo, cuándo y con qué fotos, por cliente</p>
        </div>
        <button type="button" className="btn btn-primary px-4 py-2 flex items-center justify-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={20} /> Nuevo proyecto
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" aria-hidden="true" />
          <input type="search" className="field w-full pl-10 pr-4 h-11" placeholder="Buscar proyecto o cliente…" aria-label="Buscar proyecto o cliente" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="field h-11 lg:w-60" aria-label="Filtrar por cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="seg self-start" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="seg-item" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

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
          <button type="button" className="btn btn-primary px-4 py-2 mt-4" onClick={() => setModalOpen(true)}>Nuevo proyecto</button>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center text-gray-400 py-14">Ningún proyecto coincide con ese filtro.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.name} aria-label={g.name}>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-white font-semibold text-base">{g.name}</h2>
                <span className="text-xs text-[#9FB0C4]">{g.items.length} {g.items.length === 1 ? "proyecto" : "proyectos"}</span>
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
