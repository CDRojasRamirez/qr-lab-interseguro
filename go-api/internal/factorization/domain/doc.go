// Package domain holds the factorization bounded context core (domain layer).
// It depends only on the standard library: no frameworks, I/O or JSON.
//
//   - errors.go: sentinel domain errors
//   - matrix.go: Matrix value object and its validated constructor
//   - qr_result.go: QRResult value object (Q and R)
//   - decomposer.go: Decomposer strategy port
//   - givens.go, givens_rotation.go: Givens-rotation QR implementation
package domain
