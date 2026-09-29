import { IconEstrella } from './Icons'

/** Muestra una calificación (0-5, admite decimales) como estrellas; el texto alternativo la dice en palabras. */
export function Estrellas({ valor, className = 'h-4 w-4' }: { valor: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-star" role="img" aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="relative inline-block">
          <IconEstrella llena={false} className={`${className} text-border-strong`} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, valor - (n - 1))) * 100}%` }}>
            <IconEstrella className={className} />
          </span>
        </span>
      ))}
    </span>
  )
}

/** Promedio + cantidad de opiniones, o un texto neutro si todavía no hay. */
export function ResumenValoracion({ promedio, total }: { promedio?: number | string | null; total?: number }) {
  if (!total || promedio == null) {
    return <span className="text-xs text-text-faint">Sin valoraciones todavía</span>
  }
  const valor = Number(promedio)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <Estrellas valor={valor} className="h-3.5 w-3.5" />
      <span className="font-medium text-text">{valor.toFixed(1)}</span>
      <span>({total})</span>
    </span>
  )
}

const ETIQUETAS = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

/** Selector accesible de 1 a 5 estrellas (grupo de radios: flechas del teclado y lectores de pantalla). */
export function SelectorEstrellas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div role="radiogroup" aria-label="Calificación" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${ETIQUETAS[n - 1]}`}
            tabIndex={valor === n || (valor === 0 && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(5, (valor || 0) + 1))
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, (valor || 2) - 1))
            }}
            className="rounded p-1 text-star transition-transform hover:scale-110"
          >
            <IconEstrella llena={n <= valor} className="h-8 w-8" />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm text-text-muted" aria-live="polite">
        {valor ? ETIQUETAS[valor - 1] : 'Toca una estrella para calificar'}
      </p>
    </div>
  )
}
