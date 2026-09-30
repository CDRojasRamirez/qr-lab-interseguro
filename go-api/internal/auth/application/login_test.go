package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"qrchallenge/go-api/internal/auth/domain"
)

type fakeVerifier struct {
	subject string
	err     error
	got     domain.Credentials
}

func (f *fakeVerifier) Verify(_ context.Context, c domain.Credentials) (string, error) {
	f.got = c
	return f.subject, f.err
}

type fakeIssuer struct {
	token domain.Token
	err   error
	got   string
}

func (f *fakeIssuer) Issue(subject string) (domain.Token, error) {
	f.got = subject
	return f.token, f.err
}

func TestLoginSuccess(t *testing.T) {
	v := &fakeVerifier{subject: "admin"}
	i := &fakeIssuer{token: domain.Token{Value: "jwt", ExpiresIn: time.Minute}}
	tok, err := NewLogin(v, i).Execute(context.Background(), domain.Credentials{Username: "admin", Password: "p"})
	if err != nil || tok.Value != "jwt" || i.got != "admin" || v.got.Password != "p" {
		t.Fatalf("tok=%+v err=%v issuedFor=%q", tok, err, i.got)
	}
}

func TestLoginInvalidCredentialsDoesNotIssue(t *testing.T) {
	v := &fakeVerifier{err: domain.ErrInvalidCredentials}
	i := &fakeIssuer{}
	_, err := NewLogin(v, i).Execute(context.Background(), domain.Credentials{})
	if !errors.Is(err, domain.ErrInvalidCredentials) || i.got != "" {
		t.Fatalf("err=%v issued=%q", err, i.got)
	}
}

func TestLoginIssuerFailure(t *testing.T) {
	boom := errors.New("boom")
	_, err := NewLogin(&fakeVerifier{subject: "a"}, &fakeIssuer{err: boom}).Execute(context.Background(), domain.Credentials{})
	if !errors.Is(err, boom) {
		t.Fatalf("err=%v", err)
	}
}
