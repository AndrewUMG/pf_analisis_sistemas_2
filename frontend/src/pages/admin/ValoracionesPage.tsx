import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import { Estrellas } from '../../components/Estrellas'
import { soloFecha } from '../../utils/fechas'
import type { Barbero, RespuestaValoraciones, Valoracion } from '../../types'

export function ValoracionesPage() {
  const [datos, setDatos] = useState<RespuestaValoraciones | null>(null)
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [barberoId, setBarberoId] = useState('')
  const [estrellas, setEstrellas] = useState('')
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cambiandoId, setCambiandoId] = useState<number | null>(null)

  useEffect(() => {
    api.get<Barbero[]>('/barberos').then((r) => setBarberos(r.data)).catch(() => undefined)
  }, [])

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<RespuestaValoraciones>('/valoraciones', {
        params: { barbero_id: barberoId || undefined, calificacion: estrellas || undefined, page: pagina },
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
  }, [barberoId, estrellas, pagina])

  async function alternarVisible(v: Valoracion) {
    setCambiandoId(v.id)
    setError('')
    try {
      await api.put(`/valoraciones/${v.id}`, { visible: !v.visible })
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCambiandoId(null)
    }
  }

  const resumen = datos?.resumen
  const maximo = Math.max(1, ...Object.values(resumen?.por_estrella ?? {}))

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader titulo="Valoraciones" descripcion="Opiniones de los clientes sobre el servicio recibido." />

      {error && (
        <div className="mb-4">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      {resumen && (
        <section className="tarjeta mb-6 grid gap-6 p-5 sm:grid-cols-[auto_1fr]" aria-label="Resumen">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-semibold text-text">{resumen.promedio?.toFixed(1) ?? '–'}</p>
            {resumen.promedio != null && <Estrellas valor={resumen.promedio} className="h-5 w-5" />}
            <p className="mt-1 text-sm text-text-muted">{resumen.total} {resumen.total === 1 ? 'valoración' : 'valoraciones'}</p>
          </div>
          <ul className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const cantidad = resumen.por_estrella[String(n)] ?? 0
              return (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 whitespace-nowrap text-text-muted">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(cantidad / maximo) * 100}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right text-text">{cantidad}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="campo w-auto" aria-label="Filtrar por barbero" value={barberoId} onChange={(e) => { setBarberoId(e.target.value); setPagina(1) }}>
          <option value="">Todos los barberos</option>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>{b.user.nombres} {b.user.apellidos}</option>
          ))}
        </select>
        <select className="campo w-auto" aria-label="Filtrar por estrellas" value={estrellas} onChange={(e) => { setEstrellas(e.target.value); setPagina(1) }}>
          <option value="">Todas las estrellas</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'estrella' : 'estrellas'}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <Spinner etiqueta="Cargando valoraciones…" />
      ) : !datos || datos.valoraciones.data.length === 0 ? (
        <p className="text-text-muted">No hay valoraciones con esos filtros.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {datos.valoraciones.data.map((v) => (
              <li key={v.id} className={`tarjeta p-4 ${v.visible ? '' : 'opacity-60'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Estrellas valor={v.calificacion} />
                    <p className="mt-1 text-sm text-text">
                      <span className="font-medium">{v.cliente?.nombres} {v.cliente?.apellidos}</span>
                      <span className="text-text-muted"> sobre {v.barbero?.user.nombres} {v.barbero?.user.apellidos}</span>
                    </p>
                    {v.cita && <p className="text-xs text-text-faint">Cita del {soloFecha(v.cita.fecha)}</p>}
                  </div>
                  <button onClick={() => alternarVisible(v)} disabled={cambiandoId === v.id} className="btn-secundario px-3 py-1.5 text-xs">
                    {v.visible ? 'Ocultar' : 'Volver a mostrar'}
                  </button>
                </div>
                {v.comentario ? (
                  <p className="mt-2 rounded-lg bg-bg-subtle p-3 text-sm text-text">“{v.comentario}”</p>
                ) : (
                  <p className="mt-2 text-xs italic text-text-faint">Sin comentario.</p>
                )}
                {!v.visible && <p className="mt-2 text-xs text-text-muted">Oculta: no cuenta en el promedio público del barbero.</p>}
              </li>
            ))}
          </ul>
          {datos.valoraciones.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button className="btn-secundario" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
              <span className="text-sm text-text-muted">Página {datos.valoraciones.current_page} de {datos.valoraciones.last_page}</span>
              <button className="btn-secundario" disabled={pagina >= datos.valoraciones.last_page} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
