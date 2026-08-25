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

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll(1, 50, statusFilter);
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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isClient ? "Mis solicitudes" : "Solicitudes de clientes"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isClient ? "Da seguimiento a tus pendientes con Grupo AC" : "Da seguimiento a los pendientes de todos los clientes"}
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
          {isClient && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={20} /> Nueva solicitud
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-2">
        {["", "PENDING", "IN_PROGRESS", "DONE"].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s ? STATUS_LABEL[s] : "Todas"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Folio</th>
                <th className="px-6 py-4">Título</th>
                {!isClient && <th className="px-6 py-4">Cliente</th>}
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Última actualización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isClient ? 4 : 5} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={isClient ? 4 : 5} className="text-center py-14 text-gray-400">
                    <ClipboardList className="mx-auto mb-2 text-gray-300" size={32} />
                    {isClient ? "Todavía no tienes solicitudes. Crea la primera con el botón de arriba." : "No hay solicitudes registradas."}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/app/requests/${r.id}`} className="font-bold text-blue-600 hover:underline">
                        {formatRequestId(r.correlativo)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-800">{r.title}</td>
                    {!isClient && <td className="px-6 py-4 text-gray-600">{r.client?.name}</td>}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(r.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
