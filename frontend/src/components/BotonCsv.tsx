import { IconDescargar } from './Icons'
import { descargarCsv } from '../utils/csv'

export function BotonCsv({ nombre, filas, deshabilitado }: { nombre: string; filas: (string | number)[][]; deshabilitado?: boolean }) {
  return (
    <button type="button" onClick={() => descargarCsv(nombre, filas)} disabled={deshabilitado} className="btn-secundario px-3 py-1.5 text-xs">
      <IconDescargar className="h-4 w-4" />
      Exportar CSV
    </button>
  )
}
