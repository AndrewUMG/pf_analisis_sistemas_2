import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Alerta } from '../../components/Alerta'
import { Spinner } from '../../components/Spinner'
import { PageHeader } from '../../components/PageHeader'
import type { Barbero, ExcepcionHorario } from '../../types'

const DIAS = [
  { valor: 1, etiqueta: 'Lunes' },
  { valor: 2, etiqueta: 'Martes' },
  { valor: 3, etiqueta: 'Miércoles' },
  { valor: 4, etiqueta: 'Jueves' },
  { valor: 5, etiqueta: 'Viernes' },
  { valor: 6, etiqueta: 'Sábado' },
  { valor: 0, etiqueta: 'Domingo' },
]

type FilaDia = { activo: boolean; hora_inicio: string; hora_fin: string }

const TIPOS_EXCEPCION: Record<ExcepcionHorario['tipo'], string> = {
  dia_libre: 'Día libre',
  permiso: 'Permiso',
  vacaciones: 'Vacaciones',
  otro: 'Otro',
}

export function HorarioPage() {
  const { usuario } = useAuth()
  const barberoId = usuario?.barbero?.id

  const [barbero, setBarbero] = useState<Barbero | null>(null)
  const [dias, setDias] = useState<Record<number, FilaDia>>({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [excepcion, setExcepcion] = useState({ tipo: 'dia_libre' as ExcepcionHorario['tipo'], fecha_inicio: '', fecha_fin: '', motivo: '' })
  const [guardandoExcepcion, setGuardandoExcepcion] = useState(false)

  async function cargar() {
    if (!barberoId) return
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get<Barbero>(`/barberos/${barberoId}`)
      setBarbero(data)
      const iniciales: Record<number, FilaDia> = {}
      for (const dia of DIAS) {
        const existente = data.horarios?.find((h) => h.dia_semana === dia.valor)
        iniciales[dia.valor] = existente
          ? { activo: true, hora_inicio: existente.hora_inicio.slice(0, 5), hora_fin: existente.hora_fin.slice(0, 5) }
          : { activo: false, hora_inicio: '09:00', hora_fin: '18:00' }
      }
      setDias(iniciales)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberoId])

  function actualizarDia(valor: number, cambios: Partial<FilaDia>) {
    setDias((actual) => ({ ...actual, [valor]: { ...actual[valor], ...cambios } }))
  }

  async function guardarHorario(e: FormEvent) {
    e.preventDefault()
    if (!barberoId) return
    setGuardando(true)
    setError('')
    setExito('')
    try {
      const horarios = DIAS.filter((d) => dias[d.valor]?.activo).map((d) => ({
        dia_semana: d.valor,
        hora_inicio: dias[d.valor].hora_inicio,
        hora_fin: dias[d.valor].hora_fin,
      }))
      await api.put(`/barberos/${barberoId}/horarios`, { horarios })
      setExito('Horario actualizado correctamente.')
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function agregarExcepcion(e: FormEvent) {
    e.preventDefault()
    if (!barberoId) return
    setGuardandoExcepcion(true)
    setError('')
    try {
      await api.post(`/barberos/${barberoId}/excepciones`, excepcion)
      setExcepcion({ tipo: 'dia_libre', fecha_inicio: '', fecha_fin: '', motivo: '' })
      await cargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardandoExcepcion(false)
    }
  }

  if (!barberoId) {
    return <Alerta tipo="error" mensaje="Tu cuenta no tiene un perfil de barbero asociado." />
  }

  if (cargando) return <Spinner etiqueta="Cargando tu horario…" />

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <PageHeader titulo="Mi horario" descripcion="Define tu jornada laboral semanal recurrente." />

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

        <form onSubmit={guardarHorario} className="tarjeta divide-y">
          {DIAS.map((dia) => {
            const fila = dias[dia.valor]
            if (!fila) return null
            return (
              <div key={dia.valor} className="flex flex-wrap items-center gap-3 p-4">
                <label className="flex w-32 shrink-0 items-center gap-2 text-sm font-medium text-text">
                  <input
                    type="checkbox"
                    checked={fila.activo}
                    onChange={(e) => actualizarDia(dia.valor, { activo: e.target.checked })}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  {dia.etiqueta}
                </label>
                {fila.activo ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={fila.hora_inicio}
                      onChange={(e) => actualizarDia(dia.valor, { hora_inicio: e.target.value })}
                      className="campo w-auto"
                    />
                    <span className="text-text-muted">a</span>
                    <input
                      type="time"
                      value={fila.hora_fin}
                      onChange={(e) => actualizarDia(dia.valor, { hora_fin: e.target.value })}
                      className="campo w-auto"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-text-faint">No labora</span>
                )}
              </div>
            )
          })}
          <div className="flex justify-end p-4">
            <button type="submit" disabled={guardando} className="btn-principal">
              {guardando ? 'Guardando…' : 'Guardar horario'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <PageHeader titulo="Días libres y permisos" descripcion="Bloquea fechas puntuales fuera de tu jornada recurrente." />

        <form onSubmit={agregarExcepcion} className="tarjeta mb-4 space-y-3 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Tipo</span>
              <select
                className="campo"
                value={excepcion.tipo}
                onChange={(e) => setExcepcion((f) => ({ ...f, tipo: e.target.value as ExcepcionHorario['tipo'] }))}
              >
                {Object.entries(TIPOS_EXCEPCION).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Motivo (opcional)</span>
              <input
                className="campo"
                value={excepcion.motivo}
                onChange={(e) => setExcepcion((f) => ({ ...f, motivo: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Desde</span>
              <input
                type="date"
                required
                className="campo"
                value={excepcion.fecha_inicio}
                onChange={(e) => setExcepcion((f) => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text">Hasta</span>
              <input
                type="date"
                required
                className="campo"
                value={excepcion.fecha_fin}
                onChange={(e) => setExcepcion((f) => ({ ...f, fecha_fin: e.target.value }))}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={guardandoExcepcion} className="btn-secundario">
              {guardandoExcepcion ? 'Agregando…' : 'Agregar bloqueo'}
            </button>
          </div>
        </form>

        {barbero?.excepciones && barbero.excepciones.length > 0 ? (
          <ul className="space-y-2">
            {barbero.excepciones.map((exc) => (
              <li key={exc.id} className="tarjeta flex items-center justify-between p-4 text-sm">
                <span>
                  <span className="font-medium text-text">{TIPOS_EXCEPCION[exc.tipo]}</span>
                  <span className="text-text-muted">
                    {' '}
                    · {exc.fecha_inicio.slice(0, 10)} a {exc.fecha_fin.slice(0, 10)}
                  </span>
                  {exc.motivo && <span className="block text-text-faint">{exc.motivo}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No tienes bloqueos registrados.</p>
        )}
      </div>
    </div>
  )
}
