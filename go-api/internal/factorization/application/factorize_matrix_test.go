package application

import (
	"context"
	"errors"
	"math"
	"reflect"
	"testing"

	"qrchallenge/go-api/internal/factorization/domain"
)

type ctxKey struct{}

var sampleReport = StatisticsReport{
	Global:      Statistics{Max: 3, Min: -1, Average: 0.5, Sum: 4, Count: 8},
	PerMatrix:   []MatrixStatistics{{Name: "Q", IsDiagonal: false}, {Name: "R", IsDiagonal: true}},
	AnyDiagonal: true,
}

func TestExecute_HappyPath(t *testing.T) {
	an := &fakeAnalyzer{report: sampleReport}
	uc := NewFactorizeMatrix(domain.NewGivensDecomposer(), an)

	res, err := uc.Execute(context.Background(), FactorizeCommand{Values: [][]float64{{1, 2}, {3, 4}, {5, 6}}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if an.calls != 1 || len(an.gotInput) != 2 {
		t.Fatalf("analyzer calls=%d matrices=%d, want 1 and 2", an.calls, len(an.gotInput))
	}
	want := []NamedMatrix{{MatrixNameQ, res.Q}, {MatrixNameR, res.R}}
	for i, w := range want {
		g := an.gotInput[i]
		if g.Name != w.Name || !reflect.DeepEqual(g.Matrix.ToSlice(), w.Matrix.ToSlice()) {
			t.Errorf("matrix %d = %s %v, want %s %v", i, g.Name, g.Matrix.ToSlice(), w.Name, w.Matrix.ToSlice())
		}
	}
	if !reflect.DeepEqual(res.Statistics, sampleReport) {
		t.Errorf("statistics = %+v, want %+v", res.Statistics, sampleReport)
	}
}

func TestExecute_InvalidMatrix(t *testing.T) {
	tests := []struct {
		name   string
		values [][]float64
		want   error
	}{
		{"jagged", [][]float64{{1, 2}, {3}}, domain.ErrNotRectangular},
		{"empty", [][]float64{}, domain.ErrEmptyMatrix},
		{"nan", [][]float64{{math.NaN()}}, domain.ErrNonFiniteValue},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dec, an := &fakeDecomposer{}, &fakeAnalyzer{}
			_, err := NewFactorizeMatrix(dec, an).Execute(context.Background(), FactorizeCommand{Values: tt.values})
			if !errors.Is(err, tt.want) {
				t.Errorf("err = %v, want %v", err, tt.want)
			}
			if dec.calls != 0 || an.calls != 0 {
				t.Errorf("decomposer=%d analyzer=%d calls, want 0", dec.calls, an.calls)
			}
		})
	}
}

func TestExecute_DecomposerError(t *testing.T) {
	boom := errors.New("boom")
	an := &fakeAnalyzer{}
	uc := NewFactorizeMatrix(&fakeDecomposer{err: boom}, an)

	_, err := uc.Execute(context.Background(), FactorizeCommand{Values: [][]float64{{1}}})
	if !errors.Is(err, boom) {
		t.Errorf("err = %v, want %v", err, boom)
	}
	if an.calls != 0 {
		t.Errorf("analyzer called %d times, want 0", an.calls)
	}
}

func TestExecute_AnalyzerErrors(t *testing.T) {
	for _, sentinel := range []error{ErrAnalyticsTimeout, ErrAnalyticsUnavailable, ErrAnalyticsRejected} {
		t.Run(sentinel.Error(), func(t *testing.T) {
			an := &fakeAnalyzer{err: errors.Join(errors.New("transport"), sentinel)}
			uc := NewFactorizeMatrix(domain.NewGivensDecomposer(), an)

			_, err := uc.Execute(context.Background(), FactorizeCommand{Values: [][]float64{{1, 2}, {3, 4}}})
			if !errors.Is(err, sentinel) {
				t.Errorf("err = %v, want %v", err, sentinel)
			}
		})
	}
}

func TestExecute_ForwardsContext(t *testing.T) {
	an := &fakeAnalyzer{}
	uc := NewFactorizeMatrix(domain.NewGivensDecomposer(), an)
	ctx := context.WithValue(context.Background(), ctxKey{}, "req-1")

	if _, err := uc.Execute(ctx, FactorizeCommand{Values: [][]float64{{1}}}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got := an.gotCtx.Value(ctxKey{}); got != "req-1" {
		t.Errorf("ctx value = %v, want req-1", got)
	}
}

func TestNewFactorizeMatrix_NilDepsPanic(t *testing.T) {
	tests := []struct {
		name string
		d    domain.Decomposer
		a    StatsAnalyzer
	}{
		{"nil decomposer", nil, &fakeAnalyzer{}},
		{"nil analyzer", &fakeDecomposer{}, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			defer func() {
				if recover() == nil {
					t.Error("expected panic")
				}
			}()
			NewFactorizeMatrix(tt.d, tt.a)
		})
	}
}
