import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ImagenPlaceholder } from '../ImagenPlaceholder'
import { IconFlecha, IconReloj } from '../Icons'
import type { Servicio } from '../../types'

export const CATEGORIAS: Record<Servicio['categoria'], string> = {
  corte: 'Cortes',
  barba: 'Barba',
  tratamiento: 'Tratamientos',
  spa_facial: 'Spa facial',
  combo: 'Combos',
}

/** Tarjeta de servicio con foto, duración, precio en serif dorado y CTA que preselecciona el servicio al reservar. */
export function ServicioCard({ servicio, indice = 0 }: { servicio: Servicio; indice?: number }) {
  return (
    <article className="tarjeta-interactiva aparecer group flex flex-col overflow-hidden" style={{ '--i': indice } as CSSProperties}>
      <div className="relative overflow-hidden">
        <ImagenPlaceholder
          src={servicio.imagen}
          etiqueta={servicio.nombre}
          className="aspect-[16/10] w-full rounded-none transition-transform duration-700 group-hover:scale-105"
        />
        <span className="badge absolute left-3 top-3 bg-bg/90 text-text shadow-sm backdrop-blur">{CATEGORIAS[servicio.categoria]}</span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold leading-snug text-text">{servicio.nombre}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-text-muted">
          {servicio.descripcion ?? 'Atención profesional con productos de calidad y el estilo que tú elijas.'}
        </p>

        <div className="mt-4 flex items-end justify-between border-t pt-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
              <IconReloj className="h-3.5 w-3.5" />
              {servicio.duracion_minutos} min
            </p>
            <p className="mt-0.5 font-serif text-2xl font-semibold text-accent-hover">Q{Number(servicio.precio).toFixed(2)}</p>
          </div>
          <Link
            to={`/reservar?servicio=${servicio.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle"
            aria-label={`Reservar ${servicio.nombre}`}
          >
            Reservar
            <IconFlecha className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
