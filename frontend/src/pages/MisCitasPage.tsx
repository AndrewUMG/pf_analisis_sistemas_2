import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Spinner } from '../components/Spinner'
import { EstadoBadge } from '../components/EstadoBadge'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'
import type { Cita, PaginaCitas } from '../types'

/** El backend serializa "fecha" como datetime ISO completo; aquí solo interesa el día. */
function soloFecha(fecha: string): string {
  return fecha.slice(0, 10)
}

export function MisCitasPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<PaginaCitas>('/citas')
      setCitas(data.data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function cancelar(cita: Cita) {
    if (!confirm('¿Seguro que quieres cancelar esta cita?')) return
    setCancelandoId(cita.id)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/cancelar`)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCancelandoId(null)
    }
  }

  if (cargando) return <Spinner etiqueta="Cargando tus citas…" />

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-text">Mis citas</h1>

      {error && <Alerta tipo="error" mensaje={error} />}

      {citas.length === 0 ? (
        <div className="tarjeta flex flex-col items-center gap-4 p-10 text-center">
          <ImagenPlaceholder etiqueta="Ilustración" className="h-28 w-28" />
          <div>
            <p className="font-medium text-text">Todavía no tienes citas reservadas.</p>
            <p className="mt-1 text-sm text-text-muted">Elige un servicio y un barbero para agendar tu primera visita.</p>
          </div>
          <Link to="/reservar" className="btn-principal">
            Reservar una cita
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {citas.map((cita) => (
            <li key={cita.id} className="tarjeta p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ImagenPlaceholder src={cita.barbero?.foto} variante="avatar" etiqueta="Foto" className="h-11 w-11 shrink-0" />
                  <div>
                    <p className="font-semibold text-text">
                      {soloFecha(cita.fecha)} · {cita.hora_inicio.slice(0, 5)}
                    </p>
                    <p className="text-sm text-text-muted">
                      con {cita.barbero?.user.nombres} {cita.barbero?.user.apellidos}
                    </p>
                    <p className="mt-1 text-sm text-text">
                      {cita.detalles?.map((d) => d.servicio?.nombre).filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                <EstadoBadge estado={cita.estado} />
              </div>

              {cita.estado === 'confirmada' && (
                <div className="mt-4 border-t pt-3">
                  <button onClick={() => cancelar(cita)} disabled={cancelandoId === cita.id} className="btn-texto">
                    {cancelandoId === cita.id ? 'Cancelando…' : 'Cancelar cita'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
