package domain

import (
	"context"
	"errors"
	"time"
)

var (
	// ErrInvalidCredentials means the username/password pair was rejected.
	ErrInvalidCredentials = errors.New("invalid credentials")
	// ErrInvalidToken means a token is malformed, forged, expired or otherwise
	// not acceptable.
	ErrInvalidToken = errors.New("invalid token")
)

// Credentials is the login input.
type Credentials struct {
	Username string
	Password string
}

// Token is an issued access token with its lifetime.
type Token struct {
	Value     string
	ExpiresIn time.Duration
}

// CredentialVerifier checks credentials and returns the authenticated
// subject. It returns ErrInvalidCredentials on mismatch.
type CredentialVerifier interface {
	Verify(ctx context.Context, c Credentials) (subject string, err error)
}

// TokenIssuer creates access tokens for a subject.
type TokenIssuer interface {
	Issue(subject string) (Token, error)
}

// TokenVerifier validates a raw token and returns its subject. It returns
// ErrInvalidToken when validation fails.
type TokenVerifier interface {
	Verify(token string) (subject string, err error)
}
