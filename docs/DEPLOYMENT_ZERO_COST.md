# Stokku — Zero-Cost Portfolio Deployment (Vercel + Render + Neon)

> **Goal:** Deploy Stokku without any credit card, paid subscription, prepaid credits, or automatic monetary charge. Suspension on quota exhaustion is expected. All three vendors offer a free tier with no payment method required.

| Layer | Target | Plan | Billing risk |
|-------|--------|------|--------------|
| Web   | Vercel | Hobby (Free) | None — do NOT add payment method |
| API   | Render | Free Web Service | None — do NOT add payment method |
| DB    | Neon   | Free | None — do NOT add payment method |

**Topology (reverse proxy):**
```
Browser → https://<vercel>/api/v1/* (+/backend-health)
        → Vercel external rewrite → https://<render>/api/v1/* (/health)
        → Render Express API → Neon PostgreSQL
```
Browser never calls `onrender.com` directly. `API_ORIGIN` is server/build-only (no `NEXT_PUBLIC_`).

**Why proxy:**
- Keeps `stokku_refresh` HttpOnly cookie **first-party** (`SameSite=Lax`) — avoids third-party-cookie blocking that can break `SameSite=None` cross-site flows.
- Reduces CORS complexity (explicit single origin, no wildcard with credentials).
- Preserves `HttpOnly`/`Secure` refresh session, memory-only access token.
- Still uses only free-tier infra (no extra serverless function, just Next.js external rewrite).

---

## 1) Neon Free PostgreSQL

1. Create account at https://neon.tech → **Create Free Project** (region closest to Render, e.g. AWS US East).
2. In Neon dashboard → **Connection Details** → select **Pooled** endpoint, check **Prisma** example.
   Copy connection string like:
   `postgresql://user:password@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require`
3. Set `DATABASE_URL` locally to that string to test migrations:
   ```bash
   pnpm --filter @stokku/database exec prisma migrate deploy
   pnpm --filter @stokku/database exec prisma db seed   # optional demo data
   ```
4. Store the URL only as `DATABASE_URL` in **Render** environment variables (never commit it). Neon pooled URL already includes `sslmode=require`.

**Migrations:**
- Production must use `prisma migrate deploy` (not `migrate dev`, not `db push`).
- Never rely on SQLite or local `dev.db`; provider is `postgresql`.

---

## 2) Render Free Web Service (API)

Render docs: https://render.com/docs/free

1. Push branch `chore/zero-cost-deployment` to GitHub and merge to `main` when ready.
2. In Render dashboard → **New +** → **Web Service** → **Connect GitHub repository** `nakamino24/stokku`.
3. Configure:
   - **Name:** `stokku-api`
   - **Runtime:** `Node`
   - **Node version:** `22` (see `render.yaml` / `engines`)
   - **Branch:** `main`
   - **Root directory:** `.` (repo root)
   - **Build command:** `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @stokku/database build && pnpm --filter @stokku/api build`
   - **Start command:** `pnpm --filter @stokku/api start` → runs `node dist/server.js` listening on `0.0.0.0:$PORT`
   - **Plan:** **Free**
   - **Health check path:** `/health`
4. Add **Environment Variables** (do NOT add a payment method):
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | enables `Secure=true` + `SameSite=Lax` |
   | `DATABASE_URL` | Neon pooled URL | from step 1 |
   | `ACCESS_TOKEN_SECRET` | `openssl rand -base64 32` | >=16 chars |
   | `CORS_ORIGINS` | `https://<your-vercel-app>.vercel.app` | exact production origin |
   | `APP_URL` | `https://<your-vercel-app>.vercel.app` | for emails / reset links |
   | `LOG_LEVEL` | `info` | optional |
   | `RATE_LIMIT_MAX` / `PASSWORD_RESET_RATE_LIMIT_MAX` | optional | defaults 100 / 5 |
5. **Do NOT add payment method.** Render Free will sleep after ~15 min inactivity and spin up on request (cold start expected). `PORT` is injected by Render.
6. Use `render.yaml` (Infrastructure as Code) at repo root — Render will detect it on **New → Blueprint**. It defines a single `plan: free` web service with same build/start/health and `autoDeploy: false` until first production verification (see §9).
7. Verify direct (server-to-server): `https://<your-api>.onrender.com/health` returns `{ status: "healthy", database: "connected" }`. Browser should not use this origin in prod.

**Requirements satisfied:**
- Node 22, pnpm, `prisma generate`, `prisma migrate deploy` against Neon, bind `0.0.0.0` + `process.env.PORT`, no local FS persistence, health endpoint retained.

---

## 3) Vercel Hobby (Web) — Reverse Proxy

1. In Vercel dashboard → **Add New Project** → **Import** `nakamino24/stokku` (or keep existing project).
2. Configure project:
   - **Framework Preset:** Next.js
   - **Root directory:** `.` (monorepo); `vercel.json` sets `outputDirectory: apps/web/.next`
   - **Install command:** `corepack enable && pnpm install`
   - **Build command:** `pnpm build`
   - **Output directory:** `apps/web/.next`
