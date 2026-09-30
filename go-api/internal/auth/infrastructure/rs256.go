package infrastructure

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"qrchallenge/go-api/internal/auth/domain"
)

// RS256 issues and verifies RS256 JWTs. It implements domain.TokenIssuer and
// domain.TokenVerifier. Node verifies the same tokens with the public key.
type RS256 struct {
	key      *rsa.PrivateKey
	issuer   string
	audience string
	ttl      time.Duration
}

// NewRS256 builds the service from a PKCS#8 or PKCS#1 PEM private key.
func NewRS256(privatePEM, issuer, audience string, ttl time.Duration) (*RS256, error) {
	key, err := parseRSAPrivateKey(privatePEM)
	if err != nil {
		return nil, err
	}
	return &RS256{key: key, issuer: issuer, audience: audience, ttl: ttl}, nil
}

// Issue signs a token for subject with iss, aud, sub, iat and exp claims.
func (s *RS256) Issue(subject string) (domain.Token, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Issuer:    s.issuer,
		Audience:  jwt.ClaimStrings{s.audience},
		Subject:   subject,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims).SignedString(s.key)
	if err != nil {
		return domain.Token{}, fmt.Errorf("sign token: %w", err)
	}
	return domain.Token{Value: signed, ExpiresIn: s.ttl}, nil
}

// Verify validates signature (RS256 only), issuer, audience and expiry, and
// returns the subject. Any failure is reported as domain.ErrInvalidToken.
func (s *RS256) Verify(token string) (string, error) {
	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(token, claims,
		func(*jwt.Token) (any, error) { return &s.key.PublicKey, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodRS256.Alg()}),
		jwt.WithIssuer(s.issuer),
		jwt.WithAudience(s.audience),
		jwt.WithExpirationRequired(),
	)
	if err != nil || claims.Subject == "" {
		return "", domain.ErrInvalidToken
	}
	return claims.Subject, nil
}

func parseRSAPrivateKey(p string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(p))
	if block == nil {
		return nil, errors.New("rs256: private key is not valid PEM")
	}
	if k, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		rk, ok := k.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("rs256: private key is not RSA")
		}
		return rk, nil
	}
	k, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("rs256: parse private key: %w", err)
	}
	return k, nil
}
