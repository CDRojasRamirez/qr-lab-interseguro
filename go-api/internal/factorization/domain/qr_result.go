package domain

// QRResult is the immutable outcome of a QR factorization A = Q·R.
type QRResult struct {
	q, r Matrix
}

// NewQRResult builds a QRResult from its two factors.
func NewQRResult(q, r Matrix) QRResult { return QRResult{q: q, r: r} }

// Q returns the orthogonal factor (m×m).
func (res QRResult) Q() Matrix { return res.q }

// R returns the upper-triangular factor (m×n).
func (res QRResult) R() Matrix { return res.r }
