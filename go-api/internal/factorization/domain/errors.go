package domain

import "errors"

// Sentinel errors returned (wrapped with context) by domain constructors.
// Callers should match them with errors.Is.
var (
	ErrEmptyMatrix    = errors.New("matrix must have at least one row and one column")
	ErrNotRectangular = errors.New("matrix rows must all have the same length")
	ErrNonFiniteValue = errors.New("matrix values must be finite numbers")
	ErrMatrixTooLarge = errors.New("matrix dimension exceeds the maximum allowed")
)
