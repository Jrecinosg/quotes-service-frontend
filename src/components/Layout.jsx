import { Outlet } from "react-router-dom";
import  Sidebar from "./Sidebar"

export default function Layout() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">

      {/* Sidebar: barra+cajon en celular, fijo a la izquierda en escritorio */}
      <Sidebar />

      {/*SOLO esto scroll */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}