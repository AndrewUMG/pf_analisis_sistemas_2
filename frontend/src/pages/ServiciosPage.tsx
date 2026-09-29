import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Contenedor } from '../components/Contenedor'
import { TarjetasSkeleton } from '../components/Skeleton'
import { CATEGORIAS, ServicioCard } from '../components/sitio/ServicioCard'
import { SeccionTitulo } from '../components/sitio/SeccionTitulo'
import type { Servicio } from '../types'

export function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api
      .get<Servicio[]>('/servicios')
      .then((r) => setServicios(r.data))
      .catch((e) => setError(mensajeError(e)))
      .finally(() => setCargando(false))
  }, [])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return servicios.filter((s) => (categoria === 'todas' || s.categoria === categoria) && (!texto || s.nombre.toLowerCase().includes(texto)))
  }, [servicios, categoria, busqueda])

  // Solo se ofrecen como filtro las categorías que realmente tienen servicios.
  const categoriasConServicios = Object.entries(CATEGORIAS).filter(([valor]) => servicios.some((s) => s.categoria === valor))

  return (
    <>
      <section className="border-b bg-bg-subtle textura-rayas">
        <Contenedor className="py-14 sm:py-20">
          <SeccionTitulo eyebrow="Catálogo" titulo="Nuestros servicios" descripcion="Encuentra el servicio ideal y reserva con el barbero que prefieras." />
        </Contenedor>
      </section>

      <Contenedor className="py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
            <button className="chip" aria-pressed={categoria === 'todas'} onClick={() => setCategoria('todas')}>
              Todos
            </button>
            {categoriasConServicios.map(([valor, etiqueta]) => (
              <button key={valor} className="chip" aria-pressed={categoria === valor} onClick={() => setCategoria(valor)}>
                {etiqueta}
              </button>
            ))}
          </div>
          <label className="w-full sm:w-72">
            <span className="sr-only">Buscar servicio</span>
            <input type="search" className="campo" placeholder="Buscar servicio…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </label>
        </div>

        {error && (
          <div className="mt-6">
            <Alerta tipo="error" mensaje={error} />
          </div>
        )}

        <p className="mt-6 text-sm text-text-muted" aria-live="polite">
          {cargando ? 'Cargando servicios…' : `${visibles.length} ${visibles.length === 1 ? 'servicio' : 'servicios'}`}
        </p>

        <div className="mt-4">
          {cargando ? (
            <TarjetasSkeleton />
          ) : visibles.length === 0 ? (
            <div className="tarjeta p-10 text-center">
              <p className="font-serif text-xl font-semibold text-text">No encontramos servicios con ese filtro</p>
              <p className="mt-1 text-sm text-text-muted">Prueba con otra categoría o borra la búsqueda.</p>
              <button
                className="btn-secundario mt-5"
                onClick={() => {
                  setCategoria('todas')
                  setBusqueda('')
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((s, i) => (
                <ServicioCard key={s.id} servicio={s} indice={i} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 text-center">
          <Link to="/reservar" className="btn-principal btn-lg">
            Reservar mi cita
          </Link>
        </div>
      </Contenedor>
    </>
  )
}
