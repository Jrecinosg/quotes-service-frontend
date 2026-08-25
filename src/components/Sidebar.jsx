import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, Settings, User, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import appLogo from "../assets/logo.png";

export default function Sidebar() {
    const { logout, user } = useAuth();
    const location = useLocation(); // Obtener URL actual
    const isClientAccount = user?.role === 'CLIENT';

    const menuItems = isClientAccount
        ? [{ path: "/requests", icon: ClipboardList, label: "Mis solicitudes" }]
        : [
            { path: "/", icon: LayoutDashboard, label: "Dashboard" },
            { path: "/clients", icon: Users, label: "Clientes" },
            { path: "/quotations", icon: FileText, label: "Cotizaciones" },
            { path: "/requests", icon: ClipboardList, label: "Solicitudes" },
        ];

    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
            {/* Logo */}
            {isClientAccount ? (
                <div className="h-16 flex items-center justify-center gap-2 border-b border-gray-100 px-3">
                    <img src={appLogo} alt="Grupo AC" className="h-8 w-auto" />
                    {user?.client?.logoBase64 && (
                        <>
                            <span className="text-gray-300">+</span>
                            <img src={user.client.logoBase64} alt={user.client.name} className="h-8 w-auto object-contain" />
                        </>
                    )}
                </div>
            ) : (
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-blue-600">Cotizador</h1>
                </div>
            )}

            {/* Navegación Principal */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                        to="/admin"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/admin'
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
                <Link to="/profile" className="flex items-center gap-3 px-3 py-4 mb-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
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
    );

}