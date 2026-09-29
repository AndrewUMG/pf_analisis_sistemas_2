import { IconTijeras } from './Icons'

/** Monograma (tijeras sobre verde bosque) + wordmark serif. `soloMarca` para espacios reducidos. */
export function Logo({ soloMarca = false, invertido = false, className = '' }: { soloMarca?: boolean; invertido?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.65rem] shadow-sm"
        style={{ backgroundColor: invertido ? 'var(--color-accent)' : 'var(--color-brand)', color: invertido ? 'var(--color-text-on-accent)' : 'var(--color-accent)' }}
      >
        <IconTijeras className="h-[1.15rem] w-[1.15rem]" />
      </span>
      {!soloMarca && (
        <span className="leading-none">
          <span className="block font-serif text-lg font-semibold tracking-tight" style={{ color: invertido ? 'var(--color-text-on-brand)' : 'var(--color-text)' }}>
            Studio La Barber
          </span>
          <span className="mt-0.5 block text-[0.62rem] font-semibold uppercase tracking-[0.28em]" style={{ color: invertido ? 'var(--color-accent)' : 'var(--color-accent-hover)' }}>
            Barbería
          </span>
        </span>
      )}
    </span>
  )
}
