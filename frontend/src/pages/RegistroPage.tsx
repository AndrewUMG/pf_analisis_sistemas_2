import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Campo, InputPassword } from '../components/Campo'
import { AuthLayout } from '../components/sitio/AuthLayout'
import { FuerzaPassword } from '../components/sitio/FuerzaPassword'

export function RegistroPage() {
  const { registrarse, cargando } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', telefono: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [errorConfirmacion, setErrorConfirmacion] = useState('')

  function actualizar(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (campo === 'password' || campo === 'password_confirmation') setErrorConfirmacion('')
  }

  const confirmacion = form.password_confirmation
  const coincide = confirmacion.length > 0 && confirmacion === form.password
  const coincideMal = confirmacion.length >= form.password.length && confirmacion.length > 0 && !coincide

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirmation) {
      setErrorConfirmacion('Las contraseñas no coinciden.')
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
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="Reserva tu primera cita en menos de un minuto."
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-text underline decoration-accent-strong underline-offset-4">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-6">
        {error && (
          <div role="alert">
            <Alerta tipo="error" mensaje={error} />
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo etiqueta="Nombres">{(p) => <input {...p} required autoComplete="given-name" className="campo" value={form.nombres} onChange={(e) => actualizar('nombres', e.target.value)} />}</Campo>
          <Campo etiqueta="Apellidos">{(p) => <input {...p} required autoComplete="family-name" className="campo" value={form.apellidos} onChange={(e) => actualizar('apellidos', e.target.value)} />}</Campo>
        </div>

        <Campo etiqueta="Correo electrónico">
          {(p) => <input {...p} type="email" required autoComplete="email" className="campo" value={form.email} onChange={(e) => actualizar('email', e.target.value)} placeholder="tucorreo@ejemplo.com" />}
        </Campo>

        <Campo etiqueta="Teléfono (opcional)" ayuda="Lo usamos para enviarte recordatorios por WhatsApp.">
          {(p) => <input {...p} type="tel" autoComplete="tel" inputMode="tel" className="campo" value={form.telefono} onChange={(e) => actualizar('telefono', e.target.value)} />}
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Campo etiqueta="Contraseña">
              {(p) => <InputPassword {...p} required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => actualizar('password', e.target.value)} />}
            </Campo>
            <FuerzaPassword valor={form.password} />
          </div>
          <Campo
            etiqueta="Confirmar contraseña"
            error={errorConfirmacion || (coincideMal ? 'Las contraseñas no coinciden.' : undefined)}
            ayuda={coincide ? 'Las contraseñas coinciden.' : undefined}
          >
            {(p) => <InputPassword {...p} required minLength={8} autoComplete="new-password" value={form.password_confirmation} onChange={(e) => actualizar('password_confirmation', e.target.value)} />}
          </Campo>
        </div>

        <button type="submit" disabled={cargando} className="btn-principal btn-lg mt-2 w-full">
          {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p className="text-center text-xs text-text-muted">Usaremos tus datos solo para gestionar tus citas y enviarte recordatorios.</p>
      </form>
    </AuthLayout>
  )
}
