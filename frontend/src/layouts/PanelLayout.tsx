import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_PANEL } from '../config/navegacion'
import { Logo } from '../components/Logo'
import { Drawer } from '../components/Drawer'
import { ThemeToggle } from '../components/ThemeToggle'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { IconInicio, IconMenu } from '../components/Icons'

const ROLES: Record<string, string> = { administrador: 'Administrador', barbero: 'Barbero', recepcionista: 'Recepción' }

const claseItem = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-accent)]' : 'text-[var(--color-sidebar-texto)] hover:bg-white/8 hover:text-white'
  }`

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  if (!usuario || usuario.rol === 'cliente') return null
  const grupos = NAV_PANEL[usuario.rol]

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Panel" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {grupos.map((g) => (
          <div key={g.grupo}>
            <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{g.grupo}</p>
            <ul className="space-y-1">
              {g.enlaces.map((e) => (
                <li key={e.to}>
                  <NavLink to={e.to} className={claseItem} onClick={onNavegar}>
                    <e.icono className="h-[1.15rem] w-[1.15rem] shrink-0 opacity-90" />
                    {e.etiqueta}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        <Link to="/" onClick={onNavegar} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-sidebar-texto)] hover:bg-white/8 hover:text-white">
          <IconInicio className="h-[1.15rem] w-[1.15rem]" />
          Ver el sitio
        </Link>
        <div className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-text-on-accent)]" aria-hidden="true">
            {usuario.nombres.charAt(0)}
            {usuario.apellidos.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {usuario.nombres} {usuario.apellidos}
            </p>
            <p className="text-xs text-[var(--color-sidebar-texto)] opacity-75">{ROLES[usuario.rol]}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await cerrarSesion()
            navigate('/')
          }}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-sidebar-texto)] hover:bg-white/8 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

/** Marco de los paneles internos: sidebar fijo en ≥ 1024 px, drawer en móvil y barra superior. */
export function PanelLayout() {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    setMenuAbierto(false)
    window.scrollTo(0, 0)
  }, [pathname])

  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol === 'cliente') return <Navigate to="/" replace />

  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[var(--color-sidebar)] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link to="/" aria-label="Ir al sitio">
            <Logo invertido />
          </Link>
        </div>
        <Navegacion />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuAbierto(true)} aria-label="Abrir menú" aria-expanded={menuAbierto} className="grid h-10 w-10 place-items-center rounded-lg border text-text hover:border-brand lg:hidden">
            <IconMenu className="h-5 w-5" />
          </button>
          <Link to="/" className="lg:hidden" aria-label="Ir al sitio">
            <Logo soloMarca />
          </Link>
          <p className="hidden text-sm text-text-muted lg:block">
            Panel de <span className="font-medium text-text">{ROLES[usuario.rol]}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-text-muted sm:inline">Hola, {usuario.nombres}</span>
          <ThemeToggle />
        </div>
      </header>

      {menuAbierto && (
        <Drawer titulo="Menú del panel" lado="left" onClose={() => setMenuAbierto(false)}>
          <div className="h-full bg-[var(--color-sidebar)]">
            <Navegacion onNavegar={() => setMenuAbierto(false)} />
          </div>
        </Drawer>
      )}

      <main id="contenido" className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
