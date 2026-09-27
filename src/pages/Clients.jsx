import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Merge } from "lucide-react";
import { clientService } from "../services/client.service";
import ClientModal from "../components/ClientModal";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

export default function Clients() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // ?highlight=<id>: viene del buscador global del encabezado -resalta y
    // lleva a la vista la fila de ese cliente (no hay página de detalle).
    const [searchParams] = useSearchParams();
    const highlightId = Number(searchParams.get("highlight")) || null;
    const highlightRef = useRef(null);

    // Estado para Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await clientService.getAll();
            setClients(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (!loading && highlightId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [loading, highlightId]);

    const handleCreate = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await clientService.delete(id);
                Swal.fire('¡Borrado!', 'El cliente ha sido eliminado.', 'success');
                fetchClients(); // Recarga lista
            } catch (error) {
                Swal.fire('Error', 'No se pudo borrar (tal vez tiene cotizaciones asociadas).', 'error');
            }
        }
    };

    const handleMerge = async (client) => {
        const others = clients.filter((c) => c.id !== client.id);
        if (others.length === 0) {
            Swal.fire('No hay otro cliente', 'Necesitas al menos otro cliente registrado para fusionar.', 'info');
            return;
        }

        const inputOptions = others.reduce((acc, c) => {
            acc[c.id] = `${c.name}${c.taxId ? ` — NIT ${c.taxId}` : ''}`;
            return acc;
        }, {});

        const { value: intoClientId, isConfirmed } = await Swal.fire({
            title: `Fusionar "${client.name}"`,
            html: `Elige el cliente que se <strong>conserva</strong>. Todas las cotizaciones y solicitudes de <strong>${client.name}</strong> se moverán ahí, y luego se borrará este duplicado.`,
            input: 'select',
            inputOptions,
            inputPlaceholder: 'Selecciona el cliente que se conserva...',
            showCancelButton: true,
            confirmButtonText: 'Fusionar',
            confirmButtonColor: '#2563eb',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => !value && 'Selecciona un cliente'
        });

        if (!isConfirmed || !intoClientId) return;

        const target = others.find((c) => String(c.id) === String(intoClientId));
        const confirm = await Swal.fire({
            title: '¿Confirmar fusión?',
            text: `"${client.name}" se borrará y todo lo suyo pasará a "${target.name}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, fusionar'
        });
        if (!confirm.isConfirmed) return;

        try {
            const result = await clientService.merge(client.id, intoClientId);
            Swal.fire('¡Fusionado!', `${result.message} (${result.movedQuotations} cotizaciones y ${result.movedRequests} solicitudes movidas)`, 'success');
            fetchClients();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo fusionar', 'error');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.taxId || "").includes(searchTerm)
    );

    return (
        <div>
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white">Clientes</h1>
                    <p className="text-gray-400 text-sm">Gestiona tu cartera de clientes</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-brand-gradient hover:brightness-105 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-surface-card p-4 rounded-2xl border border-surface-border mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o NIT..."
                        className="w-full pl-10 pr-4 py-2 bg-surface-base border border-surface-border text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-surface-base text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">Cargando...</td></tr>
                            ) : filteredClients.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">No se encontraron clientes</td></tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        ref={client.id === highlightId ? highlightRef : null}
                                        className={`transition-colors group ${client.id === highlightId ? "bg-blue-500/10 ring-1 ring-inset ring-blue-400/50" : "hover:bg-surface-hover"}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{client.name}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{client.address}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-surface-hover text-gray-300 rounded text-xs font-mono">
                                                {client.taxId || "Sin NIT"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            <p>{client.email}</p>
                                            <p>{client.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/15 rounded-lg" title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleMerge(client)}
                                                        className="p-2 text-purple-400 hover:bg-purple-500/15 rounded-lg" title="Fusionar con otro cliente"
                                                    >
                                                        <Merge size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg" title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* MODAL REUTILIZABLE */}
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                clientToEdit={editingClient}
                onSuccess={fetchClients}
            />
        </div>
    );
}