package statsclient

import (
	"net"
	"net/http"
	"time"
)

// maxDialTimeout caps the connect phase (DNS + TCP handshake). Keeping it
// shorter than the total timeout lets classify tell "service unreachable"
// (502) apart from "service slow to answer" (504).
const maxDialTimeout = time.Second

// NewHTTPClient returns the client used to reach the Analytics API: total is
// the whole-request budget, while connecting gets at most maxDialTimeout.
func NewHTTPClient(total time.Duration) *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.DialContext = (&net.Dialer{Timeout: min(maxDialTimeout, total)}).DialContext
	return &http.Client{Timeout: total, Transport: transport}
}
