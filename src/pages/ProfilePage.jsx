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
        <h1 className="font-display text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal en el sistema.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* Campo de Nombre (Editable) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            {/* Campo de Email (Lectura) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative bg-gray-50 rounded-lg">
                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400 italic">El correo no puede ser modificado.</p>
            </div>

            {/* Campo de Rol (Lectura) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rol asignado
              </label>
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg w-fit border border-blue-100">
                <Shield size={18} />
                <span className="font-bold text-sm uppercase">{user?.role}</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            <button
              type="submit"
              disabled={loading || name === user?.name}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-all ${
                loading || name === user?.name
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-brand-gradient hover:brightness-105 shadow-md'
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