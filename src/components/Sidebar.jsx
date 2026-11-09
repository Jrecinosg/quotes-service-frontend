import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, Settings, ClipboardList, ShieldCheck, BookOpen, Menu, X } from "lucide-react";
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
            // Garantías es interno: va solo en este menú, nunca en el de CLIENT
            { path: "/app/warranties", icon: ShieldCheck, label: "Garantías" },
            // Bitácora de proyectos: interno (ADMIN/USER), nunca en el menú de CLIENT
            { path: "/app/bitacora", icon: BookOpen, label: "Bitácora" },
        ];
    // Configuración (solo ADMIN) entra al mismo menú para compartir el indicador deslizante
    const allItems = user?.role === 'ADMIN'
        ? [...menuItems, { path: "/app/admin", icon: Settings, label: "Configuración", admin: true }]
        : menuItems;

    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";

    // Indicador que se desliza (con resorte) hasta el ítem activo
    const itemRefs = useRef([]);
    const [ind, setInd] = useState({ y: 0, h: 0, show: false });
    const activeIdx = allItems.findIndex((i) => i.path === location.pathname);
    useLayoutEffect(() => {
        const el = itemRefs.current[activeIdx];
        if (el) setInd({ y: el.offsetTop, h: el.offsetHeight, show: true });
        else setInd((p) => ({ ...p, show: false }));
    }, [activeIdx, allItems.length, mobileOpen]);

    return (
        <>
            {/* Barra superior -solo celular: logo + boton de menu */}
            <div className="md:hidden flex items-center justify-between h-14 px-4 bg-surface-card/90 backdrop-blur border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <img src={appLogo} alt="Grupo AC" className="h-7 w-auto" />
                    <span className="font-display font-extrabold text-sm text-white">GRUPO AC</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="btn btn-ghost btn-icon -mr-2"
                    aria-label="Abrir menú"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Fondo oscuro detras del menu -solo celular, mientras esta abierto */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                style={{ viewTransitionName: "sidebar" }}
                className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0e2340] to-[#0a1a2f] border-r border-white/5 h-screen flex flex-col transform transition-transform duration-300 ease-move ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                {/* Logo (encabezado del menu -visible siempre en escritorio, dentro del cajon en celular) */}
                <div className="flex items-center justify-between border-b border-white/5">
                    {isClientAccount ? (
                        <div className="h-16 flex-1 flex items-center justify-center gap-2 px-3">
                            <img src={appLogo} alt="Grupo AC" className="h-8 w-auto" />
                            {user?.client?.logoBase64 && (
                                <>
                                    <span className="text-gray-500">+</span>
                                    <img src={user.client.logoBase64} alt={user.client.name} className="h-8 w-auto object-contain" />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-16 flex-1 flex items-center gap-2.5 px-5">
                            <img src={appLogo} alt="Grupo AC" className="h-8 w-auto" />
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-extrabold text-sm tracking-wide text-white">GRUPO AC</span>
                                <span className="mt-0.5 text-[10px] font-semibold text-transparent bg-clip-text bg-brand-gradient uppercase tracking-wider">Plataforma</span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden btn btn-ghost btn-icon mr-2"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navegación Principal */}
                <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                    {/* indicador deslizante */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 right-3 top-0 rounded-xl bg-white/[0.07] border border-white/10"
                        style={{
                            height: ind.h,
                            transform: `translateY(${ind.y}px)`,
                            opacity: ind.show ? 1 : 0,
                            transition: "transform 630ms var(--spring-bounce), height 400ms var(--spring-soft), opacity 200ms",
                        }}
                    >
                        <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-brand-cyan" />
                    </span>

                    {allItems.map((item, i) => {
                        const Icon = item.icon;
                        const isActive = i === activeIdx;
                        return (
                            <Link
                                key={item.path}
                                ref={(el) => { itemRefs.current[i] = el; }}
                                to={item.path}
                                viewTransition
                                onClick={() => setMobileOpen(false)}
                                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${isActive
                                    ? "text-white"
                                    : item.admin
                                        ? "text-gray-400 hover:text-purple-300 hover:bg-white/[0.04]"
                                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                    }`}
                            >
                                <Icon
                                    size={19}
                                    className={`transition-transform duration-500 ease-[var(--spring-bounce)] group-hover:scale-110 group-hover:-rotate-6 ${isActive ? "text-brand-cyan" : ""}`}
                                />
                                <span className="transition-transform duration-300 ease-move group-hover:translate-x-0.5">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Perfil del Usuario y Logout */}
                <div className="p-3 border-t border-white/5 space-y-1">
                    {/* Info de Usuario */}
                    <Link
                        to="/app/profile"
                        viewTransition
                        onClick={() => setMobileOpen(false)}
                        className="card card-hover flex items-center gap-3 px-3 py-3 mb-1"
                    >
                        <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold shrink-0">
                            {getInitial(user?.name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">
                                {user?.name || "Cargando..."}
                            </span>
                            <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                                {user?.role}
                            </span>
                        </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="btn btn-ghost w-full !justify-start !text-red-300 hover:!bg-red-500/10 px-4"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );

}
