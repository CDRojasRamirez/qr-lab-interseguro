package http

import (
	"errors"

	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/factorization/domain"
	"qrchallenge/go-api/internal/shared/httperror"
)

// Codes specific to this context.
const (
	codeInvalidMatrix       = "INVALID_MATRIX"
	codeUpstreamTimeout     = "UPSTREAM_TIMEOUT"
	codeUpstreamUnavailable = "UPSTREAM_UNAVAILABLE"
	codeUpstreamRejected    = "UPSTREAM_REJECTED"
)

// toAppError translates domain and application errors into transport errors.
// Unknown errors are returned untouched so the global handler renders a 500.
func toAppError(err error) error {
	switch {
	case errors.Is(err, domain.ErrEmptyMatrix),
		errors.Is(err, domain.ErrNotRectangular),
		errors.Is(err, domain.ErrNonFiniteValue),
		errors.Is(err, domain.ErrMatrixTooLarge):
		return httperror.New(400, codeInvalidMatrix, "invalid matrix", err.Error())
	case errors.Is(err, application.ErrAnalyticsTimeout):
		return httperror.New(504, codeUpstreamTimeout, "statistics service timed out")
	case errors.Is(err, application.ErrAnalyticsUnavailable):
		return httperror.New(502, codeUpstreamUnavailable, "statistics service unavailable")
	case errors.Is(err, application.ErrAnalyticsRejected):
		return httperror.New(502, codeUpstreamRejected, "statistics service rejected the request")
	default:
		return err
	}
}
