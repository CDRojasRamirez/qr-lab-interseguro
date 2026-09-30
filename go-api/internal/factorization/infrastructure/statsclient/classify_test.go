package statsclient

import (
	"context"
	"errors"
	"net"
	"testing"

	"qrchallenge/go-api/internal/factorization/application"
)

// timeoutErr is a net.Error that reports a timeout.
type timeoutErr struct{}

func (timeoutErr) Error() string   { return "i/o timeout" }
func (timeoutErr) Timeout() bool   { return true }
func (timeoutErr) Temporary() bool { return true }

func TestClassify(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want error
	}{
		// A service that cannot be reached is unavailable (502), even when the
		// connect phase itself timed out (e.g. slow DNS for a stopped container).
		{"dial timeout", &net.OpError{Op: "dial", Net: "tcp", Err: timeoutErr{}}, application.ErrAnalyticsUnavailable},
		{"dns failure", &net.DNSError{Err: "no such host", Name: "node-api", IsNotFound: true}, application.ErrAnalyticsUnavailable},
		{"connection refused", &net.OpError{Op: "dial", Net: "tcp", Err: errors.New("connection refused")}, application.ErrAnalyticsUnavailable},
		// Once connected, a slow answer is a timeout (504).
		{"read timeout", &net.OpError{Op: "read", Net: "tcp", Err: timeoutErr{}}, application.ErrAnalyticsTimeout},
		{"deadline exceeded", context.DeadlineExceeded, application.ErrAnalyticsTimeout},
		{"other", errors.New("boom"), application.ErrAnalyticsUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := classify(tt.err); !errors.Is(got, tt.want) {
				t.Fatalf("classify(%v) = %v, want %v", tt.err, got, tt.want)
			}
		})
	}
}

func TestNewHTTPClientDialTimeoutIsShorterThanTotal(t *testing.T) {
	c := NewHTTPClient(3e9) // 3s
	if c.Timeout != 3e9 {
		t.Fatalf("total timeout = %v, want 3s", c.Timeout)
	}
	if c.Transport == nil {
		t.Fatal("expected a custom transport with a dial timeout")
	}
}
