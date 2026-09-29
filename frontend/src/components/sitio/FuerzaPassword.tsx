import { IconCheck } from '../Icons'

const REGLAS = [
  { texto: 'Mínimo 8 caracteres', cumple: (p: string) => p.length >= 8 },
  { texto: 'Una mayúscula y una minúscula', cumple: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { texto: 'Un número', cumple: (p: string) => /\d/.test(p) },
]

const NIVELES = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte']

/** Medidor de contraseña: barras + texto + lista de reglas (no depende solo del color). */
export function FuerzaPassword({ valor }: { valor: string }) {
  if (!valor) return null
  const cumplidas = REGLAS.filter((r) => r.cumple(valor)).length
  const nivel = valor.length >= 12 && cumplidas === REGLAS.length ? 3 : cumplidas
  const colores = ['var(--color-danger)', 'var(--color-danger)', 'var(--color-accent-strong)', 'var(--color-success)']

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ backgroundColor: i <= nivel ? colores[nivel] : 'var(--color-border-strong)' }} />
          ))}
        </div>
        <span className="w-20 text-right text-xs font-medium text-text-muted">{NIVELES[nivel]}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {REGLAS.map((r) => {
          const ok = r.cumple(valor)
          return (
            <li key={r.texto} className="flex items-center gap-2 text-xs" style={{ color: ok ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              {ok ? <IconCheck className="h-3.5 w-3.5" /> : <span className="grid h-3.5 w-3.5 place-items-center" aria-hidden="true">•</span>}
              <span>
                {r.texto}
                <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
