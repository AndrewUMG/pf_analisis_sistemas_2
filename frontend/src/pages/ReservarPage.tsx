import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Spinner } from '../components/Spinner'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'
import type { Barbero, Servicio } from '../types'

const PASOS = ['Servicios', 'Barbero', 'Fecha y hora', 'Confirmar'] as const

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReservarPage() {
  const navigate = useNavigate()

  const [paso, setPaso] = useState(0)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true)

  const [servicioIds, setServicioIds] = useState<number[]>([])
  const [barberoId, setBarberoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(hoyISO())
  const [hora, setHora] = useState<string | null>(null)
  const [notas, setNotas] = useState('')

  const [franjas, setFranjas] = useState<string[]>([])
  const [cargandoFranjas, setCargandoFranjas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [citaCreada, setCitaCreada] = useState(false)

  useEffect(() => {
    async function cargar() {
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
        setCargandoCatalogo(false)
      }
    }
    cargar()
  }, [])

  const serviciosSeleccionados = useMemo(
    () => servicios.filter((s) => servicioIds.includes(s.id)),
    [servicios, servicioIds]
  )

  // Solo se muestran barberos que ofrecen TODOS los servicios elegidos (lo exige el backend).
  const barberosDisponibles = useMemo(
    () =>
      barberos.filter((b) => servicioIds.every((id) => b.servicios.some((s) => s.id === id))),
    [barberos, servicioIds]
  )

  const totalPrecio = serviciosSeleccionados.reduce((suma, s) => suma + Number(s.precio), 0)
  const totalDuracion = serviciosSeleccionados.reduce((suma, s) => suma + s.duracion_minutos, 0)

  function alternarServicio(id: number) {
    setServicioIds((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]))
  }

  async function irAPasoFechaHora() {
    setPaso(2)
    await cargarFranjas(barberoId!, fecha)
  }

  async function cargarFranjas(idBarbero: number, fechaConsulta: string) {
    setCargandoFranjas(true)
    setError('')
    setHora(null)
    try {
      const { data } = await api.get(`/barberos/${idBarbero}/disponibilidad`, {
        params: { fecha: fechaConsulta, servicio_ids: servicioIds },
      })
      setFranjas(data.franjas_disponibles)
    } catch (e) {
      setError(mensajeError(e))
      setFranjas([])
    } finally {
      setCargandoFranjas(false)
    }
  }

  async function confirmarReserva() {
    if (!barberoId || !hora) return
    setEnviando(true)
    setError('')
    try {
      await api.post('/citas', {
        barbero_id: barberoId,
        fecha,
        hora_inicio: hora,
        servicio_ids: servicioIds,
        notas: notas || undefined,
      })
      setCitaCreada(true)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  if (cargandoCatalogo) return <Spinner etiqueta="Preparando el buscador de citas…" />

  if (citaCreada) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--color-success-soft)', borderColor: 'var(--color-success)' }}>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-success)' }}>
          ¡Cita confirmada!
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Reservaste para el {fecha} a las {hora}. Te enviaremos recordatorios antes de tu cita.
        </p>
        <button onClick={() => navigate('/mis-citas')} className="btn-principal mt-6">
          Ver mis citas
        </button>
      </div>
    )
  }

  const barberoElegido = barberos.find((b) => b.id === barberoId) ?? null

  return (
    <div className="mx-auto max-w-3xl">
      <Pasos actual={paso} />

      {error && (
        <div className="mt-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {paso === 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-text">¿Qué servicios quieres?</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {servicios.map((servicio) => {
              const elegido = servicioIds.includes(servicio.id)
              return (
                <button
                  key={servicio.id}
                  type="button"
                  onClick={() => alternarServicio(servicio.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                    elegido ? 'border-accent bg-accent-soft' : 'bg-surface hover:border-border-strong'
                  }`}
                >
                  <span>
                    <span className="block font-medium text-text">{servicio.nombre}</span>
                    <span className="block text-xs text-text-muted">{servicio.duracion_minutos} min</span>
                  </span>
                  <span className="font-semibold text-accent-hover">Q{Number(servicio.precio).toFixed(2)}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-text-muted">
              {serviciosSeleccionados.length} servicio(s) · {totalDuracion} min · Q{totalPrecio.toFixed(2)}
            </span>
            <button
              disabled={servicioIds.length === 0}
              onClick={() => setPaso(1)}
              className="btn-principal"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {paso === 1 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-text">¿Con quién prefieres tu cita?</h2>
          {barberosDisponibles.length === 0 ? (
            <p className="text-text-muted">Ningún barbero ofrece esa combinación de servicios. Ajusta tu selección.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {barberosDisponibles.map((barbero) => (
                <button
                  key={barbero.id}
                  type="button"
                  onClick={() => setBarberoId(barbero.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    barberoId === barbero.id ? 'border-accent bg-accent-soft' : 'bg-surface hover:border-border-strong'
                  }`}
                >
                  <ImagenPlaceholder variante="avatar" etiqueta="Foto" className="h-11 w-11 shrink-0" />
                  <span>
                    <span className="block font-medium text-text">
                      {barbero.user.nombres} {barbero.user.apellidos}
                    </span>
                    <span className="block text-xs text-text-muted">{barbero.especialidad ?? 'Barbero profesional'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <button onClick={() => setPaso(0)} className="btn-secundario">
              Atrás
            </button>
            <button disabled={!barberoId} onClick={irAPasoFechaHora} className="btn-principal">
              Continuar
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-text">Elige fecha y horario</h2>

          <label className="block max-w-xs">
            <span className="mb-1 block text-sm font-medium text-text">Fecha</span>
            <input
              type="date"
              min={hoyISO()}
              value={fecha}
              className="campo"
              onChange={(e) => {
                setFecha(e.target.value)
                cargarFranjas(barberoId!, e.target.value)
              }}
            />
          </label>

          {cargandoFranjas ? (
            <Spinner etiqueta="Buscando horarios disponibles…" />
          ) : franjas.length === 0 ? (
            <p className="text-text-muted">No hay horarios disponibles ese día. Prueba otra fecha.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {franjas.map((franja) => (
                <button
                  key={franja}
                  type="button"
                  onClick={() => setHora(franja)}
                  className={`rounded-lg border py-2 text-sm transition-colors ${
                    hora === franja ? 'border-accent bg-accent-soft text-accent-hover' : 'bg-surface text-text hover:border-border-strong'
                  }`}
                >
                  {franja}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <button onClick={() => setPaso(1)} className="btn-secundario">
              Atrás
            </button>
            <button disabled={!hora} onClick={() => setPaso(3)} className="btn-principal">
              Continuar
            </button>
          </div>
        </div>
      )}

      {paso === 3 && barberoElegido && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-text">Confirma tu reserva</h2>

          <div className="tarjeta space-y-2 p-5 text-sm">
            <Fila etiqueta="Servicios" valor={serviciosSeleccionados.map((s) => s.nombre).join(', ')} />
            <Fila etiqueta="Barbero" valor={`${barberoElegido.user.nombres} ${barberoElegido.user.apellidos}`} />
            <Fila etiqueta="Fecha" valor={fecha} />
            <Fila etiqueta="Hora" valor={hora ?? ''} />
            <Fila etiqueta="Duración estimada" valor={`${totalDuracion} min`} />
            <Fila etiqueta="Total" valor={`Q${totalPrecio.toFixed(2)}`} destacado />
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Notas para el barbero (opcional)</span>
            <textarea
              className="campo"
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. prefiero degradado bajo, alergia a ciertos productos, etc."
            />
          </label>

          <div className="flex items-center justify-between border-t pt-4">
            <button onClick={() => setPaso(2)} className="btn-secundario">
              Atrás
            </button>
            <button disabled={enviando} onClick={confirmarReserva} className="btn-principal">
              {enviando ? 'Reservando…' : 'Confirmar cita'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Pasos({ actual }: { actual: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {PASOS.map((etiqueta, i) => (
        <li key={etiqueta} className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
              i === actual
                ? 'bg-accent text-text-on-accent'
                : i < actual
                  ? 'bg-accent-soft text-accent-hover'
                  : 'bg-neutral-soft text-text-faint'
            }`}
          >
            {i + 1}
          </span>
          <span className={i === actual ? 'text-text' : 'text-text-faint'}>{etiqueta}</span>
          {i < PASOS.length - 1 && <span className="mx-1 text-text-faint">—</span>}
        </li>
      ))}
    </ol>
  )
}

function Fila({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{etiqueta}</span>
      <span className={destacado ? 'text-lg font-semibold text-accent-hover' : 'text-text'}>{valor}</span>
    </div>
  )
}
