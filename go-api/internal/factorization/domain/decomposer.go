package domain

// Decomposer is the Strategy port for QR factorization. Use cases depend on
// this interface only, so algorithms (Givens, Householder, ...) can be swapped
// without touching them (Open/Closed Principle).
type Decomposer interface {
	// Decompose returns Q and R such that A = Q·R, with Q orthogonal and R
	// upper triangular.
	Decompose(a Matrix) (QRResult, error)
}
