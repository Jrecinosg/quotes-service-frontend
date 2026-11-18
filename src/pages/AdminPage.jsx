import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import { clientService } from '../services/client.service';
import { quotationService } from '../services/quotation.service';
import Swal from 'sweetalert2';
import { Trash2, Pencil, X, ShieldCheck, User as UserIcon, Mail, Building2, CalendarClock } from 'lucide-react';

export default function AdminPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [authorizedUsers, setAuthorizedUsers] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [editingEmail, setEditingEmail] = useState(null); // email en edición, o null = invitar nuevo
    const [backfilling, setBackfilling] = useState(false);

    const handleBackfillValidUntil = async () => {
        setBackfilling(true);
        try {
            const result = await quotationService.backfillValidUntil();
            Swal.fire({
                icon: 'success',
                title: 'Listo',
                text: `${result.updated} de ${result.scanned} cotizaciones actualizadas con su vigencia real.`,
                confirmButtonColor: '#3b82f6'
            });
        } catch (error) {
            Swal.fire('Error', 'No se pudo rellenar la vigencia', 'error');
        } finally {
            setBackfilling(false);
        }
    };

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
                // El servidor explica el motivo (p. ej. no se puede revocar al único administrador)
                Swal.fire('Error', error.response?.data?.error || 'No se pudo eliminar el acceso', 'error');
            }
        }
    };

    const staffUsers = authorizedUsers.filter((u) => u.role !== 'CLIENT');
    const clientGroups = Object.values(
        authorizedUsers
            .filter((u) => u.role === 'CLIENT')
            .reduce((acc, u) => {
                const key = u.clientId || u.client?.name || 'sin-empresa';
                if (!acc[key]) acc[key] = { clientName: u.client?.name || 'Sin empresa asignada', users: [] };
                acc[key].users.push(u);
                return acc;
            }, {})
    ).sort((a, b) => a.clientName.localeCompare(b.clientName));

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="title-xl">Configuración del <span className="serif-accent">Sistema</span></h1>
                <p className="text-ink-muted">Gestiona quién tiene acceso al cotizador y sus permisos.</p>
            </header>

            {/* Formulario de Invitación / Edición de rol */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                        <Mail size={20} className="text-info" />
                        {editingEmail ? 'Editar rol de usuario' : 'Invitar Nuevo Usuario'}
                    </h2>
                    {editingEmail && (
                        <button type="button" onClick={cancelEdit} className="text-sm text-ink-muted hover:text-ink flex items-center gap-1">
                            <X size={16} /> Cancelar
                        </button>
                    )}
                </div>
                <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-ink-2 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={!!editingEmail}
                            className="field w-full py-2 disabled:bg-surface-hover disabled:text-ink-soft"
                            placeholder="correo@empresa.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-2 mb-1">Tipo de acceso</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="field w-full py-2"
                        >
                            <option value="USER">Colaborador — Operador (USER)</option>
                            <option value="ADMIN">Colaborador — Administrador (ADMIN)</option>
                            <option value="CLIENT">Cliente (portal de solicitudes)</option>
                        </select>
                    </div>
                    {role === 'CLIENT' ? (
                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-1">Empresa cliente</label>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                required
                                className="field w-full py-2"
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
                        className={`py-2 px-4 rounded-md text-white font-medium transition-all md:col-start-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-soft hover:brightness-105 shadow-sm'
                            }`}
                    >
                        {loading ? 'Procesando...' : editingEmail ? 'Actualizar Rol' : 'Enviar Invitación'}
                    </button>
                </form>
                {role === 'CLIENT' && clients.length === 0 && (
                    <p className="text-xs text-warn mt-2">No hay clientes registrados todavía — crea uno primero en la sección Clientes.</p>
                )}
            </div>

            {/* Equipo interno */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-surface-border">
                    <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                        <ShieldCheck size={20} className="text-ok" />
                        Equipo interno
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-base text-ink-2 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Fecha Invitación</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {fetching ? (
                                <tr><td colSpan="4" className="text-center py-10 text-ink-muted">Cargando lista...</td></tr>
                            ) : staffUsers.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-ink-muted">No hay colaboradores registrados.</td></tr>
                            ) : (
                                staffUsers.map((user) => (
                                    <UserRow key={user.email} user={user} onEdit={startEdit} onDelete={handleDelete} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clientes, agrupados por empresa */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-surface-border">
                    <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                        <Building2 size={20} className="text-accent" />
                        Clientes con acceso al portal
                    </h2>
                    <p className="text-sm text-ink-muted mt-1">Una misma empresa puede tener más de una persona con acceso — solo invita otro correo con la misma empresa seleccionada.</p>
                </div>
                {fetching ? (
                    <div className="text-center py-10 text-ink-muted">Cargando lista...</div>
                ) : clientGroups.length === 0 ? (
                    <div className="text-center py-10 text-ink-muted">Todavía no hay clientes con acceso al portal.</div>
                ) : (
                    <div className="divide-y divide-surface-border">
                        {clientGroups.map(({ clientName, users }) => (
                            <div key={clientName}>
                                <div className="px-6 py-3 bg-surface-base flex items-center gap-2">
                                    <Building2 size={14} className="text-ink-muted" />
                                    <span className="font-semibold text-ink text-sm">{clientName}</span>
                                    <span className="text-xs text-ink-muted">({users.length} persona{users.length === 1 ? '' : 's'})</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <tbody className="divide-y divide-surface-border">
                                            {users.map((user) => (
                                                <UserRow key={user.email} user={user} onEdit={startEdit} onDelete={handleDelete} hideRole />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Acción de una sola vez: cotizaciones creadas antes de que existiera
                la vigencia real quedaron en "Sin fecha" -esto la calcula para
                todas usando su propio texto de Validez + fecha de creación. */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                    <CalendarClock size={20} className="text-info" />
                    Rellenar vigencia de cotizaciones antiguas
                </h2>
                <p className="text-sm text-ink-muted mt-1 mb-4">
                    Calcula Vigente/Vencida para las cotizaciones que ya existían antes de este cambio, usando su propio texto de "Validez". Es seguro ejecutarlo varias veces -solo toca las que todavía digan "Sin fecha".
                </p>
                <button
                    onClick={handleBackfillValidUntil}
                    disabled={backfilling}
                    className={`py-2 px-4 rounded-md text-white font-medium transition-all ${backfilling ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-soft hover:brightness-105 shadow-sm'}`}
                >
                    {backfilling ? 'Calculando...' : 'Rellenar ahora'}
                </button>
            </div>
        </div>
    );
}

function UserRow({ user, onEdit, onDelete, hideRole = false }) {
    return (
        <tr className="hover:bg-surface-hover transition-colors">
            <td className="px-6 py-4 w-1/3">
                <div className="flex items-center gap-3">
                    <div className="bg-surface-hover p-2 rounded-full">
                        <UserIcon size={16} className="text-ink-muted" />
                    </div>
                    <span className="font-medium text-ink">{user.email}</span>
                </div>
            </td>
            {!hideRole && (
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-violet/15 text-violet'
                        : user.role === 'CLIENT' ? 'bg-accent/15 text-accent'
                        : 'bg-info/15 text-info'
                        }`}>
                        {user.role}
                    </span>
                </td>
            )}
            <td className="px-6 py-4 text-sm text-ink-muted">
                {new Date(user.invitedAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onEdit(user)}
                        className="text-info hover:text-info transition-colors p-2 hover:bg-info/10 rounded-lg"
                        title="Editar rol"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(user.email)}
                        className="text-bad hover:text-bad transition-colors p-2 hover:bg-bad/10 rounded-lg"
                        title="Revocar acceso"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}