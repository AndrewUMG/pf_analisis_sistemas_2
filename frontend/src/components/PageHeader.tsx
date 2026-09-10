import type { ReactNode } from 'react'

export function PageHeader({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-text">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-text-muted">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}
