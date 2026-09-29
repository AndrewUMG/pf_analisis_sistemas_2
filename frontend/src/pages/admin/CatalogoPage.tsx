import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { BotonSubirFoto } from '../../components/BotonSubirFoto'
import { Campo, InputPassword } from '../../components/Campo'
import { ImagenPlaceholder } from '../../components/ImagenPlaceholder'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { TarjetasSkeleton } from '../../components/Skeleton'
import { Tabs } from '../../components/Tabs'
import { EstadoVacio } from '../../components/panel/Piezas'
import { IconPersonas, IconTijeras } from '../../components/Icons'
import { CATEGORIAS } from '../../components/sitio/ServicioCard'
import type { Barbero, Servicio } from '../../types'

const FORM_SERVICIO_VACIO = { nombre: '', categoria: 'corte' as Servicio['categoria'], descripcion: '', duracion_minutos: '30', precio: '', barbero_ids: [] as number[] }
const FORM_BARBERO_VACIO = { nombres: '', apellidos: '', email: '', telefono: '', password: '', especialidad: '', comision_porcentaje: '40', servicio_ids: [] as number[] }

const pildora = (activa: boolean) => `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${activa ? 'border-brand bg-brand text-text-on-brand' : 'bg-surface text-text-muted hover:border-brand hover:text-text'}`

