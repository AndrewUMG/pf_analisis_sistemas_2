import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Campo, InputPassword } from '../components/Campo'
import { AuthLayout } from '../components/sitio/AuthLayout'
import { FuerzaPassword } from '../components/sitio/FuerzaPassword'

export function RestablecerPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [errorConfirmacion, setErrorConfirmacion] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmacion) {
      setErrorConfirmacion('Las contraseñas no coinciden.')
      return
    }
    setEnviando(true)
    try {
      await api.post('/auth/restablecer-password', { email, token, password, password_confirmation: confirmacion })
      navigate('/login', { replace: true, state: { restablecida: true } })
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const enlaceInvalido = !email || !token

  return (
    <AuthLayout
      titulo="Crea una nueva contraseña"
      subtitulo="Elige una contraseña segura para tu cuenta."
      pie={
        <Link to="/login" className="font-semibold text-text underline decoration-accent-strong underline-offset-4">
          Volver a iniciar sesión
        </Link>
      }
    >
      {enlaceInvalido ? (
        <div role="alert" className="space-y-4">
          <Alerta tipo="error" mensaje="El enlace no es válido. Solicita uno nuevo." />
          <Link to="/olvide-password" className="btn-principal btn-lg w-full">
            Solicitar otro enlace
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-6">
          {error && (
            <div role="alert">
              <Alerta tipo="error" mensaje={error} />
            </div>
          )}
          <div>
            <Campo etiqueta="Nueva contraseña">
              {(p) => <InputPassword {...p} required minLength={8} autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Campo>
            <FuerzaPassword valor={password} />
          </div>
          <Campo etiqueta="Confirmar contraseña" error={errorConfirmacion}>
            {(p) => (
              <InputPassword
                {...p}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => {
                  setConfirmacion(e.target.value)
                  setErrorConfirmacion('')
                }}
              />
            )}
          </Campo>
          <button type="submit" disabled={enviando} className="btn-principal btn-lg w-full">
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
