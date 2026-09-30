package httperror

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

type body struct {
	Error struct {
		Code    string   `json:"code"`
		Message string   `json:"message"`
		Details []string `json:"details"`
	} `json:"error"`
}

func run(t *testing.T, err error) (int, body) {
	t.Helper()
	app := fiber.New(fiber.Config{ErrorHandler: ErrorHandler(slog.New(slog.NewTextHandler(io.Discard, nil)))})
	app.Get("/x", func(fiber.Ctx) error { return err })
	resp, terr := app.Test(httptest.NewRequest(http.MethodGet, "/x", nil))
	if terr != nil {
		t.Fatal(terr)
	}
	defer resp.Body.Close()
	var b body
	if derr := json.NewDecoder(resp.Body).Decode(&b); derr != nil {
		t.Fatalf("decode: %v", derr)
	}
	return resp.StatusCode, b
}

func TestErrorHandlerMapping(t *testing.T) {
	tests := []struct {
		name   string
		err    error
		status int
		code   string
	}{
		{"app error", New(400, "INVALID_MATRIX", "bad", "d1"), 400, "INVALID_MATRIX"},
		{"wrapped app error", errors.Join(errors.New("ctx"), Unauthorized("no")), 401, "UNAUTHORIZED"},
		{"fiber 413", fiber.NewError(413, "big"), 413, "PAYLOAD_TOO_LARGE"},
		{"fiber 404", fiber.ErrNotFound, 404, "NOT_FOUND"},
		{"fiber 405", fiber.ErrMethodNotAllowed, 405, "METHOD_NOT_ALLOWED"},
		{"fiber 400", fiber.NewError(400, "x"), 400, "VALIDATION_ERROR"},
		{"fiber 503", fiber.NewError(503, "x"), 503, "INTERNAL_ERROR"},
		{"unknown", errors.New("db password leaked"), 500, "INTERNAL_ERROR"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			status, b := run(t, tc.err)
			if status != tc.status || b.Error.Code != tc.code {
				t.Fatalf("got %d %s, want %d %s", status, b.Error.Code, tc.status, tc.code)
			}
			if b.Error.Details == nil {
				t.Fatal("details must be a JSON array, never null")
			}
		})
	}
}

func TestUnknownErrorIsNotLeaked(t *testing.T) {
	_, b := run(t, errors.New("secret detail"))
	if b.Error.Message == "secret detail" {
		t.Fatal("internal error message leaked")
	}
}

func TestAppErrorKeepsDetails(t *testing.T) {
	_, b := run(t, New(400, "INVALID_MATRIX", "bad", "row 2"))
	if len(b.Error.Details) != 1 || b.Error.Details[0] != "row 2" {
		t.Fatalf("details = %v", b.Error.Details)
	}
}
