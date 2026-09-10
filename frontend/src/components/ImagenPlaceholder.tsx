import { IconImagen, IconPersona } from './Icons'

/**
 * Muestra la foto real cuando ya existe (src). Mientras no haya una, se
 * muestra un espacio reservado con borde punteado e ícono, para que sea
 * evidente que es un placeholder y no un error de carga.
 */
export function ImagenPlaceholder({
  src,
  variante = 'foto',
  etiqueta,
  className = '',
}: {
  src?: string | null
  variante?: 'foto' | 'avatar'
  etiqueta?: string
  className?: string
}) {
  const formaClase = variante === 'avatar' ? 'aspect-square rounded-full' : ''

  if (src) {
    return (
      <img
        src={src}
        alt={etiqueta ?? ''}
        className={`object-cover ${formaClase} ${className}`}
      />
    )
  }

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
