import axios from 'axios'
import type { ErrorApi } from '../types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
})

// Adjunta el token Bearer guardado tras el login en cada petición saliente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token ya no es válido, se limpia la sesión local para forzar un nuevo login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    }
    return Promise.reject(error)
  }
)

/** Extrae un mensaje de error legible sin importar si viene de NegocioException o de una regla de validación. */
export function mensajeError(error: unknown): string {
  const data = (error as { response?: { data?: ErrorApi } })?.response?.data
  if (!data) return 'Ocurrió un error inesperado. Verifica tu conexión con el servidor.'
  if (data.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  return data.mensaje ?? data.message ?? 'Ocurrió un error inesperado.'
}
