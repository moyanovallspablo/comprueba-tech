# comprueba.tech · Design System

Este documento es la **referencia obligatoria** para cualquier interfaz de comprueba.tech. Si una pantalla nueva necesita algo que no está aquí, se añade aquí primero (token, regla o componente) y después se usa.

- **Fuente de verdad de los tokens:** [`app/globals.css`](app/globals.css) (CSS + `@theme` de Tailwind v4).
- **Espejo para WebGL/SVG** (contextos sin variables CSS): [`lib/brand.ts`](lib/brand.ts). Si cambias uno, cambia el otro.
- **Primitivas de UI:** [`components/advisor/ui.tsx`](components/advisor/ui.tsx) (`Card`, `GlowFrame`, `PrimaryButton`, `GhostButton`, `OptionButton`, `BrandPill`, `VerdictBadge`, `Eyebrow`).

---

## 1. Principios

1. **Claridad de laboratorio.** Fondo gris espacial, superficies blancas, bordes casi invisibles. El color de marca es un acento, nunca un fondo de página.
2. **Los datos se leen en mono.** Cualquier cifra técnica (precio, Hz, ppi, cm, notas) va en Geist Mono con `tabular-nums`.
3. **Honestidad visual.** Verde = ventaja o recomendación; ámbar = advertencia o sacrificio; rosa = descarte o desventaja. No se usan para decorar.
4. **Accesible por defecto.** WCAG 2.2 AA en texto y controles, foco visible, movimiento reducido respetado.
5. **Solo modo claro.** `<body>` declara `color-scheme: light`; no hay variante oscura.

---

## 2. Color

### 2.1 Marca

| Token CSS | Utilidad Tailwind | Valor | Uso |
| --- | --- | --- | --- |
| `--brand-primary` | `brand` | `#059669` Verde Esmeralda | Iconos, bordes activos, anillos de foco, indicadores. **No** para texto pequeño ni como fondo de texto blanco. |
| `--brand-accent` | `brand-accent` | `#10B981` Menta | Brillos, puntos de foco, extremos de degradados, cotas del visor 3D. Nunca texto. |
| `--brand-primary-strong` | `brand-strong` | `#047857` | Relleno de botones con texto blanco; texto de marca (enlaces, «Limpiar», etiquetas de pastilla). |
| `--brand-primary-deep` | `brand-deep` | `#065F46` | Hover de rellenos con texto blanco. |
| `--brand-glow` | `brand-glow` | `rgba(16,185,129,.12)` | Fondo de elementos seleccionados, pastillas y avisos de marca. |
| `--brand-border-glow` | `brand-border` | `rgba(16,185,129,.30)` | Bordes y anillos iluminados (`ring-brand-border`). |

### 2.2 Neutros y superficies

| Token | Utilidad | Valor | Uso |
| --- | --- | --- | --- |
| `--color-canvas` | `canvas` | `#F7F7F9` | Fondo de página y zonas hundidas dentro de tarjetas (`bg-canvas/60`). |
| `--color-ink` | `ink` | `#0B0B0F` | Texto principal y titulares. |
| `--color-hairline` | `hairline` | `rgb(15 15 25 / .07)` | **Borde sutil por defecto** de tarjetas, divisores y campos. |
| — | `white` | `#FFFFFF` | Superficie de tarjetas, menús y diálogos. |
| — | `zinc-500` / `zinc-600` / `zinc-700` | Tailwind | Texto secundario, eyebrows, placeholders y hints / texto secundario sobre `brand-glow` / cuerpo largo. |
| — | `zinc-300` | Tailwind | **Solo** separadores tipográficos («×», flechas) e iconos puramente decorativos. **Prohibido `text-zinc-400`** en el sitio (2,56:1). |

### 2.3 Semánticos

| Significado | Fondo | Texto | Anillo |
| --- | --- | --- | --- |
| Recomendado / ventaja | `bg-emerald-50` | `text-emerald-700` | `ring-emerald-600/15` |
| Advertencia / con oferta | `bg-amber-50` | `text-amber-800` | `ring-amber-600/20` |
| Descartado / desventaja | `bg-rose-50` | `text-rose-700` | `ring-rose-600/15` |

