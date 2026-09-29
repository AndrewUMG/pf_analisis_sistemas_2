import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { SitioLayout } from './layouts/SitioLayout'
import { PanelLayout } from './layouts/PanelLayout'
import { FilasSkeleton } from './components/Skeleton'
import { HomePage } from './pages/HomePage'

// Cada pantalla se descarga solo cuando se visita (el sitio público carga primero y rápido).
const ResponsivePage = lazy(() => import('./pages/dev/ResponsivePage').then((m) => ({ default: m.ResponsivePage })))
const ServiciosPage = lazy(() => import('./pages/ServiciosPage').then((m) => ({ default: m.ServiciosPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegistroPage = lazy(() => import('./pages/RegistroPage').then((m) => ({ default: m.RegistroPage })))
const ReservarPage = lazy(() => import('./pages/ReservarPage').then((m) => ({ default: m.ReservarPage })))
const MisCitasPage = lazy(() => import('./pages/MisCitasPage').then((m) => ({ default: m.MisCitasPage })))
const AgendaPage = lazy(() => import('./pages/barbero/AgendaPage').then((m) => ({ default: m.AgendaPage })))
const HorarioPage = lazy(() => import('./pages/barbero/HorarioPage').then((m) => ({ default: m.HorarioPage })))
const CajaPage = lazy(() => import('./pages/recepcion/CajaPage').then((m) => ({ default: m.CajaPage })))
const WalkinPage = lazy(() => import('./pages/recepcion/WalkinPage').then((m) => ({ default: m.WalkinPage })))
const InventarioPage = lazy(() => import('./pages/recepcion/InventarioPage').then((m) => ({ default: m.InventarioPage })))
const AdminCatalogoPage = lazy(() => import('./pages/admin/CatalogoPage').then((m) => ({ default: m.CatalogoPage })))
const UsuariosPage = lazy(() => import('./pages/admin/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
const ReportesPage = lazy(() => import('./pages/admin/ReportesPage').then((m) => ({ default: m.ReportesPage })))
const ValoracionesPage = lazy(() => import('./pages/admin/ValoracionesPage').then((m) => ({ default: m.ValoracionesPage })))
const NotificacionesPage = lazy(() => import('./pages/admin/NotificacionesPage').then((m) => ({ default: m.NotificacionesPage })))
const ParametrosPage = lazy(() => import('./pages/admin/ParametrosPage').then((m) => ({ default: m.ParametrosPage })))

const PERSONAL = ['barbero', 'recepcionista', 'administrador'] as const

function Cargando() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <FilasSkeleton cantidad={3} />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        {/* Sitio público y zona del cliente */}
        <Route element={<SitioLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/servicios" element={<ServiciosPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/reservar" element={<ProtectedRoute><ReservarPage /></ProtectedRoute>} />
          <Route path="/mis-citas" element={<ProtectedRoute><MisCitasPage /></ProtectedRoute>} />
        </Route>

        {/* Paneles internos con sidebar */}
        <Route element={<PanelLayout />}>
          <Route path="/barbero/agenda" element={<RoleRoute roles={['barbero']}><AgendaPage /></RoleRoute>} />
          <Route path="/barbero/horario" element={<RoleRoute roles={['barbero']}><HorarioPage /></RoleRoute>} />

          <Route path="/recepcion/caja" element={<RoleRoute roles={['recepcionista', 'administrador']}><CajaPage /></RoleRoute>} />
          <Route path="/recepcion/walkin" element={<RoleRoute roles={['recepcionista', 'administrador']}><WalkinPage /></RoleRoute>} />
          <Route path="/recepcion/inventario" element={<RoleRoute roles={[...PERSONAL].filter((r) => r !== 'barbero')}><InventarioPage /></RoleRoute>} />

          <Route path="/admin/catalogo" element={<RoleRoute roles={['administrador']}><AdminCatalogoPage /></RoleRoute>} />
          <Route path="/admin/usuarios" element={<RoleRoute roles={['administrador']}><UsuariosPage /></RoleRoute>} />
          <Route path="/admin/reportes" element={<RoleRoute roles={['administrador']}><ReportesPage /></RoleRoute>} />
          <Route path="/admin/valoraciones" element={<RoleRoute roles={['administrador']}><ValoracionesPage /></RoleRoute>} />
          <Route path="/admin/notificaciones" element={<RoleRoute roles={['administrador']}><NotificacionesPage /></RoleRoute>} />
          <Route path="/admin/parametros" element={<RoleRoute roles={['administrador']}><ParametrosPage /></RoleRoute>} />
        </Route>
        {import.meta.env.DEV && <Route path="/dev/responsive" element={<ResponsivePage />} />}
      </Routes>
    </Suspense>
  )
}

export default App
