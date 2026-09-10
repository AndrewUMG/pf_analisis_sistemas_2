import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'light' | 'dark'

interface ThemeContextValue {
  tema: Tema
  alternarTema: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function temaInicial(): Tema {
  // index.html ya fijó el atributo antes del primer render para evitar parpadeos.
  const atributo = document.documentElement.getAttribute('data-theme')
  return atributo === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('tema', tema)
  }, [tema])

  function alternarTema() {
    setTema((actual) => (actual === 'light' ? 'dark' : 'light'))
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const contexto = useContext(ThemeContext)
  if (!contexto) throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  return contexto
}
