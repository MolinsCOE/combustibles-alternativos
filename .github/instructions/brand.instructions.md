---
description: "Use al aplicar la identidad de marca Molins: logo, simbolo, favicon, tono de voz, nombres de negocios y cargos. Complementa a design-system (tokens) y frontend (implementacion)."
applyTo: "apps/frontend/**"
---

# Identidad de Marca — Molins

Esta instruccion resume las reglas del **Manual de Marca Molins** y su **Extension** (anexo 1) aplicables a la app. Referencia interna, no sustituye al manual oficial.

## Activos visuales

Los ficheros oficiales estan en `apps/frontend/public/brand/`:

- `molins-logo.png` — Logotipo completo ("Molins°"). Horizontal. Version RGB color oficial.
- `molins-symbol.png` — Simbolo ("M°" dentro de circulo). Monograma. Version RGB color oficial.

Son ficheros **de solo lectura**. Nunca se editan a mano. Si se necesita una variante (SVG, version negativa, monocroma), se solicita a diseño o marca.

### Cuando usar cada uno

| Contexto | Activo |
|----------|--------|
| Header de la app con espacio suficiente | `molins-logo.png` |
| Login / splash / pantallas de bienvenida | `molins-logo.png` |
| Emails transaccionales | `molins-logo.png` |
| Favicon del navegador | `molins-symbol.png` |
| Apple touch icon / iconos de PWA | `molins-symbol.png` |
| Avatares de usuario por defecto | `molins-symbol.png` |
| Encabezado compacto en movil (<375px) | `molins-symbol.png` |
| Loaders / placeholders | `molins-symbol.png` |

**Regla clave**: el simbolo aislado solo es valido si el logo completo esta cerca, la marca ya es reconocible o el espacio no permite usar el logo. No usar simbolo aislado en pantallas donde el usuario acabe de llegar sin haber visto antes "Molins".

### Reglas tecnicas del simbolo y logo

- **Color del semicirculo superior**: siempre `#22ABF8` (Sky) sobre fondo blanco o verde oscuro. Sobre otros fondos, aplicar a una sola tinta (verde `#003E39`, blanco o negro segun contraste).
- **Area de seguridad**: logo → altura del simbolo del logo; simbolo → 2× grosor de linea del circulo.
- **Tamaño minimo digital**: 30px de altura.
- Prohibido: deformar, rotar, recolorear fuera de la paleta, aplicar sombras/outlines/degradados, recortar, incrustar dentro de otros elementos, colocar sobre fondos de bajo contraste.

## Nombres y nomenclatura (extension del manual)

Reglas obligatorias al escribir textos en la UI y documentacion:

- "**Molins**" siempre con mayuscula inicial y resto en minuscula. Nunca MOLINS en caps excepto en un logo.
- **Nunca** usar "grupo Molins". Se dice "Molins", "empresa" o "compañia Molins".
- **No** usar "empresa familiar". Usar "empresa de origen familiar".
- **No** usar "empresa internacional". Usar "empresa global".
- **No** usar "unidades de negocio". Usar "nuestros negocios".
- **No** usar "negocios internacionales/nacionales". Usar "negocios en España" y "negocios en otros paises".
- Nombres de negocios (Cement, Construction Solutions, Precast Solutions, Concrete & Aggregates, Circular Economy, Corporate, Corporate IT Solutions & Services, Global Business Services) **siempre en ingles** cuando aparecen con el logo o en comunicacion externa.
- En texto corrido externo: cada palabra del descriptivo con inicial mayuscula ("Construction Solutions de Molins", no "construction solutions").
- Externamente se prioriza "Cement **de** Molins" sobre "Molins Cement". La unica marca es Molins.
- **Siglas** (CS, PS, CA, CE, CMT) solo en emails internos, nunca hacia fuera.

## Cargos y firmas

- Cargos en **ingles** → inicial mayuscula en cada palabra, y "Molins" **al inicio**: `Molins IT Project Manager`.
- Cargos en **español** → solo inicial mayuscula en la primera palabra, y "Molins" **al final** o con "en Molins": `Jefa de marketing de Concrete & Aggregates en Molins`.
- **No traducir** cargos: si estan en español se dejan en español y viceversa.
- En textos internos dirigidos al equipo, **no repetir** "Molins" al mencionar a una persona Molins: basta con "Daria Yanchuk, Consolidation Specialist, Global Business Services".

## Tono de voz

Segun el manual: **cercano, claro, humano, global y sostenible**. En la UI:

- Frases cortas, directas, en segunda persona cuando sea posible.
- Evitar jerga corporativa y lenguaje frio.
- Evitar marcadores de genero innecesarios (preferir formas neutras).
- Español como idioma principal de la app (las pautas de este repositorio ya lo establecen).

## Paleta de marca (coherencia con design tokens)

Los tokens normalizados en [apps/frontend/design-tokens/molins-ui-kit.json](../../apps/frontend/design-tokens/molins-ui-kit.json) reflejan fielmente la paleta oficial:

| Uso en UI | Token | HEX |
|-----------|-------|-----|
| Acento principal, headers, CTAs oscuros | `primary.green.500` | `#003E39` |
| Acento secundario, detalles, links | `primary.sky.500` | `#22ABF8` |
| Highlights, graficos | `secondary.land.500` | `#00CBBF` |
| Alertas warning, graficos | `secondary.sun.500` | `#FFC657` |
| Calidez, graficos | `secondary.earth.500` | `#E69876` |
| Blanco corporativo | `neutrals.0` | `#FFFFFF` |
| Black (solo B/N monocromo) | `neutrals.1000` | `#000000` |

- **Nunca** introducir colores fuera de la paleta oficial + neutrals.
- Mantener la jerarquia: verde Molins como protagonista, Sky como acento, secundarios (Land/Sun/Earth) solo en graficos y elementos de soporte.

## Tipografia oficial

- **Be Vietnam Pro** es la unica tipografia corporativa.
- Pesos permitidos: ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold.
- Uso en UI: combinar maximo dos pesos con diferencia minima de dos grados (ej. Bold + Medium, nunca Bold + SemiBold).
- La tipografia ya esta configurada en los design tokens (`typography.family`).

## Checklist al implementar pantallas

- [ ] Logo/simbolo elegido segun la tabla de arriba.
- [ ] Colores usados son tokens del design system, no hex sueltos.
- [ ] Textos respetan nomenclatura Molins (sin "grupo Molins", "empresa familiar", etc.).
- [ ] Cargos siguen la regla ingles/español.
- [ ] Tipografia Be Vietnam Pro aplicada.
- [ ] El simbolo aislado (si se usa) es coherente con el manual.
