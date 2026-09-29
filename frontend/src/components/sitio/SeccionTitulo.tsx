/** Encabezado de sección: eyebrow dorado + titular serif + ornamento y texto de apoyo opcional. */
export function SeccionTitulo({ eyebrow, titulo, descripcion, centrado = false }: { eyebrow?: string; titulo: string; descripcion?: string; centrado?: boolean }) {
  return (
    <div className={centrado ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-tight text-text">{titulo}</h2>
      <div className={`divisor-ornamental mt-4 ${centrado ? 'mx-auto max-w-xs' : 'max-w-[11rem]'}`} aria-hidden="true">
        <span />
      </div>
      {descripcion && <p className="mt-4 text-base leading-relaxed text-text-muted">{descripcion}</p>}
    </div>
  )
}
