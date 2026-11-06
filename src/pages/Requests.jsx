import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileDown, ClipboardList, Clock, PlayCircle, CheckCircle2, LayoutGrid, List } from "lucide-react";
import Swal from "sweetalert2";
import { requestService } from "../services/request.service";
import RequestModal from "../components/RequestModal";
import RequestsBoard from "../components/RequestsBoard";
import { useAuth } from "../context/AuthContext";
import { formatRequestId, formatDate } from "../utils/formatters";
import { pdf } from '@react-pdf/renderer';
import { RequestsDocument } from "../components/RequestsPDF";
import appLogo from "../assets/logo.png";

const STATUS_LABEL = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', DONE: 'Finalizado' };
const STATUS_STYLE = {
  PENDING: 'bg-amber-500/15 text-amber-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400',
  DONE: 'bg-green-500/15 text-green-400'
};

function StatTile({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[28px] font-bold tracking-tight text-white leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const isStaff = !isClient;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultClientId, setModalDefaultClientId] = useState("");
  const [downloading, setDownloading] = useState(false);
  // Vista del personal: lista agrupada por cliente (la de siempre) o tablero por estados.
  const [view, setView] = useState(() => (localStorage.getItem("requests-view") === "board" ? "board" : "list"));
  const changeView = (v) => { setView(v); localStorage.setItem("requests-view", v); };

  // Se trae todo sin filtrar una sola vez: los tarjetones de conteo
  // necesitan ver el total real, y el filtro de estado se aplica aqui
  // mismo en el navegador -asi no se desincroniza uno del otro.
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll(1, isStaff ? 300 : 100, "");
      setRequests(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRequests = useMemo(
    () => (statusFilter ? requests.filter((r) => r.status === statusFilter) : requests),
    [requests, statusFilter]
  );

  const counts = useMemo(() => ({
    total: requests.length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    IN_PROGRESS: requests.filter((r) => r.status === 'IN_PROGRESS').length,
    DONE: requests.filter((r) => r.status === 'DONE').length,
  }), [requests]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await pdf(
        <RequestsDocument requests={visibleRequests} clientName={isClient ? user?.client?.name : 'Grupo AC'} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  // Pasar una solicitud a otro estado desde el tablero. Es el MISMO flujo del detalle:
  // confirmación + nota opcional, y el servidor avisa al cliente por correo (por eso se confirma siempre).
  const handleBoardMove = async (r, status) => {
    const result = await Swal.fire({
      title: `¿Pasar ${formatRequestId(r.correlativo)} a "${STATUS_LABEL[status]}"?`,
      text: "Se avisará al cliente por correo.",
      input: "text",
      inputLabel: "Nota para el cliente (opcional)",
      inputPlaceholder: "Ej. Técnico agendado para mañana 9am",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
    });
    if (!result.isConfirmed) return false;
    try {
      await requestService.updateStatus(r.id, status, result.value || undefined);
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)));
      return true;
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo actualizar el estado.", "error");
      return false;
    }
  };

  const openNewRequest = (clientId = "") => {
    setModalDefaultClientId(clientId ? String(clientId) : "");
    setIsModalOpen(true);
  };

  // Agrupar por empresa cliente: una lista plana mezclando a todos hace
  // dificil dar seguimiento cuando hay varias empresas activas a la vez.
  const groups = isStaff
    ? Object.values(
        visibleRequests.reduce((acc, r) => {
          const key = r.clientId;
          if (!acc[key]) acc[key] = { client: r.client, items: [] };
          acc[key].items.push(r);
          return acc;
        }, {})
      ).sort((a, b) => (a.client?.name || '').localeCompare(b.client?.name || ''))
    : null;

  const StatusFilterChips = () => (
    <div className="card p-4 mb-6 flex gap-2">
      {["", "PENDING", "IN_PROGRESS", "DONE"].map((s) => (
        <button
          key={s || 'ALL'}
          onClick={() => setStatusFilter(s)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            statusFilter === s ? "bg-brand-gradient text-white" : "bg-surface-hover text-gray-300 hover:bg-surface-border"
          }`}
        >
          {s ? STATUS_LABEL[s] : "Todas"}
        </button>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="card text-center py-14 text-gray-400">
      <ClipboardList className="mx-auto mb-2 text-gray-300" size={32} />
      {isClient ? "Todavía no tienes solicitudes. Crea la primera con el botón de arriba." : "No hay solicitudes registradas."}
    </div>
  );

  if (isClient) {
    return (
      <div>
        {/* Banner de bienvenida con marca del cliente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-orange-400 p-6 md:p-8 mb-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-14 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 -bottom-16 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
                  <img src={appLogo} alt="Grupo AC" className="w-full h-full object-contain" />
                </div>
                {user?.client?.logoBase64 && (
                  <>
                    <span className="text-white/50 text-xl font-light">+</span>
                    <div className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
                      <img src={user.client.logoBase64} alt={user.client.name} className="w-full h-full object-contain" />
                    </div>
                  </>
                )}
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium">Bienvenido a tu portal</p>
                <h1 className="font-display text-2xl md:text-3xl font-bold">{user?.client?.name || "Tu empresa"}</h1>
                <p className="text-blue-100 text-sm mt-0.5">{user?.name || user?.email}</p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleDownloadPdf}
                disabled={downloading || requests.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur border border-white/30 rounded-lg text-white hover:bg-white/25 disabled:opacity-50 transition-all text-sm font-medium"
              >
                <FileDown size={16} /> {downloading ? "Generando..." : "PDF"}
              </button>
              <button
                onClick={() => openNewRequest()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 shadow-sm transition-all font-semibold text-sm"
              >
                <Plus size={18} /> Nueva solicitud
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetones de conteo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatTile label="Total" value={counts.total} icon={ClipboardList} colorClass="bg-surface-hover text-gray-300" />
          <StatTile label="Pendiente" value={counts.PENDING} icon={Clock} colorClass="bg-amber-500/15 text-amber-400" />
          <StatTile label="En proceso" value={counts.IN_PROGRESS} icon={PlayCircle} colorClass="bg-blue-500/15 text-blue-400" />
          <StatTile label="Finalizado" value={counts.DONE} icon={CheckCircle2} colorClass="bg-green-500/15 text-green-400" />
        </div>

        <StatusFilterChips />

        {loading ? (
          <div className="card text-center py-10 text-gray-400">Cargando...</div>
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : visibleRequests.length === 0 ? (
          <div className="card text-center py-14 text-gray-400">
            No hay solicitudes con este estado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRequests.map((r) => (
              <Link
                key={r.id}
                to={`/app/requests/${r.id}`}
                className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-400">{formatRequestId(r.correlativo)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                  {r.title}
                </h3>
                <p className="text-xs text-gray-400 mt-auto pt-2 border-t border-surface-border">
                  Actualizado {formatDate(r.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}

        <RequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchRequests}
          forStaff={false}
          defaultClientId=""
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-white">Solicitudes de clientes</h1>
          <p className="text-gray-400 text-sm">Da seguimiento a los pendientes de cada cliente</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="seg" role="group" aria-label="Vista de solicitudes">
            <button type="button" aria-pressed={view === "list"} onClick={() => changeView("list")}
              className={`seg-item flex items-center gap-1.5 ${view === "list" ? "bg-white/10" : ""}`}>
              <List size={15} /> Lista
            </button>
            <button type="button" aria-pressed={view === "board"} onClick={() => changeView("board")}
              className={`seg-item flex items-center gap-1.5 ${view === "board" ? "bg-white/10" : ""}`}>
              <LayoutGrid size={15} /> Tablero
            </button>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || requests.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-lg text-gray-200 hover:bg-surface-hover disabled:opacity-50 transition-all"
          >
            <FileDown size={18} /> {downloading ? "Generando..." : "Descargar PDF"}
          </button>
          <button
            onClick={() => openNewRequest()}
            className="btn btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus size={20} /> Nueva solicitud
          </button>
        </div>
      </div>

      {view === "list" && <StatusFilterChips />}

      {loading ? (
        <div className="card text-center py-10 text-gray-400">Cargando...</div>
      ) : requests.length === 0 ? (
        <EmptyState />
      ) : view === "board" ? (
        <RequestsBoard requests={requests} onMove={handleBoardMove} />
      ) : (
        <div className="space-y-6">
          {groups.map(({ client, items }) => (
            <div key={client?.id} className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-base">
                <div>
                  <h2 className="font-semibold text-white">{client?.name}</h2>
                  <p className="text-xs text-gray-400">{items.length} solicitud{items.length === 1 ? '' : 'es'}</p>
                </div>
                <button
                  onClick={() => openNewRequest(client?.id)}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Plus size={16} /> Nueva para este cliente
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-surface-base text-gray-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Folio</th>
                      <th className="px-6 py-3">Título</th>
                      <th className="px-6 py-3">Creado por</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Última actualización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/app/requests/${r.id}`} className="font-bold text-blue-400 hover:underline">
                            {formatRequestId(r.correlativo)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-white">{r.title}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{r.createdBy?.name || r.createdBy?.email || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{formatDate(r.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRequests}
        forStaff={isStaff}
        defaultClientId={modalDefaultClientId}
      />
    </div>
  );
}
