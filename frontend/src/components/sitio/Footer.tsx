import { Link } from 'react-router-dom'
import { NEGOCIO } from '../../config/negocio'
import { Contenedor } from '../Contenedor'
import { Logo } from '../Logo'
import { IconReloj, IconTelefono, IconUbicacion } from '../Icons'

/** Pie de página en verde de marca: identidad, contacto, horario y enlaces útiles. */
export function Footer() {
  return (
    <footer className="textura-rayas mt-24" style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' }}>
      <Contenedor className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo invertido />
          <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-80">{NEGOCIO.eslogan}. Reserva en línea, sin filas ni llamadas.</p>
        </div>

        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
            Visítanos
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5 opacity-90">
              <IconUbicacion className="mt-0.5 h-4 w-4 shrink-0" />
              {NEGOCIO.direccion}
            </li>
            <li className="flex gap-2.5 opacity-90">
              <IconReloj className="mt-0.5 h-4 w-4 shrink-0" />
              {NEGOCIO.horario}
            </li>
            <li className="flex gap-2.5 opacity-90">
              <IconTelefono className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={`tel:${NEGOCIO.telefono.replace(/\s/g, '')}`} className="hover:underline">
                {NEGOCIO.telefono}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
            Explorar
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/servicios" className="opacity-90 hover:underline">Servicios</Link></li>
            <li><Link to="/#equipo" className="opacity-90 hover:underline">Nuestro equipo</Link></li>
            <li><Link to="/reservar" className="opacity-90 hover:underline">Reservar cita</Link></li>
            <li><Link to="/mis-citas" className="opacity-90 hover:underline">Mis citas</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
            ¿Listo?
          </h2>
          <p className="mt-4 text-sm opacity-90">Elige tu servicio y tu barbero en menos de un minuto.</p>
          <Link to="/reservar" className="btn-dorado mt-4">
            Reservar ahora
          </Link>
        </div>
      </Contenedor>

      <div className="border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-text-on-brand) 15%, transparent)' }}>
        <Contenedor className="flex flex-col gap-2 py-5 text-xs opacity-70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {NEGOCIO.nombre}. Todos los derechos reservados.</p>
          <p>Hecho con cuidado para una barbería de barrio.</p>
        </Contenedor>
      </div>
    </footer>
  )
}
