import { ImagenPlaceholder } from '../ImagenPlaceholder'
import { formatoFechaLarga } from '../../utils/fechas'
import type { Barbero, Servicio } from '../../types'

export interface DatosResumen {
  servicios: Servicio[]
  barbero: Barbero | null
  fecha: string | null
  hora: string | null
}

export const totalDe = (servicios: Servicio[]) => servicios.reduce((s, x) => s + Number(x.precio), 0)
export const duracionDe = (servicios: Servicio[]) => servicios.reduce((s, x) => s + x.duracion_minutos, 0)

/** Resumen vivo de la reserva: se va completando a medida que el cliente avanza. */
export function ResumenReserva({ servicios, barbero, fecha, hora }: DatosResumen) {
  const total = totalDe(servicios)

  return (
    <div className="tarjeta p-5">
      <h2 className="font-serif text-lg font-semibold text-text">Tu reserva</h2>

      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">Servicios</dt>
          <dd className="mt-1.5">
            {servicios.length === 0 ? (
              <span className="text-text-faint">Aún no eliges servicios</span>
            ) : (
              <ul className="space-y-1.5">
                {servicios.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3">
                    <span className="text-text">{s.nombre}</span>
                    <span className="shrink-0 text-text-muted">Q{Number(s.precio).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>

        <div className="border-t pt-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">Barbero</dt>
          <dd className="mt-1.5">
            {barbero ? (
              <span className="flex items-center gap-2.5 text-text">
                <ImagenPlaceholder src={barbero.foto} variante="avatar" etiqueta={barbero.user.nombres} className="h-8 w-8 shrink-0" />
                {barbero.user.nombres} {barbero.user.apellidos}
              </span>
            ) : (
              <span className="text-text-faint">Por elegir</span>
            )}
          </dd>
        </div>

        <div className="border-t pt-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">Fecha y hora</dt>
          <dd className="mt-1.5 text-text">
            {fecha && hora ? (
              <>
                <span className="capitalize">{formatoFechaLarga(fecha)}</span> · {hora}
              </>
            ) : (
              <span className="text-text-faint">Por elegir</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-end justify-between border-t pt-4">
        <div>
          <p className="text-xs text-text-muted">Total estimado</p>
          {servicios.length > 0 && <p className="text-xs text-text-muted">{duracionDe(servicios)} min de servicio</p>}
        </div>
        <p className="font-serif text-3xl font-semibold text-accent-hover">Q{total.toFixed(2)}</p>
      </div>
    </div>
  )
}
