# Architecture

## Bounded contexts

| Context         | Runtime            | Responsibility                                      |
| --------------- | ------------------ | --------------------------------------------------- |
| `factorization` | Go (Fiber v3)      | Validate matrix, compute QR, orchestrate statistics |
| `analytics`     | Node (Express 5)   | Compute max/min/average/sum and diagonal detection  |

`auth` (Go) issues JWT RS256 tokens; Node only verifies them with the public key.
The contexts talk over HTTP; the contract lives in `docs/api-contract.md`.

## Layers (hexagonal)

```
        +-----------------------------------------------+
        |               infrastructure                  |
        |   HTTP handlers, HTTP clients, JWT, config    |
        |   +---------------------------------------+   |
        |   |            application                |   |
        |   |   use cases, ports (interfaces), DTOs |   |
        |   |   +-------------------------------+   |   |
        |   |   |           domain              |   |   |
        |   |   |  Value Objects, domain        |   |   |
        |   |   |  services, domain errors      |   |   |
        |   |   +-------------------------------+   |   |
        |   +---------------------------------------+   |
        +-----------------------------------------------+
```

## Dependency rule

Dependencies point inward only: infrastructure -> application -> domain.
The domain imports nothing from the framework, HTTP, or I/O. Ports are
declared by the application layer; adapters in infrastructure implement them.

## DDD tactical pieces

Used (tactical-lite):
- Value Objects (`Matrix`, `Statistics`), immutable and validated on creation.
- Domain services (`Decomposer`, statistics calculator), stateless logic.
- Domain errors (`InvalidMatrix`, ...), mapped to HTTP only at the edge.

Deliberately NOT used:
- Repositories: there is no persistence.
- Aggregates / entities with identity: nothing has a lifecycle or identity.
- Domain events: no side effects to broadcast, requests are synchronous.
- Adding them would be ceremony without a problem to solve.

## Patterns

- Strategy: `Decomposer` interface (Givens today, other algorithms swappable).
- Factory / validated constructors: `NewMatrix` rejects invalid shapes.
- Ports & Adapters: use cases depend on interfaces, not on Fiber/Express.
- Composition Root DI: `main.go` / `main.ts` wire everything by hand.
- Middleware chain: request id, logging, auth, error mapping, body limits.
- DTO + Mapper: transport shapes are separate from domain types.
- Anti-Corruption Layer: Go's `statsclient` translates Node's response and
  errors into Go domain terms so upstream changes do not leak inward.
- Container / Presentational: Angular smart components fetch and orchestrate,
  dumb components render inputs and emit outputs.

## Repository layout

```
go-api/     Go service (cmd/, internal/<context>/{domain,application,infrastructure})
node-api/   Node service (src/<context>/{domain,application,infrastructure})
frontend/   Angular app (core/, features/, shared/)
docs/       Architecture and API contract
```

Node shared kernel: `node-api/src/shared/domain` holds `DomainError`, the base
class of every context's domain errors. `shared` never imports from a bounded
context (dependencies point inward); contexts extend the kernel and the error
handler maps `DomainError` to HTTP without knowing any concrete context.

### Frontend dependency direction

`features -> core/shared`, never the reverse. `core/` and `shared/` must not import from `features/`.
`core/health` (`HealthApi`, `ApiHealthStore`) is app-wide shared state: the shell, the login page and the QR page all consume it.
