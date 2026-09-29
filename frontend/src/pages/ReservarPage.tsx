import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Contenedor } from '../components/Contenedor'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'
import { ResumenValoracion } from '../components/Estrellas'
import { FilasSkeleton, Skeleton } from '../components/Skeleton'
import { IconCheck, IconReloj } from '../components/Icons'
import { Pasos } from '../components/reserva/Pasos'
import { SelectorDia } from '../components/reserva/SelectorDia'
import { ResumenReserva, duracionDe, totalDe } from '../components/reserva/ResumenReserva'
import { ReservaExito } from '../components/reserva/ReservaExito'
import { hoyLocalISO } from '../utils/fechas'
import type { Barbero, Cita, Servicio } from '../types'

const PASOS = ['Servicios', 'Barbero', 'Fecha y hora', 'Confirmar'] as const

/** Agrupa las franjas del día para que la lista larga sea más fácil de escanear. */
function agruparFranjas(franjas: string[]) {
  const grupos = [
    { titulo: 'Mañana', horas: franjas.filter((f) => Number(f.slice(0, 2)) < 12) },
    { titulo: 'Tarde', horas: franjas.filter((f) => Number(f.slice(0, 2)) >= 12 && Number(f.slice(0, 2)) < 18) },
    { titulo: 'Noche', horas: franjas.filter((f) => Number(f.slice(0, 2)) >= 18) },
  ]
  return grupos.filter((g) => g.horas.length > 0)
}

