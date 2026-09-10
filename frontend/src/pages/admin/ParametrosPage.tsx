import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import type { ParametroSistema } from '../../types'

const ETIQUETAS: Record<string, string> = {
  holgura_entre_servicios_minutos: 'Holgura entre citas consecutivas (minutos)',
  anticipacion_minima_horas: 'Anticipación mínima para reservar/cancelar (horas)',
  tolerancia_ausencia_minutos: 'Tolerancia antes de marcar ausente (minutos)',
}

export function ParametrosPage() {
  const [parametros, setParametros] = useState<ParametroSistema[]>([])
  const [valores, setValores] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [guardandoClave, setGuardandoClave] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<ParametroSistema[]>('/parametros')
      setParametros(data)
      setValores(Object.fromEntries(data.map((p) => [p.clave, p.valor])))
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function guardar(parametro: ParametroSistema) {
    setGuardandoClave(parametro.clave)
    setError('')
    setExito('')
    try {
      await api.put(`/parametros/${parametro.clave}`, {
        valor: valores[parametro.clave],
        descripcion: parametro.descripcion ?? undefined,
      })
      setExito(`"${ETIQUETAS[parametro.clave] ?? parametro.clave}" actualizado.`)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardandoClave(null)
    }
  }

  if (cargando) return <Spinner etiqueta="Cargando parámetros…" />

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titulo="Parámetros del sistema" descripcion="Reglas de negocio configurables sin tocar código." />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}
      {exito && (
        <div className="mb-4">
          <Alerta tipo="exito" mensaje={exito} />
        </div>
      )}

      <ul className="space-y-3">
        {parametros.map((parametro) => (
          <li key={parametro.clave} className="tarjeta p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">{ETIQUETAS[parametro.clave] ?? parametro.clave}</span>
              {parametro.descripcion && <span className="mb-2 block text-xs text-text-muted">{parametro.descripcion}</span>}
              <div className="flex gap-2">
                <input
                  className="campo"
                  value={valores[parametro.clave] ?? ''}
                  onChange={(e) => setValores((v) => ({ ...v, [parametro.clave]: e.target.value }))}
                />
                <button
                  onClick={() => guardar(parametro)}
                  disabled={guardandoClave === parametro.clave}
                  className="btn-principal shrink-0"
                >
                  {guardandoClave === parametro.clave ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
