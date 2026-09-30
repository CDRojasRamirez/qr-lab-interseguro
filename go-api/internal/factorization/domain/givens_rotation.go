package domain

// rotateRows applies the rotation to rows p and q of a row-major matrix with
// the given column count, starting at column from.
func rotateRows(d []float64, cols, p, q, from int, c, s float64) {
	for k := from; k < cols; k++ {
		rp, rq := d[p*cols+k], d[q*cols+k]
		d[p*cols+k] = c*rp + s*rq
		d[q*cols+k] = -s*rp + c*rq
	}
}

// rotateCols applies the rotation to columns p and q of a row-major matrix.
func rotateCols(d []float64, rows, cols, p, q int, c, s float64) {
	for k := 0; k < rows; k++ {
		cp, cq := d[k*cols+p], d[k*cols+q]
		d[k*cols+p] = c*cp + s*cq
		d[k*cols+q] = -s*cp + c*cq
	}
}

// normalizeSigns makes diag(R) non-negative (negating row k of R and column k
// of Q, which preserves Q·R) and turns negative zeros into positive zeros.
func normalizeSigns(q, r []float64, m, n int) {
	for k := 0; k < min(m, n); k++ {
		if r[k*n+k] < 0 {
			for j := k; j < n; j++ {
				r[k*n+j] = -r[k*n+j]
			}
			for i := 0; i < m; i++ {
				q[i*m+k] = -q[i*m+k]
			}
		}
	}
	clearNegativeZeros(q)
	clearNegativeZeros(r)
}

func clearNegativeZeros(d []float64) {
	for i := range d {
		d[i] += 0 // -0 + 0 == +0
	}
}
