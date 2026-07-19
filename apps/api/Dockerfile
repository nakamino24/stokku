FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.6.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/types/package.json packages/types/
COPY packages/validation/package.json packages/validation/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY . .
RUN pnpm run build --filter=@stokku/database && pnpm run build --filter=@stokku/api

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist 2>/dev/null || true
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/types/dist ./packages/types/dist 2>/dev/null || true
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/validation/dist ./packages/validation/dist 2>/dev/null || true
COPY --from=builder /app/packages/validation/package.json ./packages/validation/
COPY --from=builder /app/packages/config/dist ./packages/config/dist 2>/dev/null || true
COPY --from=builder /app/packages/config/package.json ./packages/config/
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN corepack enable && corepack prepare pnpm@8.6.0 --activate && pnpm install --frozen-lockfile --prod

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
