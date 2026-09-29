import type { ReactNode } from 'react'

// Iconos SVG a línea (stroke), livianos y sin depender de una librería externa.
// Todos aceptan className para heredar tamaño/color desde el sitio donde se usan.

type IconProps = { className?: string }

export function IconSol({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.55 1.55M17.55 17.55l1.55 1.55M2 12h2.2M19.8 12H22M4.9 19.1l1.55-1.55M17.55 6.45l1.55-1.55" />
    </svg>
  )
}

export function IconLuna({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />
    </svg>
  )
}

export function IconTijeras({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8.3 7.7 20 18M20 6 8.3 16.3" />
    </svg>
  )
}

export function IconImagen({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 5-5 3.5 3.5L17 11l3 3" />
    </svg>
  )
}

export function IconPersona({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5" />
    </svg>
  )
}

export function IconEstrella({ className, llena = true }: IconProps & { llena?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={llena ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={className}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
    </svg>
  )
}

export function IconDescargar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
    </svg>
  )
}

// Iconos de trazo simple (24×24) que comparten estilo; se usan en navegación, listas y estados.
function Trazo({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconCalendario = ({ className }: IconProps) => (
  <Trazo className={className}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Trazo>
)
export const IconReloj = ({ className }: IconProps) => (
  <Trazo className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Trazo>
)
export const IconUbicacion = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10" r="2.3" /></Trazo>
)
export const IconTelefono = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 5.3 5.3l1.4-2.2L19 14.5V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2Z" /></Trazo>
)
export const IconMenu = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M4 7h16M4 12h16M4 17h16" /></Trazo>
)
export const IconCerrar = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M6 6l12 12M18 6 6 18" /></Trazo>
)
export const IconCheck = ({ className }: IconProps) => (
  <Trazo className={className}><path d="m5 12.5 4.5 4.5L19 7.5" /></Trazo>
)
export const IconFlecha = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M5 12h14m-5-5 5 5-5 5" /></Trazo>
)
export const IconChevron = ({ className }: IconProps) => (
  <Trazo className={className}><path d="m9 6 6 6-6 6" /></Trazo>
)
export const IconInicio = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-7.5Z" /></Trazo>
)
export const IconCaja = ({ className }: IconProps) => (
  <Trazo className={className}><rect x="3.5" y="6" width="17" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M7 9.5v.01M17 14.5v.01" /></Trazo>
)
export const IconCaja3d = ({ className }: IconProps) => (
  <Trazo className={className}><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" /><path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" /></Trazo>
)
export const IconGrafica = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></Trazo>
)
export const IconCampana = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" /></Trazo>
)
export const IconAjustes = ({ className }: IconProps) => (
  <Trazo className={className}><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></Trazo>
)
export const IconPersonas = ({ className }: IconProps) => (
  <Trazo className={className}><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c.9-3.3 3.3-5 6-5s5.1 1.7 6 5M16 5.5a3 3 0 0 1 0 6M18 15c1.8.6 3 2.2 3.5 5" /></Trazo>
)
export const IconEtiqueta = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M3.5 12.2V4.5h7.7l9.3 9.3a1.6 1.6 0 0 1 0 2.3l-5.4 5.4a1.6 1.6 0 0 1-2.3 0l-9.3-9.3Z" /><circle cx="8" cy="9" r="1.2" /></Trazo>
)
export const IconEscudo = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Trazo>
)
export const IconVer = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></Trazo>
)
export const IconVerOculto = ({ className }: IconProps) => (
  <Trazo className={className}><path d="M4 4l16 16M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.3 7.7A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8" /></Trazo>
)
