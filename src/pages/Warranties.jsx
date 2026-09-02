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
      [s.name, s.contactName, s.phone, s.email].filter(Boolean).some((v) => v.toLowerCase().includes(term))
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
          <h1 className="font-display text-2xl font-bold text-gray-800">Garantías</h1>
          <p className="text-gray-500 text-sm">
            Rastrea qué equipo se compró, a qué proveedor y contra qué factura
          </p>
        </div>
        {tab === "projects" ? (
          <Link
            to="/app/warranties/new"
            className="bg-brand-gradient hover:brightness-105 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus size={20} />
            Nuevo proyecto
          </Link>
        ) : (
          <button
            onClick={() => { setEditingSupplier(null); setIsSupplierModalOpen(true); }}
            className="bg-brand-gradient hover:brightness-105 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
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
                ? "bg-brand-gradient text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={16} />
            {label}
            <span className={`text-xs ${tab === key ? "text-white/80" : "text-gray-400"}`}>
              {key === "projects" ? projects.length : suppliers.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "projects" ? (
        <>
          {/* Buscador */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, título, factura o número de serie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de proyectos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[820px]">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Folio</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Proyecto</th>
                    <th className="px-6 py-4">Factura al cliente</th>
                    <th className="px-6 py-4">Equipos</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingProjects ? (
                    <tr><td colSpan="6" className="text-center py-10 text-gray-400">Cargando garantías...</td></tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-14 text-gray-400">
                        <ShieldCheck className="mx-auto mb-2 text-gray-300" size={32} />
                        Todavía no hay garantías registradas. Crea la primera con el botón de arriba.
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-14 text-gray-400">No se encontró ninguna garantía con esa búsqueda.</td></tr>
                  ) : (
                    filteredProjects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/app/warranties/${p.id}`)}
                        className="hover:bg-blue-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600">{formatWarrantyId(p.correlativo)}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{p.client?.name || "—"}</td>
                        <td className="px-6 py-4 text-gray-600">{p.title}</td>
                        <td className="px-6 py-4 text-sm">
                          {p.clientInvoiceNumber ? (
                            <>
                              <p className="text-gray-800 font-mono">{p.clientInvoiceNumber}</p>
                              <p className="text-xs text-gray-400">{formatDate(p.clientInvoiceDate)}</p>
                            </>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Sin facturar aún</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                            <Package size={13} />
                            {p.items?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/app/warranties/${p.id}`}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Ver detalle"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              to={`/app/warranties/edit/${p.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Editar"
                            >
                              <Pencil size={18} />
                            </Link>
                            <button
                              onClick={() => handleDeleteProject(p)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Eliminar"
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
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar proveedor por nombre, contacto o teléfono..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[620px]">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Proveedor</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Teléfono / Correo</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingSuppliers ? (
                    <tr><td colSpan="4" className="text-center py-10 text-gray-400">Cargando proveedores...</td></tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-14 text-gray-400">
                        <Truck className="mx-auto mb-2 text-gray-300" size={32} />
                        Aún no hay proveedores. Registra el primero para poder asignarlo a los equipos.
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-14 text-gray-400">No se encontró ningún proveedor con esa búsqueda.</td></tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-medium text-gray-900">{s.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.contactName || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <p>{s.phone || "—"}</p>
                          <p className="text-xs text-gray-400">{s.email || ""}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingSupplier(s); setIsSupplierModalOpen(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(s)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Eliminar"
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
