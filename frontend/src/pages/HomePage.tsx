import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { NEGOCIO } from '../config/negocio'
import { Alerta } from '../components/Alerta'
import { Contenedor } from '../components/Contenedor'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'
import { Estrellas } from '../components/Estrellas'
import { IconCalendario, IconCheck, IconFlecha, IconReloj, IconTijeras } from '../components/Icons'
import { SeccionTitulo } from '../components/sitio/SeccionTitulo'
import { ServicioCard } from '../components/sitio/ServicioCard'
import { BarberoCard } from '../components/sitio/BarberoCard'
import { TarjetasSkeleton } from '../components/Skeleton'
import type { Barbero, Servicio } from '../types'

const PASOS = [
  { icono: IconTijeras, titulo: 'Elige tu servicio', texto: 'Corte, barba, tratamientos o combos. Ves duración y precio antes de decidir.' },
  { icono: IconCalendario, titulo: 'Escoge barbero y horario', texto: 'Mira la disponibilidad real de cada barbero y toma la franja que más te acomode.' },
  { icono: IconCheck, titulo: 'Confirma y listo', texto: 'Te enviamos la confirmación y recordatorios. ¿Cambio de planes? Reagendas en un clic.' },
]

export function HomePage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get<Servicio[]>('/servicios'), api.get<Barbero[]>('/barberos')])
      .then(([s, b]) => {
        setServicios(s.data)
        setBarberos(b.data)
      })
      .catch((e) => setError(mensajeError(e)))
      .finally(() => setCargando(false))
  }, [])

  // Promedio general ponderado por número de valoraciones de cada barbero.
  const valoracion = useMemo(() => {
    const total = barberos.reduce((s, b) => s + (b.total_valoraciones ?? 0), 0)
    if (!total) return null
    const suma = barberos.reduce((s, b) => s + Number(b.promedio_valoracion ?? 0) * (b.total_valoraciones ?? 0), 0)
    return { promedio: suma / total, total }
  }, [barberos])

  const estadisticas = [
    { valor: valoracion ? valoracion.promedio.toFixed(1) : '5.0', etiqueta: valoracion ? `Valoración de ${valoracion.total} clientes` : 'Atención de primera' },
    { valor: String(barberos.length || '—'), etiqueta: 'Barberos profesionales' },
    { valor: String(servicios.length || '—'), etiqueta: 'Servicios para elegir' },
    { valor: '1 min', etiqueta: 'Para reservar tu cita' },
  ]

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(60rem 28rem at 85% -5%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)' }}>
        <div className="textura-rayas absolute inset-0 opacity-70" aria-hidden="true" />
        <Contenedor className="relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <p className="eyebrow inline-flex items-center gap-2">
              <span className="h-px w-8 bg-accent-strong" aria-hidden="true" />
              Barbería · Reservas en línea
            </p>
            <h1 className="mt-5 text-[clamp(2.5rem,5.6vw,4.6rem)] font-semibold leading-[1.04] text-text">
              Tu <span className="underline decoration-accent-strong decoration-[5px] underline-offset-[10px]">mejor versión</span> empieza en la silla
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
              Elige tu servicio, tu barbero de confianza y el horario que más te convenga. Sin filas, sin llamadas, con recordatorios para que no se te pase.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/reservar" className="btn-principal btn-lg">
                Reservar mi cita
                <IconFlecha className="h-5 w-5" />
              </Link>
              <Link to="/servicios" className="btn-secundario btn-lg">
                Ver servicios
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-text-muted">
              {valoracion && (
                <span className="inline-flex items-center gap-2">
                  <Estrellas valor={valoracion.promedio} className="h-4 w-4" />
                  <strong className="text-text">{valoracion.promedio.toFixed(1)}</strong> de {valoracion.total} opiniones
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <IconReloj className="h-4 w-4 text-accent-hover" />
                {NEGOCIO.horario}
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-8">
            <div className="absolute inset-0 translate-x-5 translate-y-5 rounded-[1.75rem] border-2 border-accent-strong/50 lg:left-8" aria-hidden="true" />
            <ImagenPlaceholder src={NEGOCIO.imagenes.hero} etiqueta="Foto del local o del equipo" className="relative aspect-[4/5] w-full rounded-[1.5rem] shadow-[var(--shadow-float)] sm:aspect-[5/6] lg:aspect-[4/5]" />
            <div className="tarjeta absolute -bottom-6 left-3 flex items-center gap-3 p-4 sm:-left-2 lg:left-2" style={{ boxShadow: 'var(--shadow-raised)' }}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent-hover">
                <IconCalendario className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">Agenda abierta</p>
                <p className="text-xs text-text-muted">Elige tu horario en tiempo real</p>
              </div>
            </div>
          </div>
        </Contenedor>
      </section>

      {/* ---------- Franja de confianza ---------- */}
      <section aria-label="En números" className="border-y bg-bg-subtle">
        <Contenedor className="grid grid-cols-2 gap-y-6 py-8 lg:grid-cols-4">
          {estadisticas.map((e) => (
            <div key={e.etiqueta} className="px-2 text-center lg:border-l lg:first:border-l-0">
              <p className="font-serif text-3xl font-semibold text-text sm:text-4xl">{e.valor}</p>
              <p className="mt-1 text-sm text-text-muted">{e.etiqueta}</p>
            </div>
          ))}
        </Contenedor>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="scroll-mt-24 py-20 sm:py-24">
        <Contenedor>
          <SeccionTitulo centrado eyebrow="Así de fácil" titulo="Reservar toma menos de un minuto" />
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="tarjeta aparecer relative p-7" style={{ '--i': i } as CSSProperties}>
                <span className="absolute right-6 top-4 font-serif text-6xl font-semibold text-accent/25" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-xl text-[var(--color-text-on-brand)]" style={{ backgroundColor: 'var(--color-brand)' }}>
                  <p.icono className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-text">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Contenedor>
      </section>

      {/* ---------- Servicios ---------- */}
      <section className="bg-bg-subtle py-20 sm:py-24">
        <Contenedor>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SeccionTitulo eyebrow="Nuestros servicios" titulo="Cuidado a tu medida" descripcion="Desde un corte clásico hasta tratamientos completos. Precios claros, sin sorpresas." />
            <Link to="/servicios" className="btn-secundario">
              Ver todos
              <IconFlecha className="h-4 w-4" />
            </Link>
          </div>
          {error && (
            <div className="mt-6">
              <Alerta tipo="error" mensaje={error} />
            </div>
          )}
          <div className="mt-12">
            {cargando ? (
              <TarjetasSkeleton cantidad={3} />
            ) : servicios.length === 0 ? (
              <p className="text-text-muted">Pronto publicaremos nuestro catálogo de servicios.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {servicios.slice(0, 6).map((s, i) => (
                  <ServicioCard key={s.id} servicio={s} indice={i} />
                ))}
              </div>
            )}
          </div>
        </Contenedor>
      </section>

      {/* ---------- Equipo ---------- */}
      <section id="equipo" className="scroll-mt-24 py-20 sm:py-24">
        <Contenedor>
          <SeccionTitulo centrado eyebrow="El equipo" titulo="Manos expertas, trato cercano" descripcion="Conoce a los barberos y reserva directamente con quien prefieras." />
          <div className="mt-14">
            {cargando ? (
              <TarjetasSkeleton cantidad={3} />
            ) : (
              <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {barberos.map((b, i) => (
                  <BarberoCard key={b.id} barbero={b} indice={i} />
                ))}
              </div>
            )}
          </div>
        </Contenedor>
      </section>

      {/* ---------- CTA final ---------- */}
      <Contenedor>
        <div className="textura-rayas relative overflow-hidden rounded-[1.75rem] px-6 py-14 text-center sm:px-12 sm:py-20" style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' }}>
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>
            Tu próxima cita
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-tight">¿Listo para tu próximo corte?</h2>
          <p className="mx-auto mt-4 max-w-lg opacity-85">Reserva en línea en menos de un minuto y recibe tu confirmación al instante.</p>
          <Link to="/reservar" className="btn-dorado btn-lg mt-8">
            Reservar ahora
            <IconFlecha className="h-5 w-5" />
          </Link>
        </div>
      </Contenedor>
    </>
  )
}
