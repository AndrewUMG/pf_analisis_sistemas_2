import type { EstadoCita } from '../types'

const TOKENS: Record<EstadoCita, { bg: string; fg: string }> = {
  confirmada: { bg: 'var(--color-info-soft)', fg: 'var(--color-info)' },
  en_atencion: { bg: 'var(--color-accent-soft)', fg: 'var(--color-accent-hover)' },
  completada: { bg: 'var(--color-success-soft)', fg: 'var(--color-success)' },
  cancelada: { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger)' },
  ausente: { bg: 'var(--color-neutral-soft)', fg: 'var(--color-text-muted)' },
}

const ETIQUETAS: Record<EstadoCita, string> = {
  confirmada: 'Confirmada',
  en_atencion: 'En atención',
  completada: 'Completada',
  cancelada: 'Cancelada',
  ausente: 'Ausente',
}

export function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const { bg, fg } = TOKENS[estado]
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      {ETIQUETAS[estado]}
    </span>
  )
}
