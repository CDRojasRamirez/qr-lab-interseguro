package application

import (
	"context"

	"qrchallenge/go-api/internal/factorization/domain"
)

// NamedMatrix is a matrix labelled for the statistics request.
type NamedMatrix struct {
	Name   string
	Matrix domain.Matrix
}

// Statistics summarises a set of values.
type Statistics struct {
	Max, Min, Average, Sum float64
	Count                  int
}

// MatrixStatistics holds the statistics of a single named matrix.
type MatrixStatistics struct {
	Name       string
	Statistics Statistics
	IsDiagonal bool
}

// StatisticsReport is this context's own model of the Analytics answer.
// The HTTP adapter acts as an Anti-Corruption Layer translating into it.
type StatisticsReport struct {
	Global      Statistics
	PerMatrix   []MatrixStatistics
	AnyDiagonal bool
}

// StatsAnalyzer is the output port to the Analytics bounded context.
// Implementations MUST return errors wrapping ErrAnalyticsUnavailable,
// ErrAnalyticsTimeout or ErrAnalyticsRejected so callers can map them.
type StatsAnalyzer interface {
	Analyze(ctx context.Context, matrices []NamedMatrix) (StatisticsReport, error)
}
