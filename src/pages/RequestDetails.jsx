import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { requestService } from "../services/request.service";
import { useAuth } from "../context/AuthContext";
import { formatRequestId, formatDate } from "../utils/formatters";
import Swal from "sweetalert2";

const STATUS_LABEL = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', DONE: 'Finalizado' };
const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700'
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'USER';

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchRequest = () => {
    requestService.getById(id)
      .then(setRequest)
      .catch(() => navigate("/app/requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSending(true);
    try {
      await requestService.addNote(id, note.trim());
      setNote("");
      fetchRequest();
    } catch (error) {
      Swal.fire("Error", "No se pudo agregar la observación.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    const result = await Swal.fire({
      title: `¿Marcar como "${STATUS_LABEL[status]}"?`,
      input: 'text',
      inputLabel: 'Nota para el cliente (opcional)',
      inputPlaceholder: 'Ej. Técnico agendado para mañana 9am',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb'
    });
    if (!result.isConfirmed) return;

    setChangingStatus(true);
    try {
      await requestService.updateStatus(id, status, result.value || undefined);
      Swal.fire("Actualizado", "Se notificó al cliente por correo.", "success");
      fetchRequest();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el estado.", "error");
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando solicitud...</div>;
  if (!request) return null;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <button onClick={() => navigate("/app/requests")} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6">
        <ArrowLeft size={20} /> Volver al listado
      </button>

      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{formatRequestId(request.correlativo)} — {request.title}</h1>
            <p className="text-gray-500 mt-1 font-medium">
              {isStaff ? request.client?.name : 'Creada'} · {formatDate(request.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_STYLE[request.status]}`}>
            {STATUS_LABEL[request.status]}
          </span>
        </div>

        <div className="p-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-8">{request.description}</p>

          {isStaff && (
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                disabled={changingStatus || request.status === 'IN_PROGRESS'}
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
              >
                <PlayCircle size={18} /> Marcar en proceso
              </button>
              <button
                disabled={changingStatus || request.status === 'DONE'}
                onClick={() => handleStatusChange('DONE')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
              >
                <CheckCircle2 size={18} /> Marcar finalizado
              </button>
            </div>
          )}

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Historial</h3>
          <div className="space-y-4 mb-8">
            {request.notes.map((n) => (
              <div key={n.id} className="flex gap-3">
                <div className="mt-1 shrink-0">
                  {n.type === 'STATUS_CHANGE' ? (
                    <Clock size={16} className="text-blue-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 ml-1" />
                  )}
                </div>
                <div className="flex-1 border-b border-gray-100 pb-3">
                  <p className="text-sm text-gray-700">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.createdBy?.name || n.createdBy?.email} · {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddNote} className="flex gap-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Agregar una observación o recordatorio..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !note.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
