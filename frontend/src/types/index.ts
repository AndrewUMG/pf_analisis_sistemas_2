// Formas de datos que devuelve la API. Reflejan los modelos Eloquent del backend.

export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  rol: 'administrador' | 'barbero' | 'recepcionista' | 'cliente'
  estado: 'activo' | 'inactivo' | 'suspendido'
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

export interface HorarioBarbero {
  id: number
  barbero_id: number
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export interface ExcepcionHorario {
  id: number
  barbero_id: number
  tipo: 'dia_libre' | 'permiso' | 'vacaciones' | 'otro'
  fecha_inicio: string
  fecha_fin: string
  motivo: string | null
}

export interface Barbero {
  id: number
  user_id: number
  especialidad: string | null
  comision_porcentaje: string
  user: Usuario
  servicios: Servicio[]
  horarios?: HorarioBarbero[]
  excepciones?: ExcepcionHorario[]
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

export interface AgendaDia {
  citas: Cita[]
  citas_atendidas: number
  comision_del_dia: number
}

export interface Producto {
  id: number
  nombre: string
  categoria: string | null
  precio: string
  existencia: number
  existencia_minima: number
  activo: boolean
  en_nivel_critico?: boolean
}

export interface MovimientoInventario {
  id: number
  producto_id: number
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo: string | null
  usuario_id: number
  created_at: string
  producto?: Producto
}

export interface VentaDetalle {
  id: number
  venta_id: number
  tipo: 'servicio' | 'producto'
  servicio_id: number | null
  producto_id: number | null
  barbero_id: number | null
  descripcion: string
  cantidad: number
  precio_unitario: string
  subtotal: string
  comision: string | null
}

export interface Venta {
  id: number
  cita_id: number | null
  cliente_id: number | null
  usuario_id: number
  numero_recibo: string
  subtotal: string
  descuento: string
  total: string
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  estado: 'pagada' | 'anulada'
  created_at: string
  cliente?: Usuario | null
  usuario?: Usuario
  detalles?: VentaDetalle[]
}

export interface PaginaVentas {
  data: Venta[]
  current_page: number
  last_page: number
  total: number
}

export interface PaginaUsuarios {
  data: Usuario[]
  current_page: number
  last_page: number
  total: number
}

export interface ParametroSistema {
  id: number
  clave: string
  valor: string
  descripcion: string | null
}

export interface ReporteIngresos {
  rango: { desde: string; hasta: string }
  total_periodo: number
  por_dia: { fecha: string; total: string }[]
}

export interface ReporteServiciosDemandados {
  rango: { desde: string; hasta: string }
  servicios: { nombre: string; veces_solicitado: number }[]
}

export interface ReporteComisiones {
  rango: { desde: string; hasta: string }
  comisiones: { barbero_id: number; barbero: string; comision_total: string; servicios_cobrados: number }[]
}

export interface ReporteCancelaciones {
  rango: { desde: string; hasta: string }
  total_citas: number
  por_estado: Record<EstadoCita, number>
  porcentaje_canceladas: number
  porcentaje_ausentes: number
}

/** Forma común de un error de negocio (422) o de validación de Laravel. */
export interface ErrorApi {
  mensaje?: string
  message?: string
  errors?: Record<string, string[]>
}
