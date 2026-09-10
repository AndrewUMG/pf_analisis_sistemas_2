import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { IconLuna, IconSol, IconTijeras } from './Icons'

const enlaceClase = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-soft text-accent-hover' : 'text-text-muted hover:text-accent-hover'
  }`

const ENLACES_POR_ROL: Record<string, { to: string; etiqueta: string }[]> = {
  cliente: [
    { to: '/reservar', etiqueta: 'Reservar' },
    { to: '/mis-citas', etiqueta: 'Mis citas' },
  ],
  barbero: [
    { to: '/barbero/agenda', etiqueta: 'Mi agenda' },
    { to: '/barbero/horario', etiqueta: 'Mi horario' },
  ],
  recepcionista: [
    { to: '/recepcion/caja', etiqueta: 'Caja' },
    { to: '/recepcion/walkin', etiqueta: 'Registro presencial' },
    { to: '/recepcion/inventario', etiqueta: 'Inventario' },
  ],
  administrador: [
    { to: '/admin/catalogo', etiqueta: 'Catálogo' },
    { to: '/admin/usuarios', etiqueta: 'Usuarios' },
    { to: '/recepcion/inventario', etiqueta: 'Inventario' },
    { to: '/admin/reportes', etiqueta: 'Reportes' },
    { to: '/admin/parametros', etiqueta: 'Parámetros' },
  ],
}

export function Navbar() {
  const { usuario, cerrarSesion } = useAuth()
  const { tema, alternarTema } = useTheme()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/')
  }

  const enlacesRol = usuario ? ENLACES_POR_ROL[usuario.rol] ?? [] : []

  return (
    <header className="sticky top-0 z-10 border-b bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-text">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-hover">
            <IconTijeras className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Studio La Barber</span>
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {(!usuario || usuario.rol === 'cliente') && (
            <NavLink to="/" className={enlaceClase} end>
              Catálogo
            </NavLink>
          )}
          {enlacesRol.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} className={enlaceClase}>
              {enlace.etiqueta}
            </NavLink>
          ))}
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
              <span className="hidden text-sm text-text-muted md:inline">Hola, {usuario.nombres}</span>
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
