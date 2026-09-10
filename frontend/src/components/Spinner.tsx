export function Spinner({ etiqueta = 'Cargando…' }: { etiqueta?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong" style={{ borderTopColor: 'var(--color-accent)' }} />
      <span className="text-sm">{etiqueta}</span>
    </div>
  )
}