### 2.4 Contraste verificado (WCAG 2.2)

| Par | Ratio | Veredicto |
| --- | --- | --- |
| Blanco sobre `brand-strong` `#047857` | 5,48:1 | ✅ AA texto normal |
| Blanco sobre `brand-deep` `#065F46` | 7,68:1 | ✅ AAA |
| Blanco sobre `brand` `#059669` | 3,77:1 | ❌ texto · ✅ solo gráficos/iconos (≥ 3:1) |
| Blanco sobre `brand-accent` `#10B981` | 2,54:1 | ❌ nunca con texto |
| `brand-strong` sobre blanco | 5,48:1 | ✅ |
| `brand-strong` sobre `brand-glow` (sobre blanco) | 4,99:1 | ✅ |
| `brand-strong` sobre `canvas` | 5,13:1 | ✅ |
| `ink` sobre `canvas` | 18,36:1 | ✅ |
| `zinc-500` sobre blanco / `canvas` | 4,83:1 / 4,52:1 | ✅ (mínimo para texto informativo) |
| `zinc-500` sobre `brand-glow` (filas activas) | 4,33:1 | ❌ → usar `zinc-600` (6,92:1) |
| `zinc-400` sobre blanco | 2,56:1 | ❌ no se usa para texto |

> **Regla:** texto de color de marca → `text-brand-strong`. `text-brand` solo en iconos, bordes y cifras grandes (≥ 24 px, o ≥ 18,66 px en negrita).

### 2.5 Portada: nivel AAA

La home (`app/page.tsx`, `components/home/`) cumple **WCAG 2.2 AAA** (7:1 en texto normal, 4,5:1 en texto grande). Sus primitivas están en [`components/home/SectionHeader.tsx`](components/home/SectionHeader.tsx) (`aaaButton`, `tagEmerald`, `tagAmber`, `homeEyebrow`, `tile`).

| Uso en la portada | Par | Ratio |
| --- | --- | --- |
| Texto secundario | `zinc-600` sobre blanco / `canvas` / tintes pastel | 7,73 / 7,22 / ≥ 7,29:1 |
| Subtítulo sobre el aura del hero (punto más intenso) | `zinc-700` | 8,62:1 (`zinc-600` bajaría a 6,38) |
| CTA | Blanco sobre `emerald-800` → hover `emerald-900` | 7,68 → 9,72:1 |
| Botón «Buscar» e insignia «VS» (menta) | `ink` sobre `emerald-500` / `emerald-400` / `teal-300` | 7,74 / 10,22 / 13,28:1 |
| Etiqueta verde · ámbar | `emerald-900` sobre `emerald-100` · `amber-900` sobre `amber-100` | 8,57 · 8,15:1 |
| Ventajas de duelo | `emerald-800` sobre `emerald-50` | 7,29:1 |
| Titular «exacto.» (≥ 48 px) | `text-gradient-brand-deep` (`brand-deep` → `brand-strong`) sobre el aura | ≥ 4,53:1 |
| Unidad «%» de métricas (≥ 48 px) | `emerald-700` sobre blanco | 5,48:1 |

- **Prohibido en la portada:** texto blanco sobre `emerald-600`/`emerald-500` (3,77 / 2,54:1) y `text-gradient-brand` (su extremo menta da 2,4:1).
- **Tintes de tarjeta por tipo de contenido:** recomendación del algoritmo `bg-emerald-50/60 border-emerald-200/70`; precio / mínimo histórico `bg-amber-50/50 border-amber-200/60`; herramientas y duelos `bg-white border-zinc-200`.
- **Fondo decorativo del hero:** `bg-dot-grid` (malla de puntos con máscara) y esferas `bg-emerald-400/15` · `bg-teal-300/10` con `blur-3xl` y `motion-safe:animate-aura` (deriva de 18 s, desactivada con movimiento reducido). Siempre `aria-hidden` y `pointer-events-none`.

---

