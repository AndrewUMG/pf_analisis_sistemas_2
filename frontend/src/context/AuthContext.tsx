import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Usuario } from '../types'

interface AuthContextValue {
  usuario: Usuario | null
  cargando: boolean
  iniciarSesion: (email: string, password: string) => Promise<void>
  registrarse: (datos: DatosRegistro) => Promise<void>
  cerrarSesion: () => Promise<void>
}

interface DatosRegistro {
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  password: string
  password_confirmation: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function usuarioGuardado(): Usuario | null {
  const crudo = localStorage.getItem('usuario')
  return crudo ? (JSON.parse(crudo) as Usuario) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => usuarioGuardado())
  const [cargando, setCargando] = useState(false)

  function guardarSesion(usuario: Usuario, token: string) {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    setUsuario(usuario)
  }

  async function iniciarSesion(email: string, password: string) {
    setCargando(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      guardarSesion(data.usuario, data.token)
    } finally {
      setCargando(false)
    }
  }

  async function registrarse(datos: DatosRegistro) {
    setCargando(true)
    try {
      const { data } = await api.post('/auth/registro', datos)
      guardarSesion(data.usuario, data.token)
    } finally {
      setCargando(false)
    }
  }

  async function cerrarSesion() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Si el token ya expiró en el servidor, igual limpiamos la sesión local.
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, registrarse, cerrarSesion }),
    [usuario, cargando]
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return contexto
}
