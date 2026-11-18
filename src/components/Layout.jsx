import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Aurora from "./Aurora";

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      {/* Fondo vivo del ambiente elegido (detrás de todo, sin capturar el cursor) */}
      <Aurora />
      <div className="relative z-[1] flex flex-col md:flex-row h-screen overflow-hidden text-ink font-medium">

        {/* Sidebar: barra+cajon en celular, fijo a la izquierda en escritorio */}
        <Sidebar />

        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Encabezado (buscador, fecha, perfil) -solo escritorio */}
          <Header />

          {/*SOLO esto scroll */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8 lg:px-10" style={{ viewTransitionName: "page" }}>
            {/* Entrada en cascada con resorte al cambiar de pagina (una vez por pantalla; respeta prefers-reduced-motion) */}
            <div key={pathname} className="page-stagger mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
