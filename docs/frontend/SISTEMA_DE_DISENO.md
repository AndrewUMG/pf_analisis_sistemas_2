# Sistema de diseño — Studio La Barber

Dirección: **Clásico premium** (marfil, verde bosque, dorado). Tema claro por defecto con tema oscuro re-afinado.

## Tokens (`frontend/src/index.css`)
- Definidos con Tailwind v4 `@theme`; el tema oscuro los sobrescribe en `:root[data-theme='dark']`.
- Semánticos: `--color-bg, surface, text, text-muted, text-faint, accent, danger, success, info…`; marca: `--color-brand*`; `--color-star` (valoraciones); `--color-sidebar*` (paneles).
- Sombras `--shadow-card`, `--shadow-float`; easing `--ease-salida`.
- Contraste: `node frontend/scripts/contraste.mjs` valida todos los pares a WCAG AA (4.5:1) en ambos temas.

## Tipografía
Autohospedada con `@fontsource-variable`: **Fraunces** (serif, h1–h3) e **Inter** (texto/UI).

## Clases reutilizables
`.campo`, `.btn-principal`, `.btn-dorado`, `.btn-secundario`, `.btn-peligro`, `.btn-texto`, `.btn-lg`, `.tarjeta`, `.tarjeta-interactiva`, `.chip`, `.badge`, `.eyebrow`, `.divisor-ornamental`, `.placeholder-imagen`, `.skeleton`, `.aparecer`, `.saltar`.

## Layouts
- `SitioLayout`: cabecera, pie y contenido público/cliente.
- `PanelLayout`: sidebar fijo ≥1024 px, drawer en móvil; valida el rol.
- Rutas con `React.lazy` y `ErrorBoundary`.
- Navegación centralizada en `config/navegacion.ts`; datos del negocio en `config/negocio.ts` (dirección y fotos pendientes).

## Componentes clave
`Modal` y `Drawer` (hook `useDialogo`: trampa de foco, Esc, bloqueo de scroll), `Campo` (etiqueta/ayuda/error enlazados), `Skeleton`, `panel/Piezas` (`StatCard`, `Panel`, `EstadoVacio`, `Paginacion`, `Barra`), `reserva/*` (asistente de reserva), `sitio/*`.

## Reglas responsive y accesibilidad
- Mobile-first; sin scroll horizontal; objetivos táctiles ≥44 px en `pointer: coarse`.
- Foco visible global, enlace para saltar al contenido, `prefers-reduced-motion` respetado.
- Los estados no dependen solo del color; los diálogos reemplazan a `confirm()`.

## Imágenes
`ImagenPlaceholder` muestra un placeholder de marca hasta que se sube una foto real (Admin → Catálogo); `loading="lazy"` y proporción fija.
