# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
# Dependency layer first: only invalidated when the manifests change.
COPY package.json package-lock.json ./
# --legacy-peer-deps: workaround for an npm arborist bug with this dependency tree.
RUN npm ci --legacy-peer-deps
COPY . .
# Output: dist/frontend/browser (angular.json project "frontend", application builder).
RUN npx ng build --configuration production

# Unprivileged variant: runs as uid 101 (non-root) and listens on a port >= 1024.
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Cloud Run injects PORT; 8080 matches the local default.
ENV PORT=8080 \
    GO_API_URL=http://localhost:8080 \
    NODE_API_URL=http://localhost:3000
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
# Runs before nginx starts (.gitattributes keeps *.sh as LF on Windows). The exec
# bit is set with RUN chmod instead of COPY --chmod, which needs BuildKit and
# fails on Cloud Build's classic builder; root is needed only for that step.
USER root
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod 755 /docker-entrypoint.d/40-runtime-config.sh
USER 101
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
