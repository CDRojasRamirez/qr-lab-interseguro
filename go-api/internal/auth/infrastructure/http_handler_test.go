package infrastructure

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"

	"qrchallenge/go-api/internal/auth/domain"
	"qrchallenge/go-api/internal/shared/httperror"
)

type fakeLogin struct {
	tok domain.Token
	err error
	got domain.Credentials
}

func (f *fakeLogin) Execute(_ context.Context, c domain.Credentials) (domain.Token, error) {
	f.got = c
	return f.tok, f.err
}

func newApp() *fiber.App {
	return fiber.New(fiber.Config{ErrorHandler: httperror.ErrorHandler(slog.New(slog.NewTextHandler(io.Discard, nil)))})
}

func testApp(h fiber.Handler) *fiber.App {
	app := newApp()
	app.Post("/login", h)
	return app
}

func post(t *testing.T, app *fiber.App, body string) (int, map[string]any) {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(body))
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

func TestLoginHandlerSuccess(t *testing.T) {
	uc := &fakeLogin{tok: domain.Token{Value: "jwt", ExpiresIn: 15 * time.Minute}}
	status, out := post(t, testApp(NewLoginHandler(uc).Login), `{"username":"a","password":"b"}`)
	if status != 200 || out["accessToken"] != "jwt" || out["tokenType"] != "Bearer" || out["expiresIn"] != float64(900) {
		t.Fatalf("status=%d body=%v", status, out)
	}
	if uc.got.Username != "a" || uc.got.Password != "b" {
		t.Fatalf("credentials = %+v", uc.got)
	}
}

func TestLoginHandlerErrors(t *testing.T) {
	tests := []struct {
		name string
		uc   *fakeLogin
		body string
		want int
		code string
	}{
		{"malformed json", &fakeLogin{}, `{`, 400, "VALIDATION_ERROR"},
		{"missing password", &fakeLogin{}, `{"username":"a"}`, 400, "VALIDATION_ERROR"},
		{"missing username", &fakeLogin{}, `{"password":"a"}`, 400, "VALIDATION_ERROR"},
		{"bad credentials", &fakeLogin{err: domain.ErrInvalidCredentials}, `{"username":"a","password":"b"}`, 401, "UNAUTHORIZED"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			status, out := post(t, testApp(NewLoginHandler(tc.uc).Login), tc.body)
			e, _ := out["error"].(map[string]any)
			if status != tc.want || e["code"] != tc.code {
				t.Fatalf("status=%d body=%v", status, out)
			}
		})
	}
}
