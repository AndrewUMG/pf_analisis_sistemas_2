export function Alerta({ tipo, mensaje }: { tipo: 'error' | 'exito'; mensaje: string }) {
  const estilos =
    tipo === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'

  return <div className={`rounded-lg border px-4 py-3 text-sm ${estilos}`}>{mensaje}</div>
}
