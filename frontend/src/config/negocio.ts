/**
 * Datos del negocio que se muestran en el sitio (cabecera, pie, hero).
 * EDITAR AQUÍ: los valores marcados como "pendiente" son de ejemplo hasta tener los reales.
 *
 * Fotos: deja el archivo en `frontend/public/imagenes/` y escribe su ruta (p. ej. '/imagenes/hero.jpg').
 * Mientras sea null se muestra un espacio reservado de marca.
 */
export const NEGOCIO = {
  nombre: 'Studio La Barber',
  eslogan: 'Tu mejor versión empieza en la silla',
  direccion: 'Dirección del local (pendiente)',
  telefono: '+502 0000 0000',
  correo: 'hola@studiolabarber.com',
  horario: 'Lunes a sábado · 9:00 – 18:00',
  imagenes: {
    hero: null as string | null,
    local: null as string | null,
  },
}
