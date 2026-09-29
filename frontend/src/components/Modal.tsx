import { useEffect, useId, useRef, type ReactNode } from 'react'

const FOCUSABLES = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo modal accesible: cierra con Esc o al hacer clic fuera, mantiene el
 * foco dentro (Tab cicla), bloquea el scroll de fondo y devuelve el foco al
 * elemento que lo abrió. Reemplaza a window.confirm, que no se puede estilizar
 * ni probar y rompe el flujo en móviles.
 */
export function Modal({
  titulo,
  descripcion,
  onClose,
  children,
}: {
  titulo: string
  descripcion?: string
  onClose: () => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLES)?.focus()

    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const elementos = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLES))
      if (elementos.length === 0) return
      const primero = elementos[0]
      const ultimo = elementos[elementos.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = overflowPrevio
      previo?.focus()
    }
    // onClose cambia en cada render del padre; el efecto solo debe correr al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4"
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
        className="tarjeta max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-b-xl"
        style={{ boxShadow: 'var(--shadow-raised)' }}
      >
        <h2 id={idTitulo} className="text-lg font-semibold text-text">
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