## 3. Tipografía

Fuentes cargadas con `next/font` en [`app/layout.tsx`](app/layout.tsx) y expuestas como `--font-sans` y `--font-mono`.

| Familia | Utilidad | Uso |
| --- | --- | --- |
| **Geist Sans** | `font-sans` (por defecto) | Titulares, cuerpo, botones, etiquetas. |
| **Geist Mono** | `font-mono` + `tabular-nums` | Precios en tablas y deltas, especificaciones (Hz, ppi, cm, W), notas `/100`, atajos `<kbd>`, rótulos A/B. |

### Escala

| Rol | Clases | Notas |
| --- | --- | --- |
| Display (hero) | `text-4xl sm:text-5xl font-semibold tracking-tight` | Una por página. |
| Display XL (portada) | `text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight` | Solo el H1 de la home. Comprobado a 320 px sin desbordar. |
| H1 de página | `text-3xl sm:text-4xl font-semibold tracking-tight` | |
| H2 de sección | `text-xl sm:text-2xl font-semibold tracking-tight` | Precedido de `Eyebrow`. |
| Título de tarjeta | `text-lg font-semibold tracking-tight` | |
| Precio destacado | `text-4xl font-semibold tabular-nums` | Sans; el resto de cifras, mono. |
| Cuerpo | `text-sm` (14/20) · `text-[15px]` en textos destacados | |
| Secundario | `text-xs` (12/16) `text-zinc-500` | |
| Eyebrow | `text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500` | Componente `Eyebrow`. |
| Micro-etiqueta | `text-[10px]` / `text-[11px]` | Solo `dt` de fichas compactas y leyendas. Nunca contenido crítico. |

Reglas:

- `h1`–`h3` llevan `text-wrap: balance` globalmente; el `body` lleva `overflow-wrap: break-word` para que ningún modelo largo (p. ej. «27GR95QE-B») desborde.
- Sin `font-bold` (700): el sistema usa `font-medium` (500) y `font-semibold` (600).
- Titulares grandes: siempre `tracking-tight`.

---

## 4. Espaciado y rejilla de 8 px

La unidad base es **4 px** (`--spacing` de Tailwind = 0,25 rem) y el **ritmo es de 8 px**.

| Ámbito | Valores permitidos | Ejemplos |
| --- | --- | --- |
| **Layout** (separación entre tarjetas y secciones, padding de tarjeta, márgenes de página) | Múltiplos de 8 px: `2 4 6 8 10 12 14 16 20` | `gap-6`, `mt-6`, `p-6 sm:p-8`, `mt-14`, `px-4 sm:px-6` |
| **Interior de componente** (gaps, paddings de chips y filas) | Múltiplos de 4 px: `1 2 3 4 5 6` | `gap-2`, `gap-3`, `px-3`, `py-3` |
| **Medios pasos** (`x.5`: 2, 6, 10, 14 px) | Solo en dos casos documentados | ver abajo |

Excepciones de medio paso (las únicas aceptadas):

1. **Padding vertical que compensa el interlineado** para que la caja quede en la rejilla: `py-1.5` + `text-sm` (20 px) = **32 px**; `py-2.5` + `text-sm` = **40 px**; `py-0.5` + `text-xs` (16 px) = **20 px**.
2. **Ajuste óptico de 2 px** (`mt-0.5`, `p-0.5`, `gap-0.5`) para alinear un icono de 16 px con la primera línea de texto o para el borde interior de un grupo segmentado.

Alturas de control (siempre en la rejilla): **32 px** (`h-8`, chips y segmentados), **40 px** (`h-10`, botones e iconos de cabecera), **48 px** (`h-12`, CTA grandes), **56 px** (`h-14`, buscadores).

Prohibido: `gap-1.5`, `gap-2.5`, `px-3.5`; `p-5`/`p-7`/`mt-7` en tarjetas y layout (20 y 28 px rompen el ritmo de 8); valores arbitrarios en px para espaciado (`mt-[13px]`). Alturas fijas grandes con tokens (`h-96`, `sm:h-120`, `min-h-106`), no `h-[380px]`.

