package application

import (
	"context"

	"qrchallenge/go-api/internal/factorization/domain"
)

// fakeAnalyzer records its inputs and returns a configurable outcome.
type fakeAnalyzer struct {
	report   StatisticsReport
	err      error
	calls    int
	gotCtx   context.Context
	gotInput []NamedMatrix
}

func (f *fakeAnalyzer) Analyze(ctx context.Context, m []NamedMatrix) (StatisticsReport, error) {
	f.calls++
	f.gotCtx = ctx
	f.gotInput = m
	return f.report, f.err
}

// fakeDecomposer returns a configurable outcome.
type fakeDecomposer struct {
	result domain.QRResult
	err    error
	calls  int
}

func (f *fakeDecomposer) Decompose(domain.Matrix) (domain.QRResult, error) {
	f.calls++
	return f.result, f.err
}
