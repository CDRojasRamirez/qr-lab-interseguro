package statsclient

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/factorization/domain"
	"qrchallenge/go-api/internal/shared/requestctx"
)

const okBody = `{"global":{"max":3,"min":0,"average":1,"sum":8,"count":8},
"perMatrix":[{"name":"Q","max":1,"min":0,"average":0.5,"sum":2,"count":4,"isDiagonal":true}],
"anyDiagonal":true}`

func input(t *testing.T) []application.NamedMatrix {
	t.Helper()
	m, err := domain.NewMatrix([][]float64{{1, 0}, {0, 1}})
	if err != nil {
		t.Fatal(err)
	}
	return []application.NamedMatrix{{Name: "Q", Matrix: m}}
}

func newClient(url string, timeout time.Duration) *Client {
	return New(url, &http.Client{Timeout: timeout})
}

// serve starts a server answering a fixed status/body; it is closed on cleanup.
func serve(t *testing.T, status int, body string) string {
	t.Helper()
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(s.Close)
	return s.URL
}

// serveSlow starts a server that answers only after delay.
func serveSlow(t *testing.T, delay time.Duration) string {
	t.Helper()
	s := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		time.Sleep(delay)
	}))
	t.Cleanup(s.Close)
	return s.URL
}

func TestAnalyzeSuccessTranslatesAndSendsRequest(t *testing.T) {
	var gotAuth, gotPath, gotMethod string
	var gotBody requestDTO
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth, gotPath, gotMethod = r.Header.Get("Authorization"), r.URL.Path, r.Method
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		_, _ = w.Write([]byte(okBody))
	}))
	defer srv.Close()

	ctx := requestctx.WithBearerToken(context.Background(), "tok123")
	rep, err := newClient(srv.URL, time.Second).Analyze(ctx, input(t))
	if err != nil {
		t.Fatal(err)
	}
	if gotAuth != "Bearer tok123" || gotPath != "/api/v1/statistics" || gotMethod != http.MethodPost {
		t.Fatalf("auth=%q path=%q method=%q", gotAuth, gotPath, gotMethod)
	}
	if len(gotBody.Matrices) != 1 || gotBody.Matrices[0].Name != "Q" || gotBody.Matrices[0].Values[1][1] != 1 {
		t.Fatalf("request body = %+v", gotBody)
	}
	if rep.Global.Sum != 8 || rep.Global.Count != 8 || !rep.AnyDiagonal {
		t.Fatalf("report = %+v", rep)
	}
	pm := rep.PerMatrix
	if len(pm) != 1 || pm[0].Name != "Q" || !pm[0].IsDiagonal || pm[0].Statistics.Average != 0.5 {
		t.Fatalf("perMatrix = %+v", pm)
	}
}

func TestAnalyzeErrorMapping(t *testing.T) {
	down := httptest.NewServer(http.NotFoundHandler())
	down.Close()

	tests := []struct {
		name   string
		client *Client
		want   error
	}{
		{"500", newClient(serve(t, 500, "boom"), time.Second), application.ErrAnalyticsUnavailable},
		{"400", newClient(serve(t, 400, "{}"), time.Second), application.ErrAnalyticsRejected},
		{"401", newClient(serve(t, 401, "{}"), time.Second), application.ErrAnalyticsRejected},
		{"invalid json", newClient(serve(t, 200, "not json"), time.Second), application.ErrAnalyticsUnavailable},
		{"slow server", newClient(serveSlow(t, 300*time.Millisecond), 50*time.Millisecond), application.ErrAnalyticsTimeout},
		{"server down", newClient(down.URL, time.Second), application.ErrAnalyticsUnavailable},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := tc.client.Analyze(context.Background(), input(t))
			if !errors.Is(err, tc.want) {
				t.Fatalf("err = %v, want %v", err, tc.want)
			}
		})
	}
}

func TestAnalyzeContextDeadlineIsTimeout(t *testing.T) {
	url := serveSlow(t, 300*time.Millisecond)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
	defer cancel()
	_, err := newClient(url, 5*time.Second).Analyze(ctx, input(t))
	if !errors.Is(err, application.ErrAnalyticsTimeout) {
		t.Fatalf("err = %v", err)
	}
}
