import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { FilasSkeleton } from '../../components/Skeleton'
import { PageHeader } from '../../components/PageHeader'
import { Modal } from '../../components/Modal'
import { Campo, InputPassword } from '../../components/Campo'
import { EstadoVacio, Panel } from '../../components/panel/Piezas'
import { IconPersonas } from '../../components/Icons'
import type { PaginaUsuarios, Usuario } from '../../types'

const ROLES: Usuario['rol'][] = ['administrador', 'barbero', 'recepcionista', 'cliente']
const ETIQUETA_ROL: Record<Usuario['rol'], string> = { administrador: 'Administrador', barbero: 'Barbero', recepcionista: 'Recepción', cliente: 'Cliente' }
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
  const [aDesactivar, setADesactivar] = useState<Usuario | null>(null)

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
    try {
      await api.delete(`/usuarios/${usuario.id}`)
      setADesactivar(null)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Negocio"
        titulo="Usuarios"
        descripcion="Cuentas de clientes y personal del sistema."
        accion={
          <button onClick={abrirCrear} className="btn-principal">
            Nuevo usuario
          </button>
        }
      />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      <Panel className="overflow-hidden" >
        <div className="-m-5 mb-4 flex flex-wrap items-center gap-3 border-b p-4">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="sr-only">Buscar por nombre o correo</span>
            <input type="search" className="campo" placeholder="Buscar por nombre o correo…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          </label>
          <label>
            <span className="sr-only">Filtrar por rol</span>
            <select className="campo w-auto" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="">Todos los roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_ROL[r]}
                </option>
              ))}
            </select>
          </label>
          <p className="ml-auto text-sm text-text-muted" aria-live="polite">
            {cargando ? '' : `${usuarios.length} ${usuarios.length === 1 ? 'usuario' : 'usuarios'}`}
          </p>
        </div>

        {cargando ? (
          <FilasSkeleton cantidad={4} />
        ) : usuarios.length === 0 ? (
          <EstadoVacio icono={IconPersonas} titulo="No se encontraron usuarios" texto="Prueba con otro nombre o quita el filtro de rol." />
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y bg-bg-subtle text-xs uppercase tracking-wider text-text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">Usuario</th>
                  <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell">Contacto</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Rol</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-bg-subtle/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-hover" aria-hidden="true">
                          {u.nombres.charAt(0)}
                          {u.apellidos.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text">{u.nombres} {u.apellidos}</p>
                          <p className="truncate text-xs text-text-muted md:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3.5 text-text-muted md:table-cell">
                      <p>{u.email}</p>
                      {u.telefono && <p className="text-xs">{u.telefono}</p>}
                    </td>
                    <td className="px-3 py-3.5"><span className="badge bg-neutral-soft text-text">{ETIQUETA_ROL[u.rol]}</span></td>
                    <td className="px-3 py-3.5">
                      <span
                        className="badge"
                        style={u.estado === 'activo' ? { backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)' } : { backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
                      >
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => abrirEditar(u)} className="btn-secundario px-3 py-1.5 text-xs">Editar</button>
                        {u.estado === 'activo' && (
                          <button onClick={() => setADesactivar(u)} className="btn-texto px-2 text-xs">Desactivar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {mostrarFormulario && (
        <Modal titulo={editando ? 'Editar usuario' : 'Nuevo usuario'} descripcion={editando ? undefined : 'Para que un barbero aparezca en el catálogo, completa después su perfil en Catálogo → Barberos.'} onClose={() => setMostrarFormulario(false)}>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombres">{(p) => <input {...p} required className="campo" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />}</Campo>
              <Campo etiqueta="Apellidos">{(p) => <input {...p} required className="campo" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />}</Campo>
            </div>
            {!editando && (
              <Campo etiqueta="Correo">{(p) => <input {...p} required type="email" className="campo" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />}</Campo>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Teléfono">{(p) => <input {...p} className="campo" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />}</Campo>
              {!editando && (
                <Campo etiqueta="Contraseña temporal" ayuda="Mínimo 8 caracteres.">{(p) => <InputPassword {...p} required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />}</Campo>
              )}
              <Campo etiqueta="Rol">
                {(p) => (
                  <select {...p} className="campo" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as Usuario['rol'] }))}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ETIQUETA_ROL[r]}</option>
                    ))}
                  </select>
                )}
              </Campo>
              {editando && (
                <Campo etiqueta="Estado">
                  {(p) => (
                    <select {...p} className="campo" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as Usuario['estado'] }))}>
                      {ESTADOS.map((es) => (
                        <option key={es} value={es}>{es}</option>
                      ))}
                    </select>
                  )}
                </Campo>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setMostrarFormulario(false)} className="btn-secundario">Cancelar</button>
              <button type="submit" disabled={guardando} className="btn-principal">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {aDesactivar && (
        <Modal titulo={`¿Desactivar a ${aDesactivar.nombres} ${aDesactivar.apellidos}?`} descripcion="No podrá iniciar sesión, pero se conserva su historial de citas y ventas." onClose={() => setADesactivar(null)}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setADesactivar(null)} className="btn-secundario">Cancelar</button>
            <button type="button" onClick={() => desactivar(aDesactivar)} className="btn-peligro">Sí, desactivar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
