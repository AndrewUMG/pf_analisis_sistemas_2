import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import { Tabs } from '../../components/Tabs'
import { ImagenPlaceholder } from '../../components/ImagenPlaceholder'
import type { Barbero, Servicio } from '../../types'

const CATEGORIAS: Servicio['categoria'][] = ['corte', 'barba', 'tratamiento', 'spa_facial', 'combo']

const FORM_SERVICIO_VACIO = {
  nombre: '',
  categoria: 'corte' as Servicio['categoria'],
  descripcion: '',
  duracion_minutos: '30',
  precio: '',
  barbero_ids: [] as number[],
}

const FORM_BARBERO_VACIO = {
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  especialidad: '',
  comision_porcentaje: '40',
  servicio_ids: [] as number[],
}

export function CatalogoPage() {
  const [pestana, setPestana] = useState<'servicios' | 'barberos'>('servicios')
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const [resServicios, resBarberos] = await Promise.all([
        api.get<Servicio[]>('/servicios'),
        api.get<Barbero[]>('/barberos'),
      ])
      setServicios(resServicios.data)
      setBarberos(resBarberos.data)
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
    <div className="mx-auto max-w-3xl">
      <PageHeader titulo="Catálogo" descripcion="Servicios ofrecidos y perfiles de barberos." />
      <Tabs
        pestanas={[
          { valor: 'servicios', etiqueta: 'Servicios' },
          { valor: 'barberos', etiqueta: 'Barberos' },
        ]}
        activa={pestana}
        onChange={setPestana}
      />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {cargando ? (
        <Spinner etiqueta="Cargando catálogo…" />
      ) : pestana === 'servicios' ? (
        <TabServicios servicios={servicios} barberos={barberos} onCambio={cargar} onError={setError} />
      ) : (
        <TabBarberos barberos={barberos} servicios={servicios} onCambio={cargar} onError={setError} />
      )}
    </div>
  )
}

