// Package httperror defines the transport-level AppError and the Fiber error
// handler rendering the unified body {"error":{"code","message","details"}}
// shared by both APIs. It knows no bounded context: each context maps its own
// errors into *AppError (Open/Closed).
//
// Files:
//   - error.go: AppError, codes and constructors.
//   - handler.go: ErrorHandler.
package httperror