Contenedores de página: `mx-auto w-full max-w-5xl px-4 sm:px-6` (catálogo: `max-w-6xl`), `pt-8 sm:pt-12`, `pb-20`.

---

## 5. Radios, bordes y elevación

| Elemento | Radio | Borde | Sombra |
| --- | --- | --- | --- |
| Tarjeta (`Card`) | `rounded-3xl` (24 px) | `border border-hairline` | `shadow-elevated` |
| Tarjeta en hover (si es enlace) | — | — | `hover:shadow-float` + `hover:-translate-y-0.5` |
| Panel interior / opción de wizard | `rounded-2xl` (16 px) | `border-hairline` | — |
| Campo, chip de filtro | `rounded-xl` (12 px) | `border-hairline`; foco `border-brand ring-4 ring-brand-glow` | — |
| Botones, pastillas, segmentados | `rounded-full` | — | ver §6 |
| Diálogos y paletas | `rounded-3xl` | `border-hairline` | `shadow-float` |

Contenido dentro de un marco con degradado: radio interior `rounded-[calc(1.5rem-1px)]` (24 px menos el píxel del marco).

---

## 6. Componentes

### 6.1 Tarjetas elevadas — `Card`

```tsx
<Card className="p-6 sm:p-8">…</Card>
// = rounded-3xl border border-hairline bg-white shadow-elevated
```

- Padding: `p-6` en móvil, `sm:p-8` en escritorio (tarjetas compactas de rejilla: `p-6` fijo).
- Zonas secundarias dentro de la tarjeta: `border-t border-hairline bg-canvas/60`.
- Fondo de foto de producto en la portada: `rounded-2xl bg-zinc-100/70` en los duelos; dentro de tarjetas tintadas, `bg-white` con `ring-1 ring-inset` del tinte (las fotos tienen fondo blanco). Insignia de duelo «VS»: `size-11 rounded-full bg-gradient-to-br from-teal-300 via-emerald-400 to-emerald-500 text-ink font-mono text-xs ring-4 ring-white shadow-glow`.
- Separación entre tarjetas apiladas: `space-y-6` / `gap-6`; en rejillas de producto, `gap-4`.

### 6.2 Bordes con degradado — `GlowFrame` / `border-gradient-brand`

Reservado al **elemento protagonista** de cada vista (tarjeta ganadora, lanzador de comparativas). Máximo uno por pantalla.

```tsx
<GlowFrame>
  <div className="rounded-[calc(1.5rem-1px)] bg-white p-6 sm:p-8">…</div>
</GlowFrame>
```

- `border-gradient-brand` pinta un marco de 1 px (degradado menta → esmeralda → hairline) mediante `padding: 1px`; el hijo pone el fondo blanco.
- Lleva detrás un halo `bg-ambient-glow` desenfocado (`aria-hidden`). El contenedor de página usa `overflow-x-clip` para que el halo nunca cree scroll horizontal.
- Para titulares de acento: `text-gradient-brand` (máximo una frase por página).

### 6.3 Botones (WCAG AA)

| Variante | Base | Tamaños | Estados |
| --- | --- | --- | --- |
| **Primario** — `PrimaryButton` / `brandButtonBase` | `bg-brand-strong text-white rounded-full font-medium shadow-glow-sm` | `sm` `px-4 py-2 text-xs` (32 px) · `md` `px-5 py-2.5 text-sm` (40 px) · `lg` `px-5 py-3 text-sm` · CTA `h-12 px-6 text-[15px]` | hover `bg-brand-deep shadow-glow` · active `scale-[0.98]` · foco `outline-2 outline-offset-2 outline-brand` · disabled `opacity-30` sin sombra |
| **Secundario de marca** | `bg-brand-glow text-brand-strong ring-1 ring-inset ring-brand-border` | `px-4 py-2 text-xs` / `py-2.5 text-sm` | hover `bg-brand-strong text-white` |
| **Neutro con borde** | `border border-hairline bg-white text-ink` | `px-4 py-2 text-xs` / `h-10 px-4 text-sm` | hover `border-brand-border` o `bg-canvas` |
| **Fantasma** — `GhostButton` | `text-zinc-500` | `px-4 py-2.5 text-sm` | hover `bg-black/[0.04] text-ink` · foco `outline-ink` |
| **Enlace de texto** | `text-sm font-medium text-ink` o `text-brand-strong` | — | hover `underline` / `text-brand-strong` |
| **Solo icono** | `grid size-10 place-items-center rounded-full` | 40 px (mín. 32 px dentro de listas) | **obligatorio** `aria-label` |

