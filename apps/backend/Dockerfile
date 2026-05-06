FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter backend

COPY apps/backend/ apps/backend/
RUN pnpm --filter backend run build

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --prod --frozen-lockfile --filter backend

COPY --from=build /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 3000
CMD ["node", "dist/src/main/server.js"]
