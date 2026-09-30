// Package application holds the auth use cases (application layer).
package application

import (
	"context"
	"fmt"

	"qrchallenge/go-api/internal/auth/domain"
)

// Login is the use case exchanging credentials for an access token.
type Login struct {
	verifier domain.CredentialVerifier
	issuer   domain.TokenIssuer
}

// NewLogin wires the use case.
func NewLogin(v domain.CredentialVerifier, i domain.TokenIssuer) *Login {
	return &Login{verifier: v, issuer: i}
}

// Execute verifies c and issues a token for the authenticated subject.
// domain.ErrInvalidCredentials is returned unchanged.
func (l *Login) Execute(ctx context.Context, c domain.Credentials) (domain.Token, error) {
	subject, err := l.verifier.Verify(ctx, c)
	if err != nil {
		return domain.Token{}, err
	}
	tok, err := l.issuer.Issue(subject)
	if err != nil {
		return domain.Token{}, fmt.Errorf("issue token: %w", err)
	}
	return tok, nil
}
