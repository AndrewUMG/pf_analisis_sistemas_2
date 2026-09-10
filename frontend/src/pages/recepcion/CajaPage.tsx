import { useEffect, useMemo, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import type { Cita, PaginaCitas, PaginaVentas, Producto, Venta } from '../../types'

const METODOS_PAGO: { valor: Venta['metodo_pago']; etiqueta: string }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
]

export function CajaPage() {
  const [citasCompletadas, setCitasCompletadas] = useState<Cita[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [ventasRecientes, setVentasRecientes] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [citaId, setCitaId] = useState<number | null>(null)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [metodoPago, setMetodoPago] = useState<Venta['metodo_pago']>('efectivo')
  const [descuento, setDescuento] = useState('0')
  const [enviando, setEnviando] = useState(false)
  const [reciboUltimo, setReciboUltimo] = useState<Venta | null>(null)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const [resCitas, resProductos, resVentas] = await Promise.all([
        api.get<PaginaCitas>('/citas', { params: { estado: 'completada' } }),
        api.get<Producto[]>('/productos'),
        api.get<PaginaVentas>('/ventas'),
      ])
      setCitasCompletadas(resCitas.data.data)
      setProductos(resProductos.data.filter((p) => p.activo))
      setVentasRecientes(resVentas.data.data.slice(0, 8))
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const citaSeleccionada = citasCompletadas.find((c) => c.id === citaId) ?? null

  const subtotalCita = citaSeleccionada
    ? (citaSeleccionada.detalles ?? []).reduce((s, d) => s + Number(d.precio_aplicado), 0)
    : 0

  const lineasProductos = useMemo(
    () =>
      productos
        .map((p) => ({ producto: p, cantidad: cantidades[p.id] ?? 0 }))
        .filter((l) => l.cantidad > 0),
    [productos, cantidades]
  )

  const subtotalProductos = lineasProductos.reduce((s, l) => s + Number(l.producto.precio) * l.cantidad, 0)
  const subtotal = subtotalCita + subtotalProductos
  const total = Math.max(0, subtotal - Number(descuento || 0))

  function cambiarCantidad(id: number, delta: number) {
    setCantidades((actual) => {
      const nueva = Math.max(0, (actual[id] ?? 0) + delta)
      return { ...actual, [id]: nueva }
    })
  }

  async function registrarCobro() {
    if (!citaId && lineasProductos.length === 0) {
      setError('Selecciona una cita completada o agrega al menos un producto.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const { data } = await api.post<Venta>('/ventas', {
        cita_id: citaId ?? undefined,
        productos: lineasProductos.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
        metodo_pago: metodoPago,
        descuento: Number(descuento || 0),
      })
      setReciboUltimo(data)
      setCitaId(null)
      setCantidades({})
      setDescuento('0')
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Spinner etiqueta="Cargando caja…" />

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader titulo="Caja" descripcion="Cobra una cita completada, productos, o ambos en un mismo recibo." />

      {error && <Alerta tipo="error" mensaje={error} />}

      {reciboUltimo && (
        <div className="tarjeta p-5" style={{ borderColor: 'var(--color-success)' }}>
          <p className="text-sm text-text-muted">Cobro registrado</p>
          <p className="text-lg font-semibold text-text">Recibo {reciboUltimo.numero_recibo}</p>
          <p className="text-2xl font-semibold text-accent-hover">Q{Number(reciboUltimo.total).toFixed(2)}</p>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">1. Cita completada (opcional)</h2>
        {citasCompletadas.length === 0 ? (
          <p className="text-sm text-text-muted">No hay citas completadas pendientes de cobro.</p>
        ) : (
          <ul className="space-y-2">
            {citasCompletadas.map((cita) => (
              <li key={cita.id}>
                <button
                  onClick={() => setCitaId(citaId === cita.id ? null : cita.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    citaId === cita.id ? 'border-accent bg-accent-soft' : 'bg-surface hover:border-border-strong'
                  }`}
                >
                  <span className="font-medium text-text">
                    {cita.cliente?.nombres} {cita.cliente?.apellidos}
                  </span>
                  <span className="text-text-muted"> · {cita.detalles?.map((d) => d.servicio?.nombre).join(', ')}</span>
                  <span className="float-right font-semibold text-accent-hover">
                    Q{(cita.detalles ?? []).reduce((s, d) => s + Number(d.precio_aplicado), 0).toFixed(2)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">2. Productos (opcional)</h2>
        {productos.length === 0 ? (
          <p className="text-sm text-text-muted">No hay productos activos en el catálogo.</p>
        ) : (
          <ul className="space-y-2">
            {productos.map((producto) => (
              <li key={producto.id} className="flex items-center justify-between rounded-lg border bg-surface p-3 text-sm">
                <span>
                  <span className="font-medium text-text">{producto.nombre}</span>
                  <span className="text-text-muted"> · Q{Number(producto.precio).toFixed(2)}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cambiarCantidad(producto.id, -1)} className="btn-secundario h-7 w-7 p-0">
                    −
                  </button>
                  <span className="w-6 text-center text-text">{cantidades[producto.id] ?? 0}</span>
                  <button type="button" onClick={() => cambiarCantidad(producto.id, 1)} className="btn-secundario h-7 w-7 p-0">
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta space-y-3 p-5">
        <h2 className="text-lg font-semibold text-text">3. Cobro</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Método de pago</span>
            <select className="campo" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as Venta['metodo_pago'])}>
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Descuento</span>
            <input type="number" min={0} step="0.01" className="campo" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
          </label>
        </div>

        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span>Q{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-text">
            <span>Total</span>
            <span className="text-accent-hover">Q{total.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={registrarCobro} disabled={enviando} className="btn-principal w-full">
          {enviando ? 'Registrando…' : 'Registrar cobro'}
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">Ventas recientes</h2>
        {ventasRecientes.length === 0 ? (
          <p className="text-sm text-text-muted">Todavía no hay ventas registradas.</p>
        ) : (
          <ul className="space-y-2">
            {ventasRecientes.map((venta) => (
              <li key={venta.id} className="flex items-center justify-between rounded-lg border bg-surface p-3 text-sm">
                <span>
                  <span className="font-medium text-text">{venta.numero_recibo}</span>
                  <span className="text-text-muted"> · {venta.cliente ? `${venta.cliente.nombres} ${venta.cliente.apellidos}` : 'Venta directa'}</span>
                </span>
                <span className={venta.estado === 'anulada' ? 'text-danger line-through' : 'font-semibold text-text'}>
                  Q{Number(venta.total).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
