import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Campo } from '../../components/Campo'
import { FilasSkeleton } from '../../components/Skeleton'
import { PageHeader } from '../../components/PageHeader'
import { ImagenPlaceholder } from '../../components/ImagenPlaceholder'
import { IconCheck } from '../../components/Icons'
import { formatoHora } from '../../utils/fechas'
import type { Barbero, Cita, Servicio } from '../../types'

export function WalkinPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null)

  const [form, setForm] = useState({ nombres: '', apellidos: '', telefono: '' })
  const [servicioIds, setServicioIds] = useState<number[]>([])
  const [barberoId, setBarberoId] = useState<number | null>(null)
  const [notas, setNotas] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [resServicios, resBarberos] = await Promise.all([api.get<Servicio[]>('/servicios'), api.get<Barbero[]>('/barberos')])
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

  const barberosDisponibles = barberos.filter((b) => servicioIds.every((id) => b.servicios.some((s) => s.id === id)))
  const elegidos = servicios.filter((s) => servicioIds.includes(s.id))
  const total = elegidos.reduce((suma, s) => suma + Number(s.precio), 0)
  const minutos = elegidos.reduce((suma, s) => suma + s.duracion_minutos, 0)

  function alternarServicio(id: number) {
    setServicioIds((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]))
    setBarberoId(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (servicioIds.length === 0 || !barberoId) {
      setError('Elige al menos un servicio y un barbero.')
      return
    }
    setEnviando(true)
    setError('')
    setCitaCreada(null)
    try {
      const { data } = await api.post<Cita>('/citas/walkin', {
        ...form,
        barbero_id: barberoId,
        servicio_ids: servicioIds,
        notas: notas || undefined,
      })
      setCitaCreada(data)
      setForm({ nombres: '', apellidos: '', telefono: '' })
      setServicioIds([])
      setBarberoId(null)
      setNotas('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(mensajeError(e))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <FilasSkeleton cantidad={4} />

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Recepción" titulo="Registro presencial" descripcion="Atiende a un cliente que llegó sin cita, con el primer horario libre de hoy." />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {citaCreada && (
        <div className="mb-6" role="status">
          <Alerta tipo="exito" mensaje={`Cita registrada para las ${formatoHora(citaCreada.hora_inicio)} con ${citaCreada.barbero?.user.nombres ?? 'el barbero seleccionado'}.`} />
        </div>
      )}

      <form onSubmit={enviar} className="space-y-8">
        <section className="tarjeta space-y-5 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-text">1. Datos del cliente</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Nombres">{(p) => <input {...p} required autoComplete="off" className="campo" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />}</Campo>
            <Campo etiqueta="Apellidos">{(p) => <input {...p} autoComplete="off" className="campo" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />}</Campo>
          </div>
          <Campo etiqueta="Teléfono" ayuda="Se usa para enviarle el recordatorio por WhatsApp.">
            {(p) => <input {...p} required type="tel" inputMode="tel" autoComplete="off" className="campo" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />}
          </Campo>
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold text-text">2. Servicios</h2>
          <p className="mb-3 text-sm text-text-muted">Puedes elegir varios.</p>
          <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Servicios">
            {servicios.map((servicio) => {
              const elegido = servicioIds.includes(servicio.id)
              return (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={elegido}
                  key={servicio.id}
                  onClick={() => alternarServicio(servicio.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${elegido ? 'border-brand bg-[color-mix(in_srgb,var(--color-brand)_7%,transparent)]' : 'bg-surface hover:border-border-strong'}`}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md border"
                    style={elegido ? { backgroundColor: 'var(--color-brand)', borderColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' } : undefined}
                    aria-hidden="true"
                  >
                    {elegido && <IconCheck className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-text">{servicio.nombre}</span>
                    <span className="text-xs text-text-muted">{servicio.duracion_minutos} min</span>
                  </span>
                  <span className="font-serif font-semibold text-accent-hover">Q{Number(servicio.precio).toFixed(2)}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">3. Barbero</h2>
          {barberosDisponibles.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-text-muted">
              {servicioIds.length === 0 ? 'Elige al menos un servicio para ver los barberos disponibles.' : 'Ningún barbero ofrece todos esos servicios juntos. Quita alguno.'}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Barbero">
              {barberosDisponibles.map((barbero) => {
                const activo = barberoId === barbero.id
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    key={barbero.id}
                    onClick={() => setBarberoId(barbero.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${activo ? 'border-brand bg-[color-mix(in_srgb,var(--color-brand)_7%,transparent)]' : 'bg-surface hover:border-border-strong'}`}
                  >
                    <ImagenPlaceholder src={barbero.foto} variante="avatar" etiqueta={`Foto de ${barbero.user.nombres}`} className="h-11 w-11 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-text">
                        {barbero.user.nombres} {barbero.user.apellidos}
                      </span>
                      {barbero.especialidad && <span className="text-xs text-text-muted">{barbero.especialidad}</span>}
                    </span>
                    {activo && <IconCheck className="h-5 w-5 text-brand" />}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <Campo etiqueta="Notas (opcional)">{(p) => <textarea {...p} className="campo" rows={2} maxLength={255} value={notas} onChange={(e) => setNotas(e.target.value)} />}</Campo>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
          <div>
            <p className="text-xs text-text-muted">{elegidos.length === 0 ? 'Sin servicios' : `${elegidos.length} ${elegidos.length === 1 ? 'servicio' : 'servicios'} · ${minutos} min`}</p>
            <p className="font-serif text-xl font-semibold text-text">Q{total.toFixed(2)}</p>
          </div>
          <button type="submit" disabled={enviando} className="btn-principal btn-lg">
            {enviando ? 'Registrando…' : 'Registrar cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
