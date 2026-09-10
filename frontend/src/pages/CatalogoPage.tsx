import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Spinner } from '../components/Spinner'
import { Alerta } from '../components/Alerta'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'
import { useAuth } from '../context/AuthContext'
import type { Barbero, Servicio } from '../types'

const CATEGORIAS: Record<Servicio['categoria'], string> = {
  corte: 'Cortes',
  barba: 'Barba',
  tratamiento: 'Tratamientos',
  spa_facial: 'Spa facial',
  combo: 'Combos',
}

export function CatalogoPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [categoria, setCategoria] = useState<string>('todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const [resServicios, resBarberos] = await Promise.all([
          api.get<Servicio[]>('/servicios'),
          api.get<Barbero[]>('/barberos'),
        ])
        setServicios(resServicios.data)
        setBarberos(resBarberos.data)
      } catch (e) {
        setError(mensajeError(e))
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const serviciosFiltrados = useMemo(
    () => (categoria === 'todas' ? servicios : servicios.filter((s) => s.categoria === categoria)),
    [servicios, categoria]
  )

  function irAReservar() {
    navigate(usuario ? '/reservar' : '/login')
  }

  if (cargando) return <Spinner etiqueta="Cargando catálogo…" />

  return (
    <div className="space-y-14">
      <section className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-2xl border bg-bg-subtle p-8 sm:p-10 md:grid-cols-2 md:gap-10">
        <div>
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-hover">
            Reservas en línea
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-text sm:text-4xl">
            Tu barbería, a un clic de distancia
          </h1>
          <p className="mt-3 max-w-md text-text-muted">
            Elige tu servicio, tu barbero favorito y reserva el horario que más te convenga. Sin filas, sin llamadas.
          </p>
          <button onClick={irAReservar} className="btn-principal mt-6">
            Reservar una cita
          </button>
        </div>
        <ImagenPlaceholder etiqueta="Foto del local o del equipo" className="aspect-[4/3] w-full md:aspect-square" />
      </section>

      {error && <Alerta tipo="error" mensaje={error} />}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-text">Catálogo de servicios</h2>
          <div className="flex flex-wrap gap-2">
            <FiltroCategoria activa={categoria === 'todas'} onClick={() => setCategoria('todas')}>
              Todas
            </FiltroCategoria>
            {Object.entries(CATEGORIAS).map(([valor, etiqueta]) => (
              <FiltroCategoria key={valor} activa={categoria === valor} onClick={() => setCategoria(valor)}>
                {etiqueta}
              </FiltroCategoria>
            ))}
          </div>
        </div>

        {serviciosFiltrados.length === 0 ? (
          <p className="text-text-muted">No hay servicios en esta categoría por el momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {serviciosFiltrados.map((servicio) => (
              <article
                key={servicio.id}
                className="tarjeta flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <ImagenPlaceholder src={servicio.imagen} variante="foto" className="aspect-[16/10] w-full rounded-none border-x-0 border-t-0" />
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-accent-hover">
                      {CATEGORIAS[servicio.categoria]}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold text-text">{servicio.nombre}</h3>
                    {servicio.descripcion && (
                      <p className="mt-2 text-sm text-text-muted">{servicio.descripcion}</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-text-muted">{servicio.duracion_minutos} min</span>
                    <span className="text-lg font-semibold text-accent-hover">Q{Number(servicio.precio).toFixed(2)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-text">Nuestro equipo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barberos.map((barbero) => (
            <article key={barbero.id} className="tarjeta flex items-start gap-4 p-5">
              <ImagenPlaceholder
                src={barbero.foto}
                variante="avatar"
                etiqueta="Foto"
                className="h-14 w-14 shrink-0 text-[10px]"
              />
              <div>
                <h3 className="font-semibold text-text">
                  {barbero.user.nombres} {barbero.user.apellidos}
                </h3>
                <p className="text-sm text-text-muted">{barbero.especialidad ?? 'Barbero profesional'}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {barbero.servicios.slice(0, 3).map((s) => (
                    <span key={s.id} className="rounded-full bg-neutral-soft px-2 py-0.5 text-xs text-text-muted">
                      {s.nombre}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function FiltroCategoria({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
        activa ? 'bg-accent text-text-on-accent font-medium' : 'bg-neutral-soft text-text-muted hover:bg-border-strong'
      }`}
    >
      {children}
    </button>
  )
}
