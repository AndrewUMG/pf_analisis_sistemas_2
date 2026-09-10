import { Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { CatalogoPage } from './pages/CatalogoPage'
import { LoginPage } from './pages/LoginPage'
import { RegistroPage } from './pages/RegistroPage'
import { ReservarPage } from './pages/ReservarPage'
import { MisCitasPage } from './pages/MisCitasPage'
import { AgendaPage } from './pages/barbero/AgendaPage'
import { HorarioPage } from './pages/barbero/HorarioPage'
import { CajaPage } from './pages/recepcion/CajaPage'
import { WalkinPage } from './pages/recepcion/WalkinPage'
import { InventarioPage } from './pages/recepcion/InventarioPage'
import { CatalogoPage as AdminCatalogoPage } from './pages/admin/CatalogoPage'
import { UsuariosPage } from './pages/admin/UsuariosPage'
import { ReportesPage } from './pages/admin/ReportesPage'
import { ParametrosPage } from './pages/admin/ParametrosPage'

function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route
            path="/reservar"
            element={
              <ProtectedRoute>
                <ReservarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-citas"
            element={
              <ProtectedRoute>
                <MisCitasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/barbero/agenda"
            element={
              <RoleRoute roles={['barbero']}>
                <AgendaPage />
              </RoleRoute>
            }
          />
          <Route
            path="/barbero/horario"
            element={
              <RoleRoute roles={['barbero']}>
                <HorarioPage />
              </RoleRoute>
            }
          />

          <Route
            path="/recepcion/caja"
            element={
              <RoleRoute roles={['recepcionista', 'administrador']}>
                <CajaPage />
              </RoleRoute>
            }
          />
          <Route
            path="/recepcion/walkin"
            element={
              <RoleRoute roles={['recepcionista', 'administrador']}>
                <WalkinPage />
              </RoleRoute>
            }
          />
          <Route
            path="/recepcion/inventario"
            element={
              <RoleRoute roles={['recepcionista', 'administrador']}>
                <InventarioPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/catalogo"
            element={
              <RoleRoute roles={['administrador']}>
                <AdminCatalogoPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RoleRoute roles={['administrador']}>
                <UsuariosPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/reportes"
            element={
              <RoleRoute roles={['administrador']}>
                <ReportesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/parametros"
            element={
              <RoleRoute roles={['administrador']}>
                <ParametrosPage />
              </RoleRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
