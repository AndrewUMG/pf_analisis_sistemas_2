import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Campo } from '../../components/Campo'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { FilasSkeleton } from '../../components/Skeleton'
import { Barra, EstadoVacio, Panel, StatCard } from '../../components/panel/Piezas'
import { IconCaja3d, IconCampana, IconGrafica } from '../../components/Icons'
import type { Producto } from '../../types'

const FORM_VACIO = { nombre: '', categoria: '', precio: '', existencia: '0', existencia_minima: '5' }
const quetzales = (n: number) => `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [soloCriticos, setSoloCriticos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const [movimientoProducto, setMovimientoProducto] = useState<Producto | null>(null)
  const [movimiento, setMovimiento] = useState({ tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste', cantidad: '1', motivo: '' })
  const [registrando, setRegistrando] = useState(false)
  const [aDesactivar, setADesactivar] = useState<Producto | null>(null)

  async function cargar() {
    setError('')
    try {
      const { data } = await api.get<Producto[]>('/productos')
      setProductos(data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const esCritico = (p: Producto) => p.existencia <= p.existencia_minima
  const activos = productos.filter((p) => p.activo)
  const criticos = activos.filter(esCritico)
  const valorTotal = activos.reduce((s, p) => s + p.existencia * Number(p.precio), 0)
  const visibles = useMemo(() => (soloCriticos ? productos.filter((p) => p.activo && esCritico(p)) : productos), [productos, soloCriticos])

  function abrirCrear() {
    setForm(FORM_VACIO)
    setEditando('nuevo')
  }

  function abrirEditar(p: Producto) {
    setForm({ nombre: p.nombre, categoria: p.categoria ?? '', precio: p.precio, existencia: String(p.existencia), existencia_minima: String(p.existencia_minima) })
    setEditando(p)
  }

  async function guardarProducto(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = { nombre: form.nombre, categoria: form.categoria || null, precio: Number(form.precio), existencia: Number(form.existencia), existencia_minima: Number(form.existencia_minima) }
      if (editando && editando !== 'nuevo') await api.put(`/productos/${editando.id}`, payload)
      else await api.post('/productos', payload)
      setEditando(null)
      setAviso('Producto guardado.')
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(p: Producto) {
    setError('')
    try {
      await api.delete(`/productos/${p.id}`)
      setADesactivar(null)
      setAviso(`“${p.nombre}” se dio de baja del catálogo.`)
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  async function registrarMovimiento(e: FormEvent) {
    e.preventDefault()
    if (!movimientoProducto) return
    setRegistrando(true)
    setError('')
    try {
      await api.post(`/productos/${movimientoProducto.id}/movimientos`, { tipo: movimiento.tipo, cantidad: Number(movimiento.cantidad), motivo: movimiento.motivo || undefined })
      setMovimientoProducto(null)
      setMovimiento({ tipo: 'entrada', cantidad: '1', motivo: '' })
      setAviso('Movimiento registrado.')
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setRegistrando(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operación"
        titulo="Inventario"
        descripcion="Catálogo de productos y control de existencias."
        accion={
          <button onClick={abrirCrear} className="btn-principal">
            Nuevo producto
          </button>
        }
      />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}
      {aviso && !error && (
        <div className="mb-4" role="status">
          <Alerta tipo="exito" mensaje={aviso} />
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Productos activos" valor={activos.length} icono={IconCaja3d} tono="marca" />
        <StatCard etiqueta="En nivel crítico" valor={criticos.length} ayuda={criticos.length ? 'Conviene reabastecer' : 'Todo en orden'} icono={IconCampana} tono={criticos.length ? 'peligro' : 'exito'} />
        <StatCard etiqueta="Valor en existencias" valor={quetzales(valorTotal)} icono={IconGrafica} tono="acento" />
      </div>

      <Panel>
        <div className="-m-5 mb-2 flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <button className="chip" aria-pressed={soloCriticos} onClick={() => setSoloCriticos((v) => !v)}>
            Solo nivel crítico ({criticos.length})
          </button>
          <p className="text-sm text-text-muted" aria-live="polite">
            {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {cargando ? (
          <FilasSkeleton cantidad={4} />
        ) : visibles.length === 0 ? (
          <EstadoVacio icono={IconCaja3d} titulo={soloCriticos ? 'Ningún producto en nivel crítico' : 'Aún no hay productos'} texto={soloCriticos ? 'Todas las existencias están por encima del mínimo.' : 'Agrega tu primer producto para controlar el inventario.'} />
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-bg-subtle text-xs uppercase tracking-wider text-text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">Producto</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell">Precio</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Existencia</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibles.map((p) => {
                  const critico = esCritico(p)
                  return (
                    <tr key={p.id} className={p.activo ? '' : 'opacity-55'}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-text">
                          {p.nombre}
                          {!p.activo && <span className="badge ml-2 bg-neutral-soft text-text-muted">Inactivo</span>}
                        </p>
                        <p className="text-xs capitalize text-text-muted">{(p.categoria ?? 'Sin categoría').replace('_', ' ')}</p>
                      </td>
                      <td className="hidden px-3 py-3.5 text-right text-text sm:table-cell">{quetzales(Number(p.precio))}</td>
                      <td className="min-w-40 px-3 py-3.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold" style={{ color: critico && p.activo ? 'var(--color-danger)' : 'var(--color-text)' }}>{p.existencia} u.</span>
                          <span className="text-text-muted">mín. {p.existencia_minima}</span>
                        </div>
                        <div className="mt-1.5">
                          <Barra valor={p.existencia} maximo={Math.max(p.existencia_minima * 3, p.existencia, 1)} etiqueta={`Existencia de ${p.nombre}`} color={critico ? 'var(--color-danger)' : 'var(--color-success)'} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {p.activo && <button onClick={() => setMovimientoProducto(p)} className="btn-secundario px-3 py-1.5 text-xs">Movimiento</button>}
                          <button onClick={() => abrirEditar(p)} className="btn-secundario px-3 py-1.5 text-xs">Editar</button>
                          {p.activo && <button onClick={() => setADesactivar(p)} className="btn-texto px-2 text-xs">Baja</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editando && (
        <Modal titulo={editando === 'nuevo' ? 'Nuevo producto' : 'Editar producto'} onClose={() => setEditando(null)}>
          <form onSubmit={guardarProducto} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre">{(p) => <input {...p} required className="campo" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />}</Campo>
              <Campo etiqueta="Categoría">{(p) => <input {...p} className="campo" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />}</Campo>
              <Campo etiqueta="Precio (Q)">{(p) => <input {...p} required type="number" min={0} step="0.01" inputMode="decimal" className="campo" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} />}</Campo>
              <Campo etiqueta="Existencia mínima" ayuda="Al llegar a este nivel se marca como crítico.">{(p) => <input {...p} required type="number" min={0} className="campo" value={form.existencia_minima} onChange={(e) => setForm((f) => ({ ...f, existencia_minima: e.target.value }))} />}</Campo>
              {editando === 'nuevo' && (
                <Campo etiqueta="Existencia inicial">{(p) => <input {...p} type="number" min={0} className="campo" value={form.existencia} onChange={(e) => setForm((f) => ({ ...f, existencia: e.target.value }))} />}</Campo>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditando(null)} className="btn-secundario">Cancelar</button>
              <button type="submit" disabled={guardando} className="btn-principal">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {movimientoProducto && (
        <Modal titulo={`Movimiento de “${movimientoProducto.nombre}”`} descripcion={`Existencia actual: ${movimientoProducto.existencia} unidades.`} onClose={() => setMovimientoProducto(null)}>
          <form onSubmit={registrarMovimiento} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Tipo">
                {(p) => (
                  <select {...p} className="campo" value={movimiento.tipo} onChange={(e) => setMovimiento((m) => ({ ...m, tipo: e.target.value as typeof m.tipo }))}>
                    <option value="entrada">Entrada (suma)</option>
                    <option value="salida">Salida (resta)</option>
                    <option value="ajuste">Ajuste (+/−)</option>
                  </select>
                )}
              </Campo>
              <Campo etiqueta="Cantidad">{(p) => <input {...p} required type="number" className="campo" value={movimiento.cantidad} onChange={(e) => setMovimiento((m) => ({ ...m, cantidad: e.target.value }))} />}</Campo>
            </div>
            <Campo etiqueta="Motivo" ayuda={movimiento.tipo === 'ajuste' ? 'Obligatorio en los ajustes manuales.' : 'Opcional.'}>
              {(p) => <input {...p} required={movimiento.tipo === 'ajuste'} className="campo" value={movimiento.motivo} onChange={(e) => setMovimiento((m) => ({ ...m, motivo: e.target.value }))} />}
            </Campo>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setMovimientoProducto(null)} className="btn-secundario">Cancelar</button>
              <button type="submit" disabled={registrando} className="btn-principal">{registrando ? 'Registrando…' : 'Registrar movimiento'}</button>
            </div>
          </form>
        </Modal>
      )}

      {aDesactivar && (
        <Modal titulo={`¿Dar de baja “${aDesactivar.nombre}”?`} descripcion="Dejará de venderse, pero se conserva su historial de movimientos y ventas." onClose={() => setADesactivar(null)}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setADesactivar(null)} className="btn-secundario">Cancelar</button>
            <button type="button" onClick={() => desactivar(aDesactivar)} className="btn-peligro">Sí, dar de baja</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
