import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import { ImagenPlaceholder } from '../../components/ImagenPlaceholder'
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

  const barberosDisponibles = barberos.filter((b) => servicioIds.every((id) => b.servicios.some((s) => s.id === id)))

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
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Spinner etiqueta="Cargando catálogo…" />

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titulo="Registro presencial" descripcion="Atiende a un cliente que llegó sin cita, con el primer horario libre de hoy." />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {citaCreada && (
        <div className="mb-6">
          <Alerta
            tipo="exito"
            mensaje={`Cita registrada para las ${citaCreada.hora_inicio.slice(0, 5)} con ${citaCreada.barbero?.user.nombres ?? 'el barbero seleccionado'}.`}
          />
        </div>
      )}

      <form onSubmit={enviar} className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Nombres</span>
            <input required className="campo" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Apellidos</span>
            <input className="campo" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Teléfono</span>
            <input required className="campo" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
          </label>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-text">Servicios</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {servicios.map((servicio) => {
              const elegido = servicioIds.includes(servicio.id)
              return (
                <button
                  type="button"
                  key={servicio.id}
                  onClick={() => alternarServicio(servicio.id)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                    elegido ? 'border-accent bg-accent-soft' : 'bg-surface hover:border-border-strong'
                  }`}
                >
                  <span className="text-text">{servicio.nombre}</span>
                  <span className="text-accent-hover">Q{Number(servicio.precio).toFixed(2)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-text">Barbero</span>
          {barberosDisponibles.length === 0 ? (
            <p className="text-sm text-text-muted">Elige al menos un servicio para ver barberos disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {barberosDisponibles.map((barbero) => (
                <button
                  type="button"
                  key={barbero.id}
                  onClick={() => setBarberoId(barbero.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                    barberoId === barbero.id ? 'border-accent bg-accent-soft' : 'bg-surface hover:border-border-strong'
                  }`}
                >
                  <ImagenPlaceholder src={barbero.foto} variante="avatar" etiqueta="Foto" className="h-9 w-9 shrink-0" />
                  <span className="text-text">
                    {barbero.user.nombres} {barbero.user.apellidos}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text">Notas (opcional)</span>
          <textarea className="campo" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        <button type="submit" disabled={enviando} className="btn-principal w-full">
          {enviando ? 'Registrando…' : 'Registrar cliente'}
        </button>
      </form>
    </div>
  )
}
