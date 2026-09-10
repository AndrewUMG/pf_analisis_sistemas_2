import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Usuario } from '../types'

/** Exige sesión iniciada y que el rol del usuario esté en la lista permitida. */
export function RoleRoute({ roles, children }: { roles: Usuario['rol'][]; children: ReactNode }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />
  if (!roles.includes(usuario.rol)) return <Navigate to="/" replace />

  return <>{children}</>
}

/** A dónde debe aterrizar cada rol justo después de iniciar sesión. */
export function rutaInicioPara(rol: Usuario['rol']): string {
  switch (rol) {
    case 'barbero':
      return '/barbero/agenda'
    case 'recepcionista':
      return '/recepcion/caja'
    case 'administrador':
      return '/admin/catalogo'
    default:
      return '/'
  }
}
