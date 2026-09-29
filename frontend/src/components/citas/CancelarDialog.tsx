import { useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../Alerta'
import { Modal } from '../Modal'
import { formatoFechaLarga, formatoHora, soloFecha } from '../../utils/fechas'
import type { Cita } from '../../types'

export function CancelarDialog({
  cita,
  onClose,
  onDone,
}: {
  cita: Cita
  onClose: () => void
  onDone: (mensaje: string) => void
}) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    setEnviando(true)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/cancelar`, { motivo: motivo.trim() || undefined })
      onDone('Tu cita fue cancelada. El horario quedó libre para otros clientes.')
    } catch (e) {
      setError(mensajeError(e))
      setEnviando(false)
    }
  }

  return (
    <Modal
      titulo="¿Cancelar esta cita?"
      descripcion={`${formatoFechaLarga(soloFecha(cita.fecha))} a las ${formatoHora(cita.hora_inicio)} con ${cita.barbero?.user.nombres ?? 'tu barbero'}.`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error" mensaje={error} />}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text">Motivo (opcional)</span>
          <textarea
            className="campo"
            rows={3}
            maxLength={255}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Cuéntanos qué pasó; nos ayuda a mejorar."
          />
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={enviando} className="btn-secundario">
            Mantener mi cita
          </button>
          <button type="button" onClick={confirmar} disabled={enviando} className="btn-peligro">
            {enviando ? 'Cancelando…' : 'Sí, cancelar cita'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
