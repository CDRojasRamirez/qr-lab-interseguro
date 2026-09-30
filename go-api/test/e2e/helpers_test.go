//go:build e2e

package e2e

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

var client = &http.Client{Timeout: 10 * time.Second}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func goURL() string   { return env("E2E_GO_URL", "http://localhost:8080") }
func nodeURL() string { return env("E2E_NODE_URL", "http://localhost:3000") }

// do sends a JSON request; a non-empty token is sent as a Bearer header.
func do(t *testing.T, method, url, token string, body []byte) (int, []byte) {
	t.Helper()
	req, err := http.NewRequest(method, url, bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := client.Do(req)
	if err != nil {
		t.Fatalf("%s %s: %v (is the stack up?)", method, url, err)
	}
	defer res.Body.Close()
	data, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	return res.StatusCode, data
}

func login(t *testing.T) string {
	t.Helper()
	creds, _ := json.Marshal(map[string]string{
		"username": env("E2E_USERNAME", "admin"),
		"password": env("E2E_PASSWORD", "secret"),
	})
	status, body := do(t, http.MethodPost, goURL()+"/api/v1/auth/login", "", creds)
	if status != http.StatusOK {
		t.Fatalf("login status = %d, body = %s", status, body)
	}
	var out struct {
		AccessToken string `json:"accessToken"`
	}
	decode(t, body, &out)
	return out.AccessToken
}

func factorize(t *testing.T, token string, matrix [][]float64) (int, []byte) {
	t.Helper()
	payload, _ := json.Marshal(map[string]any{"matrix": matrix})
	return do(t, http.MethodPost, goURL()+"/api/v1/factorizations", token, payload)
}

func decode(t *testing.T, data []byte, v any) {
	t.Helper()
	if err := json.Unmarshal(data, v); err != nil {
		t.Fatalf("decode %q: %v", data, err)
	}
}

func assertError(t *testing.T, status int, body []byte, wantStatus int, wantCode string) {
	t.Helper()
	var e struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	decode(t, body, &e)
	if status != wantStatus || e.Error.Code != wantCode {
		t.Errorf("got %d %q, want %d %q (body %s)", status, e.Error.Code, wantStatus, wantCode, body)
	}
}