function TabServicios({
  servicios,
  barberos,
  onCambio,
  onError,
}: {
  servicios: Servicio[]
  barberos: Barbero[]
  onCambio: () => void
  onError: (m: string) => void
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [form, setForm] = useState(FORM_SERVICIO_VACIO)
  const [guardando, setGuardando] = useState(false)

  function abrirCrear() {
    setEditando(null)
    setForm(FORM_SERVICIO_VACIO)
    setMostrarFormulario(true)
  }

  function abrirEditar(servicio: Servicio) {
    setEditando(servicio)
    setForm({
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      descripcion: servicio.descripcion ?? '',
      duracion_minutos: String(servicio.duracion_minutos),
      precio: servicio.precio,
      barbero_ids: barberos.filter((b) => b.servicios.some((s) => s.id === servicio.id)).map((b) => b.id),
    })
    setMostrarFormulario(true)
  }

  function alternarBarbero(id: number) {
    setForm((f) => ({
      ...f,
      barbero_ids: f.barbero_ids.includes(id) ? f.barbero_ids.filter((x) => x !== id) : [...f.barbero_ids, id],
    }))
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    onError('')
    try {
      const payload = {
        nombre: form.nombre,
        categoria: form.categoria,
        descripcion: form.descripcion || null,
        duracion_minutos: Number(form.duracion_minutos),
        precio: Number(form.precio),
        barbero_ids: form.barbero_ids,
      }
      if (editando) {
        await api.put(`/servicios/${editando.id}`, payload)
      } else {
        await api.post('/servicios', payload)
      }
      setMostrarFormulario(false)
      onCambio()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(servicio: Servicio) {
    if (!confirm(`¿Quitar "${servicio.nombre}" del catálogo activo?`)) return
    try {
      await api.delete(`/servicios/${servicio.id}`)
      onCambio()
    } catch (e) {
      onError(mensajeError(e))
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={abrirCrear} className="btn-principal">
          Nuevo servicio
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={guardar} className="tarjeta mb-6 space-y-3 p-5">
          <h2 className="font-semibold text-text">{editando ? 'Editar servicio' : 'Nuevo servicio'}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Nombre</span>
              <input required className="campo" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Categoría</span>
              <select className="campo" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as Servicio['categoria'] }))}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Duración (min)</span>
              <input required type="number" min={1} className="campo" value={form.duracion_minutos} onChange={(e) => setForm((f) => ({ ...f, duracion_minutos: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Precio</span>
              <input required type="number" min={0} step="0.01" className="campo" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text">Descripción (opcional)</span>
            <textarea className="campo" rows={2} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-text">Barberos que lo ofrecen</span>
            <div className="flex flex-wrap gap-2">
              {barberos.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => alternarBarbero(b.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    form.barbero_ids.includes(b.id) ? 'bg-accent text-text-on-accent' : 'bg-neutral-soft text-text-muted'
                  }`}
                >
                  {b.user.nombres} {b.user.apellidos}
                </button>
              ))}
            </div>
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

      <ul className="space-y-2">
        {servicios.map((servicio) => (
          <li key={servicio.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-text">
                {servicio.nombre}
                {!servicio.activo && <span className="ml-2 text-xs text-text-faint">(inactivo)</span>}
              </p>
              <p className="text-sm text-text-muted">
                {servicio.categoria} · {servicio.duracion_minutos} min · Q{Number(servicio.precio).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => abrirEditar(servicio)} className="btn-secundario px-3 py-1.5 text-xs">
                Editar
              </button>
              {servicio.activo && (
                <button onClick={() => desactivar(servicio)} className="btn-texto px-1 text-xs">
                  Desactivar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TabBarberos({
  barberos,
  servicios,
  onCambio,
  onError,
}: {
  barberos: Barbero[]
  servicios: Servicio[]
  onCambio: () => void
  onError: (m: string) => void
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Barbero | null>(null)
  const [form, setForm] = useState(FORM_BARBERO_VACIO)
  const [guardando, setGuardando] = useState(false)

  function abrirCrear() {
    setEditando(null)
    setForm(FORM_BARBERO_VACIO)
    setMostrarFormulario(true)
  }

  function abrirEditar(barbero: Barbero) {
    setEditando(barbero)
    setForm({
      ...FORM_BARBERO_VACIO,
      especialidad: barbero.especialidad ?? '',
      comision_porcentaje: barbero.comision_porcentaje,
      servicio_ids: barbero.servicios.map((s) => s.id),
    })
    setMostrarFormulario(true)
  }

  function alternarServicio(id: number) {
    setForm((f) => ({
      ...f,
      servicio_ids: f.servicio_ids.includes(id) ? f.servicio_ids.filter((x) => x !== id) : [...f.servicio_ids, id],
    }))
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    onError('')
    try {
      if (editando) {
        await api.put(`/barberos/${editando.id}`, {
          especialidad: form.especialidad || null,
          comision_porcentaje: Number(form.comision_porcentaje),
          servicio_ids: form.servicio_ids,
        })
      } else {
        // Un barbero nuevo requiere primero una cuenta de usuario con rol "barbero".
        const { data: usuario } = await api.post('/usuarios', {
          nombres: form.nombres,
          apellidos: form.apellidos,
          email: form.email,
          telefono: form.telefono || undefined,
          password: form.password,
          rol: 'barbero',
        })
        await api.post('/barberos', {
          user_id: usuario.id,
          especialidad: form.especialidad || null,
          comision_porcentaje: Number(form.comision_porcentaje),
          servicio_ids: form.servicio_ids,
        })
      }
      setMostrarFormulario(false)
      onCambio()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={abrirCrear} className="btn-principal">
          Nuevo barbero
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={guardar} className="tarjeta mb-6 space-y-3 p-5">
          <h2 className="font-semibold text-text">{editando ? 'Editar barbero' : 'Nuevo barbero'}</h2>

          {!editando && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Nombres</span>
                <input required className="campo" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Apellidos</span>
                <input required className="campo" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Correo</span>
                <input required type="email" className="campo" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Teléfono</span>
                <input className="campo" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Contraseña temporal</span>
                <input required type="password" minLength={8} className="campo" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Especialidad</span>
              <input className="campo" value={form.especialidad} onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Comisión (%)</span>
              <input required type="number" min={0} max={100} className="campo" value={form.comision_porcentaje} onChange={(e) => setForm((f) => ({ ...f, comision_porcentaje: e.target.value }))} />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-text">Servicios que presta</span>
            <div className="flex flex-wrap gap-2">
              {servicios.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => alternarServicio(s.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    form.servicio_ids.includes(s.id) ? 'bg-accent text-text-on-accent' : 'bg-neutral-soft text-text-muted'
                  }`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
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

      <ul className="space-y-2">
        {barberos.map((barbero) => (
          <li key={barbero.id} className="tarjeta flex items-center gap-4 p-4">
            <ImagenPlaceholder variante="avatar" etiqueta="Foto" className="h-11 w-11 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-text">
                {barbero.user.nombres} {barbero.user.apellidos}
              </p>
              <p className="text-sm text-text-muted">
                {barbero.especialidad ?? 'Sin especialidad'} · Comisión {Number(barbero.comision_porcentaje)}%
              </p>
            </div>
            <button onClick={() => abrirEditar(barbero)} className="btn-secundario px-3 py-1.5 text-xs">
              Editar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
