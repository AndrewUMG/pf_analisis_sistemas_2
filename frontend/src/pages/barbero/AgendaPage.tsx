import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { EstadoBadge } from '../../components/EstadoBadge'
import { PageHeader } from '../../components/PageHeader'
import type { AgendaDia, Cita } from '../../types'

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AgendaPage() {
  const { usuario } = useAuth()
  const barberoId = usuario?.barbero?.id

  const [fecha, setFecha] = useState(hoyISO())
  const [agenda, setAgenda] = useState<AgendaDia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesandoId, setProcesandoId] = useState<number | null>(null)

  async function cargar() {
    if (!barberoId) return
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<AgendaDia>(`/barberos/${barberoId}/agenda`, { params: { fecha } })
      setAgenda(data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, barberoId])

  async function iniciar(cita: Cita, confirmarInicioTemprano = false) {
    setProcesandoId(cita.id)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/iniciar`, { confirmar_inicio_temprano: confirmarInicioTemprano })
      await cargar()
    } catch (e) {
      const detalles = (e as { response?: { data?: { requiere_confirmacion?: boolean } } })?.response?.data
      if (detalles?.requiere_confirmacion && confirm('Esta cita inicia con mucha anticipación respecto a lo programado. ¿Iniciar de todas formas?')) {
        await iniciar(cita, true)
        return
      }
      setError(mensajeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  async function finalizar(cita: Cita) {
    setProcesandoId(cita.id)
    setError('')
    try {
      const { data } = await api.post(`/citas/${cita.id}/finalizar`)
      if (data?.advertencia) setError(data.advertencia)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  async function marcarAusente(cita: Cita) {
    if (!confirm('¿Confirmas que el cliente no se presentó?')) return
    setProcesandoId(cita.id)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/marcar-ausente`)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  if (!barberoId) {
    return <Alerta tipo="error" mensaje="Tu cuenta no tiene un perfil de barbero asociado." />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Mi agenda"
        descripcion="Citas del día y resumen de comisiones."
        accion={
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="campo w-auto"
          />
        }
      />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {cargando ? (
        <Spinner etiqueta="Cargando agenda…" />
      ) : agenda ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="tarjeta p-5">
              <p className="text-sm text-text-muted">Citas atendidas</p>
              <p className="mt-1 text-2xl font-semibold text-text">{agenda.citas_atendidas}</p>
            </div>
            <div className="tarjeta p-5">
              <p className="text-sm text-text-muted">Comisión del día</p>
              <p className="mt-1 text-2xl font-semibold text-accent-hover">Q{Number(agenda.comision_del_dia).toFixed(2)}</p>
            </div>
          </div>

          {agenda.citas.length === 0 ? (
            <p className="text-text-muted">No tienes citas programadas para esta fecha.</p>
          ) : (
            <ul className="space-y-3">
              {agenda.citas.map((cita) => (
                <li key={cita.id} className="tarjeta p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">
                        {cita.hora_inicio.slice(0, 5)} · {cita.cliente?.nombres} {cita.cliente?.apellidos}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        {cita.detalles?.map((d) => d.servicio?.nombre).filter(Boolean).join(', ')}
                      </p>
                      {cita.notas && <p className="mt-1 text-sm italic text-text-faint">"{cita.notas}"</p>}
                    </div>
                    <EstadoBadge estado={cita.estado} />
                  </div>

                  {(cita.estado === 'confirmada' || cita.estado === 'en_atencion') && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                      {cita.estado === 'confirmada' && (
                        <>
                          <button
                            onClick={() => iniciar(cita)}
                            disabled={procesandoId === cita.id}
                            className="btn-principal px-3 py-1.5 text-xs"
                          >
                            Iniciar atención
                          </button>
                          <button
                            onClick={() => marcarAusente(cita)}
                            disabled={procesandoId === cita.id}
                            className="btn-secundario px-3 py-1.5 text-xs"
                          >
                            Marcar ausente
                          </button>
                        </>
                      )}
                      {cita.estado === 'en_atencion' && (
                        <button
                          onClick={() => finalizar(cita)}
                          disabled={procesandoId === cita.id}
                          className="btn-principal px-3 py-1.5 text-xs"
                        >
                          Finalizar atención
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
