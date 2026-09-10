import { Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CatalogoPage } from './pages/CatalogoPage'
import { LoginPage } from './pages/LoginPage'
import { RegistroPage } from './pages/RegistroPage'
import { ReservarPage } from './pages/ReservarPage'
import { MisCitasPage } from './pages/MisCitasPage'

function App() {
  return (
    <div className="min-h-screen bg-carbon-950">
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
        </Routes>
      </main>
    </div>
  )
}

export default App
