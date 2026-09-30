# QR Lab · QR Factorization Challenge

Monorepo with three deployable services: a **Go API** (Fiber v3) that computes the
QR factorization of a rectangular matrix, a **Node API** (Express 5 + TypeScript)
that returns statistics over the resulting matrices (max, min, average, sum and a
diagonal check), and an **Angular 21** frontend that consumes both. The APIs follow
DDD and hexagonal architecture, communicate over HTTP and are secured with JWT RS256.

## Stack

| Layer        | Technology                                                    | Role                                                                 |
| ------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Go API       | Go 1.26, Fiber v3, golang-jwt v5, `log/slog`                  | Login, JWT **signing** (RS256), QR with Givens, orchestration        |
| Node API     | Node 22, Express 5, TypeScript (strict), zod, jose, pino      | Statistics and diagonal check, JWT **verification** (public key)     |
| Frontend     | Angular 21 (standalone, zoneless, signals), SCSS, lucide      | Login, matrix editor, Q/R views, statistics, live API status         |
| Security     | JWT RS256, Secret Manager, IAM service accounts               | Asymmetric keys, secrets out of code and images, least privilege     |
| Containers   | Docker multi-stage (distroless, alpine, nginx-unprivileged)   | Non-root images, identical locally and in the cloud                  |
| Cloud        | Google Cloud Run, Cloud Build, Artifact Registry              | Serverless HTTPS services built from each Dockerfile                 |
| Testing      | Go `testing`, Vitest, Supertest, e2e over Docker Compose      | Unit, integration and end-to-end coverage                            |
| Docs         | OpenAPI 3.1 (contract-first), Swagger UI at `/docs`           | Interactive API documentation in both services                       |

## Live demo

| Service     | URL                                                             |
| ----------- | --------------------------------------------------------------- |
| Web app     | https://frontend-193940609406.southamerica-west1.run.app        |
| Go API docs | https://go-api-193940609406.southamerica-west1.run.app/docs     |
| Node API docs | https://node-api-193940609406.southamerica-west1.run.app/docs |

Test credentials are shown on the login screen ("Usar credenciales de prueba" fills
the form). Services scale to zero on Google Cloud Run, so the first request after a
period of inactivity can take a few seconds while an instance starts.

## Architecture

```
Browser ──► Frontend (nginx) ── GET /config.json (API URLs, set per environment)
   │
   ├─ POST /api/v1/auth/login ──────────► Go API ── signs JWT (RS256, private key)
   ├─ POST /api/v1/factorizations ──────► Go API ── validates JWT and matrix
   │    (Bearer JWT)                        │  computes QR with Givens rotations
   │                                        └─► Node API /api/v1/statistics
   │                                             (same JWT, verified with public key)
   └─ GET /health (both APIs) ── live status indicators
```

- **Go** is the entry point and orchestrator: it authenticates, factorizes and
  delegates statistics to Node through an anti-corruption layer that translates the
  Node contract into its own model.
- **Node** is a focused analytics service; it verifies every token on its own
  (zero trust between services) and never holds signing material.
- Each API is split into `domain`, `application` and `infrastructure` per bounded
  context (`factorization` in Go, `analytics` in Node); dependencies point inward.

Details: [docs/architecture.md](docs/architecture.md) ·
contract: [docs/api-contract.md](docs/api-contract.md) ·
cloud setup: [docs/deployment.md](docs/deployment.md).

## Running locally

Prerequisites: Docker (Compose v2), Go 1.26 (keys and e2e tests), Node 22 (unit
tests). `make` is optional; raw commands are shown next to each target.

```bash
make keys     # cd go-api && go run ./cmd/keygen -out ../keys   (git-ignored)
make up       # docker compose up --build -d
make e2e      # cd go-api && go test -tags=e2e ./test/e2e/... -v -count=1
make test     # Go and Node unit tests (e2e excluded)
make down     # docker compose down
```

| Service  | URL                                                          |
| -------- | ------------------------------------------------------------ |
| Frontend | http://localhost:4200 (login: `admin` / `secret`)            |
| Go API   | http://localhost:8080 (docs: `/docs`, spec: `/openapi.yaml`) |
| Node API | http://localhost:3000 (docs: `/docs`)                        |

