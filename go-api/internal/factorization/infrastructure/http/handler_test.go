package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	nethttp "net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v3"

	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/factorization/domain"
	"qrchallenge/go-api/internal/shared/httperror"
)

type fakeFactorizer struct {
	res application.FactorizeResult
	err error
	got application.FactorizeCommand
}

func (f *fakeFactorizer) Execute(_ context.Context, cmd application.FactorizeCommand) (application.FactorizeResult, error) {
	f.got = cmd
	return f.res, f.err
}

type fakeAnalyzer struct{ err error }

func (f fakeAnalyzer) Analyze(context.Context, []application.NamedMatrix) (application.StatisticsReport, error) {
	return application.StatisticsReport{
		Global:      application.Statistics{Max: 1, Min: 0, Average: 0.5, Sum: 2, Count: 4},
		PerMatrix:   []application.MatrixStatistics{{Name: "Q", IsDiagonal: true}},
		AnyDiagonal: true,
	}, f.err
}

func call(t *testing.T, uc Factorizer, body string) (int, map[string]any) {
	t.Helper()
	app := fiber.New(fiber.Config{ErrorHandler: httperror.ErrorHandler(slog.New(slog.NewTextHandler(io.Discard, nil)))})
	app.Post("/f", NewHandler(uc).Factorize)
	req := httptest.NewRequest(nethttp.MethodPost, "/f", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	var out map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&out)
	return resp.StatusCode, out
}

func errCode(out map[string]any) any { return out["error"].(map[string]any)["code"] }

func TestFactorizeSuccessWithFakeFactorizer(t *testing.T) {
	m, _ := domain.NewMatrix([][]float64{{1, 0}, {0, 1}})
	f := &fakeFactorizer{res: application.FactorizeResult{Q: m, R: m,
		Statistics: application.StatisticsReport{AnyDiagonal: true,
			PerMatrix: []application.MatrixStatistics{{Name: "Q", IsDiagonal: true}}}}}
	status, out := call(t, f, `{"matrix":[[1,2],[3,4]]}`)
	if status != 200 || len(f.got.Values) != 2 {
		t.Fatalf("status=%d got=%v", status, f.got)
	}
	stats := out["statistics"].(map[string]any)
	if out["q"] == nil || out["r"] == nil || stats["anyDiagonal"] != true {
		t.Fatalf("body = %v", out)
	}
	if pm := stats["perMatrix"].([]any)[0].(map[string]any); pm["name"] != "Q" || pm["isDiagonal"] != true {
		t.Fatalf("perMatrix = %v", pm)
	}
}

func TestFactorizeRequestErrors(t *testing.T) {
	for name, body := range map[string]string{
		"malformed":     `{`,
		"wrong type":    `{"matrix":"x"}`,
		"missing field": `{}`,
	} {
		t.Run(name, func(t *testing.T) {
			status, out := call(t, &fakeFactorizer{}, body)
			if status != 400 || errCode(out) != "VALIDATION_ERROR" {
				t.Fatalf("status=%d body=%v", status, out)
			}
		})
	}
}

func TestFactorizeUseCaseErrorsAreMapped(t *testing.T) {
	status, out := call(t, &fakeFactorizer{err: application.ErrAnalyticsTimeout}, `{"matrix":[[1]]}`)
	if status != 504 || errCode(out) != "UPSTREAM_TIMEOUT" {
		t.Fatalf("status=%d body=%v", status, out)
	}
	status, _ = call(t, &fakeFactorizer{err: errors.New("boom")}, `{"matrix":[[1]]}`)
	if status != 500 {
		t.Fatalf("status = %d", status)
	}
}

func TestFactorizeWithRealUseCase(t *testing.T) {
	uc := application.NewFactorizeMatrix(domain.NewGivensDecomposer(), fakeAnalyzer{})
	status, out := call(t, uc, `{"matrix":[[1,2],[3,4],[5,6]]}`)
	if status != 200 || len(out["q"].([]any)) != 3 || len(out["r"].([]any)) != 3 {
		t.Fatalf("status=%d body=%v", status, out)
	}
	status, out = call(t, uc, `{"matrix":[[1,2],[3]]}`)
	if status != 400 || errCode(out) != "INVALID_MATRIX" {
		t.Fatalf("status=%d body=%v", status, out)
	}
	uc = application.NewFactorizeMatrix(domain.NewGivensDecomposer(), fakeAnalyzer{err: application.ErrAnalyticsRejected})
	if status, _ = call(t, uc, `{"matrix":[[1]]}`); status != 502 {
		t.Fatalf("status = %d", status)
	}
}