3. Set **Environment Variables** (Production + Preview as needed, **server-only**):
   | Key | Value | Type |
   |-----|-------|------|
   | `API_ORIGIN` | `https://<your-api>.onrender.com` (no trailing slash) | **Server/build only, NOT `NEXT_PUBLIC_*`** |
   | `APP_URL` | `https://<your-vercel-app>.vercel.app` | optional, for SEO |
   | `CORS_ORIGINS` is on **Render**, not Vercel |
   Do NOT set `DATABASE_URL`,`DIRECT_URL`, or `ACCESS_TOKEN_SECRET` on Vercel.
4. `apps/web/next.config.mjs` rewrites:
   - If `API_ORIGIN` set: `/api/:path* → ${API_ORIGIN}/api/:path*` and `/backend-health → ${API_ORIGIN}/health`
   - Else (local dev): `/api/:path* → http://localhost:3001/api/:path*`
   No API serverless function, no CDN caching for `/api/*` (authenticated responses must not be cached).
5. Deploy → verify:
   - `https://<vercel>/backend-health` proxies to Render `/health` (200).
   - `/api/v1/auth/login` sets first-party `stokku_refresh` cookie.

**Security checks:**
- No `NEXT_PUBLIC_*` exposes server secrets or Render origin.
- Browser API base is **same-origin** `/api/v1` (`apps/web/utils/api.ts` defaults to `/api/v1`, `NEXT_PUBLIC_API_URL` only as optional dev override).
- Cookies: `HttpOnly=true, Secure=true (prod), SameSite=Lax, path=/api/v1/auth, 7d`, access token memory-only.
- CORS: `credentials: true`, explicit `CORS_ORIGINS`/`APP_URL` (no `*`), proxy works without wildcard.

---

## 4) Post-deploy Acceptance Checklist

- [ ] `GET /health` via `https://<render>.onrender.com/health` returns 200 (direct)
- [ ] `GET /backend-health` via Vercel proxy returns 200
- [ ] `pnpm build` succeeds locally and on CI
- [ ] Vercel build succeeds with `API_ORIGIN` (no `NEXT_PUBLIC_API_URL` needed)
- [ ] `GET /api/v1/...` via Vercel same-origin succeeds (no CORS error)
- [ ] Login works (sets first-party `stokku_refresh` `Lax` cookie)
- [ ] Refresh session works (401 triggers silent `/api/v1/auth/refresh` via proxy)
- [ ] Logout clears cookie
- [ ] Auth guard redirects unauthenticated → `/auth/login`
- [ ] Products / Inventory / Purchase Orders / Sales Orders load (seeded Neon data)

---

## 5) Environment Variable Audit (Production)

**Render API (secrets, server-only):**
`DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `DIRECT_URL`, `NODE_ENV=production`, `CORS_ORIGINS=https://<vercel>.vercel.app`, `APP_URL=https://<vercel>.vercel.app`, `PORT` (auto-injected), `LOG_LEVEL`, `RATE_LIMIT_MAX`

**Vercel Web (server/build-only, not public):**
`API_ORIGIN=https://<render-api>.onrender.com`  
Optional dev/test override only: `NEXT_PUBLIC_API_URL=http://localhost:3001` (leave empty in prod to use proxy)

**Never commit `.env` containing Neon URL. Never expose `ACCESS_TOKEN_SECRET` via `NEXT_PUBLIC_*`. No `NEXT_PUBLIC_API_URL=https://*.onrender.com` in prod.**

---

## 6) Zero-Cost Guarantees & Limitations

- Do NOT add payment method on Render, Neon, or Vercel if you require zero monetary risk.
- Free quotas (sleep, connection limits, build minutes) may cause downtime — acceptable per spec.
- `render.yaml` defines **only** a `plan: free` web service — no disks, workers, cron, private services, or paid Postgres — `autoDeploy: false` until first prod verification.
- GitHub Actions no longer holds `FLY_API_TOKEN`; Vercel and Render deploy via integrations/GHCR optional.

---

## 7) Local Development

```bash
pnpm install
# Start Postgres locally or use Neon pooled URL
pnpm --filter @stokku/database exec prisma migrate deploy
pnpm --filter @stokku/database exec prisma db seed
pnpm dev  # API http://localhost:3001, Web http://localhost:3000 (proxy /api → localhost:3001)
# To test proxy with real Render locally: API_ORIGIN=https://<render>.onrender.com pnpm --filter @stokku/web dev
```

## 8) Render autoDeploy

Initial `render.yaml: autoDeploy: false` prevents pushes to `main` from redeploying before env/DB are verified. After first prod `health` + login verified, you may change to `true` in `render.yaml` and redeploy Blueprint. No billing introduced.

## 9) Docker (optional)

`docker.yml` (formerly `cd.yml`) is now **manual only** (`workflow_dispatch`) — Vercel/Render build from source, GHCR images are optional validation, not deployment.
