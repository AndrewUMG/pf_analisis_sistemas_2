import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeError } from '../api/client'
import { Alerta } from '../components/Alerta'
import { Spinner } from '../components/Spinner'
import { ImagenPlaceholder } from '../components/ImagenPlaceholder'
import { PageHeader } from '../components/PageHeader'
import { Tabs } from '../components/Tabs'
import { CitaCard } from '../components/citas/CitaCard'
import { CancelarDialog } from '../components/citas/CancelarDialog'
import { ReagendarDialog } from '../components/citas/ReagendarDialog'
import { ValorarDialog } from '../components/citas/ValorarDialog'
import { soloFecha } from '../utils/fechas'
import type { Cita, PaginaCitas } from '../types'

type Pestana = 'proximas' | 'historial'

const ESTADOS_ACTIVOS = ['confirmada', 'en_atencion']

const claveOrden = (c: Cita) => `${soloFecha(c.fecha)} ${c.hora_inicio}`

export function MisCitasPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [pestana, setPestana] = useState<Pestana>('proximas')
  const [aReagendar, setAReagendar] = useState<Cita | null>(null)
  const [aCancelar, setACancelar] = useState<Cita | null>(null)
  const [aValorar, setAValorar] = useState<Cita | null>(null)

  async function cargar() {
    setError('')
    try {
      const { data } = await api.get<PaginaCitas>('/citas')
      setCitas(data.data)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  // Próximas: de la más cercana a la más lejana. Historial: de la más reciente hacia atrás.
  const { proximas, historial } = useMemo(() => {
    const activas = citas.filter((c) => ESTADOS_ACTIVOS.includes(c.estado))
    const pasadas = citas.filter((c) => !ESTADOS_ACTIVOS.includes(c.estado))
    return {
      proximas: [...activas].sort((a, b) => claveOrden(a).localeCompare(claveOrden(b))),
      historial: [...pasadas].sort((a, b) => claveOrden(b).localeCompare(claveOrden(a))),
    }
  }, [citas])

  function alTerminarAccion(mensaje: string) {
    setAReagendar(null)
    setACancelar(null)
    setAValorar(null)
    setAviso(mensaje)
    cargar()
  }

  if (cargando) return <Spinner etiqueta="Cargando tus citas…" />

  const visibles = pestana === 'proximas' ? proximas : historial

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Mis citas"
        descripcion="Consulta, reagenda o cancela tus reservas."
        accion={
          <Link to="/reservar" className="btn-principal">
            Reservar nueva cita
          </Link>
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

      <Tabs
        pestanas={[
          { valor: 'proximas', etiqueta: `Próximas (${proximas.length})` },
          { valor: 'historial', etiqueta: `Historial (${historial.length})` },
        ]}
        activa={pestana}
        onChange={(p) => {
          setPestana(p)
          setAviso('')
        }}
      />

      {visibles.length === 0 ? (
        <div className="tarjeta flex flex-col items-center gap-4 p-10 text-center">
          <ImagenPlaceholder etiqueta="Ilustración" className="h-28 w-28" />
          <div>
            <p className="font-medium text-text">
              {pestana === 'proximas' ? 'No tienes citas próximas.' : 'Todavía no tienes citas en tu historial.'}
            </p>
            <p className="mt-1 text-sm text-text-muted">Elige un servicio y un barbero para agendar tu próxima visita.</p>
          </div>
          <Link to="/reservar" className="btn-principal">
            Reservar una cita
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((cita) => (
            <CitaCard key={cita.id} cita={cita} onReagendar={setAReagendar} onCancelar={setACancelar} onValorar={setAValorar} />
          ))}
        </ul>
      )}

      {aReagendar && <ReagendarDialog cita={aReagendar} onClose={() => setAReagendar(null)} onDone={alTerminarAccion} />}
      {aCancelar && <CancelarDialog cita={aCancelar} onClose={() => setACancelar(null)} onDone={alTerminarAccion} />}
      {aValorar && <ValorarDialog cita={aValorar} onClose={() => setAValorar(null)} onDone={alTerminarAccion} />}
    </div>
  )
}
