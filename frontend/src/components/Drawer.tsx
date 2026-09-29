import { useId, useRef, type ReactNode } from 'react'
import { useDialogo } from '../hooks/useDialogo'
import { IconCerrar } from './Icons'

/** Panel lateral deslizante (menú móvil). Comparte el comportamiento accesible de Modal. */
export function Drawer({ titulo, lado = 'right', onClose, children }: { titulo: string; lado?: 'left' | 'right'; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  useDialogo(panelRef, onClose)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`absolute inset-y-0 flex w-[min(22rem,88vw)] flex-col bg-bg shadow-[var(--shadow-float)] ${lado === 'right' ? 'right-0 border-l' : 'left-0 border-r'}`}
        style={{ animation: `${lado === 'right' ? 'entraDerecha' : 'entraIzquierda'} 0.28s var(--ease-salida)` }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id={idTitulo} className="font-serif text-lg font-semibold text-text">
            {titulo}
          </h2>
          <button onClick={onClose} aria-label="Cerrar menú" className="grid h-10 w-10 place-items-center rounded-lg text-text-muted hover:bg-bg-subtle hover:text-text">
            <IconCerrar className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
