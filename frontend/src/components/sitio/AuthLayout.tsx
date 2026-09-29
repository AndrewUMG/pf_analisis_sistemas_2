import type { ReactNode } from 'react'
import { NEGOCIO } from '../../config/negocio'
import { Contenedor } from '../Contenedor'
import { Logo } from '../Logo'
import { IconCheck } from '../Icons'

const BENEFICIOS = ['Reserva en menos de un minuto', 'Recordatorios para que no se te pase', 'Reagenda o cancela cuando lo necesites']

/** Marco de login/registro: panel de marca a la izquierda (≥ 1024 px) y formulario a la derecha. */
export function AuthLayout({ titulo, subtitulo, children, pie }: { titulo: string; subtitulo: string; children: ReactNode; pie: ReactNode }) {
  return (
    <Contenedor className="py-8 sm:py-14">
      <div className="tarjeta mx-auto grid max-w-5xl overflow-hidden lg:grid-cols-[1fr_1.1fr]" style={{ boxShadow: 'var(--shadow-float)' }}>
        <aside className="relative hidden min-h-[36rem] flex-col justify-between overflow-hidden p-12 lg:flex" style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' }}>
          {/* Fondo: foto del local (cuando exista) o patrón de marca */}
          {NEGOCIO.imagenes.local ? (
            <img src={NEGOCIO.imagenes.local} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="textura-rayas absolute inset-0" aria-hidden="true" />
          )}
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-brand) 78%, transparent) 0%, color-mix(in srgb, var(--color-brand) 35%, transparent) 40%, color-mix(in srgb, var(--color-brand) 94%, transparent) 100%)' }}
          />

          <div className="relative">
            <Logo invertido />
          </div>
          <div className="relative">
            <h2 className="font-serif text-4xl font-semibold leading-tight">{NEGOCIO.eslogan}</h2>
            <ul className="mt-8 space-y-4 text-sm">
              {BENEFICIOS.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col justify-center p-6 sm:p-12">
          <div className="textura-rayas -mx-6 -mt-6 mb-10 flex items-center justify-between gap-3 px-6 py-4 sm:-mx-12 sm:-mt-12 sm:px-12 lg:hidden" style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' }}>
            <Logo invertido />
            <p className="text-right font-serif text-sm leading-snug">{NEGOCIO.eslogan}</p>
          </div>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">{titulo}</h1>
          <p className="mt-3 text-base text-text-muted">{subtitulo}</p>
          <div className="mt-10">{children}</div>
          <div className="mt-10 border-t pt-8 text-center text-sm text-text-muted">{pie}</div>
        </div>
      </div>
    </Contenedor>
  )
}
