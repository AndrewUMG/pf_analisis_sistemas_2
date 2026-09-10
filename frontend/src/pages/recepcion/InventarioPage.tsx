import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import type { Producto } from '../../types'

const FORM_VACIO = { nombre: '', categoria: '', precio: '', existencia: '0', existencia_minima: '5' }

export function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [soloCriticos, setSoloCriticos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const [movimientoProducto, setMovimientoProducto] = useState<Producto | null>(null)
  const [movimiento, setMovimiento] = useState({ tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste', cantidad: '1', motivo: '' })
  const [registrandoMovimiento, setRegistrandoMovimiento] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<Producto[]>('/productos', { params: soloCriticos ? { solo_criticos: 1 } : {} })
      setProductos(data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloCriticos])

  function abrirCrear() {
    setEditando(null)
    setForm(FORM_VACIO)
    setMostrarFormulario(true)
  }

  function abrirEditar(producto: Producto) {
    setEditando(producto)
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria ?? '',
      precio: producto.precio,
      existencia: String(producto.existencia),
      existencia_minima: String(producto.existencia_minima),
    })
    setMostrarFormulario(true)
  }

  async function guardarProducto(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = {
        nombre: form.nombre,
        categoria: form.categoria || null,
        precio: Number(form.precio),
        existencia: Number(form.existencia),
        existencia_minima: Number(form.existencia_minima),
      }
      if (editando) {
        await api.put(`/productos/${editando.id}`, payload)
      } else {
        await api.post('/productos', payload)
      }
      setMostrarFormulario(false)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(producto: Producto) {
    if (!confirm(`¿Dar de baja "${producto.nombre}" del catálogo?`)) return
    setError('')
    try {
      await api.delete(`/productos/${producto.id}`)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  async function registrarMovimiento(e: FormEvent) {
    e.preventDefault()
    if (!movimientoProducto) return
    setRegistrandoMovimiento(true)
    setError('')
    try {
      await api.post(`/productos/${movimientoProducto.id}/movimientos`, {
        tipo: movimiento.tipo,
        cantidad: Number(movimiento.cantidad),
        motivo: movimiento.motivo || undefined,
      })
      setMovimientoProducto(null)
      setMovimiento({ tipo: 'entrada', cantidad: '1', motivo: '' })
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setRegistrandoMovimiento(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Inventario"
        descripcion="Catálogo de productos y control de existencias."
        accion={
          <button onClick={abrirCrear} className="btn-principal">
            Nuevo producto
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={guardarProducto} className="tarjeta mb-6 space-y-3 p-5">
          <h2 className="font-semibold text-text">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Nombre</span>
              <input required className="campo" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Categoría</span>
              <input className="campo" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Precio</span>
              <input required type="number" min={0} step="0.01" className="campo" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Existencia mínima</span>
              <input required type="number" min={0} className="campo" value={form.existencia_minima} onChange={(e) => setForm((f) => ({ ...f, existencia_minima: e.target.value }))} />
            </label>
            {!editando && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Existencia inicial</span>
                <input type="number" min={0} className="campo" value={form.existencia} onChange={(e) => setForm((f) => ({ ...f, existencia: e.target.value }))} />
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMostrarFormulario(false)} className="btn-secundario">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-principal">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {movimientoProducto && (
        <form onSubmit={registrarMovimiento} className="tarjeta mb-6 space-y-3 p-5">
          <h2 className="font-semibold text-text">Movimiento de "{movimientoProducto.nombre}"</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Tipo</span>
              <select className="campo" value={movimiento.tipo} onChange={(e) => setMovimiento((m) => ({ ...m, tipo: e.target.value as typeof m.tipo }))}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Cantidad</span>
              <input required type="number" className="campo" value={movimiento.cantidad} onChange={(e) => setMovimiento((m) => ({ ...m, cantidad: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Motivo</span>
              <input className="campo" value={movimiento.motivo} onChange={(e) => setMovimiento((m) => ({ ...m, motivo: e.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMovimientoProducto(null)} className="btn-secundario">
              Cancelar
            </button>
            <button type="submit" disabled={registrandoMovimiento} className="btn-principal">
              {registrandoMovimiento ? 'Registrando…' : 'Registrar movimiento'}
            </button>
          </div>
        </form>
      )}

      <label className="mb-4 flex items-center gap-2 text-sm text-text">
        <input type="checkbox" checked={soloCriticos} onChange={(e) => setSoloCriticos(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
        Mostrar solo productos en nivel crítico
      </label>

      {cargando ? (
        <Spinner etiqueta="Cargando inventario…" />
      ) : productos.length === 0 ? (
        <p className="text-text-muted">No hay productos que coincidan con el filtro.</p>
      ) : (
        <ul className="space-y-2">
          {productos.map((producto) => {
            const critico = producto.existencia <= producto.existencia_minima
            return (
              <li key={producto.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-text">
                    {producto.nombre}
                    {!producto.activo && <span className="ml-2 text-xs text-text-faint">(inactivo)</span>}
                  </p>
                  <p className="text-sm text-text-muted">
                    Q{Number(producto.precio).toFixed(2)} ·{' '}
                    <span style={critico ? { color: 'var(--color-danger)' } : undefined}>
                      {producto.existencia} en existencia (mín. {producto.existencia_minima})
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMovimientoProducto(producto)} className="btn-secundario px-3 py-1.5 text-xs">
                    Movimiento
                  </button>
                  <button onClick={() => abrirEditar(producto)} className="btn-secundario px-3 py-1.5 text-xs">
                    Editar
                  </button>
                  {producto.activo && (
                    <button onClick={() => desactivar(producto)} className="btn-texto px-1 text-xs">
                      Desactivar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
