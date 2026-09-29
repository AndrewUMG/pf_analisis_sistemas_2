import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ENLACES_CLIENTE, ENLACES_SITIO } from '../../config/navegacion'
import { Logo } from '../Logo'
import { Drawer } from '../Drawer'
import { ThemeToggle } from '../ThemeToggle'
import { IconChevron, IconMenu } from '../Icons'
import { rutaInicioPara } from '../RoleRoute'

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent-strong after:transition-transform ${
    isActive ? 'text-text after:scale-x-100' : 'text-text-muted after:scale-x-0 hover:text-text hover:after:scale-x-100'
  }`

/** Cabecera pública: logo, navegación, CTA de reserva y menú móvil en drawer (< 1024 px). */
export function SiteHeader() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [conSombra, setConSombra] = useState(false)

  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 8)
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  // Al navegar se cierra el menú móvil.
  useEffect(() => setMenuAbierto(false), [pathname])

  const esPersonal = usuario && usuario.rol !== 'cliente'
  const enlaces = usuario?.rol === 'cliente' ? [...ENLACES_SITIO, ...ENLACES_CLIENTE] : ENLACES_SITIO

  async function salir() {
    setMenuAbierto(false)
    await cerrarSesion()
    navigate('/')
  }

  return (
    <>
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <header className={`sticky top-0 z-40 border-b bg-bg/85 backdrop-blur-md transition-shadow ${conSombra ? 'shadow-[var(--shadow-card)]' : ''}`}>
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
          <Link to="/" aria-label="Studio La Barber, ir al inicio" className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {enlaces.map((e) =>
              e.to.includes('#') ? (
                <Link key={e.to} to={e.to} className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text">
                  {e.etiqueta}
                </Link>
              ) : (
                <NavLink key={e.to} to={e.to} end={e.to === '/'} className={claseEnlace}>
                  {e.etiqueta}
                </NavLink>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            {esPersonal ? (
              <>
                <Link to={rutaInicioPara(usuario.rol)} className="btn-principal">
                  Ir a mi panel
                  <IconChevron className="h-4 w-4" />
                </Link>
                <button onClick={salir} className="btn-secundario">
                  Salir
                </button>
              </>
            ) : usuario ? (
              <>
                <span className="px-2 text-sm text-text-muted">Hola, {usuario.nombres}</span>
                <Link to="/reservar" className="btn-principal">
                  Reservar cita
                </Link>
                <button onClick={salir} className="btn-secundario">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text">
                  Iniciar sesión
                </Link>
                <Link to="/reservar" className="btn-principal">
                  Reservar cita
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              className="grid h-10 w-10 place-items-center rounded-lg border text-text hover:border-brand"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {menuAbierto && (
        <Drawer titulo="Menú" onClose={() => setMenuAbierto(false)}>
          <nav aria-label="Menú móvil" className="flex flex-col p-3">
            {enlaces.map((e) => (
              <Link key={e.to} to={e.to} onClick={() => setMenuAbierto(false)} className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium text-text hover:bg-bg-subtle">
                <e.icono className="h-5 w-5 text-accent-hover" />
                {e.etiqueta}
              </Link>
            ))}
          </nav>
          <div className="mt-2 space-y-2 border-t p-5">
            {esPersonal ? (
              <Link to={rutaInicioPara(usuario.rol)} className="btn-principal btn-lg w-full" onClick={() => setMenuAbierto(false)}>
                Ir a mi panel
              </Link>
            ) : (
              <Link to="/reservar" className="btn-principal btn-lg w-full" onClick={() => setMenuAbierto(false)}>
                Reservar cita
              </Link>
            )}
            {usuario ? (
              <button onClick={salir} className="btn-secundario w-full">
                Cerrar sesión ({usuario.nombres})
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secundario w-full" onClick={() => setMenuAbierto(false)}>
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="w-full py-2 text-center text-sm font-medium text-text-muted hover:text-text" onClick={() => setMenuAbierto(false)}>
                  ¿Aún no tienes cuenta? <span className="text-text underline">Regístrate</span>
                </Link>
              </>
            )}
          </div>
        </Drawer>
      )}
    </>
  )
}
