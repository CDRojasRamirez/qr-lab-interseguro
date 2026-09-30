package requestctx

import (
	"context"
	"testing"
)

func TestBearerTokenRoundTrip(t *testing.T) {
	ctx := WithBearerToken(context.Background(), "abc")
	got, ok := BearerToken(ctx)
	if !ok || got != "abc" {
		t.Fatalf("got (%q, %v), want (abc, true)", got, ok)
	}
}

func TestBearerTokenAbsent(t *testing.T) {
	if got, ok := BearerToken(context.Background()); ok || got != "" {
		t.Fatalf("got (%q, %v), want empty and false", got, ok)
	}
}