Reglas de accesibilidad de botones:

- Texto blanco **solo** sobre `brand-strong` o `brand-deep`. Nunca sobre `brand` ni `brand-accent`.
- Texto de marca sobre blanco o `brand-glow`: `text-brand-strong`. En hover, `hover:text-brand-strong`, nunca `hover:text-brand`.
- Área táctil mínima: 24 × 24 px (WCAG 2.5.8); objetivo 40 px en controles principales.
- Toggles: `aria-pressed`. Grupos excluyentes: `role="radiogroup"` + `role="radio"` + `aria-checked`.
- Enlaces externos de compra: `target="_blank" rel="sponsored nofollow noopener noreferrer"` y `aria-label` que avise de la pestaña nueva.
- Si en móvil se oculta la etiqueta de un botón, se oculta con `sr-only` (p. ej. `max-xs:sr-only`), nunca con `hidden`.

### 6.4 Opciones seleccionables — `OptionButton`

- Reposo: `border-hairline bg-white`, hover `-translate-y-0.5 border-brand-border shadow-elevated`.
- Seleccionado: `border-brand bg-brand-glow shadow-glow`, `aria-pressed`.

### 6.5 Segmentados con pastilla animada

`flex rounded-full bg-canvas p-1` + botones `rounded-full px-3 py-1.5`; el activo lleva una `motion.span` con `layoutId` único por grupo, `bg-white shadow-elevated`. Si los iconos no caben por debajo de 360 px, `max-xs:hidden` en el icono, nunca en la etiqueta.

### 6.6 Pastillas y badges

- `BrandPill`: `bg-brand-glow text-brand-strong ring-brand-border`, Eyebrow en mayúsculas. Para etiquetas destacadas («Veredicto de confianza», «Nº 1 para ti»).
- `VerdictBadge`: colores semánticos de §2.3, `px-3 py-0.5 text-xs` o `px-4 py-1.5 text-sm`.

### 6.7 Campos

`rounded-xl border border-hairline bg-canvas` (o `bg-white` + `shadow-elevated` en buscadores), foco `border-brand ring-4 ring-brand-glow`. Placeholders con `placeholder:text-zinc-500`. Sufijos de unidad (`cm`) en mono `text-zinc-500` con `pointer-events-none`. Los `<input type="range">` usan la clase `.range-brand` con la variable `--fill`.

### 6.8 Datos técnicos

- Tablas y fichas: `dt` en sans `text-zinc-500` (o micro `text-[11px] text-zinc-500` en fichas compactas), `dd` en `font-mono text-ink`.
- Ventaja en comparativas: `bg-emerald-50 text-emerald-700 font-semibold` + icono `Check` con `aria-label`.
- Deltas: `−` (signo menos tipográfico, U+2212) y `+`; positivo para el usuario en `text-brand-strong`/`text-brand` (iconos), negativo en `text-rose-600`.

---

## 7. Movimiento

