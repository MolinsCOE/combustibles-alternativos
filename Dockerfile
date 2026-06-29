# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:24-alpine AS build-frontend
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY apps/frontend/ apps/frontend/
RUN pnpm --filter frontend run build

# ── Stage 2: Build backend ────────────────────────────────────────────────────
FROM node:24-alpine AS build-backend
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter backend

COPY apps/backend/ apps/backend/
RUN pnpm --filter backend run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --prod --frozen-lockfile --filter backend

COPY --from=build-backend /app/apps/backend/dist ./apps/backend/dist
COPY --from=build-frontend /app/apps/frontend/dist ./apps/backend/dist/frontend-dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app/apps/backend

EXPOSE 3000
CMD ["node", "dist/src/main/server.js"]