export function ReservarPage() {
  const [params] = useSearchParams()

  const [paso, setPaso] = useState(0)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true)

  const [servicioIds, setServicioIds] = useState<number[]>([])
  const [barberoId, setBarberoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(hoyLocalISO())
  const [hora, setHora] = useState<string | null>(null)
  const [notas, setNotas] = useState('')

  const [franjas, setFranjas] = useState<string[]>([])
  const [cargandoFranjas, setCargandoFranjas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null)

  // Carga del catálogo y atajos desde las tarjetas del sitio (?servicio=ID, ?barbero=ID).
  useEffect(() => {
    Promise.all([api.get<Servicio[]>('/servicios'), api.get<Barbero[]>('/barberos')])
      .then(([s, b]) => {
        setServicios(s.data)
        setBarberos(b.data)

        const servicioParam = Number(params.get('servicio'))
        const barberoParam = Number(params.get('barbero'))
        const servicio = s.data.find((x) => x.id === servicioParam)
        const barbero = b.data.find((x) => x.id === barberoParam)

        if (servicio) {
          setServicioIds([servicio.id])
          const ofrece = barbero?.servicios.some((x) => x.id === servicio.id)
          if (barbero && ofrece) {
            setBarberoId(barbero.id)
            setPaso(2)
          } else {
            setPaso(1)
          }
        } else if (barbero) {
          setBarberoId(barbero.id)
        }
      })
      .catch((e) => setError(mensajeError(e)))
      .finally(() => setCargandoCatalogo(false))
    // Solo al montar: los parámetros de la URL se leen una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const serviciosSeleccionados = useMemo(() => servicios.filter((s) => servicioIds.includes(s.id)), [servicios, servicioIds])

  // Solo se muestran barberos que ofrecen TODOS los servicios elegidos (lo exige el backend).
  const barberosDisponibles = useMemo(() => barberos.filter((b) => servicioIds.every((id) => b.servicios.some((s) => s.id === id))), [barberos, servicioIds])

  const barberoElegido = barberos.find((b) => b.id === barberoId) ?? null
  const gruposFranjas = useMemo(() => agruparFranjas(franjas), [franjas])

  function alternarServicio(id: number) {
    setServicioIds((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]))
    setBarberoId(null)
    setHora(null)
  }

  async function cargarFranjas(idBarbero: number, fechaConsulta: string) {
    setCargandoFranjas(true)
    setError('')
    setHora(null)
    try {
      const { data } = await api.get(`/barberos/${idBarbero}/disponibilidad`, { params: { fecha: fechaConsulta, servicio_ids: servicioIds } })
      setFranjas(data.franjas_disponibles)
    } catch (e) {
      setError(mensajeError(e))
      setFranjas([])
    } finally {
      setCargandoFranjas(false)
    }
  }

  // Al entrar al paso de fecha (o al cambiar el día) se consultan las franjas reales.
  useEffect(() => {
    if (paso === 2 && barberoId) cargarFranjas(barberoId, fecha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, fecha, barberoId])

  async function confirmarReserva() {
    if (!barberoId || !hora) return
    setEnviando(true)
    setError('')
    try {
      const { data } = await api.post<Cita>('/citas', { barbero_id: barberoId, fecha, hora_inicio: hora, servicio_ids: servicioIds, notas: notas || undefined })
      setCitaCreada(data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  function reiniciar() {
    setCitaCreada(null)
    setPaso(0)
    setServicioIds([])
    setBarberoId(null)
    setHora(null)
    setNotas('')
    setFecha(hoyLocalISO())
  }

  if (citaCreada) {
    return (
      <Contenedor className="py-12 sm:py-20">
        <ReservaExito
          cita={citaCreada}
          servicios={serviciosSeleccionados.map((s) => s.nombre).join(', ')}
          barbero={barberoElegido ? `${barberoElegido.user.nombres} ${barberoElegido.user.apellidos}` : 'Tu barbero'}
          onOtra={reiniciar}
        />
      </Contenedor>
    )
  }

  const resumen = { servicios: serviciosSeleccionados, barbero: barberoElegido, fecha: hora ? fecha : null, hora }
  const puedeAvanzar = [servicioIds.length > 0, !!barberoId, !!hora, true][paso]

  return (
    <Contenedor className="py-8 sm:py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">Reserva en línea</p>
        <h1 className="mt-2 text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold text-text">Agenda tu cita</h1>
      </header>

      <div className="mt-8 max-w-3xl">
        <Pasos etiquetas={PASOS} actual={paso} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-labelledby="titulo-paso">
          {error && (
            <div className="mb-5" role="alert">
              <Alerta tipo="error" mensaje={error} />
            </div>
          )}

          {cargandoCatalogo ? (
            <FilasSkeleton cantidad={4} />
          ) : (
            <>
              {paso === 0 && (
                <div>
                  <h2 id="titulo-paso" className="text-2xl font-semibold text-text">
                    ¿Qué servicios quieres?
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">Puedes combinar varios; sumamos el tiempo y el precio por ti.</p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {servicios.map((s) => {
                      const elegido = servicioIds.includes(s.id)
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={elegido}
                            onClick={() => alternarServicio(s.id)}
                            className="relative flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
                            style={{
                              borderColor: elegido ? 'var(--color-brand)' : 'var(--color-border-strong)',
                              backgroundColor: elegido ? 'color-mix(in srgb, var(--color-brand) 7%, var(--color-surface))' : 'var(--color-surface)',
                              boxShadow: elegido ? '0 0 0 1px var(--color-brand)' : undefined,
                            }}
                          >
                            <ImagenPlaceholder src={s.imagen} etiqueta={s.nombre} className="h-16 w-16 shrink-0 rounded-lg" />
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-text">{s.nombre}</span>
                              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-text-muted">
                                <IconReloj className="h-3.5 w-3.5" />
                                {s.duracion_minutos} min
                              </span>
                              <span className="block font-serif text-lg font-semibold text-accent-hover">Q{Number(s.precio).toFixed(2)}</span>
                            </span>
                            <span
                              className="grid h-6 w-6 shrink-0 place-items-center rounded-full border"
                              style={{ backgroundColor: elegido ? 'var(--color-brand)' : 'transparent', borderColor: elegido ? 'var(--color-brand)' : 'var(--color-border-strong)', color: 'var(--color-text-on-brand)' }}
                              aria-hidden="true"
                            >
                              {elegido && <IconCheck className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {paso === 1 && (
                <div>
                  <h2 id="titulo-paso" className="text-2xl font-semibold text-text">
                    ¿Con quién prefieres tu cita?
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">Estos barberos ofrecen todos los servicios que elegiste.</p>
                  {barberosDisponibles.length === 0 ? (
                    <p className="mt-6 rounded-xl bg-bg-subtle p-5 text-text-muted">Ningún barbero ofrece esa combinación. Vuelve atrás y ajusta tu selección.</p>
                  ) : (
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {barberosDisponibles.map((b) => {
                        const elegido = barberoId === b.id
                        return (
                          <li key={b.id}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={elegido}
                              onClick={() => setBarberoId(b.id)}
                              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5"
                              style={{
                                borderColor: elegido ? 'var(--color-brand)' : 'var(--color-border-strong)',
                                backgroundColor: elegido ? 'color-mix(in srgb, var(--color-brand) 7%, var(--color-surface))' : 'var(--color-surface)',
                                boxShadow: elegido ? '0 0 0 1px var(--color-brand)' : undefined,
                              }}
                            >
                              <ImagenPlaceholder src={b.foto} variante="avatar" etiqueta={b.user.nombres} className="h-16 w-16 shrink-0" />
                              <span className="min-w-0">
                                <span className="block font-semibold text-text">
                                  {b.user.nombres} {b.user.apellidos}
                                </span>
                                <span className="block text-sm text-text-muted">{b.especialidad ?? 'Barbero profesional'}</span>
                                <span className="mt-1 block">
                                  <ResumenValoracion promedio={b.promedio_valoracion} total={b.total_valoraciones} />
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}

              {paso === 2 && (
                <div>
                  <h2 id="titulo-paso" className="text-2xl font-semibold text-text">
                    Elige día y horario
                  </h2>
                  <div className="mt-6">
                    <SelectorDia valor={fecha} onChange={setFecha} />
                  </div>

                  <div className="mt-6" aria-live="polite">
                    {cargandoFranjas ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <Skeleton key={i} className="h-11" />
                        ))}
                      </div>
                    ) : gruposFranjas.length === 0 ? (
                      <p className="rounded-xl bg-bg-subtle p-5 text-text-muted">No hay horarios disponibles ese día. Prueba con otro día de la tira.</p>
                    ) : (
                      <div className="space-y-5">
                        {gruposFranjas.map((g) => (
                          <div key={g.titulo}>
                            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">{g.titulo}</h3>
                            <div role="radiogroup" aria-label={`Horarios de ${g.titulo.toLowerCase()}`} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                              {g.horas.map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  role="radio"
                                  aria-checked={hora === f}
                                  onClick={() => setHora(f)}
                                  className="min-h-11 rounded-lg border text-sm font-medium transition-colors"
                                  style={{
                                    backgroundColor: hora === f ? 'var(--color-brand)' : 'var(--color-surface)',
                                    color: hora === f ? 'var(--color-text-on-brand)' : 'var(--color-text)',
                                    borderColor: hora === f ? 'var(--color-brand)' : 'var(--color-border-strong)',
                                  }}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paso === 3 && barberoElegido && hora && (
                <div>
                  <h2 id="titulo-paso" className="text-2xl font-semibold text-text">
                    Confirma tu reserva
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">Revisa el resumen y, si quieres, deja una nota para tu barbero.</p>
                  <label className="mt-6 block">
                    <span className="mb-1.5 block text-sm font-medium text-text">Notas para el barbero (opcional)</span>
                    <textarea className="campo" rows={4} maxLength={500} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. degradado bajo, alergia a ciertos productos…" />
                  </label>
                  <p className="mt-4 text-xs text-text-muted">
                    Duración estimada: {duracionDe(serviciosSeleccionados)} min de servicio. Podrás reagendar o cancelar desde “Mis citas”, respetando la anticipación mínima.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Resumen en móvil (en escritorio va a la derecha). */}
          {!cargandoCatalogo && paso > 0 && (
            <details className="tarjeta mt-8 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-text">
                Ver resumen de mi reserva
                <span className="font-serif text-lg text-accent-hover">Q{totalDe(serviciosSeleccionados).toFixed(2)}</span>
              </summary>
              <div className="border-t p-1">
                <ResumenReserva {...resumen} />
              </div>
            </details>
          )}

          {/* Acciones: fijas abajo en móvil para tener siempre el "Continuar" a mano. */}
          {!cargandoCatalogo && (
            <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
              {paso > 0 ? (
                <button type="button" onClick={() => setPaso(paso - 1)} className="btn-secundario">
                  Atrás
                </button>
              ) : (
                <span className="text-sm text-text-muted">
                  {servicioIds.length} {servicioIds.length === 1 ? 'servicio' : 'servicios'} · Q{totalDe(serviciosSeleccionados).toFixed(2)}
                </span>
              )}
              {paso < 3 ? (
                <button type="button" disabled={!puedeAvanzar} onClick={() => setPaso(paso + 1)} className="btn-principal btn-lg">
                  Continuar
                </button>
              ) : (
                <button type="button" disabled={enviando} onClick={confirmarReserva} className="btn-principal btn-lg">
                  {enviando ? 'Reservando…' : 'Confirmar cita'}
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="sticky top-24 hidden lg:block" aria-label="Resumen de la reserva">
          <ResumenReserva {...resumen} />
        </aside>
      </div>
    </Contenedor>
  )
}
