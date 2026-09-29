import { IconCheck } from '../Icons'

/** Indicador de progreso del wizard: círculos numerados unidos por una línea; el paso actual lleva aria-current. */
export function Pasos({ etiquetas, actual }: { etiquetas: readonly string[]; actual: number }) {
  return (
    <nav aria-label="Progreso de la reserva">
      <ol className="flex items-center">
        {etiquetas.map((etiqueta, i) => {
          const hecho = i < actual
          const activo = i === actual
          return (
            <li key={etiqueta} className={`flex items-center ${i < etiquetas.length - 1 ? 'flex-1' : ''}`} aria-current={activo ? 'step' : undefined}>
              <span className="flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: hecho ? 'var(--color-brand)' : activo ? 'var(--color-accent)' : 'var(--color-neutral-soft)',
                    color: hecho ? 'var(--color-text-on-brand)' : activo ? 'var(--color-text-on-accent)' : 'var(--color-text-muted)',
                  }}
                >
                  {hecho ? <IconCheck className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`text-sm font-medium ${activo ? 'text-text' : 'hidden text-text-muted sm:inline'}`}>{etiqueta}</span>
              </span>
              {i < etiquetas.length - 1 && (
                <span className="mx-3 h-0.5 flex-1 rounded-full" style={{ backgroundColor: hecho ? 'var(--color-brand)' : 'var(--color-border-strong)' }} aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
