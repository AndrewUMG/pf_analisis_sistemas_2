import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import { Tabs } from '../../components/Tabs'
import type {
  PaginaVentas,
  ReporteCancelaciones,
  ReporteComisiones,
  ReporteIngresos,
  ReporteServiciosDemandados,
  Venta,
} from '../../types'

type Pestana = 'ingresos' | 'servicios' | 'comisiones' | 'cancelaciones' | 'ventas'

function hace30Dias(): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - 30)
  return fecha.toISOString().slice(0, 10)
}
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReportesPage() {
  const [pestana, setPestana] = useState<Pestana>('ingresos')
  const [desde, setDesde] = useState(hace30Dias())
  const [hasta, setHasta] = useState(hoyISO())
  const [error, setError] = useState('')

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Reportes"
        descripcion="Indicadores gerenciales del negocio."
        accion={
          <div className="flex items-center gap-2 text-sm">
            <input type="date" className="campo w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <span className="text-text-muted">a</span>
            <input type="date" className="campo w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        }
      />

      <Tabs
        pestanas={[
          { valor: 'ingresos', etiqueta: 'Ingresos' },
          { valor: 'servicios', etiqueta: 'Servicios' },
          { valor: 'comisiones', etiqueta: 'Comisiones' },
          { valor: 'cancelaciones', etiqueta: 'Cancelaciones' },
          { valor: 'ventas', etiqueta: 'Ventas' },
        ]}
        activa={pestana}
        onChange={setPestana}
      />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {pestana === 'ingresos' && <ReporteIngresosVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'servicios' && <ReporteServiciosVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'comisiones' && <ReporteComisionesVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'cancelaciones' && <ReporteCancelacionesVista desde={desde} hasta={hasta} onError={setError} />}
      {pestana === 'ventas' && <VentasVista onError={setError} />}
    </div>
  )
}

