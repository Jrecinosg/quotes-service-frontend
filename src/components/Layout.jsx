import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-surface-base text-gray-200 [color-scheme:dark]">

      {/* Sidebar: barra+cajon en celular, fijo a la izquierda en escritorio */}
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Encabezado (buscador, fecha, perfil) -solo escritorio */}
        <Header />

        {/*SOLO esto scroll */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
