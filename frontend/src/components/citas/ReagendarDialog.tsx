import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../Alerta'
import { Modal } from '../Modal'
import { Spinner } from '../Spinner'
import { formatoFechaLarga, formatoHora, hoyLocalISO, soloFecha } from '../../utils/fechas'
import type { Cita } from '../../types'

export function ReagendarDialog({
  cita,
  onClose,
  onDone,
}: {
  cita: Cita
  onClose: () => void
  onDone: (mensaje: string) => void
}) {
  const fechaActual = soloFecha(cita.fecha)
  const horaActual = formatoHora(cita.hora_inicio)

  const [fecha, setFecha] = useState(fechaActual < hoyLocalISO() ? hoyLocalISO() : fechaActual)
  const [franjas, setFranjas] = useState<string[]>([])
  const [hora, setHora] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  // Se piden las franjas con los mismos servicios de la cita y excluyendo la propia
  // cita, para que su horario actual aparezca como libre si el cliente solo lo desplaza.
  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError('')
    setHora(null)
    api
      .get(`/barberos/${cita.barbero_id}/disponibilidad`, {
        params: {
          fecha,
          servicio_ids: (cita.detalles ?? []).map((d) => d.servicio_id),
          excluir_cita_id: cita.id,
        },
      })
      .then((r) => vigente && setFranjas(r.data.franjas_disponibles))
      .catch((e) => {
        if (!vigente) return
        setFranjas([])
        setError(mensajeError(e))
      })
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [fecha, cita.id, cita.barbero_id, cita.detalles])

  const sinCambios = hora === horaActual && fecha === fechaActual

  async function confirmar() {
    if (!hora) return
    setEnviando(true)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/reagendar`, { fecha, hora_inicio: hora, motivo: motivo.trim() || undefined })
      onDone(`Tu cita se movió al ${formatoFechaLarga(fecha)} a las ${hora}.`)
    } catch (e) {
      setError(mensajeError(e))
      setEnviando(false)
    }
  }

  return (
    <Modal
      titulo="Reagendar cita"
      descripcion={`Ahora: ${formatoFechaLarga(fechaActual)} a las ${horaActual} con ${cita.barbero?.user.nombres ?? 'tu barbero'}. Elige un nuevo horario; conservas los mismos servicios.`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error" mensaje={error} />}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text">Nueva fecha</span>
          <input type="date" className="campo" min={hoyLocalISO()} value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </label>

        <div aria-live="polite">
          <span className="mb-2 block text-sm font-medium text-text">Horarios disponibles</span>
          {cargando ? (
            <Spinner etiqueta="Buscando horarios…" />
          ) : franjas.length === 0 ? (
            <p className="rounded-lg bg-bg-subtle p-3 text-sm text-text-muted">No hay horarios disponibles ese día. Prueba con otra fecha.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {franjas.map((franja) => (
                <button
                  key={franja}
                  type="button"
                  aria-pressed={hora === franja}
                  onClick={() => setHora(franja)}
                  className={`rounded-lg border py-2 text-sm transition-colors ${
                    hora === franja ? 'border-accent bg-accent-soft font-medium text-accent-hover' : 'bg-surface text-text hover:border-border-strong'
                  }`}
                >
                  {franja}
                </button>
              ))}
            </div>
          )}
        </div>

        {hora && (
          <p className="rounded-lg bg-accent-soft p-3 text-sm text-text">
            Nueva cita: <strong>{formatoFechaLarga(fecha)}</strong> a las <strong>{hora}</strong>
          </p>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text">Motivo del cambio (opcional)</span>
          <input className="campo" maxLength={255} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={enviando} className="btn-secundario">
            Volver
          </button>
          <button type="button" onClick={confirmar} disabled={!hora || sinCambios || enviando} className="btn-principal">
            {enviando ? 'Reagendando…' : 'Confirmar nuevo horario'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
