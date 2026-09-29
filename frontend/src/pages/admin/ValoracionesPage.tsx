import { useEffect, useState } from 'react'
import { api, mensajeError } from '../../api/client'
import { Alerta } from '../../components/Alerta'
import { PageHeader } from '../../components/PageHeader'
import { Estrellas } from '../../components/Estrellas'
import { FilasSkeleton } from '../../components/Skeleton'
import { Barra, EstadoVacio, Paginacion } from '../../components/panel/Piezas'
import { IconEstrella } from '../../components/Icons'
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
    <div>
      <PageHeader eyebrow="Análisis" titulo="Valoraciones" descripcion="Opiniones de los clientes sobre el servicio recibido." />

      {error && (
        <div className="mb-4" role="alert">
          <Alerta tipo="error" mensaje={error} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[19rem_1fr] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-20">
          {resumen && (
            <section className="tarjeta p-5" aria-label="Resumen">
              <p className="text-sm text-text-muted">Promedio general</p>
              <p className="font-serif text-5xl font-semibold text-text">{resumen.promedio?.toFixed(1) ?? '–'}</p>
              {resumen.promedio != null && <Estrellas valor={resumen.promedio} className="h-5 w-5" />}
              <p className="mt-1 text-sm text-text-muted">
                {resumen.total} {resumen.total === 1 ? 'valoración' : 'valoraciones'}
              </p>
              <ul className="mt-5 space-y-2.5">
                {[5, 4, 3, 2, 1].map((n) => {
                  const cantidad = resumen.por_estrella[String(n)] ?? 0
                  return (
                    <li key={n} className="grid grid-cols-[2.6rem_1fr_1.75rem] items-center gap-2.5 text-sm">
                      <span className="whitespace-nowrap text-text-muted">{n} ★</span>
                      <Barra valor={cantidad} maximo={maximo} etiqueta={`${n} estrellas`} />
                      <span className="text-right text-text">{cantidad}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <div className="tarjeta space-y-3 p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Barbero</span>
              <select className="campo" value={barberoId} onChange={(e) => { setBarberoId(e.target.value); setPagina(1) }}>
                <option value="">Todos</option>
                {barberos.map((b) => (
                  <option key={b.id} value={b.id}>{b.user.nombres} {b.user.apellidos}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Estrellas</span>
              <select className="campo" value={estrellas} onChange={(e) => { setEstrellas(e.target.value); setPagina(1) }}>
                <option value="">Todas</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'estrella' : 'estrellas'}</option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <div>
          {cargando ? (
            <FilasSkeleton cantidad={3} />
          ) : !datos || datos.valoraciones.data.length === 0 ? (
            <EstadoVacio icono={IconEstrella} titulo="No hay valoraciones con esos filtros" texto="Los clientes califican desde “Mis citas” cuando su cita queda completada." />
          ) : (
            <>
              <ul className="space-y-3">
                {datos.valoraciones.data.map((v) => (
                  <li key={v.id} className={`tarjeta p-5 ${v.visible ? '' : 'opacity-60'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Estrellas valor={v.calificacion} />
                        <p className="mt-1.5 text-sm text-text">
                          <span className="font-semibold">{v.cliente?.nombres} {v.cliente?.apellidos}</span>
                          <span className="text-text-muted"> sobre {v.barbero?.user.nombres} {v.barbero?.user.apellidos}</span>
                        </p>
                        {v.cita && <p className="text-xs text-text-muted">Cita del {soloFecha(v.cita.fecha)}</p>}
                      </div>
                      <button onClick={() => alternarVisible(v)} disabled={cambiandoId === v.id} className="btn-secundario px-3 py-1.5 text-xs">
                        {v.visible ? 'Ocultar' : 'Volver a mostrar'}
                      </button>
                    </div>
                    {v.comentario ? <blockquote className="mt-3 rounded-lg bg-bg-subtle p-3.5 text-sm italic text-text">“{v.comentario}”</blockquote> : <p className="mt-3 text-xs italic text-text-muted">Sin comentario.</p>}
                    {!v.visible && <p className="mt-3 text-xs text-text-muted">Oculta: no cuenta en el promedio público del barbero.</p>}
                  </li>
                ))}
              </ul>
              <Paginacion pagina={datos.valoraciones.current_page} ultima={datos.valoraciones.last_page} onCambio={setPagina} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
