import { useRef, useState } from 'react'
import { mensajeError } from '../api/client'

/** Botón de texto que abre el selector de archivos y sube la imagen elegida. */
export function BotonSubirFoto({
  etiqueta = 'Subir foto',
  onSubir,
  onError,
}: {
  etiqueta?: string
  onSubir: (archivo: File) => Promise<void>
  onError: (mensaje: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  async function alSeleccionar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    setSubiendo(true)
    onError('')
    try {
      await onSubir(archivo)
    } catch (err) {
      onError(mensajeError(err))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={alSeleccionar} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="btn-secundario px-3 py-1.5 text-xs"
      >
        {subiendo ? 'Subiendo…' : etiqueta}
      </button>
    </>
  )
}
