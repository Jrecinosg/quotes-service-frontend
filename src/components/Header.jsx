import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, User, LogOut, FileText, Users, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { quotationService } from "../services/quotation.service";
import { clientService } from "../services/client.service";
import { formatQuotationId, formatCurrency } from "../utils/formatters";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

// Cierra un menú flotante al hacer clic fuera de él
function useClickOutside(ref, onOutside) {
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onOutside();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ref, onOutside]);
}

function formatNow(date) {
    const day = date.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });
    const time = date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
    return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
}

// Buscador global: cotizaciones (correlativo, cliente, referencia) y clientes
// (nombre, NIT, contacto). Solo para el equipo interno -una cuenta CLIENT no
// tiene acceso a esas rutas en el servidor.
function GlobalSearch() {
    const navigate = useNavigate();
    const [term, setTerm] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ quotations: [], clients: [] });
    const [error, setError] = useState(false);
    const containerRef = useRef(null);
    const requestIdRef = useRef(0);

    useClickOutside(containerRef, () => setOpen(false));

    useEffect(() => {
        const query = term.trim();
        if (query.length < MIN_CHARS) {
            setResults({ quotations: [], clients: [] });
            setLoading(false);
            setOpen(false);
            return;
        }

        setLoading(true);
        setOpen(true);
        const requestId = ++requestIdRef.current;
        const timer = setTimeout(async () => {
            try {
                const [quotationPage, clients] = await Promise.all([
                    quotationService.getAll(1, 5, query, "recent"),
                    clientService.search(query, 5)
                ]);
                // Si el usuario siguió escribiendo, se ignora esta respuesta vieja
                if (requestId !== requestIdRef.current) return;
                setResults({ quotations: quotationPage?.data || [], clients: clients || [] });
                setError(false);
            } catch (err) {
                if (requestId !== requestIdRef.current) return;
                console.error("Error en la búsqueda global:", err);
                setError(true);
                setResults({ quotations: [], clients: [] });
            } finally {
                if (requestId === requestIdRef.current) setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [term]);

    const goTo = (path) => {
        setOpen(false);
        setTerm("");
        navigate(path);
    };

    const firstResultPath = results.quotations[0]
        ? `/app/quotations/${results.quotations[0].id}`
        : results.clients[0]
            ? `/app/clients?highlight=${results.clients[0].id}`
            : null;

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            setOpen(false);
            e.currentTarget.blur();
        }
        // Enter solo navega si el menú está abierto y ya hay un resultado
        if (e.key === "Enter" && open && !loading && firstResultPath) {
            e.preventDefault();
            goTo(firstResultPath);
        }
    };

    const hasResults = results.quotations.length > 0 || results.clients.length > 0;

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onFocus={() => term.trim().length >= MIN_CHARS && setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar cotizaciones o clientes..."
                aria-label="Buscar cotizaciones o clientes"
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-surface-card border border-surface-border text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition"
            />

            {open && (
                <div className="absolute left-0 right-0 mt-2 z-40 bg-surface-card border border-surface-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                    {loading && !hasResults ? (
                        <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-400">
                            <Loader2 size={16} className="animate-spin" /> Buscando...
                        </div>
                    ) : error ? (
                        <p className="px-4 py-4 text-sm text-red-400">No se pudo completar la búsqueda. Intenta de nuevo.</p>
                    ) : !hasResults ? (
                        <p className="px-4 py-4 text-sm text-gray-400">Sin resultados para "{term.trim()}".</p>
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto py-2">
                            {results.quotations.length > 0 && (
                                <div>
                                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Cotizaciones</p>
                                    {results.quotations.map((q) => (
                                        <button
                                            key={`q-${q.id}`}
                                            type="button"
                                            onClick={() => goTo(`/app/quotations/${q.id}`)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
                                        >
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500/15 flex items-center justify-center">
                                                <FileText size={15} className="text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white">{formatQuotationId(q.correlativo)}</p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {q.client?.name || "Sin cliente"}{q.projectReference ? ` · ${q.projectReference}` : ""}
                                                </p>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-300 shrink-0">{formatCurrency(q.total)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {results.clients.length > 0 && (
                                <div className={results.quotations.length > 0 ? "mt-1 pt-1 border-t border-surface-border" : ""}>
                                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Clientes</p>
                                    {results.clients.map((c) => (
                                        <button
                                            key={`c-${c.id}`}
                                            type="button"
                                            onClick={() => goTo(`/app/clients?highlight=${c.id}`)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
                                        >
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500/15 flex items-center justify-center">
                                                <Users size={15} className="text-purple-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {c.taxId ? `NIT ${c.taxId}` : "Sin NIT"}{c.contactName ? ` · ${c.contactName}` : ""}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ProfileMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useClickOutside(ref, () => setOpen(false));

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-full bg-surface-card border border-surface-border hover:bg-surface-hover transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initial}
                </div>
                <div className="flex flex-col items-start leading-tight max-w-[160px]">
                    <span className="text-sm font-semibold text-white truncate max-w-full">{user?.name || "Mi cuenta"}</span>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{user?.role}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div role="menu" className="absolute right-0 mt-2 w-52 z-40 bg-surface-card border border-surface-border rounded-2xl shadow-2xl shadow-black/40 py-2">
                    <Link
                        to="/app/profile"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-surface-hover hover:text-white transition-colors"
                    >
                        <User size={16} /> Mi Perfil
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
}

// Encabezado superior -solo escritorio. En celular manda la barra de
// Sidebar.jsx (logo + menú), no se duplica aquí.
export default function Header() {
    const { user } = useAuth();
    const isClientAccount = user?.role === "CLIENT";
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(id);
    }, []);

    const { day, time } = formatNow(now);

    return (
        <header className="hidden md:flex items-center gap-4 h-[72px] px-8 border-b border-surface-border bg-surface-base shrink-0 relative z-30">
            <div className="flex-1 min-w-0">
                {!isClientAccount && <GlobalSearch />}
            </div>

            <div className="hidden lg:flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-white">{time}</span>
                <span className="text-xs text-gray-400">{day}</span>
            </div>

            {/* Decorativo por ahora: no hay sistema de notificaciones todavía,
                por eso va sin punto/contador -no debe insinuar algo pendiente. */}
            <button
                type="button"
                title="Notificaciones (próximamente)"
                aria-label="Notificaciones (próximamente)"
                className="w-10 h-10 rounded-full bg-surface-card border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
            >
                <Bell size={18} />
            </button>

            <ProfileMenu />
        </header>
    );
}
