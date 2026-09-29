// El backend serializa "fecha" como datetime ISO ("2026-09-10T00:00:00.000000Z"); solo interesa el día.
export function soloFecha(fecha: string): string {
  return fecha.slice(0, 10)
}

/** "16:00:00" -> "16:00" */
export function formatoHora(hora: string): string {
  return hora.slice(0, 5)
}

/** Fecha de hoy en la zona del navegador (toISOString usaría UTC y puede adelantar el día por la noche). */
export function hoyLocalISO(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function aFecha(iso: string): Date {
  const [anio, mes, dia] = soloFecha(iso).split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

/** "2026-09-10" -> "jueves 10 de septiembre" */
export function formatoFechaLarga(iso: string): string {
  return aFecha(iso).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Para el "calendario" en miniatura de cada cita: { dia: '10', mes: 'sep' } */
export function partesFecha(iso: string): { dia: string; mes: string } {
  const d = aFecha(iso)
  return {
    dia: String(d.getDate()),
    mes: d.toLocaleDateString('es-GT', { month: 'short' }).replace('.', ''),
  }
}

export const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
