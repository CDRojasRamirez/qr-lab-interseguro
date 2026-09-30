package infrastructure

import (
	"context"
	"errors"
	"testing"

	"qrchallenge/go-api/internal/auth/domain"
)

func TestStaticCredentials(t *testing.T) {
	v := NewStaticCredentials("admin", "secret")
	tests := []struct {
		name string
		c    domain.Credentials
		ok   bool
	}{
		{"valid", domain.Credentials{Username: "admin", Password: "secret"}, true},
		{"bad password", domain.Credentials{Username: "admin", Password: "nope"}, false},
		{"bad user", domain.Credentials{Username: "root", Password: "secret"}, false},
		{"empty", domain.Credentials{}, false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			sub, err := v.Verify(context.Background(), tc.c)
			if tc.ok && (err != nil || sub != "admin") {
				t.Fatalf("sub=%q err=%v", sub, err)
			}
			if !tc.ok && !errors.Is(err, domain.ErrInvalidCredentials) {
				t.Fatalf("err=%v", err)
			}
		})
	}
}
