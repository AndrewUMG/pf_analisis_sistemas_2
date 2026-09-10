// Formas de datos que devuelve la API. Reflejan los modelos Eloquent del backend.

export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  rol: 'administrador' | 'barbero' | 'recepcionista' | 'cliente'
  estado: 'activo' | 'inactivo'
  barbero?: BarberoPerfil | null
}

export interface Servicio {
  id: number
  nombre: string
  categoria: 'corte' | 'barba' | 'tratamiento' | 'spa_facial' | 'combo'
  descripcion: string | null
  duracion_minutos: number
  precio: string
  imagen: string | null
  activo: boolean
}

export interface BarberoPerfil {
  id: number
  user_id: number
  especialidad: string | null
  comision_porcentaje: string
}

export interface Barbero {
  id: number
  user_id: number
  especialidad: string | null
  comision_porcentaje: string
  user: Usuario
  servicios: Servicio[]
}

export type EstadoCita =
  | 'confirmada'
  | 'en_atencion'
  | 'completada'
  | 'cancelada'
  | 'ausente'

export interface CitaDetalle {
  id: number
  servicio_id: number
  precio_aplicado: string
  duracion_aplicada: number
  servicio?: Servicio
}

export interface Cita {
  id: number
  cliente_id: number
  barbero_id: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoCita
  canal_origen: 'en_linea' | 'presencial'
  notas: string | null
  monto_estimado: string | null
  cliente?: Usuario
  barbero?: Barbero
  detalles?: CitaDetalle[]
}

export interface PaginaCitas {
  data: Cita[]
  current_page: number
  last_page: number
  total: number
}

/** Forma común de un error de negocio (422) o de validación de Laravel. */
export interface ErrorApi {
  mensaje?: string
  message?: string
  errors?: Record<string, string[]>
}
