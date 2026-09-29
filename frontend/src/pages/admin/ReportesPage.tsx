import { useEffect, useMemo, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { PageHeader } from '../../components/PageHeader'
import { Tabs } from '../../components/Tabs'
import { BotonCsv } from '../../components/BotonCsv'
import { Modal } from '../../components/Modal'
import { FilasSkeleton, Skeleton } from '../../components/Skeleton'
import { Barra, EstadoVacio, Panel, StatCard } from '../../components/panel/Piezas'
import { IconCalendario, IconCampana, IconEstrella, IconGrafica, IconPersonas, IconTijeras } from '../../components/Icons'
import { useReporte } from '../../hooks/useReporte'
import { hoyLocalISO } from '../../utils/fechas'
import { HorasPicoVista } from './HorasPicoVista'
import type { PaginaVentas, ReporteCancelaciones, ReporteComisiones, ReporteIngresos, ReporteServiciosDemandados, Venta } from '../../types'

type Pestana = 'ingresos' | 'servicios' | 'comisiones' | 'cancelaciones' | 'horas' | 'ventas'
type Vista = { desde: string; hasta: string; onError: (m: string) => void }

const quetzales = (n: number | string) => `Q${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function hace30Dias(): string {
  const [a, m, d] = hoyLocalISO().split('-').map(Number)
  const f = new Date(a, m - 1, d - 30)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

function CargandoReporte() {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando reporte">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export function ReportesPage() {
  const [pestana, setPestana] = useState<Pestana>('ingresos')
  const [desde, setDesde] = useState(hace30Dias())
  const [hasta, setHasta] = useState(hoyLocalISO())
  const [error, setError] = useState('')

  return (
    <div>
      <PageHeader
        eyebrow="Análisis"
        titulo="Reportes"
        descripcion="Indicadores gerenciales del negocio."
        accion={
          <fieldset className="flex items-center gap-2 text-sm">
            <legend className="sr-only">Rango de fechas</legend>
            <input aria-label="Desde" type="date" className="campo w-auto" value={desde} max={hasta} onChange={(e) => e.target.value && setDesde(e.target.value)} />
            <span className="text-text-muted">a</span>
            <input aria-label="Hasta" type="date" className="campo w-auto" value={hasta} min={desde} onChange={(e) => e.target.value && setHasta(e.target.value)} />
          </fieldset>
        }
      />

      <Tabs
        pestanas={[
          { valor: 'ingresos', etiqueta: 'Ingresos' },
          { valor: 'servicios', etiqueta: 'Servicios' },
          { valor: 'comisiones', etiqueta: 'Comisiones' },
          { valor: 'cancelaciones', etiqueta: 'Cancelaciones' },
          { valor: 'horas', etiqueta: 'Horas pico' },
          { valor: 'ventas', etiqueta: 'Ventas' },
        ]}
        activa={pestana}
        onChange={setPestana}
      />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {pestana === 'ingresos' && <IngresosVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'servicios' && <ServiciosVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'comisiones' && <ComisionesVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'cancelaciones' && <CancelacionesVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'horas' && <HorasPicoVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'ventas' && <VentasVista onError={setError} />}
    </div>
  )
}

/** Ingresos: KPIs + gráfica de columnas (serie temporal) con el mejor día resaltado. */
function IngresosVista({ desde, hasta, onError }: Vista) {
  const { datos, cargando } = useReporte<ReporteIngresos>('/reportes/ingresos', desde, hasta, onError)
  if (cargando) return <CargandoReporte />
  if (!datos) return null

  const dias = datos.por_dia.map((d) => ({ fecha: d.fecha, total: Number(d.total) }))
  const maximo = Math.max(1, ...dias.map((d) => d.total))
  const mejor = dias.reduce((m, d) => (d.total > m.total ? d : m), dias[0] ?? { fecha: '', total: 0 })
  const promedio = dias.length ? Number(datos.total_periodo) / dias.length : 0
  const cadaN = Math.ceil(dias.length / 8) || 1

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Total del período" valor={quetzales(datos.total_periodo)} icono={IconGrafica} tono="marca" />
        <StatCard etiqueta="Promedio por día con ventas" valor={quetzales(promedio)} icono={IconCalendario} tono="acento" />
        <StatCard etiqueta="Mejor día" valor={mejor.total ? quetzales(mejor.total) : '—'} ayuda={mejor.fecha} icono={IconEstrella} tono="exito" />
      </div>

      <Panel
        titulo="Ingresos por día"
        accion={<BotonCsv nombre={`ingresos_${desde}_${hasta}.csv`} deshabilitado={dias.length === 0} filas={[['Fecha', 'Total (Q)'], ...dias.map((d) => [d.fecha, d.total.toFixed(2)])]} />}
      >
        {dias.length === 0 ? (
          <EstadoVacio icono={IconGrafica} titulo="Sin ventas en este rango" texto="Cuando se registren cobros en caja aparecerán aquí." />
        ) : (
          <figure>
            <div className="flex h-56 items-end gap-1.5 border-b pb-px" role="img" aria-label={`Ingresos diarios; el mejor día fue ${mejor.fecha} con ${quetzales(mejor.total)}`}>
              {dias.map((d) => (
                <div key={d.fecha} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.fecha}: ${quetzales(d.total)}`}>
                  <span className="mb-1 hidden text-center text-[0.65rem] font-medium text-text group-hover:block">{quetzales(d.total)}</span>
                  <span
                    className="block w-full rounded-t-md transition-[height] duration-500"
                    style={{ height: `${Math.max(3, (d.total / maximo) * 100)}%`, backgroundColor: d.fecha === mejor.fecha ? 'var(--color-brand)' : 'var(--color-accent)' }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 text-[0.7rem] text-text-muted" aria-hidden="true">
              {dias.map((d, i) => (
                <span key={d.fecha} className="flex-1 text-center">
                  {i % cadaN === 0 ? d.fecha.slice(8) + '/' + d.fecha.slice(5, 7) : ''}
                </span>
              ))}
            </div>
            <figcaption className="mt-3 text-xs text-text-muted">
              <span className="mr-4 inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-brand)' }} /> Mejor día</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-accent)' }} /> Otros días</span>
            </figcaption>
          </figure>
        )}
      </Panel>
    </div>
  )
}

