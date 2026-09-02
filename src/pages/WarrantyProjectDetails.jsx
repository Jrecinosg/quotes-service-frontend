import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Package, Truck, Calendar, Hash, Building2 } from "lucide-react";
import { warrantyService } from "../services/warranty.service";
import { formatWarrantyId, formatDate } from "../utils/formatters";

function InfoBlock({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-gray-800 font-medium break-words">{value || "—"}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function WarrantyProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warrantyService.getById(id)
      .then(setProject)
      .catch(() => navigate("/app/warranties"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando garantía...</div>;
  if (!project) return null;

  const items = project.items || [];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <button
        onClick={() => navigate("/app/warranties")}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft size={20} /> Volver al listado
      </button>

      {/* Encabezado del proyecto */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-brand-gradient px-5 md:px-8 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-sm text-white/80">{formatWarrantyId(project.correlativo)}</p>
              <h1 className="font-display text-2xl font-extrabold break-words">{project.title}</h1>
              <p className="text-white/90 text-sm mt-1">{project.client?.name}</p>
            </div>
            <Link
              to={`/app/warranties/edit/${project.id}`}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-semibold text-sm shadow-sm transition-all"
            >
              <Pencil size={16} /> Editar
            </Link>
          </div>
        </div>

        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoBlock icon={Building2} label="Cliente" value={project.client?.name} sub={project.client?.taxId ? `NIT ${project.client.taxId}` : null} />
          {project.clientInvoiceNumber ? (
            <>
              <InfoBlock icon={Hash} label="Factura al cliente" value={project.clientInvoiceNumber} />
              <InfoBlock icon={Calendar} label="Fecha de la factura" value={formatDate(project.clientInvoiceDate)} />
            </>
          ) : (
            <InfoBlock icon={Hash} label="Factura al cliente" value="Sin facturar aún" />
          )}
        </div>

        <div className="px-5 md:px-8 pb-5 md:pb-6 text-xs text-gray-400 border-t border-gray-100 pt-4">
          Registrado por {project.createdBy?.name || project.createdBy?.email || "—"} · {formatDate(project.createdAt)}
        </div>
      </div>

      {/* Equipos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 md:px-8 py-5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Equipos y proveedores</h2>
            <p className="text-xs text-gray-500">
              {items.length} equipo{items.length === 1 ? "" : "s"} registrado{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Package className="mx-auto mb-2 text-gray-300" size={32} />
            Este proyecto no tiene equipos registrados.
          </div>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[860px]">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Equipo</th>
                    <th className="px-6 py-3 text-center">Cant.</th>
                    <th className="px-6 py-3">Proveedor</th>
                    <th className="px-6 py-3">Compra</th>
                    <th className="px-6 py-3">Factura proveedor</th>
                    <th className="px-6 py-3">No. de serie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-800">{item.description}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                          <Truck size={13} />
                          {item.supplier?.name || "—"}
                        </span>
                        {item.supplier?.phone && (
                          <p className="text-xs text-gray-400 mt-1">{item.supplier.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(item.purchaseDate)}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm font-mono">{item.supplierInvoiceNumber}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">
                        {item.serialNumber || <span className="text-gray-300 font-sans">Sin serie</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Celular: una tarjeta por equipo, se lee sin scroll horizontal */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-800">{item.description}</p>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                    <Truck size={13} />
                    {item.supplier?.name || "—"}
                  </span>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Compra</dt>
                      <dd className="text-gray-700">{formatDate(item.purchaseDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Factura prov.</dt>
                      <dd className="text-gray-700 font-mono break-words">{item.supplierInvoiceNumber}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">No. de serie</dt>
                      <dd className="text-gray-700 font-mono break-words">
                        {item.serialNumber || <span className="text-gray-300 font-sans">Sin serie</span>}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
