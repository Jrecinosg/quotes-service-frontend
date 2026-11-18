import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, Settings, ClipboardList, ShieldCheck, BookOpen, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import appLogo from "../assets/logo.png";
import ThemeSwitch from "./ThemeSwitch";

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
            <div className="md:hidden relative z-30 flex items-center justify-between h-14 px-4 glass border-b shrink-0">
                <div className="flex items-center gap-2">
                    <img src={appLogo} alt="Grupo AC" className="h-7 w-auto" />
                    <span className="font-display font-extrabold text-sm tracking-tight text-ink">GRUPO AC</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="btn btn-ghost btn-icon -mr-2"
                    aria-label="Abrir menú"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Fondo detras del menu -solo celular, mientras esta abierto */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 backdrop-blur-sm z-40 animate-fade-in"
                    style={{ background: "var(--scrim)" }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Celular: cajón sólido (va encima del contenido). Escritorio: barra translúcida sobre el fondo vivo. */}
            <aside
                style={{ viewTransitionName: "sidebar" }}
                className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface md:bg-transparent md:glass border-r border-line h-screen flex flex-col transform transition-transform duration-300 ease-move ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                {/* Logo (encabezado del menu -visible siempre en escritorio, dentro del cajon en celular) */}
                <div className="flex items-center justify-between">
                    {isClientAccount ? (
                        <div className="h-[72px] flex-1 flex items-center justify-center gap-2 px-3">
                            <img src={appLogo} alt="Grupo AC" className="h-8 w-auto" />
                            {user?.client?.logoBase64 && (
                                <>
                                    <span className="text-ink-soft">+</span>
                                    <img src={user.client.logoBase64} alt={user.client.name} className="h-8 w-auto object-contain" />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-[72px] flex-1 flex items-center gap-3 px-5">
                            <img src={appLogo} alt="Grupo AC" className="h-9 w-auto" />
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-extrabold text-[15px] tracking-tight text-ink">GRUPO AC</span>
                                <span className="mt-1 font-mono text-[9px] font-semibold tracking-[0.18em] text-ink-soft uppercase">Plataforma</span>
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
                <nav className="relative flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
                    {/* indicador deslizante (azul de marca, con resorte) */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 right-3 top-0 rounded-[14px]"
                        style={{
                            height: ind.h,
                            transform: `translateY(${ind.y}px)`,
                            opacity: ind.show ? 1 : 0,
                            background: "linear-gradient(100deg, #0A55E6, #0A62FF 60%, #3A6BF5)",
                            boxShadow: "0 12px 24px -10px rgba(10,98,255,.8)",
                            transition: "transform 630ms var(--spring-bounce), height 400ms var(--spring-soft), opacity 200ms",
                        }}
                    />

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
                                className={`group relative flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-bold transition-[color,background-color,transform] duration-300 ease-[var(--spring-soft)] ${isActive
                                    ? "text-white"
                                    : item.admin
                                        ? "text-ink-muted hover:text-violet hover:bg-tint/[0.06] hover:translate-x-1"
                                        : "text-ink-muted hover:text-ink hover:bg-tint/[0.06] hover:translate-x-1"
                                    }`}
                            >
                                <Icon
                                    size={19}
                                    className="transition-transform duration-500 ease-[var(--spring-bounce)] group-hover:scale-[1.18] group-hover:-rotate-[7deg]"
                                />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Ambiente, perfil del usuario y cierre de sesión */}
                <div className="p-3 space-y-2">
                    {/* Ambiente visual (se recuerda en este navegador) */}
                    <ThemeSwitch />

                    {/* Info de Usuario */}
                    <Link
                        to="/app/profile"
                        viewTransition
                        onClick={() => setMobileOpen(false)}
                        className="card card-hover !rounded-2xl flex items-center gap-3 px-3 py-3"
                    >
                        <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center text-white font-extrabold shrink-0">
                            {getInitial(user?.name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-ink truncate">
                                {user?.name || "Cargando..."}
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-info uppercase tracking-[0.12em]">
                                {user?.role}
                            </span>
                        </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="btn btn-ghost w-full !justify-start !text-bad hover:!bg-bad/10 px-4"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );

}
