import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import type { PaginaUsuarios, Usuario } from '../../types'

const ROLES: Usuario['rol'][] = ['administrador', 'barbero', 'recepcionista', 'cliente']
const ESTADOS: Usuario['estado'][] = ['activo', 'inactivo', 'suspendido']

const FORM_VACIO = {
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  rol: 'cliente' as Usuario['rol'],
  estado: 'activo' as Usuario['estado'],
}

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filtroRol, setFiltroRol] = useState<string>('')
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<PaginaUsuarios>('/usuarios', {
        params: { rol: filtroRol || undefined, buscar: buscar || undefined },
      })
      setUsuarios(data.data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(cargar, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol, buscar])

  function abrirCrear() {
    setEditando(null)
    setForm(FORM_VACIO)
    setMostrarFormulario(true)
  }

  function abrirEditar(usuario: Usuario) {
    setEditando(usuario)
    setForm({ ...FORM_VACIO, nombres: usuario.nombres, apellidos: usuario.apellidos, telefono: usuario.telefono ?? '', rol: usuario.rol, estado: usuario.estado })
    setMostrarFormulario(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, {
          nombres: form.nombres,
          apellidos: form.apellidos,
          telefono: form.telefono || null,
          rol: form.rol,
          estado: form.estado,
        })
      } else {
        await api.post('/usuarios', {
          nombres: form.nombres,
          apellidos: form.apellidos,
          email: form.email,
          telefono: form.telefono || undefined,
          password: form.password,
          rol: form.rol,
        })
      }
      setMostrarFormulario(false)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(usuario: Usuario) {
    if (!confirm(`¿Desactivar la cuenta de ${usuario.nombres} ${usuario.apellidos}?`)) return
    try {
      await api.delete(`/usuarios/${usuario.id}`)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Usuarios"
        descripcion="Cuentas de clientes y personal del sistema."
        accion={
          <button onClick={abrirCrear} className="btn-principal">
            Nuevo usuario
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="campo max-w-xs"
          placeholder="Buscar por nombre o correo…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <select className="campo w-auto" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {mostrarFormulario && (
        <form onSubmit={guardar} className="tarjeta mb-6 space-y-3 p-5">
          <h2 className="font-semibold text-text">{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Nombres</span>
              <input required className="campo" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Apellidos</span>
              <input required className="campo" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />
            </label>
            {!editando && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Correo</span>
                <input required type="email" className="campo" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Teléfono</span>
              <input className="campo" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
            </label>
            {!editando && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Contraseña temporal</span>
                <input required type="password" minLength={8} className="campo" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Rol</span>
              <select className="campo" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as Usuario['rol'] }))}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {editando && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text">Estado</span>
                <select className="campo" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as Usuario['estado'] }))}>
                  {ESTADOS.map((es) => (
                    <option key={es} value={es}>
                      {es}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {!editando && (
            <p className="text-xs text-text-faint">
              Nota: para crear una cuenta con rol "barbero" y que aparezca en el catálogo, luego completa su perfil profesional desde Catálogo → Barberos.
            </p>
          )}
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

      {cargando ? (
        <Spinner etiqueta="Cargando usuarios…" />
      ) : usuarios.length === 0 ? (
        <p className="text-text-muted">No se encontraron usuarios.</p>
      ) : (
        <ul className="space-y-2">
          {usuarios.map((usuario) => (
            <li key={usuario.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-text">
                  {usuario.nombres} {usuario.apellidos}
                </p>
                <p className="text-sm text-text-muted">
                  {usuario.email} · {usuario.rol} ·{' '}
                  <span style={usuario.estado !== 'activo' ? { color: 'var(--color-danger)' } : undefined}>{usuario.estado}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirEditar(usuario)} className="btn-secundario px-3 py-1.5 text-xs">
                  Editar
                </button>
                {usuario.estado === 'activo' && (
                  <button onClick={() => desactivar(usuario)} className="btn-texto px-1 text-xs">
                    Desactivar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