Host ports and credentials can be overridden by copying `compose.env.example` to
`.env`. Each container mounts only the key it needs: Go the private key, Node the
public one. `keygen` writes `private.pem` with mode 0600; on Linux run
`chmod 644 keys/private.pem` so the non-root container can read it.

**Try the API**

```bash
TOKEN=$(curl -s localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"secret"}' | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')

curl -s localhost:8080/api/v1/factorizations \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"matrix":[[12,-51,4],[6,167,-68],[-4,24,-41]]}'
```

**Resilience check**: with `docker compose stop node-api`, the same request answers
`502 UPSTREAM_UNAVAILABLE` in about one second instead of hanging.

**Frontend without Docker**: `cd frontend && npm ci --legacy-peer-deps && npm start`.
It reads `frontend/public/config.json`; edit it if the APIs listen on other ports.

## API

| Method | Path                     | Service | Auth   |
| ------ | ------------------------ | ------- | ------ |
| GET    | `/health`                | both    | none   |
| POST   | `/api/v1/auth/login`     | Go      | none   |
| POST   | `/api/v1/factorizations` | Go      | Bearer |
| POST   | `/api/v1/statistics`     | Node    | Bearer |

Errors share one shape in both APIs: `{"error":{"code","message","details"}}`.
Shapes, codes and JWT claims: [docs/api-contract.md](docs/api-contract.md).

## Design decisions

- **Rotation vs. QR.** The statement mentions "rotation" in the architecture section
  but requires QR factorization in the functional requirements. QR is implemented
  with **Givens rotations**, which satisfies the requirement and fits the wording.
  They are numerically stable, and signs are normalized so `diag(R) >= 0`, making
  the output deterministic. Full QR is returned: `Q` is m×m and `R` is m×n.
- **DDD where it pays off.** Bounded contexts, value objects with validated
  constructors, domain services and an anti-corruption layer. No repositories,
  aggregates or domain events: the services are stateless and persist nothing.
- **Patterns.** Strategy (`Decomposer`, so Householder could replace Givens without
  touching the use case), ports and adapters, composition root, middleware chain,
  DTO mappers and container/presentational components in Angular.
- **RS256 key pair.** Go signs and Node only verifies, so no shared secret exists.
  Verification enforces the algorithm, issuer, audience and expiry, rejecting
  `alg: none` and HS256 tokens.
- **Distinct upstream failures.** Node unreachable maps to 502 and a slow Node to
  504; the connect phase has a shorter timeout than the whole request so both cases
  are told apart.
- **Diagonal check with tolerance.** Floating-point results contain values such as
  `1e-17`, so off-diagonal entries count as zero within a configurable epsilon
  (`1e-10`). Rectangular matrices can be diagonal (generalized definition).
- **Runtime frontend configuration.** The SPA loads `/config.json` before bootstrap;
  the same image runs locally and in the cloud with different environment variables.
- **Least privilege.** Non-root containers, one service account per Cloud Run
  service, and each account can read only its own secrets.

## Testing

- **Go**: property tests for the factorization (`Q·R = A`, `QᵀQ = I`, `R` upper
  triangular) plus a known-answer case, use cases with fakes, HTTP handlers, the
  statistics client against `httptest` servers, and JWT edge cases.
- **Node**: domain, use case, JWT verification and HTTP tests with Supertest.
- **Frontend**: services, interceptor, guard and every component.
- **End to end**: `go-api/test/e2e` runs against the compose stack over real sockets
  (login, factorization, 401, 400, 413 and direct Node access).

## Deployment

Deployed on **Google Cloud Run** (`southamerica-west1`), built from each Dockerfile
with `gcloud run deploy --source`. Keys and the demo password live in **Secret
Manager** and are mounted into the containers; every service runs with its own
service account and a capped number of instances. Step-by-step guide, including
secret rotation and production hardening: [docs/deployment.md](docs/deployment.md).

## Repository layout

```
go-api/      Go API: factorization context, auth, HTTP adapters, e2e tests
node-api/    Node API: analytics context, JWT verification, HTTP adapters
frontend/    Angular app: core (auth, config, layout), features (auth, qr)
docs/        Architecture, API contract and deployment guide
```
