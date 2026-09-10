import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

/** Solo deja pasar a clientes con sesión iniciada; el resto va al login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />

  return <>{children}</>
}
