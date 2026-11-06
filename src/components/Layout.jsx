import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div
      className="flex flex-col md:flex-row h-screen overflow-hidden bg-surface-base text-gray-200 [color-scheme:dark]"
      style={{
        // Ambiente de fondo muy sutil (solo color de fondo, sin efectos sobre los elementos)
        backgroundImage:
          "radial-gradient(1100px 520px at 88% -8%, rgba(0,123,255,0.10), transparent 60%), radial-gradient(900px 480px at -8% 108%, rgba(255,138,0,0.06), transparent 55%)",
      }}
    >

      {/* Sidebar: barra+cajon en celular, fijo a la izquierda en escritorio */}
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Encabezado (buscador, fecha, perfil) -solo escritorio */}
        <Header />

        {/*SOLO esto scroll */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8" style={{ viewTransitionName: "page" }}>
          {/* Entrada en cascada con resorte al cambiar de pagina (solo visual; respeta prefers-reduced-motion) */}
          <div key={pathname} className="page-stagger">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
