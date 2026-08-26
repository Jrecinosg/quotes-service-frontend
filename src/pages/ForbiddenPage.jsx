import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { auth } from '../firebase';

export default function ForbiddenPage() {
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono de Escudo con Pulso */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping"></div>
            <div className="relative bg-red-50 p-6 rounded-full border border-red-100">
              <ShieldAlert className="w-16 h-16 text-red-600" />
            </div>
          </div>
        </div>

        {/* Texto de Error */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, no tienes los permisos necesarios para ver esta sección. 
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/app"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:brightness-105 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-gray-400 font-medium tracking-widest uppercase">
        Plataforma Grupo AC © 2026
      </p>
    </div>
  );
}