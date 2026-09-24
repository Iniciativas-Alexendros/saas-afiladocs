# Seguridad — afiladocs

### Propósito de este documento

- **Objetivos:** Definir el canal privado de avisos de seguridad y el
  alcance del programa (sin issues públicos explotables).
- **Estructura:** Cómo reportar → alcance.
- **Contenido a integrar según contexto:** Adapta el correo
  (`ops@afiladocs.com`) y el perímetro de este SaaS. No copies el SECURITY
  de un sitio estático. Rotación operativa: [docs/runbooks/rotacion-secretos.md](docs/runbooks/rotacion-secretos.md).

## Reportar vulnerabilidades

Envía un informe privado a **ops@afiladocs.com** (no abras issues públicos con detalles explotables).

Incluye: descripción, impacto, pasos de reproducción y versión/commit si es posible.

Responderemos en un plazo razonable y coordinaremos el disclosure.

## Alcance

Aplicación web afiladocs.com (checkout Stripe, portal, ops, webhooks, crons). Infraestructura de terceros (Stripe, Supabase, DocuSeal, Vercel) debe reportarse también a sus programas respectivos cuando el fallo sea suyo.
