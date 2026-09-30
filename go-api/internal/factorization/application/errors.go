package application

import "errors"

// Sentinel errors describing failures of the Analytics bounded context, as
// seen by the Factorization context. Adapters wrap them so callers can map
// them with errors.Is.
var (
	// ErrAnalyticsUnavailable means the analytics service could not be reached
	// or failed internally.
	ErrAnalyticsUnavailable = errors.New("analytics service unavailable")
	// ErrAnalyticsTimeout means the analytics service did not answer in time.
	ErrAnalyticsTimeout = errors.New("analytics service timed out")
	// ErrAnalyticsRejected means the analytics service refused the input or
	// the credentials.
	ErrAnalyticsRejected = errors.New("analytics service rejected the request")
)
