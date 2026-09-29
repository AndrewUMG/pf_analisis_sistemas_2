import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { FilasSkeleton } from '../../components/Skeleton'
import { PageHeader } from '../../components/PageHeader'
import type { Notificacion, RespuestaNotificaciones } from '../../types'

const TIPOS: Record<Notificacion['tipo'], string> = {
  confirmacion: 'Confirmación',
  recordatorio_24h: 'Recordatorio 24 h',
  recordatorio_2h: 'Recordatorio 2 h',
}
const CANALES: Record<Notificacion['canal'], string> = { whatsapp: 'WhatsApp', correo: 'Correo' }
const ESTADOS: Record<Notificacion['estado'], { etiqueta: string; plural: string; bg: string; fg: string }> = {
  pendiente: { etiqueta: 'Pendiente', plural: 'Pendientes', bg: 'var(--color-info-soft)', fg: 'var(--color-info)' },
  enviada: { etiqueta: 'Enviada', plural: 'Enviadas', bg: 'var(--color-success-soft)', fg: 'var(--color-success)' },
  fallida: { etiqueta: 'Fallida', plural: 'Fallidas', bg: 'var(--color-danger-soft)', fg: 'var(--color-danger)' },
}

function fechaHora(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) : '—'
}

export function NotificacionesPage() {
  const [datos, setDatos] = useState<RespuestaNotificaciones | null>(null)
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [canal, setCanal] = useState('')
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [trabajando, setTrabajando] = useState<number | 'procesar' | null>(null)

  async function cargar() {
    setError('')
    try {
      const { data } = await api.get<RespuestaNotificaciones>('/notificaciones', {
        params: { estado: estado || undefined, tipo: tipo || undefined, canal: canal || undefined, page: pagina },
      })
      setDatos(data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, tipo, canal, pagina])

  async function procesarAhora() {
    setTrabajando('procesar')
    setError('')
    setAviso('')
    try {
      const { data } = await api.post<{ enviadas: number; fallidas: number; omitidas: number }>('/notificaciones/procesar')
      setAviso(`Listo: ${data.enviadas} enviadas, ${data.fallidas} fallidas, ${data.omitidas} omitidas.`)
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setTrabajando(null)
    }
  }

  async function reintentar(n: Notificacion) {
    setTrabajando(n.id)
    setError('')
    setAviso('')
    try {
      const { data } = await api.post<Notificacion>(`/notificaciones/${n.id}/reintentar`)
      setAviso(data.estado === 'enviada' ? 'La notificación se envió correctamente.' : 'El reintento volvió a fallar; revisa el detalle.')
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setTrabajando(null)
    }
  }

  const resumen = datos?.resumen ?? {}

  return (
    <div>
      <PageHeader eyebrow="Sistema"
        titulo="Notificaciones"
        descripcion="Confirmaciones y recordatorios automáticos enviados a los clientes."
        accion={
          <button onClick={procesarAhora} disabled={trabajando === 'procesar'} className="btn-principal">
            {trabajando === 'procesar' ? 'Enviando…' : 'Enviar pendientes ahora'}
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}
      {aviso && (
        <div className="mb-4" role="status">
          <Alerta tipo="exito" mensaje={aviso} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        {(Object.keys(ESTADOS) as Notificacion['estado'][]).map((e) => (
          <button
            key={e}
            onClick={() => {
              setEstado(estado === e ? '' : e)
              setPagina(1)
            }}
            aria-pressed={estado === e}
            className={`tarjeta p-4 text-left transition-colors ${estado === e ? 'border-accent' : ''}`}
          >
            <p className="text-sm text-text-muted">{ESTADOS[e].plural}</p>
            <p className="text-2xl font-semibold" style={{ color: ESTADOS[e].fg }}>
              {resumen[e] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="campo w-auto" aria-label="Filtrar por tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1) }}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select className="campo w-auto" aria-label="Filtrar por canal" value={canal} onChange={(e) => { setCanal(e.target.value); setPagina(1) }}>
          <option value="">Todos los canales</option>
          {Object.entries(CANALES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <FilasSkeleton cantidad={4} />
      ) : !datos || datos.notificaciones.data.length === 0 ? (
        <p className="text-text-muted">No hay notificaciones con esos filtros. Se generan al reservar una cita.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {datos.notificaciones.data.map((n) => (
              <li key={n.id} className="tarjeta p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">
                      {TIPOS[n.tipo]} · {CANALES[n.canal]}
                    </p>
                    <p className="text-xs text-text-muted">
                      {n.cita?.cliente ? `${n.cita.cliente.nombres} ${n.cita.cliente.apellidos}` : 'Cliente'} · destino: {n.destino ?? (n.canal === 'correo' ? n.cita?.cliente?.email : n.cita?.cliente?.telefono) ?? 'sin dato de contacto'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: ESTADOS[n.estado].bg, color: ESTADOS[n.estado].fg }}>
                      {ESTADOS[n.estado].etiqueta}
                    </span>
                    {n.estado === 'fallida' && (
                      <button onClick={() => reintentar(n)} disabled={trabajando === n.id} className="btn-secundario px-3 py-1.5 text-xs">
                        {trabajando === n.id ? 'Reintentando…' : 'Reintentar'}
                      </button>
                    )}
                  </div>
                </div>
                {n.mensaje && <p className="mt-2 rounded-lg bg-bg-subtle p-2.5 text-xs text-text-muted">{n.mensaje}</p>}
                <p className="mt-2 text-xs text-text-faint">
                  {n.estado === 'enviada' ? `Enviada ${fechaHora(n.enviado_at)}` : `Creada ${fechaHora(n.created_at)}`} · {n.intentos}{' '}
                  {n.intentos === 1 ? 'intento' : 'intentos'}
                  {n.ultimo_error && <span style={{ color: 'var(--color-danger)' }}> · {n.ultimo_error}</span>}
                </p>
              </li>
            ))}
          </ul>
          {datos.notificaciones.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button className="btn-secundario" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                Anterior
              </button>
              <span className="text-sm text-text-muted">
                Página {datos.notificaciones.current_page} de {datos.notificaciones.last_page}
              </span>
              <button className="btn-secundario" disabled={pagina >= datos.notificaciones.last_page} onClick={() => setPagina((p) => p + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
