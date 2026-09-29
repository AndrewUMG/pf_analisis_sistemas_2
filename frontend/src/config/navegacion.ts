import type { ComponentType } from 'react'
import { IconAjustes, IconCaja, IconCaja3d, IconCalendario, IconCampana, IconEstrella, IconEtiqueta, IconGrafica, IconInicio, IconPersonas, IconReloj, IconTijeras } from '../components/Icons'
import type { Usuario } from '../types'

type Icono = ComponentType<{ className?: string }>

export interface Enlace {
  to: string
  etiqueta: string
  icono: Icono
}

/** Enlaces de la cabecera pública (páginas y anclas dentro del inicio). */
export const ENLACES_SITIO: Enlace[] = [
  { to: '/', etiqueta: 'Inicio', icono: IconInicio },
  { to: '/servicios', etiqueta: 'Servicios', icono: IconTijeras },
  { to: '/#equipo', etiqueta: 'Equipo', icono: IconPersonas },
]

/** Enlaces extra del cliente con sesión iniciada. */
export const ENLACES_CLIENTE: Enlace[] = [{ to: '/mis-citas', etiqueta: 'Mis citas', icono: IconCalendario }]

/** Navegación lateral de los paneles internos, agrupada por rol. */
export const NAV_PANEL: Record<Exclude<Usuario['rol'], 'cliente'>, { grupo: string; enlaces: Enlace[] }[]> = {
  barbero: [
    {
      grupo: 'Mi jornada',
      enlaces: [
        { to: '/barbero/agenda', etiqueta: 'Mi agenda', icono: IconCalendario },
        { to: '/barbero/horario', etiqueta: 'Mi horario', icono: IconReloj },
      ],
    },
  ],
  recepcionista: [
    {
      grupo: 'Operación',
      enlaces: [
        { to: '/recepcion/caja', etiqueta: 'Caja', icono: IconCaja },
        { to: '/recepcion/walkin', etiqueta: 'Registro presencial', icono: IconPersonas },
        { to: '/recepcion/inventario', etiqueta: 'Inventario', icono: IconCaja3d },
      ],
    },
  ],
  administrador: [
    {
      grupo: 'Negocio',
      enlaces: [
        { to: '/admin/catalogo', etiqueta: 'Catálogo', icono: IconEtiqueta },
        { to: '/admin/usuarios', etiqueta: 'Usuarios', icono: IconPersonas },
        { to: '/recepcion/inventario', etiqueta: 'Inventario', icono: IconCaja3d },
      ],
    },
    {
      grupo: 'Análisis',
      enlaces: [
        { to: '/admin/reportes', etiqueta: 'Reportes', icono: IconGrafica },
        { to: '/admin/valoraciones', etiqueta: 'Valoraciones', icono: IconEstrella },
      ],
    },
    {
      grupo: 'Sistema',
      enlaces: [
        { to: '/admin/notificaciones', etiqueta: 'Notificaciones', icono: IconCampana },
        { to: '/admin/parametros', etiqueta: 'Parámetros', icono: IconAjustes },
      ],
    },
  ],
}
