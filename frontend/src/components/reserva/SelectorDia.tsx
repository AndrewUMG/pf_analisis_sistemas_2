import { useMemo } from 'react'
import { hoyLocalISO } from '../../utils/fechas'

const DIAS_VISIBLES = 14

/** Tira horizontal de los próximos 14 días (más rápido y táctil que un input de fecha). */
export function SelectorDia({ valor, onChange }: { valor: string; onChange: (iso: string) => void }) {
  const dias = useMemo(() => {
    const [a, m, d] = hoyLocalISO().split('-').map(Number)
    return Array.from({ length: DIAS_VISIBLES }, (_, i) => {
      const fecha = new Date(a, m - 1, d + i)
      const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
      return {
        iso,
        semana: i === 0 ? 'Hoy' : fecha.toLocaleDateString('es-GT', { weekday: 'short' }).replace('.', ''),
        numero: fecha.getDate(),
        mes: fecha.toLocaleDateString('es-GT', { month: 'short' }).replace('.', ''),
      }
    })
  }, [])

  return (
    <div role="radiogroup" aria-label="Día de la cita" className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {dias.map((d) => {
        const activo = d.iso === valor
        return (
          <button
            key={d.iso}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(d.iso)}
            className="flex w-[4.25rem] shrink-0 snap-start flex-col items-center rounded-xl border px-2 py-3 transition-all"
            style={{
              backgroundColor: activo ? 'var(--color-brand)' : 'var(--color-surface)',
              color: activo ? 'var(--color-text-on-brand)' : 'var(--color-text)',
              borderColor: activo ? 'var(--color-brand)' : 'var(--color-border-strong)',
              boxShadow: activo ? 'var(--shadow-raised)' : undefined,
            }}
          >
            <span className="text-xs font-medium capitalize opacity-80">{d.semana}</span>
            <span className="my-0.5 font-serif text-2xl font-semibold leading-none">{d.numero}</span>
            <span className="text-xs uppercase opacity-80">{d.mes}</span>
          </button>
        )
      })}
    </div>
  )
}
