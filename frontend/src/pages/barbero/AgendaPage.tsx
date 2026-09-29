import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Alerta } from '../../components/Alerta'
import { EstadoBadge } from '../../components/EstadoBadge'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { FilasSkeleton } from '../../components/Skeleton'
import { EstadoVacio, StatCard } from '../../components/panel/Piezas'
import { IconCalendario, IconCheck, IconChevron, IconReloj } from '../../components/Icons'
import { formatoFechaLarga, formatoHora, hoyLocalISO } from '../../utils/fechas'
import type { AgendaDia, Cita } from '../../types'

function moverDia(iso: string, delta: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  const f = new Date(a, m - 1, d + delta)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function AgendaPage() {
  const { usuario } = useAuth()
  const barberoId = usuario?.barbero?.id

  const [fecha, setFecha] = useState(hoyLocalISO())
  const [agenda, setAgenda] = useState<AgendaDia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [procesandoId, setProcesandoId] = useState<number | null>(null)
  const [confirmarInicio, setConfirmarInicio] = useState<Cita | null>(null)
  const [confirmarAusente, setConfirmarAusente] = useState<Cita | null>(null)

  async function cargar() {
    if (!barberoId) return
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
    setCargando(true)
    setError('')
    setAviso('')
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, barberoId])

  async function iniciar(cita: Cita, temprano = false) {
    setProcesandoId(cita.id)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/iniciar`, { confirmar_inicio_temprano: temprano })
      setConfirmarInicio(null)
      await cargar()
    } catch (e) {
      const detalles = (e as { response?: { data?: { detalles?: { requiere_confirmacion?: boolean } } } })?.response?.data?.detalles
      if (detalles?.requiere_confirmacion) setConfirmarInicio(cita)
      else setError(mensajeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  async function finalizar(cita: Cita) {
    setProcesandoId(cita.id)
    setError('')
    setAviso('')
    try {
      const { data } = await api.post(`/citas/${cita.id}/finalizar`)
      if (data?.advertencia) setAviso(data.advertencia)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  async function marcarAusente(cita: Cita) {
    setProcesandoId(cita.id)
    setError('')
    try {
      await api.post(`/citas/${cita.id}/marcar-ausente`)
      setConfirmarAusente(null)
      await cargar()
    } catch (e) {
      setConfirmarAusente(null)
      setError(mensajeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  if (!barberoId) return <Alerta tipo="error" mensaje="Tu cuenta no tiene un perfil de barbero asociado." />

  const pendientes = agenda?.citas.filter((c) => c.estado === 'confirmada' || c.estado === 'en_atencion').length ?? 0
  const esHoy = fecha === hoyLocalISO()

  return (
    <div>
      <PageHeader
        eyebrow="Mi jornada"
        titulo="Mi agenda"
        descripcion={mayuscula(formatoFechaLarga(fecha))}
        accion={
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-lg border text-text hover:border-brand" onClick={() => setFecha(moverDia(fecha, -1))} aria-label="Día anterior">
              <IconChevron className="h-4 w-4 rotate-180" />
            </button>
            <input type="date" aria-label="Fecha de la agenda" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} className="campo w-auto" />
            <button className="grid h-10 w-10 place-items-center rounded-lg border text-text hover:border-brand" onClick={() => setFecha(moverDia(fecha, 1))} aria-label="Día siguiente">
              <IconChevron className="h-4 w-4" />
            </button>
            {!esHoy && (
              <button className="btn-secundario" onClick={() => setFecha(hoyLocalISO())}>
                Hoy
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}
      {aviso && (
        <div className="mb-4" role="status">
          <Alerta tipo="error" mensaje={aviso} />
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Citas del día" valor={agenda?.citas.length ?? '—'} icono={IconCalendario} tono="marca" />
        <StatCard etiqueta="Por atender" valor={agenda ? pendientes : '—'} icono={IconReloj} tono="info" />
        <StatCard etiqueta="Comisión del día" valor={agenda ? `Q${Number(agenda.comision_del_dia).toFixed(2)}` : '—'} ayuda={agenda ? `${agenda.citas_atendidas} atendidas` : undefined} icono={IconCheck} tono="acento" />
      </div>

      {cargando ? (
        <FilasSkeleton cantidad={3} />
      ) : !agenda || agenda.citas.length === 0 ? (
        <EstadoVacio icono={IconCalendario} titulo="Sin citas para este día" texto="Cuando los clientes reserven contigo, aparecerán aquí en orden." />
      ) : (
        <ol className="space-y-4">
          {agenda.citas.map((c) => {
            const activa = c.estado === 'en_atencion'
            return (
              <li key={c.id} className="grid gap-3 sm:grid-cols-[4.5rem_1fr] sm:gap-5">
                <div className="flex items-baseline gap-2 sm:block sm:pt-4 sm:text-right">
                  <p className="font-serif text-xl font-semibold leading-none text-text">{formatoHora(c.hora_inicio)}</p>
                  <p className="text-xs text-text-muted sm:mt-1">hasta {formatoHora(c.hora_fin)}</p>
                </div>
                <div className="tarjeta p-4 sm:p-5" style={activa ? { borderColor: 'var(--color-accent-strong)', boxShadow: '0 0 0 1px var(--color-accent-strong), var(--shadow-card)' } : undefined}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-text">
                        {c.cliente?.nombres} {c.cliente?.apellidos}
                      </p>
                      <p className="text-sm text-text-muted">{c.detalles?.map((d) => d.servicio?.nombre).filter(Boolean).join(' · ')}</p>
                      {c.notas && <p className="mt-2 rounded-lg bg-bg-subtle p-2.5 text-sm italic text-text-muted">“{c.notas}”</p>}
                    </div>
                    <EstadoBadge estado={c.estado} />
                  </div>

                  {(c.estado === 'confirmada' || c.estado === 'en_atencion') && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                      {c.estado === 'confirmada' && (
                        <>
                          <button onClick={() => iniciar(c)} disabled={procesandoId === c.id} className="btn-principal px-4 py-2">
                            Iniciar atención
                          </button>
                          <button onClick={() => setConfirmarAusente(c)} disabled={procesandoId === c.id} className="btn-secundario px-4 py-2">
                            Marcar ausente
                          </button>
                        </>
                      )}
                      {c.estado === 'en_atencion' && (
                        <button onClick={() => finalizar(c)} disabled={procesandoId === c.id} className="btn-dorado px-4 py-2">
                          {procesandoId === c.id ? 'Finalizando…' : 'Finalizar atención'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {confirmarInicio && (
        <Modal titulo="Esta cita aún no toca" descripcion="Faltan más de 30 minutos para la hora programada. ¿Quieres iniciarla de todas formas?" onClose={() => setConfirmarInicio(null)}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirmarInicio(null)} className="btn-secundario">Esperar</button>
            <button type="button" onClick={() => iniciar(confirmarInicio, true)} className="btn-principal">Iniciar ahora</button>
          </div>
        </Modal>
      )}

      {confirmarAusente && (
        <Modal titulo="¿El cliente no se presentó?" descripcion={`Se libera el horario de ${confirmarAusente.cliente?.nombres ?? 'el cliente'} y la cita queda como ausente.`} onClose={() => setConfirmarAusente(null)}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirmarAusente(null)} className="btn-secundario">Cancelar</button>
            <button type="button" onClick={() => marcarAusente(confirmarAusente)} className="btn-peligro">Sí, marcar ausente</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
