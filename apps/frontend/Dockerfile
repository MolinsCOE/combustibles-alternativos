FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY apps/frontend/ apps/frontend/
RUN pnpm --filter frontend run build

FROM nginx:alpine AS runtime

COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
