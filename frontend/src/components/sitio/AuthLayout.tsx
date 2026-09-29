import type { ReactNode } from 'react'
import { NEGOCIO } from '../../config/negocio'
import { Contenedor } from '../Contenedor'
import { ImagenPlaceholder } from '../ImagenPlaceholder'
import { Logo } from '../Logo'
import { IconCheck } from '../Icons'

const BENEFICIOS = ['Reserva en menos de un minuto', 'Recordatorios para que no se te pase', 'Reagenda o cancela cuando lo necesites']

/** Marco de login/registro: panel de marca a la izquierda (≥ 1024 px) y formulario a la derecha. */
export function AuthLayout({ titulo, subtitulo, children, pie }: { titulo: string; subtitulo: string; children: ReactNode; pie: ReactNode }) {
  return (
    <Contenedor className="py-8 sm:py-14">
      <div className="tarjeta mx-auto grid max-w-5xl overflow-hidden lg:grid-cols-[1fr_1.05fr]" style={{ boxShadow: 'var(--shadow-float)' }}>
        <aside className="textura-rayas relative hidden flex-col justify-between overflow-hidden p-10 lg:flex" style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' }}>
          <Logo invertido />
          <div>
            <ImagenPlaceholder src={NEGOCIO.imagenes.local} etiqueta="Foto del local" className="mb-8 aspect-[4/3] w-full rounded-xl opacity-95" />
            <h2 className="font-serif text-3xl font-semibold leading-tight">{NEGOCIO.eslogan}</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {BENEFICIOS.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
                    <IconCheck className="h-3 w-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="p-6 sm:p-10">
          <h1 className="text-3xl font-semibold text-text">{titulo}</h1>
          <p className="mt-2 text-sm text-text-muted">{subtitulo}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 border-t pt-6 text-center text-sm text-text-muted">{pie}</div>
        </div>
      </div>
    </Contenedor>
  )
}