/** Servicios: ranking horizontal (comparación entre categorías) con etiquetas directas. */
function ServiciosVista({ desde, hasta, onError }: Vista) {
  const { datos, cargando } = useReporte<ReporteServiciosDemandados>('/reportes/servicios-mas-demandados', desde, hasta, onError)
  if (cargando) return <CargandoReporte />
  if (!datos) return null

  const total = datos.servicios.reduce((s, x) => s + x.veces_solicitado, 0)
  const maximo = Math.max(1, ...datos.servicios.map((s) => s.veces_solicitado))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard etiqueta="Servicios solicitados" valor={total} icono={IconTijeras} tono="marca" />
        <StatCard etiqueta="Más popular" valor={datos.servicios[0]?.nombre ?? '—'} ayuda={datos.servicios[0] ? `${datos.servicios[0].veces_solicitado} veces` : undefined} icono={IconEstrella} tono="acento" />
      </div>
      <Panel titulo="Ranking de servicios" accion={<BotonCsv nombre={`servicios_${desde}_${hasta}.csv`} deshabilitado={!datos.servicios.length} filas={[['Servicio', 'Veces solicitado'], ...datos.servicios.map((s) => [s.nombre, s.veces_solicitado])]} />}>
        {datos.servicios.length === 0 ? (
          <EstadoVacio icono={IconTijeras} titulo="Sin datos en este rango" />
        ) : (
          <ol className="space-y-4">
            {datos.servicios.map((s, i) => (
              <li key={s.nombre} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1.5">
                <span className="font-serif text-lg font-semibold text-text-faint">{i + 1}</span>
                <span className="font-medium text-text">{s.nombre}</span>
                <span className="text-sm font-semibold text-text">{s.veces_solicitado}</span>
                <span />
                <Barra valor={s.veces_solicitado} maximo={maximo} etiqueta={s.nombre} color={i === 0 ? 'var(--color-brand)' : 'var(--color-accent)'} />
                <span />
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  )
}

function ComisionesVista({ desde, hasta, onError }: Vista) {
  const { datos, cargando } = useReporte<ReporteComisiones>('/reportes/comisiones-por-barbero', desde, hasta, onError)
  if (cargando) return <CargandoReporte />
  if (!datos) return null

  const total = datos.comisiones.reduce((s, c) => s + Number(c.comision_total), 0)
  const maximo = Math.max(1, ...datos.comisiones.map((c) => Number(c.comision_total)))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard etiqueta="Comisiones del período" valor={quetzales(total)} icono={IconPersonas} tono="marca" />
        <StatCard etiqueta="Servicios cobrados" valor={datos.comisiones.reduce((s, c) => s + c.servicios_cobrados, 0)} icono={IconTijeras} tono="acento" />
      </div>
      <Panel titulo="Comisión por barbero" accion={<BotonCsv nombre={`comisiones_${desde}_${hasta}.csv`} deshabilitado={!datos.comisiones.length} filas={[['Barbero', 'Servicios cobrados', 'Comisión (Q)'], ...datos.comisiones.map((c) => [c.barbero, c.servicios_cobrados, Number(c.comision_total).toFixed(2)])]} />}>
        {datos.comisiones.length === 0 ? (
          <EstadoVacio icono={IconPersonas} titulo="Sin comisiones en este rango" texto="Se generan al cobrar citas completadas." />
        ) : (
          <ul className="space-y-5">
            {datos.comisiones.map((c) => (
              <li key={c.barbero_id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-text">{c.barbero}</span>
                  <span className="font-serif text-xl font-semibold text-accent-hover">{quetzales(c.comision_total)}</span>
                </div>
                <div className="mt-1.5">
                  <Barra valor={Number(c.comision_total)} maximo={maximo} etiqueta={`Comisión de ${c.barbero}`} />
                </div>
                <p className="mt-1 text-xs text-text-muted">{c.servicios_cobrados} servicios cobrados</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

const ESTADOS_LABEL: Record<string, { etiqueta: string; color: string }> = {
  confirmada: { etiqueta: 'Confirmadas', color: 'var(--color-info)' },
  en_atencion: { etiqueta: 'En atención', color: 'var(--color-accent-strong)' },
  completada: { etiqueta: 'Completadas', color: 'var(--color-success)' },
  cancelada: { etiqueta: 'Canceladas', color: 'var(--color-danger)' },
  ausente: { etiqueta: 'Ausentes', color: 'var(--color-text-faint)' },
}

function CancelacionesVista({ desde, hasta, onError }: Vista) {
  const { datos, cargando } = useReporte<ReporteCancelaciones>('/reportes/cancelaciones-ausentismo', desde, hasta, onError)
  if (cargando) return <CargandoReporte />
  if (!datos) return null

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Citas en el rango" valor={datos.total_citas} icono={IconCalendario} tono="marca" />
        <StatCard etiqueta="Canceladas" valor={`${datos.porcentaje_canceladas}%`} icono={IconCampana} tono="peligro" />
        <StatCard etiqueta="Ausentismo" valor={`${datos.porcentaje_ausentes}%`} icono={IconPersonas} tono="acento" />
      </div>
      <Panel titulo="Citas por estado">
        {datos.total_citas === 0 ? (
          <EstadoVacio icono={IconCalendario} titulo="Sin citas en este rango" />
        ) : (
          <ul className="space-y-4">
            {Object.entries(datos.por_estado).map(([estado, n]) => (
              <li key={estado} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className="text-text">{ESTADOS_LABEL[estado]?.etiqueta ?? estado}</span>
                <Barra valor={n} maximo={datos.total_citas} etiqueta={ESTADOS_LABEL[estado]?.etiqueta ?? estado} color={ESTADOS_LABEL[estado]?.color} />
                <span className="text-right font-semibold text-text">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function VentasVista({ onError }: Pick<Vista, 'onError'>) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [anulandoId, setAnulandoId] = useState<number | null>(null)
  const [aAnular, setAAnular] = useState<Venta | null>(null)

  async function cargar() {
    try {
      const { data } = await api.get<PaginaVentas>('/ventas')
      setVentas(data.data)
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function anular(venta: Venta) {
    setAnulandoId(venta.id)
    onError('')
    try {
      await api.post(`/ventas/${venta.id}/anular`)
      setAAnular(null)
      await cargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setAnulandoId(null)
    }
  }

  const activas = useMemo(() => ventas.filter((v) => v.estado !== 'anulada'), [ventas])

  if (cargando) return <FilasSkeleton cantidad={4} />

  return (
    <Panel titulo="Ventas recientes" descripcion={`${activas.length} activas de ${ventas.length}`}>
      {ventas.length === 0 ? (
        <EstadoVacio icono={IconGrafica} titulo="Todavía no hay ventas" texto="Los cobros de caja aparecerán aquí." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-text-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">Recibo</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Cliente</th>
                <th scope="col" className="hidden py-2 pr-4 font-semibold sm:table-cell">Pago</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Total</th>
                <th scope="col" className="py-2 text-right font-semibold"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ventas.map((v) => (
                <tr key={v.id} className={v.estado === 'anulada' ? 'opacity-60' : ''}>
                  <td className="py-3 pr-4 font-medium text-text">
                    {v.numero_recibo}
                    {v.estado === 'anulada' && <span className="badge ml-2" style={{ backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}>Anulada</span>}
                  </td>
                  <td className="py-3 pr-4 text-text-muted">{v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos}` : 'Venta directa'}</td>
                  <td className="hidden py-3 pr-4 capitalize text-text-muted sm:table-cell">{v.metodo_pago}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-text">{quetzales(v.total)}</td>
                  <td className="py-3 text-right">
                    {v.estado !== 'anulada' && (
                      <button onClick={() => setAAnular(v)} className="btn-texto text-xs">
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aAnular && <ConfirmarAnulacion venta={aAnular} trabajando={anulandoId === aAnular.id} onCancel={() => setAAnular(null)} onConfirm={() => anular(aAnular)} />}
    </Panel>
  )
}


function ConfirmarAnulacion({ venta, trabajando, onCancel, onConfirm }: { venta: Venta; trabajando: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal titulo={`¿Anular el recibo ${venta.numero_recibo}?`} descripcion="Se revertirán las existencias de los productos vendidos. Esta acción no se puede deshacer." onClose={onCancel}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={trabajando} className="btn-secundario">
          Conservar venta
        </button>
        <button type="button" onClick={onConfirm} disabled={trabajando} className="btn-peligro">
          {trabajando ? 'Anulando…' : 'Sí, anular'}
        </button>
      </div>
    </Modal>
  )
}
