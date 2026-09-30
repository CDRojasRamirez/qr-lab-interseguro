package infrastructure

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"

	"qrchallenge/go-api/internal/auth/domain"
	"qrchallenge/go-api/internal/shared/requestctx"
)

type fakeTokenVerifier struct{ valid string }

func (f fakeTokenVerifier) Verify(tok string) (string, error) {
	if tok == f.valid {
		return "admin", nil
	}
	return "", errors.New("nope")
}

func protectedApp(seen *string) *fiber.App {
	app := newApp()
	app.Get("/p", RequireJWT(fakeTokenVerifier{valid: "good"}), func(c fiber.Ctx) error {
		tok, _ := requestctx.BearerToken(c.Context())
		*seen = tok + "|" + c.Locals(LocalSubject).(string)
		return c.SendStatus(200)
	})
	return app
}

func TestRequireJWT(t *testing.T) {
	tests := []struct {
		name, header string
		want         int
	}{
		{"missing", "", 401},
		{"wrong scheme", "Basic abc", 401},
		{"empty bearer", "Bearer ", 401},
		{"invalid", "Bearer bad", 401},
		{"valid", "Bearer good", 200},
		{"case-insensitive scheme", "bearer good", 200},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var seen string
			req := httptest.NewRequest(http.MethodGet, "/p", nil)
			if tc.header != "" {
				req.Header.Set("Authorization", tc.header)
			}
			resp, err := protectedApp(&seen).Test(req)
			if err != nil {
				t.Fatal(err)
			}
			if resp.StatusCode != tc.want {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tc.want)
			}
			if tc.want == 200 && seen != "good|admin" {
				t.Fatalf("seen = %q", seen)
			}
		})
	}
}

var _ domain.TokenVerifier = fakeTokenVerifier{}
