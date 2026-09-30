# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS build
WORKDIR /src
# Dependency layer first: only invalidated when go.mod/go.sum change.
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Static binary (no CGO) so it runs on distroless/static.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# No shell, no package manager, no root. OpenAPI spec is embedded (go:embed).
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/api /api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/api"]
