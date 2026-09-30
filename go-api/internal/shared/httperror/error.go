package httperror

// Stable machine-readable error codes shared by both APIs.
const (
	CodeValidation       = "VALIDATION_ERROR"
	CodeUnauthorized     = "UNAUTHORIZED"
	CodeNotFound         = "NOT_FOUND"
	CodeMethodNotAllowed = "METHOD_NOT_ALLOWED"
	CodePayloadTooLarge  = "PAYLOAD_TOO_LARGE"
	CodeInternal         = "INTERNAL_ERROR"
)

// AppError is a transport-level error carrying the HTTP status and the public
// error body. Bounded contexts map their own errors into it.
type AppError struct {
	Status  int
	Code    string
	Message string
	Details []string
}

// Error implements the error interface.
func (e *AppError) Error() string { return e.Code + ": " + e.Message }

// New builds an AppError.
func New(status int, code, message string, details ...string) *AppError {
	return &AppError{Status: status, Code: code, Message: message, Details: details}
}

// Validation builds a 400 VALIDATION_ERROR.
func Validation(message string, details ...string) *AppError {
	return New(400, CodeValidation, message, details...)
}

// Unauthorized builds a 401 UNAUTHORIZED.
func Unauthorized(message string) *AppError {
	return New(401, CodeUnauthorized, message)
}

// Internal builds a 500 INTERNAL_ERROR with a generic message.
func Internal() *AppError {
	return New(500, CodeInternal, "internal server error")
}
