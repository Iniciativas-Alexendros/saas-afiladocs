# 0002 — DocuSeal como único firmante

### Propósito de este documento

- **Objetivos:** Registrar por qué Documenso quedó descartado y DocuSeal es
  el único adapter de firma.
- **Estructura:** Contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** No reintroduzcas un segundo
  firmante sin un ADR nuevo. El webhook vive en `/api/webhooks/docuseal`.

## Estado

Aceptada (F1 seguridad / Fase 3 auto-entrega).

## Contexto

Hubo un adapter Documenso además de DocuSeal. Duplicaba webhooks, secretos
y caminos de idempotencia.

## Decisión

DocuSeal self-hosted es el único firmante. `getSigningAdapter()` devuelve
`DocuSealAdapter`. El webhook verifica HMAC-SHA256 con
`DOCUSEAL_WEBHOOK_SECRET`.

## Consecuencias

- Un solo contrato de `metadata.productSku` / `orderId`.
- Recovery documentado en `docs/runbooks/recovery-docuseal.md`.
- Reintroducir otro firmante exige ADR y no es un cambio de plataforma
  silencioso.
