import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteHeader } from '../components/sitio/SiteHeader'
import { Footer } from '../components/sitio/Footer'
import { ErrorBoundary } from '../components/ErrorBoundary'

/** Marco del sitio público y del cliente: cabecera, contenido y pie. Gestiona el scroll al navegar y a las anclas (#equipo). */
export function SitioLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // El contenido puede tardar en montar (carga de datos): se reintenta un momento.
      let intentos = 0
      const buscar = () => {
        const el = document.getElementById(hash.slice(1))
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else if (intentos++ < 20) setTimeout(buscar, 100)
      }
      buscar()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="contenido" className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
