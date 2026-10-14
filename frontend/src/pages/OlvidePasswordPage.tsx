import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Campo } from '../components/Campo'
import { AuthLayout } from '../components/sitio/AuthLayout'

export function OlvidePasswordPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await api.post('/auth/olvide-password', { email })
      setEnviado(true)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="¿Olvidaste tu contraseña?"
      subtitulo="Escribe tu correo y te enviaremos un enlace para crear una nueva."
      pie={
        <Link to="/login" className="font-semibold text-text underline decoration-accent-strong underline-offset-4">
          Volver a iniciar sesión
        </Link>
      }
    >
      {enviado ? (
        <div role="status" className="space-y-4">
          <Alerta tipo="exito" mensaje="Si el correo está registrado, te enviamos un enlace de recuperación. Revisa tu bandeja de entrada y la carpeta de spam." />
          <p className="text-sm text-text-muted">El enlace es válido por 60 minutos.</p>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-6">
          {error && (
            <div role="alert">
              <Alerta tipo="error" mensaje={error} />
            </div>
          )}
          <Campo etiqueta="Correo electrónico">
            {(p) => <input {...p} type="email" required autoFocus autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" placeholder="tucorreo@ejemplo.com" />}
          </Campo>
          <button type="submit" disabled={enviando} className="btn-principal btn-lg w-full">
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
