import { useEffect, type RefObject } from 'react'

const FOCUSABLES = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Comportamiento común de diálogos y drawers: foco inicial dentro, Tab que cicla,
 * Esc para cerrar, scroll de fondo bloqueado y foco devuelto al elemento que lo abrió.
 */
export function useDialogo(panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
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
}
