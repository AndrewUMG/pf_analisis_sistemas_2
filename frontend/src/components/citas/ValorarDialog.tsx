import { useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../Alerta'
import { Modal } from '../Modal'
import { SelectorEstrellas } from '../Estrellas'
import { formatoFechaLarga, soloFecha } from '../../utils/fechas'
import type { Cita } from '../../types'

export function ValorarDialog({ cita, onClose, onDone }: { cita: Cita; onClose: () => void; onDone: (mensaje: string) => void }) {
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function enviar() {
    setEnviando(true)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/valorar`, { calificacion, comentario: comentario.trim() || undefined })
      onDone('¡Gracias por tu opinión! Nos ayuda a mejorar.')
    } catch (e) {
      setError(mensajeError(e))
      setEnviando(false)
    }
  }

  return (
    <Modal
      titulo="¿Cómo te fue?"
      descripcion={`Tu cita con ${cita.barbero?.user.nombres ?? 'tu barbero'} del ${formatoFechaLarga(soloFecha(cita.fecha))}.`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error" mensaje={error} />}
        <SelectorEstrellas valor={calificacion} onChange={setCalificacion} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text">Comentario (opcional)</span>
          <textarea
            className="campo"
            rows={3}
            maxLength={500}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cuéntanos qué te gustó o qué podemos mejorar. Solo lo ve el administrador."
          />
        </label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={enviando} className="btn-secundario">
            Ahora no
          </button>
          <button type="button" onClick={enviar} disabled={calificacion === 0 || enviando} className="btn-principal">
            {enviando ? 'Enviando…' : 'Enviar valoración'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
