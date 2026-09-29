import { soloFecha } from './fechas'

const compacto = (fecha: string, hora: string) => `${soloFecha(fecha).replace(/-/g, '')}T${hora.slice(0, 8).replace(/:/g, '')}`

/** Descarga un archivo .ics (hora local "flotante") para añadir la cita a Google/Apple/Outlook Calendar. */
export function descargarIcs(cita: { id: number; fecha: string; hora_inicio: string; hora_fin: string }, resumen: string, descripcion: string, lugar: string) {
  const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studio La Barber//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:cita-${cita.id}@studiolabarber`,
    `DTSTAMP:${ahora}`,
    `DTSTART:${compacto(cita.fecha, cita.hora_inicio)}`,
    `DTEND:${compacto(cita.fecha, cita.hora_fin)}`,
    `SUMMARY:${escapar(resumen)}`,
    `DESCRIPTION:${escapar(descripcion)}`,
    `LOCATION:${escapar(lugar)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tu cita en Studio La Barber es en 2 horas',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const url = URL.createObjectURL(new Blob([lineas.join('\r\n')], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `cita-studio-la-barber-${cita.id}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
