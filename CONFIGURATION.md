# Reference Runtime: Stokku Configuration

> This document describes configuration for the active Render, Vercel, Neon, Express,
> and Prisma reference runtime. Target deployment requirements are defined in
> `docs/Deployment.md`; do not infer target architecture from this runbook.

Stokku has one data path: the browser calls the API, and the API connects to
PostgreSQL. The browser never receives database credentials.

## API Environment

Configure these values in the Render API service:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL URL for API runtime |
| `DIRECT_URL` | Neon direct PostgreSQL URL for Prisma migrations |
| `ACCESS_TOKEN_SECRET` | Random signing secret, at least 32 characters |
| `EMAIL_OUTBOX_ENCRYPTION_KEY` | Random encryption secret, at least 32 characters |
| `RESEND_API_KEY` | Resend API credential for verification and reset email |
| `EMAIL_FROM` | Verified Resend sender address |
| `CORS_ORIGINS` | Exact Vercel production origin |
| `APP_URL` | Exact Vercel production origin |

## Web Environment

Configure only `API_ORIGIN` in the Vercel web project. It must be the HTTPS Render
API URL without a trailing slash. The Vercel rewrite keeps browser requests on
same-origin `/api/v1` paths so refresh cookies remain first-party.

Do not configure database URLs, signing keys, provider tokens, or Supabase values
in Vercel or in any `NEXT_PUBLIC_*` variable.
