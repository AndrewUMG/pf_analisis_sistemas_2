import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Campo, InputPassword } from '../components/Campo'
import { AuthLayout } from '../components/sitio/AuthLayout'
import { rutaInicioPara } from '../components/RoleRoute'

export function LoginPage() {
  const { iniciarSesion, cargando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const usuario = await iniciarSesion(email, password)
      const destino = (location.state as { desde?: string } | null)?.desde ?? rutaInicioPara(usuario.rol)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  return (
    <AuthLayout
      titulo="Bienvenido de nuevo"
      subtitulo="Inicia sesión para reservar y administrar tus citas."
      pie={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-text underline decoration-accent-strong underline-offset-4">
            Crea una gratis
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-5" noValidate={false}>
        {error && (
          <div role="alert">
            <Alerta tipo="error" mensaje={error} />
          </div>
        )}

        <Campo etiqueta="Correo electrónico">
          {(p) => <input {...p} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" placeholder="tucorreo@ejemplo.com" />}
        </Campo>

        <Campo etiqueta="Contraseña">
          {(p) => <InputPassword {...p} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" />}
        </Campo>

        <button type="submit" disabled={cargando} className="btn-principal btn-lg w-full">
          {cargando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>

        {import.meta.env.DEV && (
          <p className="rounded-lg bg-bg-subtle p-3 text-xs text-text-muted">
            Modo desarrollo · demo: <code className="text-text">admin@studiolabarber.local</code> / <code className="text-text">password123</code>
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
