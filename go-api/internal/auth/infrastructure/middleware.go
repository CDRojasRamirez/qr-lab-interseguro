package infrastructure

import (
	"strings"

	"github.com/gofiber/fiber/v3"

	"qrchallenge/go-api/internal/auth/domain"
	"qrchallenge/go-api/internal/shared/httperror"
	"qrchallenge/go-api/internal/shared/requestctx"
)

// LocalSubject is the c.Locals key holding the authenticated subject.
const LocalSubject = "subject"

// RequireJWT returns a middleware that authenticates Bearer tokens. On success
// it stores the subject in Locals and the raw token in the request context
// (requestctx) so outbound adapters can forward it.
func RequireJWT(v domain.TokenVerifier) fiber.Handler {
	return func(c fiber.Ctx) error {
		token, ok := bearerFrom(c.Get(fiber.HeaderAuthorization))
		if !ok {
			return httperror.Unauthorized("missing or malformed bearer token")
		}
		subject, err := v.Verify(token)
		if err != nil {
			return httperror.Unauthorized("invalid or expired token")
		}
		c.Locals(LocalSubject, subject)
		c.SetContext(requestctx.WithBearerToken(c.Context(), token))
		return c.Next()
	}
}

func bearerFrom(header string) (string, bool) {
	scheme, token, found := strings.Cut(header, " ")
	token = strings.TrimSpace(token)
	if !found || !strings.EqualFold(scheme, "Bearer") || token == "" {
		return "", false
	}
	return token, true
}
