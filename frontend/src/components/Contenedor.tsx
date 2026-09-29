import type { ElementType, ReactNode } from 'react'

/** Ancho máximo y márgenes laterales consistentes en todo el sitio. */
export function Contenedor({ as: Etiqueta = 'div', className = '', children, id }: { as?: ElementType; className?: string; children: ReactNode; id?: string }) {
  return (
    <Etiqueta id={id} className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Etiqueta>
  )
}
