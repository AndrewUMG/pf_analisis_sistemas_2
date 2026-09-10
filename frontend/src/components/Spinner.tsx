export function Spinner({ etiqueta = 'Cargando…' }: { etiqueta?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-carbon-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-carbon-700 border-t-gold-400" />
      <span className="text-sm">{etiqueta}</span>
    </div>
  )
}
