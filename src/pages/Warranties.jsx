import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, ShieldCheck, Truck, Pencil, Trash2, Package, Eye } from "lucide-react";
import { warrantyService } from "../services/warranty.service";
import { supplierService } from "../services/supplier.service";
import SupplierModal from "../components/SupplierModal";
import { formatWarrantyId, formatDate } from "../utils/formatters";
import Swal from "sweetalert2";

// Las dos caras del módulo viven en la misma pantalla (pestañas) para no
// sumar otra entrada al menú lateral: los proveedores son un catálogo de
// apoyo de las garantías, no un módulo propio.
const TABS = [
  { key: "projects", label: "Proyectos", icon: ShieldCheck },
  { key: "suppliers", label: "Proveedores", icon: Truck }
];

export default function Warranties() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("projects");

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      setProjects(await warrantyService.getAll());
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      setSuppliers(await supplierService.getAll());
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSuppliers();
  }, []);

  // El filtrado se hace aquí mismo: son pocos registros y así el buscador
  // responde al instante, sin ida y vuelta al servidor por cada letra.
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) => {
      const haystack = [
        formatWarrantyId(p.correlativo),
        p.title,
        p.client?.name,
        p.clientInvoiceNumber,
        ...(p.items || []).flatMap((i) => [i.serialNumber, i.supplierInvoiceNumber, i.supplier?.name, i.description])
      ];
      return haystack.filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
    });
  }, [projects, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    const term = supplierSearch.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((s) =>
      [s.name, s.taxId, s.contactName, s.phone, s.email].filter(Boolean).some((v) => v.toLowerCase().includes(term))
    );
  }, [suppliers, supplierSearch]);

  const handleDeleteProject = async (project) => {
    const result = await Swal.fire({
      title: `¿Eliminar ${formatWarrantyId(project.correlativo)}?`,
      text: "Se borrará el proyecto y todos sus equipos registrados. No se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    if (!result.isConfirmed) return;

    try {
      await warrantyService.delete(project.id);
      Swal.fire("Eliminado", "El proyecto de garantía fue eliminado.", "success");
      fetchProjects();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo eliminar.", "error");
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    const result = await Swal.fire({
      title: `¿Eliminar a "${supplier.name}"?`,
      text: "Solo se puede si no tiene equipos registrados en garantías.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    if (!result.isConfirmed) return;

    try {
      await supplierService.delete(supplier.id);
      Swal.fire("Eliminado", "El proveedor fue eliminado.", "success");
      fetchSuppliers();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.error || "No se pudo eliminar.", "error");
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="title-xl"><span className="serif-accent">Garantías</span></h1>
          <p className="text-ink-muted text-sm">
            Rastrea qué equipo se compró, a qué proveedor y contra qué factura
          </p>
        </div>
        {tab === "projects" ? (
          <Link
            to="/app/warranties/new"
            className="btn btn-primary px-4 py-2 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nuevo proyecto
          </Link>
        ) : (
          <button
            onClick={() => { setEditingSupplier(null); setIsSupplierModalOpen(true); }}
            className="btn btn-primary px-4 py-2 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nuevo proveedor
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === key
                ? "bg-brand-soft text-white shadow-sm"
                : "bg-surface-card text-ink-2 border border-surface-border hover:bg-surface-hover"
            }`}
          >
            <Icon size={16} />
            {label}
            <span className={`text-xs ${tab === key ? "text-white" : "text-ink-muted"}`}>
              {key === "projects" ? projects.length : suppliers.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "projects" ? (
        <>
          {/* Buscador */}
          <div className="card p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-ink-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, título, factura o número de serie..."
                className="field w-full pl-10 pr-4 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de proyectos */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[820px]">
                <thead className="bg-surface-base text-ink-muted text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Folio</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Proyecto</th>
                    <th className="px-6 py-4">Factura al cliente</th>
                    <th className="px-6 py-4">Equipos</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {loadingProjects ? (
                    <tr><td colSpan="6" className="text-center py-10 text-ink-muted">Cargando garantías...</td></tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-14 text-ink-muted">
                        <ShieldCheck className="mx-auto mb-2 text-ink-2" size={32} />
                        Todavía no hay garantías registradas. Crea la primera con el botón de arriba.
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-14 text-ink-muted">No se encontró ninguna garantía con esa búsqueda.</td></tr>
                  ) : (
                    filteredProjects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/app/warranties/${p.id}`)}
                        className="hover:bg-surface-hover transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-info">{formatWarrantyId(p.correlativo)}</span>
                        </td>
                        <td className="px-6 py-4 text-ink font-medium">{p.client?.name || "—"}</td>
                        <td className="px-6 py-4 text-ink-2">{p.title}</td>
                        <td className="px-6 py-4 text-sm">
                          {p.clientInvoiceNumber ? (
                            <>
                              <p className="text-ink font-mono">{p.clientInvoiceNumber}</p>
                              <p className="text-xs text-ink-muted">{formatDate(p.clientInvoiceDate)}</p>
                            </>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-warn/15 text-warn text-xs font-semibold">Sin facturar aún</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet/10 text-violet text-xs font-semibold">
                            <Package size={13} />
                            {p.items?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/app/warranties/${p.id}`}
                              className="p-2 text-ink-muted hover:bg-surface-hover rounded-lg" title="Ver detalle"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              to={`/app/warranties/edit/${p.id}`}
                              className="p-2 text-info hover:bg-info/20 rounded-lg" title="Editar"
                            >
                              <Pencil size={18} />
                            </Link>
                            <button
                              onClick={() => handleDeleteProject(p)}
                              className="p-2 text-bad hover:bg-bad/20 rounded-lg" title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Buscador de proveedores */}
          <div className="card p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-ink-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar proveedor por nombre, contacto o teléfono..."
                className="field w-full pl-10 pr-4 py-2"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[620px]">
                <thead className="bg-surface-base text-ink-muted text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Proveedor</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Teléfono / Correo</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {loadingSuppliers ? (
                    <tr><td colSpan="4" className="text-center py-10 text-ink-muted">Cargando proveedores...</td></tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-14 text-ink-muted">
                        <Truck className="mx-auto mb-2 text-ink-2" size={32} />
                        Aún no hay proveedores. Registra el primero para poder asignarlo a los equipos.
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-14 text-ink-muted">No se encontró ningún proveedor con esa búsqueda.</td></tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-hover transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet/15 flex items-center justify-center text-violet font-bold shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-ink">{s.name}</p>
                              {s.taxId && (
                                <span className="inline-block px-1.5 py-0.5 bg-surface-hover text-ink-muted rounded text-[11px] font-mono">
                                  NIT {s.taxId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-2">{s.contactName || "—"}</td>
                        <td className="px-6 py-4 text-sm text-ink-2">
                          <p>{s.phone || "—"}</p>
                          <p className="text-xs text-ink-muted">{s.email || ""}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingSupplier(s); setIsSupplierModalOpen(true); }}
                              className="p-2 text-info hover:bg-info/20 rounded-lg" title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(s)}
                              className="p-2 text-bad hover:bg-bad/20 rounded-lg" title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplierToEdit={editingSupplier}
        onSuccess={fetchSuppliers}
      />
    </div>
  );
}