function ReporteIngresosVista({ desde, hasta, onError }: { desde: string; hasta: string; onError: (m: string) => void }) {
  const [datos, setDatos] = useState<ReporteIngresos | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    api
      .get<ReporteIngresos>('/reportes/ingresos', { params: { desde, hasta } })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => onError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta])

  if (cargando) return <Spinner etiqueta="Cargando ingresos…" />
  if (!datos) return null

  const maximo = Math.max(1, ...datos.por_dia.map((d) => Number(d.total)))

  return (
    <div className="space-y-4">
      <div className="tarjeta p-5">
        <p className="text-sm text-text-muted">Total del período</p>
        <p className="text-3xl font-semibold text-accent-hover">Q{Number(datos.total_periodo).toFixed(2)}</p>
      </div>
      {datos.por_dia.length === 0 ? (
        <p className="text-text-muted">No hay ventas registradas en este rango.</p>
      ) : (
        <ul className="space-y-1.5">
          {datos.por_dia.map((dia) => (
            <li key={dia.fecha} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-text-muted">{dia.fecha}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${(Number(dia.total) / maximo) * 100}%` }}
                />
              </span>
              <span className="w-20 shrink-0 text-right font-medium text-text">Q{Number(dia.total).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReporteServiciosVista({ desde, hasta, onError }: { desde: string; hasta: string; onError: (m: string) => void }) {
  const [datos, setDatos] = useState<ReporteServiciosDemandados | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    api
      .get<ReporteServiciosDemandados>('/reportes/servicios-mas-demandados', { params: { desde, hasta } })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => onError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta])

  if (cargando) return <Spinner etiqueta="Cargando servicios…" />
  if (!datos || datos.servicios.length === 0) return <p className="text-text-muted">No hay datos en este rango.</p>

  const maximo = Math.max(1, ...datos.servicios.map((s) => s.veces_solicitado))

  return (
    <ul className="space-y-1.5">
      {datos.servicios.map((s) => (
        <li key={s.nombre} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 text-text">{s.nombre}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(s.veces_solicitado / maximo) * 100}%` }} />
          </span>
          <span className="w-10 shrink-0 text-right font-medium text-text">{s.veces_solicitado}</span>
        </li>
      ))}
    </ul>
  )
}

function ReporteComisionesVista({ desde, hasta, onError }: { desde: string; hasta: string; onError: (m: string) => void }) {
  const [datos, setDatos] = useState<ReporteComisiones | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    api
      .get<ReporteComisiones>('/reportes/comisiones-por-barbero', { params: { desde, hasta } })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => onError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta])

  if (cargando) return <Spinner etiqueta="Cargando comisiones…" />
  if (!datos || datos.comisiones.length === 0) return <p className="text-text-muted">No hay comisiones en este rango.</p>

  return (
    <ul className="space-y-2">
      {datos.comisiones.map((c) => (
        <li key={c.barbero_id} className="tarjeta flex items-center justify-between p-4 text-sm">
          <div>
            <p className="font-medium text-text">{c.barbero}</p>
            <p className="text-text-muted">{c.servicios_cobrados} servicios cobrados</p>
          </div>
          <span className="text-lg font-semibold text-accent-hover">Q{Number(c.comision_total).toFixed(2)}</span>
        </li>
      ))}
    </ul>
  )
}

function ReporteCancelacionesVista({ desde, hasta, onError }: { desde: string; hasta: string; onError: (m: string) => void }) {
  const [datos, setDatos] = useState<ReporteCancelaciones | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    api
      .get<ReporteCancelaciones>('/reportes/cancelaciones-ausentismo', { params: { desde, hasta } })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => onError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta])

  if (cargando) return <Spinner etiqueta="Cargando cancelaciones…" />
  if (!datos) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="tarjeta p-5">
          <p className="text-sm text-text-muted">% Canceladas</p>
          <p className="text-2xl font-semibold text-text">{datos.porcentaje_canceladas}%</p>
        </div>
        <div className="tarjeta p-5">
          <p className="text-sm text-text-muted">% Ausentismo</p>
          <p className="text-2xl font-semibold text-text">{datos.porcentaje_ausentes}%</p>
        </div>
      </div>
      <p className="text-sm text-text-muted">Total de citas en el rango: {datos.total_citas}</p>
      <ul className="space-y-1.5">
        {Object.entries(datos.por_estado).map(([estado, total]) => (
          <li key={estado} className="flex justify-between text-sm">
            <span className="capitalize text-text">{estado.replace('_', ' ')}</span>
            <span className="font-medium text-text">{total}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VentasVista({ onError }: { onError: (m: string) => void }) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [anulandoId, setAnulandoId] = useState<number | null>(null)

  async function cargar() {
    setCargando(true)
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
    if (!confirm(`¿Anular la venta ${venta.numero_recibo}? Esto revierte el inventario de productos.`)) return
    setAnulandoId(venta.id)
    onError('')
    try {
      await api.post(`/ventas/${venta.id}/anular`)
      await cargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setAnulandoId(null)
    }
  }

  if (cargando) return <Spinner etiqueta="Cargando ventas…" />
  if (ventas.length === 0) return <p className="text-text-muted">No hay ventas registradas.</p>

  return (
    <ul className="space-y-2">
      {ventas.map((venta) => (
        <li key={venta.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <div>
            <p className="font-medium text-text">
              {venta.numero_recibo}
              {venta.estado === 'anulada' && <span className="ml-2 text-xs" style={{ color: 'var(--color-danger)' }}>Anulada</span>}
            </p>
            <p className="text-text-muted">
              {venta.cliente ? `${venta.cliente.nombres} ${venta.cliente.apellidos}` : 'Venta directa'} · {venta.metodo_pago}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text">Q{Number(venta.total).toFixed(2)}</span>
            {venta.estado !== 'anulada' && (
              <button onClick={() => anular(venta)} disabled={anulandoId === venta.id} className="btn-texto text-xs">
                {anulandoId === venta.id ? 'Anulando…' : 'Anular'}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
