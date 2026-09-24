# Guía transversal — UI/UX y design system

### Propósito de este documento

- **Objetivos:** Fijar componentes, naming y accesibilidad de la UI.
- **Estructura:** Stack visual → convenciones → checklist.
- **Contenido a integrar según contexto:** No copies un design system de
  otro sitio. shadcn/ui es el único sistema. No reescribas `docs/UI_GUIDE.md`.

Aplica a todo cambio visual o de interacción en `src/app/**` y `src/components/**`. Define qué componentes usar, cómo nombrarlos y qué convenciones mantener.

## 1. Stack visual (fijo, no cambiar sin plan)

- **Tailwind CSS v4** con `@tailwindcss/postcss`, CSS variables HSL para tokens.
- **shadcn/ui** sobre Radix UI — primitives en [src/components/ui/](../../src/components/ui/). No modificar directamente; si falta una variante, extender con wrapper en `src/components/`.
- **Lucide React** para iconografía (único set permitido).
- **Framer Motion** para transiciones complejas; animaciones cortas (< 200ms) y respetando `prefers-reduced-motion`.
- **Vaul** para drawers móviles (ya usado en `ShoppingCart`).
- **Sonner** para toasts (`toast.success()` / `toast.error()`).

**Prohibido** añadir otras libs de UI (Mantine, Chakra, MUI, Ant Design).

## 2. Estructura de componentes

```
src/components/
├── ui/                  shadcn primitives (NO TOCAR)
├── marketing/           secciones home, tienda públicas
├── portal/              componentes específicos portal cliente
├── ops/                 componentes específicos ops
├── JsonLd.tsx           Schema.org centralizado
├── Header.tsx, Footer.tsx, CookieBanner.tsx ...
```

Componentes de dominio en subcarpeta por área; no acumular todo en la raíz de `components/`.

## 3. Naming y props

- PascalCase para componentes, kebab-case para archivos si son page/route handlers.
- Subcomponentes compuestos: `Card.Header`, `Card.Body` — no props mágicas (`hasHeader`).
- Props explícitas: `variant`, `size`, `intent` en vez de booleanos combinados.
- Button:
  - Variantes: `primary`, `secondary`, `ghost`, `danger`, `link`.
  - Tamaños: `sm`, `md`, `lg`.
  - `aria-busy` y estado loading para acciones async críticas.
- Forms:
  - `react-hook-form` + Zod resolver.
  - Errores con estilo consistente (`text-destructive text-sm mt-1`).
  - Labels siempre asociadas (`htmlFor`) — nunca placeholder como label.

## 4. Layouts por dominio

- **Root** [src/app/layout.tsx](../../src/app/layout.tsx): `<html lang="es">`, `<body>`, providers globales (Toaster, Analytics). Fuente `DM Sans` vía `next/font` (no añadir más fuentes externas).
- **(marketing)**: Header con nav + cart, Footer con links legales, navegación minimalista.
- **(auth)**: layout centrado sin nav completa; solo logo + nav de vuelta a home.
- **portal**: navegación lateral (o top en móvil) + breadcrumbs + contexto de cuenta en header.
- **ops**: densidad alta; tablas con filtros sticky, sin distracciones visuales.

## 5. Tokens y estilos

- Colores, espaciado, tipografía → CSS variables en [src/app/globals.css](../../src/app/globals.css) y config de `components.json`.
- **Prohibido** overrides inline (`style={{ color: '#FF0' }}`) salvo casos muy justificados.
- Tailwind utility classes preferente; si una clase se repite > 4 veces en el mismo componente, promover a variable CSS o variant de un componente.
- `cn()` helper de [src/lib/utils.ts](../../src/lib/utils.ts) (clsx + tailwind-merge) para composición condicional.

## 6. Imágenes y assets

- **Siempre** `next/image`, nunca `<img>` (regla ESLint activa).
- `priority` en imágenes above-the-fold.
- `blur` placeholder para Supabase Storage (helper creado en F5).
- `sizes` prop correcto en cards responsivas.

## 7. Textos

- Español neutro, tono profesional pero cercano.
- Evitar "nuestro equipo / nuestro producto" — usar directa ("Afiladocs", "el servicio").
- Sin emojis en UI salvo cuando sean parte del dominio (p.ej. estado de pedido podría usar ✓ ✗, pero preferir iconos Lucide).
- CTAs: imperativos cortos ("Comprar ahora", "Enviar documentos", "Descargar firmado").

## 8. Accesibilidad

- Radix ya da base; mantener `aria-*` que los primitives emiten.
- Foco visible en elementos teclado-navegables (ring del token `--ring`).
- Skip navigation link en root layout (F3).
- `prefers-reduced-motion` respetado en animaciones Framer Motion.
- Contraste: pares texto/fondo ≥ 4.5:1 (AA) — revisar tokens al cambiar paleta.

## 9. Estado cliente

- Contextos mínimos — `CartProvider` en `(marketing)/layout.tsx`.
- Form state con `react-hook-form` (uncontrolled por defecto).
- URL state para filtros persistentes (`?status=...`) en vez de estado local.
- `localStorage` sólo para cosas aceptables sin consentimiento (carrito, preferencia tema). **Nunca** tracking en localStorage.

## 10. Performance UI (sinergia con F5)

- Suspense boundaries granulares (por producto en tienda, no por página completa).
- `loading.tsx` por ruta con skeletons realistas (altura fija para evitar CLS).
- `dynamic()` para componentes pesados no above-the-fold (modales, drawers, editor de intake).

## 11. Validación antes de merge

- [ ] Lighthouse Mobile ≥ 90 Accessibility, ≥ 90 Performance en rutas tocadas.
- [ ] Navegación teclado completa (Tab/Shift+Tab/Enter/Esc) en flujos críticos (checkout, login, intake).
- [ ] Sin nuevas dependencias UI sin plan aprobado.
- [ ] Textos revisados (sin typos, tono consistente, español neutro).
- [ ] Storybook (si se introduce en el futuro) o página de referencia actualizada.
