package server

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/valyala/fasthttp"

	authapp "qrchallenge/go-api/internal/auth/application"
	authinfra "qrchallenge/go-api/internal/auth/infrastructure"
	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/factorization/domain"
	fhttp "qrchallenge/go-api/internal/factorization/infrastructure/http"
)

type okAnalyzer struct{}

func (okAnalyzer) Analyze(context.Context, []application.NamedMatrix) (application.StatisticsReport, error) {
	return application.StatisticsReport{}, nil
}

func newTestApp(t *testing.T) (*fiber.App, string) {
	t.Helper()
	tokens, err := authinfra.NewRS256(generateKeyPEM(t), "iss", "aud", time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	login := authapp.NewLogin(authinfra.NewStaticCredentials("admin", "secret"), tokens)
	uc := application.NewFactorizeMatrix(domain.NewGivensDecomposer(), okAnalyzer{})
	app := New(Dependencies{
		Log:            slog.New(slog.NewTextHandler(io.Discard, nil)),
		AllowedOrigins: []string{"http://localhost:4200"},
		BodyLimit:      1024,
		Login:          authinfra.NewLoginHandler(login),
		Factorization:  fhttp.NewHandler(uc),
		Tokens:         tokens,
	})
	tok, err := tokens.Issue("admin")
	if err != nil {
		t.Fatal(err)
	}
	return app, tok.Value
}

func do(t *testing.T, app *fiber.App, req *http.Request) *http.Response {
	t.Helper()
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { resp.Body.Close() })
	return resp
}

func TestHealth(t *testing.T) {
	app, _ := newTestApp(t)
	resp := do(t, app, httptest.NewRequest(http.MethodGet, "/health", nil))
	if resp.StatusCode != 200 {
		t.Fatalf("status = %d", resp.StatusCode)
	}
}

func TestUnknownRouteReturnsJSONError(t *testing.T) {
	app, _ := newTestApp(t)
	resp := do(t, app, httptest.NewRequest(http.MethodGet, "/nope", nil))
	var b struct{ Error struct{ Code string } }
	_ = json.NewDecoder(resp.Body).Decode(&b)
	if resp.StatusCode != 404 || b.Error.Code != "NOT_FOUND" {
		t.Fatalf("status=%d code=%q", resp.StatusCode, b.Error.Code)
	}
}

func factorizeReq(token string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/factorizations", strings.NewReader(`{"matrix":[[1,2],[3,4]]}`))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return req
}

func TestFactorizationsRequireToken(t *testing.T) {
	app, tok := newTestApp(t)
	if s := do(t, app, factorizeReq("")).StatusCode; s != 401 {
		t.Fatalf("without token: %d", s)
	}
	if s := do(t, app, factorizeReq(tok)).StatusCode; s != 200 {
		t.Fatalf("with token: %d", s)
	}
}

func TestLoginThenUseToken(t *testing.T) {
	app, _ := newTestApp(t)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(`{"username":"admin","password":"secret"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := do(t, app, req)
	var b struct {
		AccessToken string `json:"accessToken"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&b)
	if resp.StatusCode != 200 || b.AccessToken == "" {
		t.Fatalf("login status=%d", resp.StatusCode)
	}
	if s := do(t, app, factorizeReq(b.AccessToken)).StatusCode; s != 200 {
		t.Fatalf("status = %d", s)
	}
}

func TestBodyLimit(t *testing.T) {
	app, tok := newTestApp(t)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/factorizations", strings.NewReader(strings.Repeat("x", 4096)))
	req.Header.Set("Authorization", "Bearer "+tok)
	req.Header.Set("Content-Type", "application/json")
	// app.Test surfaces fasthttp's limit error instead of a response; over a
	// real socket Fiber renders it as 413 through the ErrorHandler.
	if _, err := app.Test(req); !errors.Is(err, fasthttp.ErrBodyTooLarge) {
		t.Fatalf("err = %v, want ErrBodyTooLarge", err)
	}
}

func TestCORSPreflight(t *testing.T) {
	app, _ := newTestApp(t)
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/factorizations", nil)
	req.Header.Set("Origin", "http://localhost:4200")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")
	resp := do(t, app, req)
	if resp.StatusCode != 204 || resp.Header.Get("Access-Control-Allow-Origin") != "http://localhost:4200" {
		t.Fatalf("status=%d headers=%v", resp.StatusCode, resp.Header)
	}
	req = httptest.NewRequest(http.MethodOptions, "/api/v1/factorizations", nil)
	req.Header.Set("Origin", "http://evil.example")
	req.Header.Set("Access-Control-Request-Method", "POST")
	if got := do(t, app, req).Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("disallowed origin got ACAO %q", got)
	}
}

func TestDocsAndSpec(t *testing.T) {
	app, _ := newTestApp(t)
	spec := do(t, app, httptest.NewRequest(http.MethodGet, "/openapi.yaml", nil))
	body, _ := io.ReadAll(spec.Body)
	if spec.StatusCode != 200 || !strings.HasPrefix(string(body), "openapi: 3.1") {
		t.Fatalf("spec status=%d", spec.StatusCode)
	}
	docs := do(t, app, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if docs.StatusCode != 200 || !strings.Contains(docs.Header.Get("Content-Type"), "text/html") {
		t.Fatalf("docs status=%d", docs.StatusCode)
	}
}
