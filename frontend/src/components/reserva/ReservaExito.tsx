import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { NEGOCIO } from '../../config/negocio'
import { descargarIcs } from '../../utils/ics'
import { capitalizar, formatoFechaLarga, formatoHora, soloFecha } from '../../utils/fechas'
import { IconCalendario, IconCheck } from '../Icons'
import type { Cita } from '../../types'

export function ReservaExito({ cita, servicios, barbero, onOtra }: { cita: Cita; servicios: string; barbero: string; onOtra: () => void }) {
  const fecha = soloFecha(cita.fecha)

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="aparecer mx-auto grid h-20 w-20 place-items-center rounded-full" style={{ backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)' }}>
        <IconCheck className="h-10 w-10" />
      </div>
      <h1 className="aparecer mt-6 text-4xl font-semibold text-text" style={{ '--i': 1 } as CSSProperties}>
        ¡Tu cita está confirmada!
      </h1>
      <p className="mt-2 text-text-muted">Te enviamos la confirmación y te recordaremos antes de tu visita.</p>

      <div className="tarjeta mt-8 p-6 text-left">
        <p className="eyebrow">Detalle de tu cita</p>
        <p className="mt-2 font-serif text-2xl font-semibold text-text">{capitalizar(formatoFechaLarga(fecha))}</p>
        <p className="text-lg text-text">
          {formatoHora(cita.hora_inicio)} – {formatoHora(cita.hora_fin)}
        </p>
        <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Barbero</dt>
            <dd className="text-right text-text">{barbero}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Servicios</dt>
            <dd className="text-right text-text">{servicios}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Lugar</dt>
            <dd className="text-right text-text">{NEGOCIO.direccion}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/mis-citas" className="btn-principal btn-lg">
          Ver mis citas
        </Link>
        <button type="button" className="btn-secundario btn-lg" onClick={() => descargarIcs(cita, `Cita en ${NEGOCIO.nombre}`, `${servicios} con ${barbero}`, NEGOCIO.direccion)}>
          <IconCalendario className="h-5 w-5" />
          Añadir al calendario
        </button>
      </div>
      <button type="button" onClick={onOtra} className="mt-4 text-sm font-medium text-text-muted underline underline-offset-4 hover:text-text">
        Reservar otra cita
      </button>
    </div>
  )
}
