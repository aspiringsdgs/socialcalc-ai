# syntax=docker/dockerfile:1
#
# Production image for the socialcalc-ai demo app (Vite + React + Ionic).
#   stage 1: build the static app
#   stage 2: nginx (unprivileged, non-root) serving it and proxying /api to the Tornado backend
#
# Nothing secret is baked in. Runtime configuration is environment-only (see docker/default.conf.template):
#   TORNADO_API_URL (required), TORNADO_CONNECT_TIMEOUT, TORNADO_READ_TIMEOUT, NGINX_RESOLVER
#
#   docker build -t socialcalc-ai .
#   docker run --rm -p 8081:8080 -e TORNADO_API_URL=http://host.docker.internal:8080 socialcalc-ai

FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is cached until the lockfile changes.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

# Build-time (public, non-secret) switches only. The API base stays empty = relative /api URLs,
# which the container's nginx forwards to TORNADO_API_URL at runtime.
ARG VITE_STORAGE_BACKEND=tornado
ENV VITE_STORAGE_BACKEND=${VITE_STORAGE_BACKEND} \
    VITE_API_BASE_URL=
RUN npm run build


FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV TORNADO_API_URL="" \
    TORNADO_CONNECT_TIMEOUT=5 \
    TORNADO_READ_TIMEOUT=60 \
    NGINX_RESOLVER=127.0.0.11

# Already runs as the non-root "nginx" user (uid 101) and listens on an unprivileged port.
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
