package domain

import (
	"errors"
	"math"
	"testing"
)

func TestNewMatrix_Valid(t *testing.T) {
	tests := []struct {
		name       string
		in         [][]float64
		rows, cols int
	}{
		{"1x1", [][]float64{{1}}, 1, 1},
		{"2x3", [][]float64{{1, 2, 3}, {4, 5, 6}}, 2, 3},
		{"negatives", [][]float64{{-1, -2}, {3, 4}}, 2, 2},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			m, err := NewMatrix(tc.in)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if m.Rows() != tc.rows || m.Cols() != tc.cols {
				t.Fatalf("got %dx%d, want %dx%d", m.Rows(), m.Cols(), tc.rows, tc.cols)
			}
			if !approxEqual(m.ToSlice(), tc.in, 0) {
				t.Fatalf("ToSlice mismatch: %v", m.ToSlice())
			}
			if m.At(tc.rows-1, tc.cols-1) != tc.in[tc.rows-1][tc.cols-1] {
				t.Fatal("At mismatch")
			}
		})
	}
}

func TestNewMatrix_Invalid(t *testing.T) {
	big := func(r, c int) [][]float64 {
		m := make([][]float64, r)
		for i := range m {
			m[i] = make([]float64, c)
		}
		return m
	}
	tests := []struct {
		name string
		in   [][]float64
		want error
	}{
		{"nil", nil, ErrEmptyMatrix},
		{"empty", [][]float64{}, ErrEmptyMatrix},
		{"empty row", [][]float64{{}}, ErrEmptyMatrix},
		{"jagged", [][]float64{{1, 2}, {3}}, ErrNotRectangular},
		{"NaN", [][]float64{{1, math.NaN()}}, ErrNonFiniteValue},
		{"+Inf", [][]float64{{math.Inf(1)}}, ErrNonFiniteValue},
		{"-Inf", [][]float64{{math.Inf(-1)}}, ErrNonFiniteValue},
		{"too many rows", big(MaxDimension+1, 1), ErrMatrixTooLarge},
		{"too many cols", big(1, MaxDimension+1), ErrMatrixTooLarge},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := NewMatrix(tc.in); !errors.Is(err, tc.want) {
				t.Fatalf("got %v, want %v", err, tc.want)
			}
		})
	}
}

func TestNewMatrix_MaxDimensionAllowed(t *testing.T) {
	in := make([][]float64, MaxDimension)
	for i := range in {
		in[i] = make([]float64, MaxDimension)
	}
	if _, err := NewMatrix(in); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestMatrix_Immutability(t *testing.T) {
	in := [][]float64{{1, 2}, {3, 4}}
	m, err := NewMatrix(in)
	if err != nil {
		t.Fatal(err)
	}
	t.Run("input mutation", func(t *testing.T) {
		in[0][0] = 99
		if m.At(0, 0) != 1 {
			t.Fatal("matrix aliased its input")
		}
	})
	t.Run("ToSlice mutation", func(t *testing.T) {
		s := m.ToSlice()
		s[1][1] = 99
		if m.At(1, 1) != 4 {
			t.Fatal("ToSlice leaked internal state")
		}
	})
}
