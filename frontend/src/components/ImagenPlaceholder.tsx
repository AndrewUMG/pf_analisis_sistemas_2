import { IconImagen, IconPersona } from './Icons'

/**
 * Espacio reservado para una imagen que se agregará más adelante (foto de
 * servicio, barbero, etc.). Se muestra con un borde punteado y un ícono para
 * que sea evidente que es un placeholder y no un error de carga.
 */
export function ImagenPlaceholder({
  variante = 'foto',
  etiqueta,
  className = '',
}: {
  variante?: 'foto' | 'avatar'
  etiqueta?: string
  className?: string
}) {
  if (variante === 'avatar') {
    return (
      <div className={`placeholder-imagen aspect-square rounded-full ${className}`} role="img" aria-label={etiqueta ?? 'Foto pendiente'}>
        <IconPersona className="h-1/3 w-1/3" />
      </div>
    )
  }

  return (
    <div className={`placeholder-imagen ${className}`} role="img" aria-label={etiqueta ?? 'Imagen pendiente'}>
      <IconImagen className="h-6 w-6" />
      {etiqueta && <span className="text-xs">{etiqueta}</span>}
    </div>
  )
}
