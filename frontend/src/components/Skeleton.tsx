/** Bloque de carga con brillo; sustituye al spinner en listas y tarjetas para evitar saltos de layout. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/** Cuadrícula de tarjetas de carga (imagen + dos líneas + precio). */
export function TarjetasSkeleton({ cantidad = 6, className = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' }: { cantidad?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-label="Cargando">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="tarjeta overflow-hidden">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Lista de filas de carga (para paneles y "Mis citas"). */
export function FilasSkeleton({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="tarjeta flex items-center gap-4 p-4">
          <Skeleton className="h-14 w-14 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
