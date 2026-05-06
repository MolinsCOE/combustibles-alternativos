import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./app/layout/AppLayout.js";
import { HomePage } from "./features/home/index.js";
import { AboutPage } from "./features/about/index.js";
import {
  RoleDetailPage,
  RolesListPage
} from "./features/roles/index.js";
import {
  UserDetailPage,
  UsersListPage
} from "./features/users/index.js";
import {
  DashboardPage,
  SolicitudPage,
  DistribucionPage,
  SeguimientoPage,
  MaestrosPage,
  LoginPage,
  PlanificacionProveedorPage,
  MisSolicitudesPage,
  EstadoSuministroPage,
  SolicitudesRecibidasPage,
  ConfirmacionesProveedoresPage,
  HistorialConfirmacionesPage,
  ConfirmarLineaPage
} from "./features/combustibles-alternativos/index.js";
import { RoleProvider } from "./features/combustibles-alternativos/auth/RoleProvider.js";
import { RoleGuard } from "./features/combustibles-alternativos/auth/RoleGuard.js";
import { CaShell } from "./features/combustibles-alternativos/components/CaShell.js";
import { CaStoreProvider } from "./features/combustibles-alternativos/store/caStore.js";

function CombustiblesRoutes() {
  return (
    <CaStoreProvider>
    <RoleProvider>
      <Routes>
        {/* Acceso público */}
        <Route path="login" element={<LoginPage />} />
        <Route path="confirmar" element={<ConfirmarLineaPage />} />

        {/* ── Producción ── */}
        <Route
          path="solicitud/nueva"
          element={
            <RoleGuard allowedRoles={["produccion"]}>
              <CaShell><SolicitudPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="solicitud/mis-solicitudes"
          element={
            <RoleGuard allowedRoles={["produccion"]}>
              <CaShell><MisSolicitudesPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="estado-suministro"
          element={
            <RoleGuard allowedRoles={["produccion"]}>
              <CaShell><EstadoSuministroPage /></CaShell>
            </RoleGuard>
          }
        />

        {/* ── Compras ── */}
        <Route
          path="resumen"
          element={
            <RoleGuard allowedRoles={["compras"]}>
              <CaShell><DashboardPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="solicitudes-recibidas"
          element={
            <RoleGuard allowedRoles={["compras"]}>
              <CaShell><SolicitudesRecibidasPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="distribucion"
          element={
            <RoleGuard allowedRoles={["compras"]}>
              <CaShell><DistribucionPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="confirmaciones"
          element={
            <RoleGuard allowedRoles={["compras"]}>
              <CaShell><ConfirmacionesProveedoresPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="entradas-reales"
          element={
            <RoleGuard allowedRoles={["compras"]}>
              <CaShell><SeguimientoPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="maestros"
          element={
            <RoleGuard allowedRoles={["compras"]}>
              <CaShell><MaestrosPage /></CaShell>
            </RoleGuard>
          }
        />

        {/* ── Proveedor ── */}
        <Route
          path="mis-confirmaciones"
          element={
            <RoleGuard allowedRoles={["proveedor"]}>
              <CaShell><PlanificacionProveedorPage /></CaShell>
            </RoleGuard>
          }
        />
        <Route
          path="historial-confirmaciones"
          element={
            <RoleGuard allowedRoles={["proveedor"]}>
              <CaShell><HistorialConfirmacionesPage /></CaShell>
            </RoleGuard>
          }
        />

        {/* Rutas legacy — redirigir para no romper bookmarks existentes */}
        <Route path="solicitud" element={<Navigate to="/combustibles/solicitud/nueva" replace />} />
        <Route path="confirmacion" element={<Navigate to="/combustibles/confirmaciones" replace />} />
        <Route path="seguimiento" element={<Navigate to="/combustibles/entradas-reales" replace />} />
        <Route path="mi-planificacion" element={<Navigate to="/combustibles/mis-confirmaciones" replace />} />

        {/* Raíz del módulo → login (el RoleProvider en LoginPage derivará al home del rol si ya hay sesión) */}
        <Route path="" element={<Navigate to="/combustibles/login" replace />} />
        <Route path="*" element={<Navigate to="/combustibles/login" replace />} />
      </Routes>
    </RoleProvider>
    </CaStoreProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isCombustibles = location.pathname.startsWith("/combustibles");

  if (isCombustibles) {
    return (
      <Routes>
        <Route path="/combustibles/*" element={<CombustiblesRoutes />} />
        <Route path="*" element={<Navigate to="/combustibles/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/administracion/usuarios" element={<UsersListPage />} />
        <Route path="/administracion/usuarios/:id" element={<UserDetailPage />} />
        <Route path="/administracion/roles" element={<RolesListPage />} />
        <Route path="/administracion/roles/:id" element={<RoleDetailPage />} />
        <Route path="/informacion" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
