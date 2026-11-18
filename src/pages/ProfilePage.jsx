import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/user.service';
import { User, Mail, Shield, Save, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updateProfileName(name);
      
      setUser({ ...user, name });

      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tu nombre ha sido modificado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el perfil.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="title-xl">Mi <span className="serif-accent">Perfil</span></h1>
        <p className="text-ink-muted">Gestiona tu información personal en el sistema.</p>
      </header>

      <div className="card overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* Campo de Nombre (Editable) */}
            <div>
              <label className="block text-sm font-semibold text-ink-2 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-ink-muted w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field w-full pl-10 pr-4 py-2.5"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            {/* Campo de Email (Lectura) */}
            <div>
              <label className="block text-sm font-semibold text-ink-2 mb-2">
                Correo Electrónico
              </label>
              <div className="relative bg-surface-base rounded-lg">
                <Mail className="absolute left-3 top-3 text-ink-muted w-5 h-5" />
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="bg-surface-base placeholder:text-ink-soft w-full pl-10 pr-4 py-2.5 border border-surface-border rounded-lg text-ink-muted cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted italic">El correo no puede ser modificado.</p>
            </div>

            {/* Campo de Rol (Lectura) */}
            <div>
              <label className="block text-sm font-semibold text-ink-2 mb-2">
                Rol asignado
              </label>
              <div className="flex items-center gap-2 text-info bg-info/10 px-4 py-2 rounded-lg w-fit border border-info/30">
                <Shield size={18} />
                <span className="font-bold text-sm uppercase">{user?.role}</span>
              </div>
            </div>

            <hr className="border-surface-border" />

            <button
              type="submit"
              disabled={loading || name === user?.name}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                loading || name === user?.name
                  ? 'bg-surface-hover text-ink-soft cursor-not-allowed'
                  : 'bg-brand-soft text-white hover:brightness-105 shadow-md'
              }`}
            >
              {loading ? 'Guardando...' : <><Save size={20} /> Guardar Cambios</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}