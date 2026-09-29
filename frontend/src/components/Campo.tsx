import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { IconVer, IconVerOculto } from './Icons'

/** Etiqueta + control + ayuda/error asociados por id (lectores de pantalla leen el error al enfocar). */
export function Campo({
  etiqueta,
  ayuda,
  error,
  children,
}: {
  etiqueta: string
  ayuda?: string
  error?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}) {
  const id = useId()
  const idNota = `${id}-nota`
  const nota = error ?? ayuda

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">
        {etiqueta}
      </label>
      {children({ id, 'aria-describedby': nota ? idNota : undefined, 'aria-invalid': error ? true : undefined })}
      {nota && (
        <p id={idNota} className="mt-1.5 text-xs" style={{ color: error ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          {nota}
        </p>
      )}
    </div>
  )
}

/** Input de contraseña con botón para mostrar/ocultar. */
export function InputPassword(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`campo pr-11 ${props.className ?? ''}`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-text-muted hover:text-text"
      >
        {visible ? <IconVerOculto className="h-5 w-5" /> : <IconVer className="h-5 w-5" />}
      </button>
    </div>
  )
}
