/** Descarga un CSV (con BOM para que Excel respete los acentos). */
export function descargarCsv(nombre: string, filas: (string | number)[][]) {
  const celda = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const contenido = '﻿' + filas.map((f) => f.map(celda).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}
