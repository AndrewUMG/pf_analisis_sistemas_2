import { EstadoBadge } from '../EstadoBadge'
import { Estrellas } from '../Estrellas'
import { ImagenPlaceholder } from '../ImagenPlaceholder'
import { formatoHora, partesFecha, soloFecha } from '../../utils/fechas'
import type { Cita } from '../../types'

export function CitaCard({
  cita,
  onReagendar,
  onCancelar,
  onValorar,
}: {
  cita: Cita
  onReagendar: (cita: Cita) => void
  onCancelar: (cita: Cita) => void
  onValorar: (cita: Cita) => void
}) {
  const { dia, mes } = partesFecha(soloFecha(cita.fecha))
  const barbero = cita.barbero
  const servicios = cita.detalles?.map((d) => d.servicio?.nombre).filter(Boolean).join(', ')
  const total = Number(cita.monto_estimado ?? 0)
  const horas = cita.anticipacion_minima_horas ?? 2

  return (
    <li className="tarjeta p-4 sm:p-5">
      <div className="flex gap-4">
        <div
          className="grid h-16 w-14 shrink-0 place-items-center rounded-lg bg-accent-soft text-center leading-tight"
          aria-hidden="true"
        >
          <span>
            <span className="block text-xl font-semibold text-accent-hover">{dia}</span>
            <span className="block text-xs font-medium uppercase text-text-muted">{mes}</span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-text">
              {formatoHora(cita.hora_inicio)} – {formatoHora(cita.hora_fin)}
            </p>
            <EstadoBadge estado={cita.estado} />
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <ImagenPlaceholder src={barbero?.foto} variante="avatar" etiqueta="Foto" className="h-6 w-6 shrink-0" />
            <span className="truncate">
              {barbero ? `${barbero.user.nombres} ${barbero.user.apellidos}` : 'Barbero'}
            </span>
          </div>

          <p className="mt-1 text-sm text-text">{servicios}</p>
          {total > 0 && <p className="mt-0.5 text-sm font-medium text-accent-hover">Q{total.toFixed(2)}</p>}

          {cita.estado === 'cancelada' && cita.motivo_cambio && (
            <p className="mt-2 text-xs italic text-text-faint">Motivo: {cita.motivo_cambio}</p>
          )}
        </div>
      </div>

      {cita.estado === 'completada' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          {cita.valoracion ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Estrellas valor={cita.valoracion.calificacion} />
              <span>Tu valoración</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-muted">¿Cómo fue tu visita? Tu opinión nos ayuda a mejorar.</p>
              <button type="button" onClick={() => onValorar(cita)} className="btn-secundario px-3 py-1.5 text-xs">
                Calificar servicio
              </button>
            </>
          )}
        </div>
      )}

      {cita.estado === 'confirmada' && (
        <div className="mt-4 border-t pt-3">
          {cita.puede_modificar ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-text-muted">
                Puedes reagendar o cancelar hasta {horas} {horas === 1 ? 'hora' : 'horas'} antes de la cita.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => onReagendar(cita)} className="btn-secundario px-3 py-1.5 text-xs">
                  Reagendar
                </button>
                <button type="button" onClick={() => onCancelar(cita)} className="btn-texto px-2 text-xs">
                  Cancelar cita
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Faltan menos de {horas} {horas === 1 ? 'hora' : 'horas'} para tu cita, por eso ya no se puede modificar en línea.
              Si necesitas un cambio, comunícate directamente con la barbería.
            </p>
          )}
        </div>
      )}
    </li>
  )
}
