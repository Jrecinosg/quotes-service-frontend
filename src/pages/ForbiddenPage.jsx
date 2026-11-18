import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import Aurora from '../components/Aurora';

export default function ForbiddenPage() {
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 text-ink font-medium">
      <Aurora />
      <div className="card relative z-[1] max-w-md w-full text-center p-8 !rounded-[1.6rem] !shadow-[var(--sh-pop)]">
        {/* Icono de Escudo con Pulso */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-bad/10 animate-ping"></div>
            <div className="relative bg-bad/10 p-6 rounded-full border border-bad/25">
              <ShieldAlert className="w-16 h-16 text-bad" />
            </div>
          </div>
        </div>

        {/* Texto de Error */}
        <h1 className="font-mono text-5xl font-semibold text-info mb-2">403</h1>
        <h2 className="title-xl !text-[1.75rem] mb-4">Acceso <span className="serif-accent">Restringido</span></h2>
        <p className="text-ink-soft mb-8">
          Lo sentimos, no tienes los permisos necesarios para ver esta sección. 
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/app"
            className="btn btn-primary flex items-center justify-center gap-2 px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Link>
          
          <button
            onClick={handleLogout}
            className="btn btn-secondary flex items-center justify-center gap-2 px-6 py-3"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-[1] mt-10 font-mono text-xs text-ink-muted font-semibold tracking-[0.14em] uppercase">
        Plataforma Grupo AC © 2026
      </p>
    </div>
  );
}