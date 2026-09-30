package infrastructure

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"qrchallenge/go-api/internal/auth/domain"
)

func newKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	k, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	return k
}

func pkcs8PEM(t *testing.T, k *rsa.PrivateKey) string {
	t.Helper()
	der, err := x509.MarshalPKCS8PrivateKey(k)
	if err != nil {
		t.Fatal(err)
	}
	return string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: der}))
}

func newSvc(t *testing.T, k *rsa.PrivateKey, ttl time.Duration) *RS256 {
	t.Helper()
	s, err := NewRS256(pkcs8PEM(t, k), "iss", "aud", ttl)
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestIssueThenVerify(t *testing.T) {
	s := newSvc(t, newKey(t), time.Minute)
	tok, err := s.Issue("admin")
	if err != nil || tok.ExpiresIn != time.Minute {
		t.Fatalf("tok=%+v err=%v", tok, err)
	}
	sub, err := s.Verify(tok.Value)
	if err != nil || sub != "admin" {
		t.Fatalf("sub=%q err=%v", sub, err)
	}
}

func TestParsesPKCS1(t *testing.T) {
	k := newKey(t)
	p := string(pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(k)}))
	if _, err := NewRS256(p, "i", "a", time.Minute); err != nil {
		t.Fatal(err)
	}
}

func TestRejectsGarbageKey(t *testing.T) {
	if _, err := NewRS256("not pem", "i", "a", time.Minute); err == nil {
		t.Fatal("expected error")
	}
}

func TestVerifyRejects(t *testing.T) {
	k := newKey(t)
	s := newSvc(t, k, time.Minute)
	sign := func(m jwt.SigningMethod, key any, c jwt.RegisteredClaims) string {
		out, err := jwt.NewWithClaims(m, c).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return out
	}
	now := time.Now()
	valid := jwt.RegisteredClaims{Issuer: "iss", Audience: jwt.ClaimStrings{"aud"}, Subject: "u",
		IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(time.Minute))}
	expired := valid
	expired.ExpiresAt = jwt.NewNumericDate(now.Add(-time.Hour))
	badIss := valid
	badIss.Issuer = "other"
	badAud := valid
	badAud.Audience = jwt.ClaimStrings{"other"}
	noSub := valid
	noSub.Subject = ""
	tests := map[string]string{
		"garbage":              "abc.def.ghi",
		"expired":              sign(jwt.SigningMethodRS256, k, expired),
		"wrong issuer":         sign(jwt.SigningMethodRS256, k, badIss),
		"wrong aud":            sign(jwt.SigningMethodRS256, k, badAud),
		"no subject":           sign(jwt.SigningMethodRS256, k, noSub),
		"other key":            sign(jwt.SigningMethodRS256, newKey(t), valid),
		"hmac (alg confusion)": sign(jwt.SigningMethodHS256, []byte("x"), valid),
		"alg none":             sign(jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType, valid),
	}
	for name, tok := range tests {
		t.Run(name, func(t *testing.T) {
			if _, err := s.Verify(tok); !errors.Is(err, domain.ErrInvalidToken) {
				t.Fatalf("err = %v, want ErrInvalidToken", err)
			}
		})
	}
}
