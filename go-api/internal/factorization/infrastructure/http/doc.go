// Package http contains the Fiber handler, DTOs and mappers that expose the
// factorization use case (infrastructure layer, inbound adapter).
//
// Files:
//   - handler.go: Factorizer port and POST /api/v1/factorizations handler.
//   - dto.go, mapper.go: wire DTOs and translation to/from the use case.
//   - errors.go: maps domain/application errors to httperror.AppError.
package http