export function CatalogoPage() {
  const [pestana, setPestana] = useState<'servicios' | 'barberos'>('servicios')
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargar() {
    setError('')
    try {
      const [s, b] = await Promise.all([api.get<Servicio[]>('/servicios'), api.get<Barbero[]>('/barberos')])
      setServicios(s.data)
      setBarberos(b.data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return (
    <div>
      <PageHeader eyebrow="Negocio" titulo="Catálogo" descripcion="Servicios ofrecidos y perfiles de barberos. Sube fotos reales para que el sitio luzca completo." />
      <Tabs
        pestanas={[
          { valor: 'servicios', etiqueta: `Servicios (${servicios.length})` },
          { valor: 'barberos', etiqueta: `Barberos (${barberos.length})` },
        ]}
        activa={pestana}
        onChange={setPestana}
      />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {cargando ? (
        <TarjetasSkeleton />
      ) : pestana === 'servicios' ? (
        <TabServicios servicios={servicios} barberos={barberos} onCambio={cargar} onError={setError} />
      ) : (
        <TabBarberos barberos={barberos} servicios={servicios} onCambio={cargar} onError={setError} />
      )}
    </div>
  )
}

function TabServicios({ servicios, barberos, onCambio, onError }: { servicios: Servicio[]; barberos: Barbero[]; onCambio: () => void; onError: (m: string) => void }) {
  const [editando, setEditando] = useState<Servicio | 'nuevo' | null>(null)
  const [form, setForm] = useState(FORM_SERVICIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [aDesactivar, setADesactivar] = useState<Servicio | null>(null)

  function abrirCrear() {
    setForm(FORM_SERVICIO_VACIO)
    setEditando('nuevo')
  }

  function abrirEditar(s: Servicio) {
    setForm({
      nombre: s.nombre,
      categoria: s.categoria,
      descripcion: s.descripcion ?? '',
      duracion_minutos: String(s.duracion_minutos),
      precio: s.precio,
      barbero_ids: barberos.filter((b) => b.servicios.some((x) => x.id === s.id)).map((b) => b.id),
    })
    setEditando(s)
  }

  const alternar = (id: number) => setForm((f) => ({ ...f, barbero_ids: f.barbero_ids.includes(id) ? f.barbero_ids.filter((x) => x !== id) : [...f.barbero_ids, id] }))

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    onError('')
    try {
      const payload = { nombre: form.nombre, categoria: form.categoria, descripcion: form.descripcion || null, duracion_minutos: Number(form.duracion_minutos), precio: Number(form.precio), barbero_ids: form.barbero_ids }
      if (editando && editando !== 'nuevo') await api.put(`/servicios/${editando.id}`, payload)
      else await api.post('/servicios', payload)
      setEditando(null)
      onCambio()
    } catch (err) {
      onError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(s: Servicio) {
    try {
      await api.delete(`/servicios/${s.id}`)
      setADesactivar(null)
      onCambio()
    } catch (err) {
      onError(mensajeError(err))
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={abrirCrear} className="btn-principal">
          Nuevo servicio
        </button>
      </div>

      {servicios.length === 0 ? (
        <EstadoVacio icono={IconTijeras} titulo="Aún no hay servicios" texto="Crea el primero para que los clientes puedan reservar." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {servicios.map((s) => (
            <li key={s.id} className={`tarjeta overflow-hidden ${s.activo ? '' : 'opacity-60'}`}>
              <ImagenPlaceholder src={s.imagen} etiqueta={s.nombre} className="aspect-[16/9] w-full rounded-none" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-text">{s.nombre}</h3>
                    <p className="text-xs text-text-muted">
                      {CATEGORIAS[s.categoria]} · {s.duracion_minutos} min
                      {!s.activo && ' · inactivo'}
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-xl font-semibold text-accent-hover">Q{Number(s.precio).toFixed(2)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <BotonSubirFoto
                    etiqueta={s.imagen ? 'Cambiar foto' : 'Subir foto'}
                    onError={onError}
                    onSubir={async (archivo) => {
                      const datos = new FormData()
                      datos.append('imagen', archivo)
                      await api.post(`/servicios/${s.id}/imagen`, datos)
                      onCambio()
                    }}
                  />
                  <button onClick={() => abrirEditar(s)} className="btn-secundario px-3 py-1.5 text-xs">Editar</button>
                  {s.activo && <button onClick={() => setADesactivar(s)} className="btn-texto ml-auto px-2 text-xs">Desactivar</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <Modal titulo={editando === 'nuevo' ? 'Nuevo servicio' : 'Editar servicio'} onClose={() => setEditando(null)}>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre">{(p) => <input {...p} required className="campo" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />}</Campo>
              <Campo etiqueta="Categoría">
                {(p) => (
                  <select {...p} className="campo" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as Servicio['categoria'] }))}>
                    {Object.entries(CATEGORIAS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                )}
              </Campo>
              <Campo etiqueta="Duración (min)">{(p) => <input {...p} required type="number" min={1} className="campo" value={form.duracion_minutos} onChange={(e) => setForm((f) => ({ ...f, duracion_minutos: e.target.value }))} />}</Campo>
              <Campo etiqueta="Precio (Q)">{(p) => <input {...p} required type="number" min={0} step="0.01" inputMode="decimal" className="campo" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} />}</Campo>
            </div>
            <Campo etiqueta="Descripción (opcional)">{(p) => <textarea {...p} rows={2} className="campo" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />}</Campo>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text">Barberos que lo ofrecen</legend>
              <div className="flex flex-wrap gap-2">
                {barberos.map((b) => (
                  <button type="button" key={b.id} aria-pressed={form.barbero_ids.includes(b.id)} onClick={() => alternar(b.id)} className={pildora(form.barbero_ids.includes(b.id))}>
                    {b.user.nombres} {b.user.apellidos}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditando(null)} className="btn-secundario">Cancelar</button>
              <button type="submit" disabled={guardando} className="btn-principal">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {aDesactivar && (
        <Modal titulo={`¿Quitar “${aDesactivar.nombre}” del catálogo?`} descripcion="Los clientes ya no podrán reservarlo, pero se conserva el historial de citas." onClose={() => setADesactivar(null)}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setADesactivar(null)} className="btn-secundario">Cancelar</button>
            <button type="button" onClick={() => desactivar(aDesactivar)} className="btn-peligro">Sí, quitar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TabBarberos({ barberos, servicios, onCambio, onError }: { barberos: Barbero[]; servicios: Servicio[]; onCambio: () => void; onError: (m: string) => void }) {
  const [editando, setEditando] = useState<Barbero | 'nuevo' | null>(null)
  const [form, setForm] = useState(FORM_BARBERO_VACIO)
  const [guardando, setGuardando] = useState(false)

  function abrirCrear() {
    setForm(FORM_BARBERO_VACIO)
    setEditando('nuevo')
  }

  function abrirEditar(b: Barbero) {
    setForm({ ...FORM_BARBERO_VACIO, especialidad: b.especialidad ?? '', comision_porcentaje: b.comision_porcentaje, servicio_ids: b.servicios.map((s) => s.id) })
    setEditando(b)
  }

  const alternar = (id: number) => setForm((f) => ({ ...f, servicio_ids: f.servicio_ids.includes(id) ? f.servicio_ids.filter((x) => x !== id) : [...f.servicio_ids, id] }))

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    onError('')
    try {
      if (editando && editando !== 'nuevo') {
        await api.put(`/barberos/${editando.id}`, { especialidad: form.especialidad || null, comision_porcentaje: Number(form.comision_porcentaje), servicio_ids: form.servicio_ids })
      } else {
        // Un barbero nuevo requiere primero una cuenta de usuario con rol "barbero".
        const { data: usuario } = await api.post('/usuarios', { nombres: form.nombres, apellidos: form.apellidos, email: form.email, telefono: form.telefono || undefined, password: form.password, rol: 'barbero' })
        await api.post('/barberos', { user_id: usuario.id, especialidad: form.especialidad || null, comision_porcentaje: Number(form.comision_porcentaje), servicio_ids: form.servicio_ids })
      }
      setEditando(null)
      onCambio()
    } catch (err) {
      onError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={abrirCrear} className="btn-principal">
          Nuevo barbero
        </button>
      </div>

      {barberos.length === 0 ? (
        <EstadoVacio icono={IconPersonas} titulo="Aún no hay barberos" texto="Da de alta al primero para que aparezca en la reserva." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {barberos.map((b) => (
            <li key={b.id} className="tarjeta overflow-hidden">
              <ImagenPlaceholder src={b.foto} etiqueta={`Foto de ${b.user.nombres}`} className="aspect-[5/4] w-full rounded-none" />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-text">{b.user.nombres} {b.user.apellidos}</h3>
                <p className="text-sm text-text-muted">{b.especialidad ?? 'Sin especialidad'} · Comisión {Number(b.comision_porcentaje)}%</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {b.servicios.map((s) => (
                    <span key={s.id} className="badge bg-neutral-soft text-text-muted">{s.nombre}</span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <BotonSubirFoto
                    etiqueta={b.foto ? 'Cambiar foto' : 'Subir foto'}
                    onError={onError}
                    onSubir={async (archivo) => {
                      const datos = new FormData()
                      datos.append('foto', archivo)
                      await api.post(`/barberos/${b.id}/foto`, datos)
                      onCambio()
                    }}
                  />
                  <button onClick={() => abrirEditar(b)} className="btn-secundario px-3 py-1.5 text-xs">Editar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <Modal titulo={editando === 'nuevo' ? 'Nuevo barbero' : 'Editar barbero'} descripcion={editando === 'nuevo' ? 'Se crea su cuenta de acceso y su perfil profesional.' : undefined} onClose={() => setEditando(null)}>
          <form onSubmit={guardar} className="space-y-4">
            {editando === 'nuevo' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Nombres">{(p) => <input {...p} required className="campo" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />}</Campo>
                  <Campo etiqueta="Apellidos">{(p) => <input {...p} required className="campo" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />}</Campo>
                  <Campo etiqueta="Correo">{(p) => <input {...p} required type="email" className="campo" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />}</Campo>
                  <Campo etiqueta="Teléfono">{(p) => <input {...p} className="campo" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />}</Campo>
                </div>
                <Campo etiqueta="Contraseña temporal" ayuda="Mínimo 8 caracteres.">{(p) => <InputPassword {...p} required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />}</Campo>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Especialidad">{(p) => <input {...p} className="campo" value={form.especialidad} onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))} />}</Campo>
              <Campo etiqueta="Comisión (%)">{(p) => <input {...p} required type="number" min={0} max={100} className="campo" value={form.comision_porcentaje} onChange={(e) => setForm((f) => ({ ...f, comision_porcentaje: e.target.value }))} />}</Campo>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text">Servicios que presta</legend>
              <div className="flex flex-wrap gap-2">
                {servicios.map((s) => (
                  <button type="button" key={s.id} aria-pressed={form.servicio_ids.includes(s.id)} onClick={() => alternar(s.id)} className={pildora(form.servicio_ids.includes(s.id))}>
                    {s.nombre}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditando(null)} className="btn-secundario">Cancelar</button>
              <button type="submit" disabled={guardando} className="btn-principal">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
