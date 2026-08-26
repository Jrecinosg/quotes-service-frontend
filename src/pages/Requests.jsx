import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileDown, ClipboardList } from "lucide-react";
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

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll(1, isStaff ? 300 : 50, statusFilter);
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
  }, [statusFilter]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const all = await requestService.getAll(1, 1000, statusFilter);
      const blob = await pdf(
        <RequestsDocument requests={all.data || []} clientName={isClient ? user?.client?.name : 'Grupo AC'} />
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
        requests.reduce((acc, r) => {
          const key = r.clientId;
          if (!acc[key]) acc[key] = { client: r.client, items: [] };
          acc[key].items.push(r);
          return acc;
        }, {})
      ).sort((a, b) => (a.client?.name || '').localeCompare(b.client?.name || ''))
    : null;

  const RequestRow = ({ r, showClient }) => (
    <tr className="hover:bg-blue-50 transition-colors">
      <td className="px-6 py-4">
        <Link to={`/app/requests/${r.id}`} className="font-bold text-blue-600 hover:underline">
          {formatRequestId(r.correlativo)}
        </Link>
      </td>
      <td className="px-6 py-4 text-gray-800">{r.title}</td>
      {showClient && <td className="px-6 py-4 text-gray-600">{r.client?.name}</td>}
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-500">{formatDate(r.updatedAt)}</td>
    </tr>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">
            {isClient ? "Mis solicitudes" : "Solicitudes de clientes"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isClient ? "Da seguimiento a tus pendientes con Grupo AC" : "Da seguimiento a los pendientes de cada cliente"}
          </p>
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

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-10 text-gray-400">Cargando...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-14 text-gray-400">
          <ClipboardList className="mx-auto mb-2 text-gray-300" size={32} />
          {isClient ? "Todavía no tienes solicitudes. Crea la primera con el botón de arriba." : "No hay solicitudes registradas."}
        </div>
      ) : isStaff ? (
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
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Última actualización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((r) => <RequestRow key={r.id} r={r} showClient={false} />)}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Folio</th>
                  <th className="px-6 py-4">Título</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Última actualización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => <RequestRow key={r.id} r={r} showClient={false} />)}
              </tbody>
            </table>
          </div>
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
