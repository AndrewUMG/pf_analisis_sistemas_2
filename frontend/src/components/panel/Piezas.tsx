import type { ComponentType, ReactNode } from 'react'

type Icono = ComponentType<{ className?: string }>

/** Tarjeta de indicador (KPI) para la parte superior de los paneles. */
export function StatCard({ etiqueta, valor, ayuda, icono: Icono, tono = 'marca' }: { etiqueta: string; valor: ReactNode; ayuda?: string; icono?: Icono; tono?: 'marca' | 'acento' | 'exito' | 'peligro' | 'info' }) {
  const colores = {
    marca: ['color-mix(in srgb, var(--color-brand) 12%, transparent)', 'var(--color-brand)'],
    acento: ['var(--color-accent-soft)', 'var(--color-accent-hover)'],
    exito: ['var(--color-success-soft)', 'var(--color-success)'],
    peligro: ['var(--color-danger-soft)', 'var(--color-danger)'],
    info: ['var(--color-info-soft)', 'var(--color-info)'],
  }[tono]

  return (
    <div className="tarjeta flex items-start gap-4 p-5">
      {Icono && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: colores[0], color: colores[1] }}>
          <Icono className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm text-text-muted">{etiqueta}</p>
        <p className="font-serif text-3xl font-semibold leading-tight text-text">{valor}</p>
        {ayuda && <p className="mt-0.5 text-xs text-text-muted">{ayuda}</p>}
      </div>
    </div>
  )
}

/** Contenedor de sección con título opcional y acción. */
export function Panel({ titulo, descripcion, accion, children, className = '' }: { titulo?: string; descripcion?: string; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`tarjeta ${className}`}>
      {(titulo || accion) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            {titulo && <h2 className="text-lg font-semibold text-text">{titulo}</h2>}
            {descripcion && <p className="text-sm text-text-muted">{descripcion}</p>}
          </div>
          {accion}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

/** Estado vacío con mensaje claro y una acción sugerida. */
export function EstadoVacio({ icono: Icono, titulo, texto, accion }: { icono?: Icono; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center" style={{ borderColor: 'var(--color-border-strong)' }}>
      {Icono && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-bg-subtle text-text-muted">
          <Icono className="h-6 w-6" />
        </span>
      )}
      <p className="font-serif text-lg font-semibold text-text">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-text-muted">{texto}</p>}
      {accion}
    </div>
  )
}

/** Paginación anterior/siguiente con contador. */
export function Paginacion({ pagina, ultima, onCambio }: { pagina: number; ultima: number; onCambio: (p: number) => void }) {
  if (ultima <= 1) return null
  return (
    <nav aria-label="Paginación" className="mt-5 flex items-center justify-between">
      <button className="btn-secundario" disabled={pagina <= 1} onClick={() => onCambio(pagina - 1)}>
        Anterior
      </button>
      <span className="text-sm text-text-muted">
        Página {pagina} de {ultima}
      </span>
      <button className="btn-secundario" disabled={pagina >= ultima} onClick={() => onCambio(pagina + 1)}>
        Siguiente
      </button>
    </nav>
  )
}

/** Barra de progreso horizontal accesible (uso: stock, distribución de estrellas, reportes). */
export function Barra({ valor, maximo, color = 'var(--color-accent-strong)', etiqueta }: { valor: number; maximo: number; color?: string; etiqueta: string }) {
  const pct = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-neutral-soft" role="meter" aria-label={etiqueta} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={maximo}>
      <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </span>
  )
}
