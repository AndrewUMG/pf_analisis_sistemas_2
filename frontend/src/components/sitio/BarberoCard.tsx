import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ImagenPlaceholder } from '../ImagenPlaceholder'
import { ResumenValoracion } from '../Estrellas'
import { IconFlecha } from '../Icons'
import type { Barbero } from '../../types'

/** Tarjeta de barbero: retrato grande, especialidad, valoración y CTA para reservar con él. */
export function BarberoCard({ barbero, indice = 0 }: { barbero: Barbero; indice?: number }) {
  return (
    <article className="tarjeta-interactiva aparecer group overflow-hidden" style={{ '--i': indice } as CSSProperties}>
      <div className="relative overflow-hidden">
        <ImagenPlaceholder src={barbero.foto} etiqueta={`Foto de ${barbero.user.nombres}`} className="aspect-[4/5] w-full rounded-none transition-transform duration-700 group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold text-text">
          {barbero.user.nombres} {barbero.user.apellidos}
        </h3>
        <p className="text-sm text-text-muted">{barbero.especialidad ?? 'Barbero profesional'}</p>
        <div className="mt-2">
          <ResumenValoracion promedio={barbero.promedio_valoracion} total={barbero.total_valoraciones} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {barbero.servicios.slice(0, 3).map((s) => (
            <span key={s.id} className="badge bg-neutral-soft text-text-muted">
              {s.nombre}
            </span>
          ))}
        </div>
        <Link to={`/reservar?barbero=${barbero.id}`} className="btn-secundario mt-4 w-full">
          Reservar con {barbero.user.nombres}
          <IconFlecha className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
