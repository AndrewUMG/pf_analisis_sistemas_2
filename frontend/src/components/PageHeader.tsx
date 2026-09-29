import type { ReactNode } from 'react'

/** Encabezado de página (público y de paneles): título serif, descripción y acción a la derecha. */
export function PageHeader({ titulo, descripcion, accion, eyebrow, nivel = 1 }: { titulo: string; descripcion?: string; accion?: ReactNode; eyebrow?: string; nivel?: 1 | 2 }) {
  const Titulo = nivel === 1 ? 'h1' : 'h2'
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <Titulo className="text-[clamp(1.6rem,3vw,2.25rem)] font-semibold leading-tight text-text">{titulo}</Titulo>
        {descripcion && <p className="mt-1.5 max-w-2xl text-sm text-text-muted sm:text-base">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}
