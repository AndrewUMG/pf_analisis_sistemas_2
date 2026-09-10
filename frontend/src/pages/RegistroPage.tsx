import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'

export function RegistroPage() {
  const { registrarse, cargando } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState('')

  function actualizar(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      await registrarse(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-carbon-800 bg-carbon-900 p-8">
        <h1 className="text-2xl font-semibold text-carbon-100">Crear cuenta</h1>
        <p className="mt-1 text-sm text-carbon-400">Regístrate para reservar tu próxima cita.</p>

        <form onSubmit={enviar} className="mt-6 space-y-4">
          {error && <Alerta tipo="error" mensaje={error} />}

          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Nombres">
              <input required className="campo" value={form.nombres} onChange={(e) => actualizar('nombres', e.target.value)} />
            </Campo>
            <Campo etiqueta="Apellidos">
              <input required className="campo" value={form.apellidos} onChange={(e) => actualizar('apellidos', e.target.value)} />
            </Campo>
          </div>

          <Campo etiqueta="Correo electrónico">
            <input
              type="email"
              required
              className="campo"
              value={form.email}
              onChange={(e) => actualizar('email', e.target.value)}
            />
          </Campo>

          <Campo etiqueta="Teléfono (opcional)">
            <input className="campo" value={form.telefono} onChange={(e) => actualizar('telefono', e.target.value)} />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Contraseña">
              <input
                type="password"
                required
                minLength={8}
                className="campo"
                value={form.password}
                onChange={(e) => actualizar('password', e.target.value)}
              />
            </Campo>
            <Campo etiqueta="Confirmar">
              <input
                type="password"
                required
                minLength={8}
                className="campo"
                value={form.password_confirmation}
                onChange={(e) => actualizar('password_confirmation', e.target.value)}
              />
            </Campo>
          </div>

          <button type="submit" disabled={cargando} className="btn-principal w-full">
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-carbon-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-gold-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-carbon-300">{etiqueta}</span>
      {children}
    </label>
  )
}
