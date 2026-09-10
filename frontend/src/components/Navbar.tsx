import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const enlaceClase = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-gold-500/15 text-gold-400' : 'text-carbon-200 hover:text-gold-400'
  }`

export function Navbar() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-carbon-800 bg-carbon-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-carbon-100">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-500/15 text-gold-400">✂</span>
          Studio La Barber
        </NavLink>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={enlaceClase} end>
            Catálogo
          </NavLink>
          {usuario?.rol === 'cliente' && (
            <>
              <NavLink to="/reservar" className={enlaceClase}>
                Reservar
              </NavLink>
              <NavLink to="/mis-citas" className={enlaceClase}>
                Mis citas
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              <span className="hidden text-sm text-carbon-400 sm:inline">Hola, {usuario.nombres}</span>
              <button
                onClick={salir}
                className="rounded-lg border border-carbon-700 px-3 py-1.5 text-sm text-carbon-200 transition-colors hover:border-gold-500 hover:text-gold-400"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={enlaceClase}>
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/registro"
                className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-semibold text-carbon-950 transition-colors hover:bg-gold-400"
              >
                Crear cuenta
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
