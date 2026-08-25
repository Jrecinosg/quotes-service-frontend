import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Quotations from "./pages/Quotations";
import QuotationForm from "./pages/QuotationForm";
import QuotationDetails from "./pages/QuotationDetails";
import Requests from "./pages/Requests";
import RequestDetails from "./pages/RequestDetails";
import AdminPage from "./pages/AdminPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import ProfilePage from "./pages/ProfilePage";

// (Guard): Si no hay usuario, manda Login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

// 2. Guard de Admin: Si no es ADMIN, manda al 403
function AdminRoute({ children }) {
  const { user } = useAuth(); // Asumiendo que useAuth ya trae el .role desde el syncUser

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/403" replace />;
  }
  return children;
}

// Guard de equipo interno: cotizaciones/clientes/dashboard son solo para
// colaboradores (ADMIN/USER). Una cuenta CLIENT que intente entrar se manda
// directo a sus solicitudes, no al 403 (no es un error, es que no le aplica).
function StaffRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'CLIENT') {
    return <Navigate to="/requests" replace />;
  }
  return children;
}

// La raíz "/" depende del tipo de cuenta: colaboradores ven el Dashboard,
// clientes van directo a sus solicitudes (no tienen Dashboard de cotizaciones).
function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === 'CLIENT') {
    return <Navigate to="/requests" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Rutas Protegidas por Login */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          {/* Páginas internas */}
          <Route index element={<HomeRoute />} />
          <Route path="clients" element={<StaffRoute><Clients /></StaffRoute>} />
          <Route path="quotations" element={<StaffRoute><Quotations /></StaffRoute>} />
          <Route path="quotations/new" element={<StaffRoute><QuotationForm /></StaffRoute>} />
          <Route path="quotations/edit/:id" element={<StaffRoute><QuotationForm /></StaffRoute>} />
          <Route path="quotations/:id" element={<StaffRoute><QuotationDetails /></StaffRoute>} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetails />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* RUTA PROTEGIDA POR ROL ADMIN */}
          <Route path="admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />

        </Route>
        {/* Catch-all: si escribe cualquier cosa, al dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}