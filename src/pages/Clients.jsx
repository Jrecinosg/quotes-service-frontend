import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, User } from "lucide-react";
import { clientService } from "../services/client.service";
import ClientModal from "../components/ClientModal";
import Swal from "sweetalert2";

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxId.includes(searchTerm)
    );

    return (
        <div>
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-gray-800">Clientes</h1>
                    <p className="text-gray-500 text-sm">Gestiona tu cartera de clientes</p>
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o NIT..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8">Cargando...</td></tr>
                            ) : filteredClients.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No se encontraron clientes</td></tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{client.name}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{client.address}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                                {client.taxId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <p>{client.email}</p>
                                            <p>{client.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Eliminar"
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