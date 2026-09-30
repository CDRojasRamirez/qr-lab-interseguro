//go:build e2e

// Package e2e exercises the running docker compose stack over real sockets.
// Run with `make e2e` after `docker compose up --build -d`.
package e2e

import (
	"io"
	"math"
	"net/http"
	"strings"
	"testing"
	"time"
)

var sample = [][]float64{{12, -51, 4}, {6, 167, -68}, {-4, 24, -41}}

var wantR = [][]float64{{14, 21, -14}, {0, 175, -70}, {0, 0, 35}}

type factorizationResp struct {
	Q          [][]float64 `json:"q"`
	R          [][]float64 `json:"r"`
	Statistics struct {
		PerMatrix []struct {
			Name string `json:"name"`
		} `json:"perMatrix"`
	} `json:"statistics"`
}

func TestHealth(t *testing.T) {
	for name, base := range map[string]string{"go": goURL(), "node": nodeURL()} {
		t.Run(name, func(t *testing.T) {
			status, _ := do(t, http.MethodGet, base+"/health", "", nil)
			if status != http.StatusOK {
				t.Fatalf("status = %d, want 200", status)
			}
		})
	}
}

func TestLoginReturnsToken(t *testing.T) {
	if token := login(t); token == "" {
		t.Fatal("empty token")
	}
}

func TestFactorizationHappyPath(t *testing.T) {
	status, body := factorize(t, login(t), sample)
	if status != http.StatusOK {
		t.Fatalf("status = %d, body = %s", status, body)
	}
	var got factorizationResp
	decode(t, body, &got)
	if len(got.R) != 3 {
		t.Fatalf("R has %d rows, want 3", len(got.R))
	}
	for i := range wantR {
		for j := range wantR[i] {
			if math.Abs(got.R[i][j]-wantR[i][j]) > 1e-9 {
				t.Errorf("R[%d][%d] = %v, want %v", i, j, got.R[i][j], wantR[i][j])
			}
		}
	}
	names := got.Statistics.PerMatrix
	if len(names) != 2 || names[0].Name != "Q" || names[1].Name != "R" {
		t.Errorf("statistics.perMatrix = %+v, want names Q,R", names)
	}
}

func TestFactorizationWithoutToken(t *testing.T) {
	status, body := factorize(t, "", sample)
	assertError(t, status, body, http.StatusUnauthorized, "UNAUTHORIZED")
}

func TestFactorizationJaggedMatrix(t *testing.T) {
	status, body := factorize(t, login(t), [][]float64{{1, 2}, {3}})
	assertError(t, status, body, http.StatusBadRequest, "INVALID_MATRIX")
}

// Verifies the body limit over a real socket (unit tests bypass the listener).
// The server rejects on Content-Length and stops reading, so the client uses
// "Expect: 100-continue" (as curl does) to wait for the verdict before
// streaming the body; otherwise it blocks writing to a socket nobody reads.
func TestFactorizationPayloadTooLarge(t *testing.T) {
	huge := `{"matrix":[[1]],"pad":"` + strings.Repeat("x", 600*1024) + `"}`
	req, err := http.NewRequest(http.MethodPost, goURL()+"/api/v1/factorizations", strings.NewReader(huge))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+login(t))
	req.Header.Set("Expect", "100-continue")

	expectClient := &http.Client{
		Timeout:   10 * time.Second,
		Transport: &http.Transport{ExpectContinueTimeout: 2 * time.Second},
	}
	res, err := expectClient.Do(req)
	if err != nil {
		t.Fatalf("oversized request: %v", err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	assertError(t, res.StatusCode, body, http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE")
}

func TestNodeDirectAuth(t *testing.T) {
	payload := []byte(`{"matrices":[{"name":"Q","values":[[1,0],[0,1]]}]}`)
	url := nodeURL() + "/api/v1/statistics"

	if status, body := do(t, http.MethodPost, url, login(t), payload); status != http.StatusOK {
		t.Errorf("with token: status = %d, body = %s", status, body)
	}
	status, body := do(t, http.MethodPost, url, "", payload)
	assertError(t, status, body, http.StatusUnauthorized, "UNAUTHORIZED")
}

func TestGoDocs(t *testing.T) {
	if status, _ := do(t, http.MethodGet, goURL()+"/docs", "", nil); status != http.StatusOK {
		t.Fatalf("status = %d, want 200", status)
	}
}
