package statsclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"

	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/shared/requestctx"
)

const (
	statisticsPath  = "/api/v1/statistics"
	maxResponseSize = 1 << 20 // 1 MiB
)

// Client implements application.StatsAnalyzer over HTTP against the Node API.
type Client struct {
	baseURL string
	http    *http.Client
}

// New builds a Client. The timeout lives in hc (http.Client.Timeout).
func New(baseURL string, hc *http.Client) *Client {
	return &Client{baseURL: strings.TrimRight(baseURL, "/"), http: hc}
}

// Analyze posts the matrices, forwarding the caller's bearer token, and
// translates the answer. Errors wrap application.ErrAnalytics* sentinels.
func (c *Client) Analyze(ctx context.Context, matrices []application.NamedMatrix) (application.StatisticsReport, error) {
	payload, err := json.Marshal(toRequest(matrices))
	if err != nil {
		return application.StatisticsReport{}, fmt.Errorf("%w: encode request: %v", application.ErrAnalyticsUnavailable, err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+statisticsPath, bytes.NewReader(payload))
	if err != nil {
		return application.StatisticsReport{}, fmt.Errorf("%w: build request: %v", application.ErrAnalyticsUnavailable, err)
	}
	req.Header.Set("Content-Type", "application/json")
	if tok, ok := requestctx.BearerToken(ctx); ok {
		req.Header.Set("Authorization", "Bearer "+tok)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return application.StatisticsReport{}, classify(err)
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode >= 200 && resp.StatusCode < 300:
		return decode(resp.Body)
	case resp.StatusCode >= 400 && resp.StatusCode < 500:
		return application.StatisticsReport{}, fmt.Errorf("%w: status %d", application.ErrAnalyticsRejected, resp.StatusCode)
	default:
		return application.StatisticsReport{}, fmt.Errorf("%w: status %d", application.ErrAnalyticsUnavailable, resp.StatusCode)
	}
}

func decode(body io.Reader) (application.StatisticsReport, error) {
	var dto responseDTO
	if err := json.NewDecoder(io.LimitReader(body, maxResponseSize)).Decode(&dto); err != nil {
		return application.StatisticsReport{}, fmt.Errorf("%w: undecodable response: %v", application.ErrAnalyticsUnavailable, err)
	}
	return dto.toReport(), nil
}

// classify separates timeouts from other transport failures. Connect-phase
// failures (DNS, dial) are checked first: an unreachable service is
// unavailable even if connecting timed out.
func classify(err error) error {
	var dnsErr *net.DNSError
	var opErr *net.OpError
	if errors.As(err, &dnsErr) || (errors.As(err, &opErr) && opErr.Op == "dial") {
		return fmt.Errorf("%w: %v", application.ErrAnalyticsUnavailable, err)
	}
	var ne net.Error
	if errors.Is(err, context.DeadlineExceeded) || (errors.As(err, &ne) && ne.Timeout()) {
		return fmt.Errorf("%w: %v", application.ErrAnalyticsTimeout, err)
	}
	return fmt.Errorf("%w: %v", application.ErrAnalyticsUnavailable, err)
}
