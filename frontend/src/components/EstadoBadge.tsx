import type { EstadoCita } from '../types'

const ESTILOS: Record<EstadoCita, string> = {
  confirmada: 'bg-blue-500/15 text-blue-300',
  en_atencion: 'bg-amber-500/15 text-amber-300',
  completada: 'bg-emerald-500/15 text-emerald-300',
  cancelada: 'bg-red-500/15 text-red-300',
  ausente: 'bg-carbon-700 text-carbon-300',
}

const ETIQUETAS: Record<EstadoCita, string> = {
  confirmada: 'Confirmada',
  en_atencion: 'En atención',
  completada: 'Completada',
  cancelada: 'Cancelada',
  ausente: 'Ausente',
}

export function EstadoBadge({ estado }: { estado: EstadoCita }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${ESTILOS[estado]}`}>
      {ETIQUETAS[estado]}
    </span>
  )
}
