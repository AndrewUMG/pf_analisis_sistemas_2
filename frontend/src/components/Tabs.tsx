export function Tabs<T extends string>({
  pestanas,
  activa,
  onChange,
}: {
  pestanas: { valor: T; etiqueta: string }[]
  activa: T
  onChange: (valor: T) => void
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b">
      {pestanas.map((p) => (
        <button
          key={p.valor}
          onClick={() => onChange(p.valor)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activa === p.valor
              ? 'border-accent text-accent-hover'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  )
}
