import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, Settings, User, ClipboardList, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import appLogo from "../assets/logo.png";

export default function Sidebar() {
    const { logout, user } = useAuth();
    const location = useLocation(); // Obtener URL actual
    const isClientAccount = user?.role === 'CLIENT';
    const [mobileOpen, setMobileOpen] = useState(false);

    const menuItems = isClientAccount
        ? [{ path: "/app/requests", icon: ClipboardList, label: "Mis solicitudes" }]
        : [
            { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
            { path: "/app/clients", icon: Users, label: "Clientes" },
            { path: "/app/quotations", icon: FileText, label: "Cotizaciones" },
            { path: "/app/requests", icon: ClipboardList, label: "Solicitudes" },
        ];

    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";

    return (
        <>
            {/* Barra superior -solo celular: logo + boton de menu */}
            <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <img src={appLogo} alt="Grupo AC" className="h-7 w-auto" />
                    <span className="font-display font-extrabold text-sm text-gray-900">GRUPO AC</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Abrir menú"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Fondo oscuro detras del menu -solo celular, mientras esta abierto */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm transform transition-transform duration-200 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
                {/* Logo (encabezado del menu -visible siempre en escritorio, dentro del cajon en celular) */}
                <div className="flex items-center justify-between border-b border-gray-100">
                    {isClientAccount ? (
                        <div className="h-16 flex-1 flex items-center justify-center gap-2 px-3">
                            <img src={appLogo} alt="Grupo AC" className="h-8 w-auto" />
                            {user?.client?.logoBase64 && (
                                <>
                                    <span className="text-gray-300">+</span>
                                    <img src={user.client.logoBase64} alt={user.client.name} className="h-8 w-auto object-contain" />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-16 flex-1 flex items-center gap-2 px-4">
                            <img src={appLogo} alt="Grupo AC" className="h-8 w-auto" />
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-extrabold text-sm tracking-wide text-gray-900">GRUPO AC</span>
                                <span className="text-[10px] font-semibold text-transparent bg-clip-text bg-brand-gradient uppercase tracking-wider">Plataforma</span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden p-2 mr-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                        aria-label="Cerrar menú"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Navegación Principal */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4 ${isActive
                                    ? "bg-blue-50 text-blue-700 font-medium border-brand-blue"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* BOTÓN ADMIN (Condicional) */}
                    {user?.role === 'ADMIN' && (
                        <Link
                            to="/app/admin"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/app/admin'
                                ? "bg-purple-50 text-purple-600 font-medium"
                                : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                                }`}
                        >
                            <Settings size={20} />
                            <span>Configuración</span>
                        </Link>
                    )}
                </nav>

                {/* Perfil del Usuario y Logout */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {/* Info de Usuario */}
                    <Link to="/app/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-4 mb-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                            {getInitial(user?.name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                                {user?.name || "Cargando..."}
                            </span>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                                {user?.role}
                            </span>
                        </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 w-full rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );

}