- **Librería:** Motion (`motion/react`). Curva de marca: `ease-out-soft` = `cubic-bezier(0.22, 1, 0.36, 1)`; en JS, `[0.22, 1, 0.36, 1]`.
- **Duraciones:** 150–200 ms en microinteracciones, 250–350 ms en entradas y salidas, ≤ 800 ms en rellenos de medidores. Muelles: `stiffness 380–500, damping 38–40`.
- **Movimiento reducido (obligatorio):**
  - `<MotionProvider>` ([`components/site/MotionProvider.tsx`](components/site/MotionProvider.tsx)) envuelve toda la app en `layout.tsx` con `MotionConfig reducedMotion="user"` y activa `MotionGlobalConfig.instantAnimations` cuando el sistema pide reducir movimiento: todas las animaciones de Motion (transform, layout, height, width, filter, strokeDashoffset) saltan a su estado final.
  - `globals.css` neutraliza animaciones y transiciones CSS (`animate-spin`, `animate-pulse`, hovers con `translate`) bajo `prefers-reduced-motion: reduce`.
  - Scroll programático: `behavior: scrollBehavior()` de [`lib/motion.ts`](lib/motion.ts), nunca `"smooth"` a pelo.
  - three.js / R3F: leer `useReducedMotion()` y desactivar amortiguaciones (`enableDamping`, `MathUtils.damp`).
- No se añaden `MotionConfig` locales: la configuración es global.

---

## 8. Responsive

Breakpoints: `xs` 360 px (custom; se usa como `max-xs:` para móviles de 320 px), `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

Reglas para evitar saltos de layout y texto desbordado:

1. **Comprobar a 320, 360 y 375 px.** Ningún elemento puede provocar scroll horizontal.
2. **Rejillas de una columna en móvil con `grid-cols-1` explícito.** Sin él, la pista implícita es `auto` y crece hasta el ancho del texto `truncate` (nowrap) en lugar de recortarlo.
3. **`min-w-0` en todo hijo flex o grid que contenga `truncate`.**
4. Nombres de modelo en titulares: tamaño responsive (`text-2xl sm:text-3xl`) y contenedor con `min-w-0`.
5. Tablas con más de 2 columnas: envolver en `overflow-x-auto`.
6. Alturas de viewport con `dvh`, no `vh` (la barra del navegador móvil no debe mover el layout).
7. Cabecera fija: `--header-h` (112 px en móvil con pestañas, 64 px en escritorio). Anclas con `scroll-mt-[calc(var(--header-h)+1rem)]`; elementos sticky con `top-[calc(var(--header-h)+1.5rem)]`.
8. Contenedores con contenido animado de altura variable (pasos del wizard): `min-h-*` para que el pie no salte entre pasos.
9. Grupos de opciones que no caben en 3 columnas en móvil pasan a una fila por opción (`grid gap-2 sm:grid-cols-3`).

---

## 9. Iconografía e ilustración

- `lucide-react`, trazo por defecto (1,75 en iconos grandes de opción). Tamaños: `size-3.5` (14 px, en texto `xs`), `size-4` (16 px, por defecto), `size-5` (20 px, CTA y cabeceras de tarjeta).
- Iconos decorativos junto a texto: sin `aria-label`. Iconos que transmiten estado («Ventaja»): con `aria-label`.
- Contenedor de icono: `grid size-8|size-9|size-11 place-items-center rounded-lg|rounded-xl|rounded-2xl bg-canvas`.
- `MonitorIllustration` dibuja a escala real (8 px por pulgada): dos ilustraciones son comparables en tamaño. Lleva `role="img"` y `aria-label`.
- Isotipo: `BrandMark` (degradado menta → `brand-strong`). Logotipo: `Wordmark` («comprueba» en `ink` + «.tech» en `brand`).

---

## 10. Checklist antes de fusionar UI

- [ ] Solo tokens de este documento (sin hex sueltos en componentes; en WebGL/SVG, `BRAND` de `lib/brand.ts`).
- [ ] Espaciado en la rejilla de 8 px (excepciones de §4 justificadas).
- [ ] Contraste AA: texto blanco solo sobre `brand-strong`/`brand-deep`; texto de marca con `text-brand-strong`; texto secundario con `zinc-500` (nunca `zinc-400`), `zinc-600` sobre `brand-glow`.
- [ ] Foco visible en todo control; `aria-label` en botones de solo icono.
- [ ] Sin scroll horizontal ni texto cortado a 320/360/375 px.
- [ ] Animaciones con Motion bajo `MotionProvider`; scroll con `scrollBehavior()`.
- [ ] `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores ni avisos.
