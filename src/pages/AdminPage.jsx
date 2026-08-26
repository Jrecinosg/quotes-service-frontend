import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import { clientService } from '../services/client.service';
import Swal from 'sweetalert2';
import { Trash2, Pencil, X, ShieldCheck, User as UserIcon, Mail, Building2 } from 'lucide-react';

export default function AdminPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [authorizedUsers, setAuthorizedUsers] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [editingEmail, setEditingEmail] = useState(null); // email en edición, o null = invitar nuevo

    // Cargar lista de usuarios autorizados
    const fetchUsers = async () => {
        try {
            const data = await userService.getAuthorizedEmails();
            setAuthorizedUsers(data);
        } catch (error) {
            console.error("Error cargando usuarios", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        clientService.getAll().then(setClients).catch(() => {});
    }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await userService.inviteUser(email, role, role === 'CLIENT' ? clientId : undefined);
            Swal.fire({
                icon: 'success',
                title: result.wasNew ? '¡Invitación enviada!' : '¡Rol actualizado!',
                text: result.wasNew
                    ? `Se ha autorizado a ${email} con éxito.`
                    : `${email} ahora tiene el rol seleccionado.`,
                confirmButtonColor: '#3b82f6'
            });
            setEmail('');
            setClientId('');
            setEditingEmail(null);
            fetchUsers();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'No se pudo guardar el cambio',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (u) => {
        setEditingEmail(u.email);
        setEmail(u.email);
        setRole(u.role);
        setClientId(u.clientId ? String(u.clientId) : '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingEmail(null);
        setEmail('');
        setRole('USER');
        setClientId('');
    };

    const handleDelete = async (userEmail) => {
        const result = await Swal.fire({
            title: '¿Revocar acceso?',
            text: `El correo ${userEmail} ya no podrá ingresar al sistema.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, revocar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await userService.removeInvitation(userEmail);
                Swal.fire('Eliminado', 'Acceso revocado correctamente', 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el acceso', 'error');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="font-display text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-gray-600">Gestiona quién tiene acceso al cotizador y sus permisos.</p>
            </header>

            {/* Formulario de Invitación / Edición de rol */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Mail size={20} className="text-blue-500" />
                        {editingEmail ? 'Editar rol de usuario' : 'Invitar Nuevo Usuario'}
                    </h2>
                    {editingEmail && (
                        <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <X size={16} /> Cancelar
                        </button>
                    )}
                </div>
                <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={!!editingEmail}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="correo@empresa.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acceso</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="USER">Colaborador — Operador (USER)</option>
                            <option value="ADMIN">Colaborador — Administrador (ADMIN)</option>
                            <option value="CLIENT">Cliente (portal de solicitudes)</option>
                        </select>
                    </div>
                    {role === 'CLIENT' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa cliente</label>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Selecciona una empresa...</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : <div />}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`py-2 px-4 rounded-md text-white font-medium transition-all md:col-start-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-gradient hover:brightness-105 shadow-sm'
                            }`}
                    >
                        {loading ? 'Procesando...' : editingEmail ? 'Actualizar Rol' : 'Enviar Invitación'}
                    </button>
                </form>
                {role === 'CLIENT' && clients.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">No hay clientes registrados todavía — crea uno primero en la sección Clientes.</p>
                )}
            </div>

            {/* Tabla de Usuarios Autorizados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-500" />
                        Usuarios Autorizados
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Fecha Invitación</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fetching ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-400">Cargando lista...</td></tr>
                            ) : authorizedUsers.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-400">No hay usuarios registrados.</td></tr>
                            ) : (
                                authorizedUsers.map((user) => (
                                    <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full">
                                                <UserIcon size={16} className="text-gray-500" />
                                            </div>
                                            <span className="font-medium text-gray-700">{user.email}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700'
                                                : user.role === 'CLIENT' ? 'bg-orange-100 text-orange-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                            {user.role === 'CLIENT' && user.client && (
                                                <span className="ml-2 text-xs text-gray-500 inline-flex items-center gap-1">
                                                    <Building2 size={12} /> {user.client.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.invitedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="text-blue-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                                    title="Editar rol"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.email)}
                                                    className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                    title="Revocar acceso"
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
        </div>
    );
}