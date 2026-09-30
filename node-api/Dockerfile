# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
# rootDir=src, outDir=dist -> dist/main.js (matches the "start" script).
RUN npx tsc

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# swagger.ts resolves ../../../api/openapi.yaml from dist/shared/docs -> /app/api
COPY api ./api
USER node
EXPOSE 3000
# busybox wget ships with alpine; no curl needed.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1
CMD ["node", "dist/main.js"]
