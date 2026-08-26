import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileDown, ClipboardList, Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import { requestService } from "../services/request.service";
import RequestModal from "../components/RequestModal";
import { useAuth } from "../context/AuthContext";
import { formatRequestId, formatDate } from "../utils/formatters";
import { pdf } from '@react-pdf/renderer';
import { RequestsDocument } from "../components/RequestsPDF";

const STATUS_LABEL = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', DONE: 'Finalizado' };
const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700'
};

function StatTile({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
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
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-2">
      {["", "PENDING", "IN_PROGRESS", "DONE"].map((s) => (
        <button
          key={s || 'ALL'}
          onClick={() => setStatusFilter(s)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            statusFilter === s ? "bg-brand-gradient text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {s ? STATUS_LABEL[s] : "Todas"}
        </button>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-14 text-gray-400">
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
              {user?.client?.logoBase64 && (
                <div className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
                  <img src={user.client.logoBase64} alt={user.client.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <p className="text-blue-100 text-sm font-medium">Bienvenido a tu portal</p>
                <h1 className="font-display text-2xl md:text-3xl font-bold">{user?.client?.name || "Tu empresa"}</h1>
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
          <StatTile label="Total" value={counts.total} icon={ClipboardList} colorClass="bg-gray-100 text-gray-600" />
          <StatTile label="Pendiente" value={counts.PENDING} icon={Clock} colorClass="bg-amber-100 text-amber-600" />
          <StatTile label="En proceso" value={counts.IN_PROGRESS} icon={PlayCircle} colorClass="bg-blue-100 text-blue-600" />
          <StatTile label="Finalizado" value={counts.DONE} icon={CheckCircle2} colorClass="bg-green-100 text-green-600" />
        </div>

        <StatusFilterChips />

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-10 text-gray-400">Cargando...</div>
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : visibleRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-14 text-gray-400">
            No hay solicitudes con este estado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRequests.map((r) => (
              <Link
                key={r.id}
                to={`/app/requests/${r.id}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-400">{formatRequestId(r.correlativo)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {r.title}
                </h3>
                <p className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
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
          <h1 className="font-display text-2xl font-bold text-gray-800">Solicitudes de clientes</h1>
          <p className="text-gray-500 text-sm">Da seguimiento a los pendientes de cada cliente</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || requests.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <FileDown size={18} /> {downloading ? "Generando..." : "Descargar PDF"}
          </button>
          <button
            onClick={() => openNewRequest()}
            className="bg-brand-gradient hover:brightness-105 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={20} /> Nueva solicitud
          </button>
        </div>
      </div>

      <StatusFilterChips />

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-10 text-gray-400">Cargando...</div>
      ) : requests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {groups.map(({ client, items }) => (
            <div key={client?.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="font-semibold text-gray-800">{client?.name}</h2>
                  <p className="text-xs text-gray-500">{items.length} solicitud{items.length === 1 ? '' : 'es'}</p>
                </div>
                <button
                  onClick={() => openNewRequest(client?.id)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus size={16} /> Nueva para este cliente
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Folio</th>
                      <th className="px-6 py-3">Título</th>
                      <th className="px-6 py-3">Creado por</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Última actualización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/app/requests/${r.id}`} className="font-bold text-blue-600 hover:underline">
                            {formatRequestId(r.correlativo)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-800">{r.title}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{r.createdBy?.name || r.createdBy?.email || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(r.updatedAt)}</td>
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
