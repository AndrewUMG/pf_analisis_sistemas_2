import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { IconLuna, IconSol, IconTijeras } from './Icons'

const enlaceClase = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-soft text-accent-hover' : 'text-text-muted hover:text-accent-hover'
  }`

export function Navbar() {
  const { usuario, cerrarSesion } = useAuth()
  const { tema, alternarTema } = useTheme()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-text">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent-hover">
            <IconTijeras className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Studio La Barber</span>
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={alternarTema}
            aria-label={tema === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
            title={tema === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
            className="grid h-9 w-9 place-items-center rounded-lg border text-text-muted transition-colors hover:border-accent hover:text-accent-hover"
          >
            {tema === 'light' ? <IconLuna className="h-4 w-4" /> : <IconSol className="h-4 w-4" />}
          </button>

          {usuario ? (
            <>
              <span className="hidden text-sm text-text-muted sm:inline">Hola, {usuario.nombres}</span>
              <button onClick={salir} className="btn-secundario px-3 py-1.5">
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={enlaceClase}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/registro" className="btn-principal px-3 py-1.5">
                Crear cuenta
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
