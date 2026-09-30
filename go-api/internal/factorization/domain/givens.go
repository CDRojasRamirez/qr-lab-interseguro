package domain

import "math"

// GivensDecomposer computes the full QR factorization using Givens rotations.
//
// Why Givens: each step is a plane rotation that zeroes a single subdiagonal
// entry, a direct fit for QR. It is
// numerically stable (rotations are orthogonal and never amplify errors) and
// uses math.Hypot to avoid overflow. Cost is roughly O(m·n·min(m,n)).
//
// For A (m×n): Q is m×m orthogonal, R is m×n upper triangular, A = Q·R.
//
// QR is unique only up to signs, so the result is normalized: whenever
// R[k][k] < 0, row k of R and column k of Q are negated, giving diag(R) ≥ 0.
// Negative zeros are also normalized to 0 for deterministic output.
type GivensDecomposer struct{}

// NewGivensDecomposer returns a ready-to-use GivensDecomposer.
func NewGivensDecomposer() *GivensDecomposer { return &GivensDecomposer{} }

// Decompose implements Decomposer.
func (*GivensDecomposer) Decompose(a Matrix) (QRResult, error) {
	m, n := a.rows, a.cols
	r := append([]float64(nil), a.data...)
	q := identityData(m)

	steps := min(m-1, n)
	for j := 0; j < steps; j++ {
		for i := j + 1; i < m; i++ {
			b := r[i*n+j]
			if b == 0 {
				continue
			}
			c, s := givensCoefficients(r[j*n+j], b)
			rotateRows(r, n, j, i, j, c, s)
			rotateCols(q, m, m, j, i, c, s)
			r[i*n+j] = 0
		}
	}
	normalizeSigns(q, r, m, n)
	return NewQRResult(newMatrixFromData(m, m, q), newMatrixFromData(m, n, r)), nil
}

// givensCoefficients returns cos/sin of the rotation that zeroes b against a.
func givensCoefficients(a, b float64) (c, s float64) {
	h := math.Hypot(a, b)
	return a / h, b / h
}

func identityData(n int) []float64 {
	d := make([]float64, n*n)
	for i := 0; i < n; i++ {
		d[i*n+i] = 1
	}
	return d
}
