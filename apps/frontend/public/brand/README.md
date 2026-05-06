# Brand Assets — Molins

Activos visuales oficiales de la marca Molins para uso en la aplicacion.

## Ficheros

| Fichero | Uso | Cuando usarlo |
|---------|-----|---------------|
| `molins-logo.png` | Logotipo horizontal completo ("Molins°") | Header principal, pantalla de login, emails, documentos exportados, pantallas de bienvenida. Siempre que haya espacio suficiente para leer el nombre completo. |
| `molins-symbol.png` | Simbolo de la marca (monograma "M°" dentro de circulo) | Favicon, avatares, iconos de app, elementos compactos, encabezados de presentaciones internas, merchandising visual. Solo cuando el logo Molins este cerca y la marca ya sea identificable, o cuando el espacio no permita el logo completo. |

Ambos ficheros son las versiones **RGB color** oficiales, aptas para todas las pantallas.

## Reglas del manual de marca (resumen operativo)

- **Solo se usa el simbolo aislado** cuando el logo Molins esta cerca y la marca se puede identificar, o en casos de espacio muy limitado (favicon, avatar, icono de app).
- **Color del semicirculo superior del simbolo**: siempre azul `#22ABF8` (Sky) sobre fondo blanco o verde oscuro. Sobre otros fondos, el simbolo se aplica **a una sola tinta** (verde, blanco o negro segun contraste).
- **Area de seguridad**:
  - Logo: el espacio libre alrededor equivale al tamaño del simbolo "°" del logo.
  - Simbolo: el area libre equivale a dos veces el grosor de las lineas del simbolo.
- **Tamaño minimo digital**: 30px de altura para cualquier version.
- **Nunca** se deforman, rotan, recolorean fuera de la paleta oficial, ni se aplican efectos (sombras, outlines, degradados).
- **Nunca** se modifican los ficheros PNG manualmente. Si se necesita una nueva variante (SVG, version monocroma, tamaño optimizado), se solicita a diseño o marca.

## Favicon y iconos de la app

El `index.html` ya referencia `/brand/molins-symbol.png` como:
- `<link rel="icon">`
- `<link rel="apple-touch-icon">`
- `theme-color` = `#003E39` (Molins Green)

Cualquier otro aplicativo que necesite icono (PWA manifest, notificaciones, splash) debe usar el mismo fichero.

## Paleta de marca (referencia rapida)

Los valores completos estan en `apps/frontend/design-tokens/molins-ui-kit.json`. Correspondencia con la guia de marca:

| Token Figma | Nombre oficial marca | HEX | Pantone |
|-------------|----------------------|-----|---------|
| `primary.green.500` | Molins Green | `#003E39` | 3302C |
| `primary.sky.500` | Sky | `#22ABF8` | 298C |
| `secondary.land.500` | Land | `#00CBBF` | 2239C |
| `secondary.sun.500` | Sun | `#FFC657` | 1365C |
| `secondary.earth.500` | Earth | `#E69876` | 7606C |
| `neutrals.0` | White | `#FFFFFF` | — |
| `neutrals.1000` | Black (solo B/N) | `#000000` | — |

## Fuentes ampliables

Para logotipos de negocios endosados ("by Molins"), versiones monocromas, variantes en negativo, descriptivos de negocio o reglas de co-branding: consultar el manual de marca completo o solicitar a diseño.
