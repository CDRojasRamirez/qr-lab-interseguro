package http

import (
	"errors"
	"fmt"
	"testing"

	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/factorization/domain"
	"qrchallenge/go-api/internal/shared/httperror"
)

func TestToAppError(t *testing.T) {
	tests := []struct {
		name   string
		err    error
		status int
		code   string
	}{
		{"empty", domain.ErrEmptyMatrix, 400, "INVALID_MATRIX"},
		{"ragged", fmt.Errorf("%w: row 1", domain.ErrNotRectangular), 400, "INVALID_MATRIX"},
		{"non finite", domain.ErrNonFiniteValue, 400, "INVALID_MATRIX"},
		{"too large", domain.ErrMatrixTooLarge, 400, "INVALID_MATRIX"},
		{"timeout", fmt.Errorf("analyze: %w", application.ErrAnalyticsTimeout), 504, "UPSTREAM_TIMEOUT"},
		{"unavailable", application.ErrAnalyticsUnavailable, 502, "UPSTREAM_UNAVAILABLE"},
		{"rejected", application.ErrAnalyticsRejected, 502, "UPSTREAM_REJECTED"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var ae *httperror.AppError
			if !errors.As(toAppError(tc.err), &ae) || ae.Status != tc.status || ae.Code != tc.code {
				t.Fatalf("got %+v", ae)
			}
		})
	}
}

func TestToAppErrorInvalidMatrixCarriesDetail(t *testing.T) {
	err := fmt.Errorf("%w: row 1 has 3 columns", domain.ErrNotRectangular)
	ae := toAppError(err).(*httperror.AppError)
	if len(ae.Details) != 1 || ae.Details[0] != err.Error() {
		t.Fatalf("details = %v", ae.Details)
	}
}

func TestToAppErrorUnknownPassesThrough(t *testing.T) {
	boom := errors.New("boom")
	if got := toAppError(boom); got != boom {
		t.Fatalf("got %v", got)
	}
}
