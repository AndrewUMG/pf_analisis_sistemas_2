import { useTheme } from '../context/ThemeContext'
import { IconLuna, IconSol } from './Icons'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { tema, alternarTema } = useTheme()
  const etiqueta = tema === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'

  return (
    <button
      onClick={alternarTema}
      aria-label={etiqueta}
      title={etiqueta}
      className={`grid h-10 w-10 place-items-center rounded-lg border text-text-muted transition-colors hover:border-brand hover:text-text ${className}`}
    >
      {tema === 'light' ? <IconLuna className="h-[1.1rem] w-[1.1rem]" /> : <IconSol className="h-[1.1rem] w-[1.1rem]" />}
    </button>
  )
}
