import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Spinner } from '../components/Spinner'
import { Alerta } from '../components/Alerta'
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
    <div className="space-y-12">
      <section className="rounded-2xl border border-carbon-800 bg-gradient-to-br from-carbon-900 to-carbon-950 p-8 text-center sm:p-12">
        <h1 className="text-3xl font-semibold text-carbon-100 sm:text-4xl">
          Tu barbería, a un clic de distancia
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-carbon-400">
          Elige tu servicio, tu barbero favorito y reserva el horario que más te convenga. Sin filas, sin llamadas.
        </p>
        <button
          onClick={irAReservar}
          className="mt-6 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-carbon-950 transition-colors hover:bg-gold-400"
        >
          Reservar una cita
        </button>
      </section>

      {error && <Alerta tipo="error" mensaje={error} />}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-carbon-100">Catálogo de servicios</h2>
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
          <p className="text-carbon-400">No hay servicios en esta categoría por el momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviciosFiltrados.map((servicio) => (
              <article
                key={servicio.id}
                className="flex flex-col justify-between rounded-xl border border-carbon-800 bg-carbon-900 p-5 transition-colors hover:border-gold-500/40"
              >
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gold-400">
                    {CATEGORIAS[servicio.categoria]}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-carbon-100">{servicio.nombre}</h3>
                  {servicio.descripcion && (
                    <p className="mt-2 text-sm text-carbon-400">{servicio.descripcion}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-carbon-800 pt-3 text-sm">
                  <span className="text-carbon-400">{servicio.duracion_minutos} min</span>
                  <span className="text-lg font-semibold text-gold-400">Q{Number(servicio.precio).toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-carbon-100">Nuestro equipo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barberos.map((barbero) => (
            <article key={barbero.id} className="flex items-start gap-4 rounded-xl border border-carbon-800 bg-carbon-900 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold-500/15 text-lg font-semibold text-gold-400">
                {barbero.user.nombres.charAt(0)}
                {barbero.user.apellidos.charAt(0)}
              </span>
              <div>
                <h3 className="font-semibold text-carbon-100">
                  {barbero.user.nombres} {barbero.user.apellidos}
                </h3>
                <p className="text-sm text-carbon-400">{barbero.especialidad ?? 'Barbero profesional'}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {barbero.servicios.slice(0, 3).map((s) => (
                    <span key={s.id} className="rounded-full bg-carbon-800 px-2 py-0.5 text-xs text-carbon-300">
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
        activa ? 'bg-gold-500 text-carbon-950 font-medium' : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
      }`}
    >
      {children}
    </button>
  )
}
