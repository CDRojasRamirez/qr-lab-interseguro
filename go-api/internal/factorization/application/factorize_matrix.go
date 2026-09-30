package application

import (
	"context"
	"fmt"

	"qrchallenge/go-api/internal/factorization/domain"
)

// Names under which the factors are sent to the analytics service.
const (
	MatrixNameQ = "Q"
	MatrixNameR = "R"
)

// FactorizeCommand is the input of the FactorizeMatrix use case.
type FactorizeCommand struct {
	Values [][]float64
}

// FactorizeResult is the output of the FactorizeMatrix use case.
type FactorizeResult struct {
	Q, R       domain.Matrix
	Statistics StatisticsReport
}

// FactorizeMatrix is the use case: validate the input, compute its QR
// factorization and delegate the statistics to the Analytics context.
type FactorizeMatrix struct {
	decomposer domain.Decomposer
	analyzer   StatsAnalyzer
}

// NewFactorizeMatrix wires the use case. It panics on nil dependencies, which
// is a programming error to be caught at the composition root.
func NewFactorizeMatrix(d domain.Decomposer, a StatsAnalyzer) *FactorizeMatrix {
	if d == nil || a == nil {
		panic("application: NewFactorizeMatrix requires non-nil decomposer and analyzer")
	}
	return &FactorizeMatrix{decomposer: d, analyzer: a}
}

// Execute validates cmd, factorizes it and requests statistics for Q and R.
// Domain validation errors are returned unchanged (errors.Is works).
func (uc *FactorizeMatrix) Execute(ctx context.Context, cmd FactorizeCommand) (FactorizeResult, error) {
	m, err := domain.NewMatrix(cmd.Values)
	if err != nil {
		return FactorizeResult{}, err
	}
	qr, err := uc.decomposer.Decompose(m)
	if err != nil {
		return FactorizeResult{}, fmt.Errorf("decompose matrix: %w", err)
	}
	report, err := uc.analyzer.Analyze(ctx, []NamedMatrix{
		{Name: MatrixNameQ, Matrix: qr.Q()},
		{Name: MatrixNameR, Matrix: qr.R()},
	})
	if err != nil {
		return FactorizeResult{}, fmt.Errorf("analyze factors: %w", err)
	}
	return FactorizeResult{Q: qr.Q(), R: qr.R(), Statistics: report}, nil
}
