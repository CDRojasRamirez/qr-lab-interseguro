package domain

import "math"

const tol = 1e-9

func identity(n int) [][]float64 {
	m := make([][]float64, n)
	for i := range m {
		m[i] = make([]float64, n)
		m[i][i] = 1
	}
	return m
}

func transpose(a [][]float64) [][]float64 {
	t := make([][]float64, len(a[0]))
	for j := range t {
		t[j] = make([]float64, len(a))
		for i := range a {
			t[j][i] = a[i][j]
		}
	}
	return t
}

func matMul(a, b [][]float64) [][]float64 {
	out := make([][]float64, len(a))
	for i := range a {
		out[i] = make([]float64, len(b[0]))
		for k := range b {
			for j := range b[0] {
				out[i][j] += a[i][k] * b[k][j]
			}
		}
	}
	return out
}

func approxEqual(a, b [][]float64, eps float64) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if len(a[i]) != len(b[i]) {
			return false
		}
		for j := range a[i] {
			if math.Abs(a[i][j]-b[i][j]) > eps {
				return false
			}
		}
	}
	return true
}
