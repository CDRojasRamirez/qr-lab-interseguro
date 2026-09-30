package infrastructure

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"

	"qrchallenge/go-api/internal/auth/domain"
)

// StaticCredentials verifies against a single demo user taken from the
// environment. DEMO ONLY: production would use a user store with salted,
// hashed passwords (argon2id/bcrypt).
type StaticCredentials struct {
	username, password string
}

// NewStaticCredentials builds the verifier for the demo user.
func NewStaticCredentials(username, password string) *StaticCredentials {
	return &StaticCredentials{username: username, password: password}
}

// Verify compares in constant time and returns the username as subject.
func (s *StaticCredentials) Verify(_ context.Context, c domain.Credentials) (string, error) {
	userOK := constEq(c.Username, s.username)
	passOK := constEq(c.Password, s.password)
	if userOK&passOK != 1 {
		return "", domain.ErrInvalidCredentials
	}
	return s.username, nil
}

// constEq hashes both sides first so the comparison length never leaks.
func constEq(a, b string) int {
	ha, hb := sha256.Sum256([]byte(a)), sha256.Sum256([]byte(b))
	return subtle.ConstantTimeCompare(ha[:], hb[:])
}
