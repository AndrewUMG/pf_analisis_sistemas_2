import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Spinner } from '../../components/Spinner'
import { BotonCsv } from '../../components/BotonCsv'
import type { ReporteHorasPico } from '../../types'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// La semana se muestra de lunes a domingo, aunque el backend numera el domingo como 0.
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0]

const rangoHora = (h: number) => `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00`

/** RF-07: mapa de calor de citas por día de la semana y hora de inicio. */
export function HorasPicoVista({ desde, hasta, onError }: { desde: string; hasta: string; onError: (m: string) => void }) {
  const [datos, setDatos] = useState<ReporteHorasPico | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    api
      .get<ReporteHorasPico>('/reportes/horas-pico', { params: { desde, hasta } })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => onError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta])

  if (cargando) return <Spinner etiqueta="Calculando horas pico…" />
  if (!datos) return null
  if (datos.total_citas === 0) return <p className="text-text-muted">No hay citas en este rango.</p>

  // Solo se dibujan las horas con actividad (con un margen), para no mostrar columnas vacías de madrugada.
  const conDatos = datos.por_hora.filter((h) => h.total > 0).map((h) => h.hora)
  const horas = Array.from({ length: Math.max(...conDatos) - Math.min(...conDatos) + 3 }, (_, i) => Math.max(0, Math.min(...conDatos) - 1) + i).filter((h) => h < 24)
  const maximo = Math.max(1, ...datos.matriz.flat())

  const filasCsv: (string | number)[][] = [
    ['Día', ...horas.map((h) => `${String(h).padStart(2, '0')}:00`), 'Total'],
    ...ORDEN_DIAS.map((d) => [DIAS[d], ...horas.map((h) => datos.matriz[d][h]), datos.por_dia[d].total]),
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="tarjeta p-4">
          <p className="text-sm text-text-muted">Hora pico</p>
          <p className="text-lg font-semibold text-accent-hover">{datos.hora_pico != null ? rangoHora(datos.hora_pico) : '—'}</p>
        </div>
        <div className="tarjeta p-4">
          <p className="text-sm text-text-muted">Día más ocupado</p>
          <p className="text-lg font-semibold text-accent-hover">{datos.dia_pico != null ? DIAS[datos.dia_pico] : '—'}</p>
        </div>
        <div className="tarjeta p-4">
          <p className="text-sm text-text-muted">Citas analizadas</p>
          <p className="text-lg font-semibold text-text">{datos.total_citas}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">Cuanto más oscuro el cuadro, más citas iniciaron en esa franja (no incluye canceladas).</p>
        <BotonCsv nombre={`horas-pico_${datos.rango.desde}_${datos.rango.hasta}.csv`} filas={filasCsv} />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-center text-xs">
          <caption className="sr-only">Citas por día de la semana y hora de inicio</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-left font-medium text-text-muted">Día</th>
              {horas.map((h) => (
                <th key={h} scope="col" className="min-w-9 p-2 font-medium text-text-muted">{h}h</th>
              ))}
              <th scope="col" className="p-2 font-medium text-text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN_DIAS.map((d) => (
              <tr key={d}>
                <th scope="row" className="whitespace-nowrap p-2 text-left font-medium text-text">{DIAS[d]}</th>
                {horas.map((h) => {
                  const n = datos.matriz[d][h]
                  return (
                    <td
                      key={h}
                      title={`${DIAS[d]} ${rangoHora(h)}: ${n} ${n === 1 ? 'cita' : 'citas'}`}
                      className="border-l p-2 text-text"
                      style={{ backgroundColor: n ? `color-mix(in srgb, var(--color-accent) ${Math.round((n / maximo) * 85) + 10}%, transparent)` : undefined }}
                    >
                      {n || ''}
                    </td>
                  )
                })}
                <td className="border-l p-2 font-medium text-text">{datos.por_dia[d].total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
