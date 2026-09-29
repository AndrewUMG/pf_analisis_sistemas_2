import { useId, useRef, type ReactNode } from 'react'
import { useDialogo } from '../hooks/useDialogo'

/**
 * Diálogo modal accesible (Esc, clic fuera, foco atrapado y devuelto). Reemplaza a
 * window.confirm, que no se puede estilizar ni probar. En móvil se ancla abajo como hoja.
 */
export function Modal({ titulo, descripcion, onClose, children }: { titulo: string; descripcion?: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()
  useDialogo(panelRef, onClose)

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/55 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className="tarjeta aparecer max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-b-xl"
        style={{ boxShadow: 'var(--shadow-float)' }}
      >
        <h2 id={idTitulo} className="text-xl font-semibold text-text">
          {titulo}
        </h2>
        {descripcion && (
          <p id={idDescripcion} className="mt-1 text-sm text-text-muted">
            {descripcion}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
