package domain

import (
	"math"
	"testing"
)

var _ Decomposer = (*GivensDecomposer)(nil)

func mustMatrix(t *testing.T, v [][]float64) Matrix {
	t.Helper()
	m, err := NewMatrix(v)
	if err != nil {
		t.Fatal(err)
	}
	return m
}

func TestGivensDecomposer_Properties(t *testing.T) {
	tests := []struct {
		name string
		in   [][]float64
	}{
		{"1x1", [][]float64{{5}}},
		{"1x1 negative", [][]float64{{-5}}},
		{"2x2", [][]float64{{1, 2}, {3, 4}}},
		{"3x3", [][]float64{{2, -1, 0}, {-1, 2, -1}, {0, -1, 2}}},
		{"3x2 tall", [][]float64{{1, 2}, {3, 4}, {5, 6}}},
		{"2x3 wide", [][]float64{{1, 2, 3}, {4, 5, 6}}},
		{"4x4 identity", identity(4)},
		{"upper triangular", [][]float64{{1, 2, 3}, {0, 4, 5}, {0, 0, 6}}},
		{"diagonal", [][]float64{{3, 0, 0}, {0, -2, 0}, {0, 0, 7}}},
		{"zero column", [][]float64{{1, 0, 2}, {3, 0, 4}, {5, 0, 6}}},
		{"negative values", [][]float64{{-1, -2}, {-3, -4}}},
		{"all zero", [][]float64{{0, 0}, {0, 0}}},
	}
	d := NewGivensDecomposer()
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			a := mustMatrix(t, tc.in)
			res, err := d.Decompose(a)
			if err != nil {
				t.Fatal(err)
			}
			q, r := res.Q(), res.R()
			m, n := a.Rows(), a.Cols()
			if q.Rows() != m || q.Cols() != m {
				t.Fatalf("Q is %dx%d, want %dx%d", q.Rows(), q.Cols(), m, m)
			}
			if r.Rows() != m || r.Cols() != n {
				t.Fatalf("R is %dx%d, want %dx%d", r.Rows(), r.Cols(), m, n)
			}
			qs, rs := q.ToSlice(), r.ToSlice()
			if !approxEqual(matMul(qs, rs), tc.in, tol) {
				t.Errorf("Q*R != A: %v", matMul(qs, rs))
			}
			if !approxEqual(matMul(transpose(qs), qs), identity(m), tol) {
				t.Errorf("QtQ != I")
			}
			for i := range rs {
				for j := range rs[i] {
					if i > j && rs[i][j] != 0 {
						t.Errorf("R[%d][%d]=%v below diagonal", i, j, rs[i][j])
					}
					if i == j && rs[i][j] < 0 {
						t.Errorf("diag R[%d]=%v negative", i, rs[i][j])
					}
				}
			}
			for _, s := range [][][]float64{qs, rs} {
				for _, row := range s {
					for _, v := range row {
						if v == 0 && math.Signbit(v) {
							t.Error("found negative zero")
						}
					}
				}
			}
		})
	}
}

func TestGivensDecomposer_KnownAnswer(t *testing.T) {
	a := mustMatrix(t, [][]float64{{12, -51, 4}, {6, 167, -68}, {-4, 24, -41}})
	res, err := NewGivensDecomposer().Decompose(a)
	if err != nil {
		t.Fatal(err)
	}
	wantR := [][]float64{{14, 21, -14}, {0, 175, -70}, {0, 0, 35}}
	wantQ := [][]float64{
		{6.0 / 7, -69.0 / 175, -58.0 / 175},
		{3.0 / 7, 158.0 / 175, 6.0 / 175},
		{-2.0 / 7, 6.0 / 35, -33.0 / 35},
	}
	if !approxEqual(res.R().ToSlice(), wantR, tol) {
		t.Errorf("R = %v, want %v", res.R().ToSlice(), wantR)
	}
	if !approxEqual(res.Q().ToSlice(), wantQ, tol) {
		t.Errorf("Q = %v, want %v", res.Q().ToSlice(), wantQ)
	}
}
