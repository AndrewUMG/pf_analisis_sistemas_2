import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'

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
      await iniciarSesion(email, password)
      const destino = (location.state as { desde?: string } | null)?.desde ?? '/'
      navigate(destino, { replace: true })
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  return (
    <div className="tarjeta mx-auto grid max-w-4xl grid-cols-1 overflow-hidden md:grid-cols-2">
      <div className="hidden bg-bg-subtle p-8 md:flex md:flex-col md:justify-between">
        <ImagenPlaceholder etiqueta="Foto del local" className="aspect-square w-full" />
        <p className="mt-6 text-sm text-text-muted">
          "Reservar mi cita nunca fue tan fácil." — así nos describen nuestros clientes.
        </p>
      </div>

      <div className="p-8">
        <h1 className="text-2xl font-semibold text-text">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-text-muted">Accede para reservar y ver tus citas.</p>

        <form onSubmit={enviar} className="mt-6 space-y-4">
          {error && <Alerta tipo="error" mensaje={error} />}

          <Campo etiqueta="Correo electrónico">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="campo"
              placeholder="tucorreo@ejemplo.com"
            />
          </Campo>

          <Campo etiqueta="Contraseña">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="campo"
              placeholder="••••••••"
            />
          </Campo>

          <button type="submit" disabled={cargando} className="btn-principal w-full">
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-accent-hover hover:underline">
            Regístrate
          </Link>
        </p>

        <div className="mt-4 rounded-lg bg-bg-subtle p-3 text-xs text-text-muted">
          Demo: <code className="text-text">admin@studiolabarber.local</code> / <code className="text-text">password123</code>
        </div>
      </div>
    </div>
  )
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text">{etiqueta}</span>
      {children}
    </label>
  )
}
