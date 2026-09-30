// Package requestctx carries request-scoped credentials through
// context.Context, so inbound and outbound adapters can share them without
// depending on each other or on the web framework.
package requestctx

import "context"

type bearerKey struct{}

// WithBearerToken returns a context carrying the raw bearer token.
func WithBearerToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, bearerKey{}, token)
}

// BearerToken returns the raw bearer token stored in ctx, if any.
func BearerToken(ctx context.Context) (string, bool) {
	t, ok := ctx.Value(bearerKey{}).(string)
	return t, ok
}
