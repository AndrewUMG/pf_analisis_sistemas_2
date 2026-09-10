export function Alerta({ tipo, mensaje }: { tipo: 'error' | 'exito'; mensaje: string }) {
  const estilo =
    tipo === 'error'
      ? { backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }
      : { backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)', borderColor: 'var(--color-success)' }

  return (
    <div className="rounded-lg border px-4 py-3 text-sm" style={{ ...estilo, borderColor: `color-mix(in srgb, ${estilo.borderColor} 35%, transparent)` }}>
      {mensaje}
    </div>
  )
}
