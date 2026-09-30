# API Contract

## Go API (public)

### `GET /health`
```json
{ "status": "ok" }
```

### `POST /api/v1/auth/login`
Request:
```json
{ "username": "admin", "password": "secret" }
```
Response 200:
```json
{ "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 900 }
```

### `POST /api/v1/factorizations` (Bearer)
Request:
```json
{ "matrix": [[1, 2], [3, 4], [5, 6]] }
```
Response 200:
```json
{
  "q": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],
  "r": [[0.0, 0.0], [0.0, 0.0], [0.0, 0.0]],
  "statistics": { "...": "Node /api/v1/statistics response" }
}
```

## Node API

### `GET /health`
```json
{ "status": "ok" }
```

### `POST /api/v1/statistics` (Bearer)
Request:
```json
{
  "matrices": [
    { "name": "Q", "values": [[1, 0], [0, 1]] },
    { "name": "R", "values": [[2, 1], [0, 3]] }
  ]
}
```
Response 200:
```json
{
  "global": { "max": 3, "min": 0, "average": 1, "sum": 8, "count": 8 },
  "perMatrix": [
    {
      "name": "Q", "max": 1, "min": 0, "average": 0.5,
      "sum": 2, "count": 4, "isDiagonal": true
    },
    {
      "name": "R", "max": 3, "min": 0, "average": 1.5,
      "sum": 6, "count": 4, "isDiagonal": false
    }
  ],
  "anyDiagonal": true
}
```

## Error format (both APIs)

```json
{
  "error": {
    "code": "INVALID_MATRIX",
    "message": "rows must have the same length",
    "details": ["row 2 has 3 columns, expected 2"]
  }
}
```

| Code                   | HTTP | Meaning                                   |
| ---------------------- | ---- | ----------------------------------------- |
| `INVALID_MATRIX`       | 400  | Empty, ragged, non-finite or oversize     |
| `VALIDATION_ERROR`     | 400  | Malformed body or missing fields          |
| `UNAUTHORIZED`         | 401  | Missing, invalid or expired token         |
| `PAYLOAD_TOO_LARGE`    | 413  | Body exceeds the size limit               |
| `NOT_FOUND`            | 404  | Unknown route                             |
| `METHOD_NOT_ALLOWED`   | 405  | Method not allowed on the route           |
| `UPSTREAM_UNAVAILABLE` | 502  | Node API unreachable, 5xx or bad response |
| `UPSTREAM_REJECTED`    | 502  | Node API refused the request (4xx)        |
| `UPSTREAM_TIMEOUT`     | 504  | Node API did not answer within timeout    |
| `INTERNAL_ERROR`       | 500  | Unexpected failure                        |

## JWT

RS256, signed by Go with the private key and verified by Node with the public
key (`make keys` from the repo root, or `go run ./cmd/keygen`, generates the pair).

| Claim | Value                                              |
| ----- | -------------------------------------------------- |
| `iss` | `JWT_ISSUER` (default `qr-go-api`)                 |
| `aud` | `JWT_AUDIENCE` (default `qr-challenge`)            |
| `sub` | authenticated username                             |
| `iat` | issue time (seconds)                               |
| `exp` | `iat` + `JWT_TTL` (default 15m, `expiresIn` = 900) |

Verifiers MUST enforce algorithm RS256, issuer, audience and expiry.

### Token propagation Go -> Node

`POST /api/v1/factorizations` requires `Authorization: Bearer <jwt>`. After
validating it, Go keeps the raw token in the request context and forwards the
same header on `POST {STATS_API_URL}/api/v1/statistics`; Node re-verifies it
independently (no shared secret, only the public key).

## Notes

- QR mode: full QR (Q is m x m, R is m x n).
- Diagonal check uses tolerance epsilon `1e-10`, configurable via
  `DIAGONAL_EPSILON` (Node).
- Limits: matrices up to 100 x 100; body up to `BODY_LIMIT` (default 512 KB).
