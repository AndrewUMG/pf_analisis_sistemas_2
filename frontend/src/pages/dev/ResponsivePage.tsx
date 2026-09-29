import { useState } from 'react'

const ANCHOS = [360, 768, 1280, 1920]
const RUTAS = ['/', '/servicios', '/login', '/registro', '/reservar', '/mis-citas', '/barbero/agenda', '/barbero/horario', '/recepcion/caja', '/recepcion/walkin', '/recepcion/inventario', '/admin/catalogo', '/admin/usuarios', '/admin/reportes', '/admin/valoraciones', '/admin/notificaciones', '/admin/parametros']

/** Solo desarrollo: muestra una ruta en iframes de distintos anchos (el viewport real no cambia con resize_window). */
export function ResponsivePage() {
  const [ruta, setRuta] = useState('/')
  const [alto, setAlto] = useState(800)

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Ruta</span>
          <select className="campo" value={ruta} onChange={(e) => setRuta(e.target.value)}>
            {RUTAS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Alto (px)</span>
          <input type="number" className="campo w-28" value={alto} onChange={(e) => setAlto(Number(e.target.value) || 800)} />
        </label>
        <p className="text-sm text-text-muted">Inicia sesión con el rol correspondiente en otra pestaña (la sesión se comparte).</p>
      </div>
      <div className="flex items-start gap-6 overflow-x-auto pb-4">
        {ANCHOS.map((w) => (
          <figure key={w} className="shrink-0">
            <figcaption className="mb-1 text-xs font-semibold text-text-muted">{w}px</figcaption>
            <iframe title={`${ruta} a ${w}px`} src={ruta} width={w} height={alto} className="rounded-lg border bg-bg" />
          </figure>
        ))}
      </div>
    </div>
  )
}
