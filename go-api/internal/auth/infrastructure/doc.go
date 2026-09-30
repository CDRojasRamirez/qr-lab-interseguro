// Package infrastructure implements auth adapters (infrastructure layer).
//
// Files:
//   - rs256.go: JWT RS256 issuer and verifier (TokenIssuer, TokenVerifier).
//   - static_credentials.go: demo CredentialVerifier from environment values.
//   - http_handler.go: POST /api/v1/auth/login.
//   - middleware.go: Bearer JWT middleware (RequireJWT).
package infrastructure
