import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Estado {
  error: Error | null
}

/** Evita la pantalla en blanco: si una página falla al renderizar, se muestra un aviso con opción de reintentar. */
export class ErrorBoundary extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de render:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div role="alert" className="tarjeta mx-auto max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold text-text">Algo salió mal en esta pantalla</h1>
        <p className="mt-2 text-sm text-text-muted">Ya quedó registrado. Puedes intentar de nuevo o volver al inicio.</p>
        {import.meta.env.DEV && <pre className="mt-3 overflow-x-auto rounded-lg bg-bg-subtle p-3 text-left text-xs text-danger">{this.state.error.message}</pre>}
        <div className="mt-5 flex justify-center gap-2">
          <button className="btn-secundario" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
          <a className="btn-principal" href="/">
            Ir al inicio
          </a>
        </div>
      </div>
    )
  }
}
