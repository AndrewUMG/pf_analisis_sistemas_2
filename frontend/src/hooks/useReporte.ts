import { useEffect, useState } from 'react'
import { api, mensajeError } from '../api/client'

/** Carga un reporte por rango de fechas evitando pisar respuestas viejas al cambiar el filtro. */
export function useReporte<T>(ruta: string, desde: string, hasta: string, onError: (m: string) => void) {
  const [datos, setDatos] = useState<T | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    api
      .get<T>(ruta, { params: { desde, hasta } })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => vigente && onError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta, desde, hasta])

  return { datos, cargando }
}
