package domain

import (
	"fmt"
	"math"
)

// MaxDimension is the maximum number of rows or columns of a Matrix.
const MaxDimension = 100

// Matrix is an immutable, validated rectangular matrix of finite numbers.
type Matrix struct {
	rows, cols int
	data       []float64 // row-major
}

// NewMatrix validates values and returns a deep-copied Matrix. It returns
// ErrEmptyMatrix, ErrNotRectangular, ErrNonFiniteValue or ErrMatrixTooLarge.
func NewMatrix(values [][]float64) (Matrix, error) {
	rows := len(values)
	if rows == 0 || len(values[0]) == 0 {
		return Matrix{}, ErrEmptyMatrix
	}
	cols := len(values[0])
	if rows > MaxDimension || cols > MaxDimension {
		return Matrix{}, fmt.Errorf("%w: got %dx%d, max is %d", ErrMatrixTooLarge, rows, cols, MaxDimension)
	}
	data := make([]float64, 0, rows*cols)
	for i, row := range values {
		if len(row) != cols {
			return Matrix{}, fmt.Errorf("%w: row %d has %d columns, expected %d", ErrNotRectangular, i, len(row), cols)
		}
		for j, v := range row {
			if math.IsNaN(v) || math.IsInf(v, 0) {
				return Matrix{}, fmt.Errorf("%w: value at (%d,%d) is %v", ErrNonFiniteValue, i, j, v)
			}
		}
		data = append(data, row...)
	}
	return Matrix{rows: rows, cols: cols, data: data}, nil
}

// newMatrixFromData wraps trusted internal data without validation or copying.
func newMatrixFromData(rows, cols int, data []float64) Matrix {
	return Matrix{rows: rows, cols: cols, data: data}
}

// Rows returns the number of rows.
func (m Matrix) Rows() int { return m.rows }

// Cols returns the number of columns.
func (m Matrix) Cols() int { return m.cols }

// At returns the element at row i, column j (zero-based).
func (m Matrix) At(i, j int) float64 { return m.data[i*m.cols+j] }

// ToSlice returns a deep copy of the matrix as row slices.
func (m Matrix) ToSlice() [][]float64 {
	out := make([][]float64, m.rows)
	for i := range out {
		out[i] = make([]float64, m.cols)
		copy(out[i], m.data[i*m.cols:(i+1)*m.cols])
	}
	return out
}
