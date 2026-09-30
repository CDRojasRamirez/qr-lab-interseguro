package infrastructure

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/gofiber/fiber/v3"

	"qrchallenge/go-api/internal/auth/domain"
	"qrchallenge/go-api/internal/shared/httperror"
)

// Authenticator is the inbound port consumed by LoginHandler; the Login use
// case satisfies it.
type Authenticator interface {
	Execute(ctx context.Context, c domain.Credentials) (domain.Token, error)
}

// LoginHandler exposes POST /api/v1/auth/login.
type LoginHandler struct{ auth Authenticator }

// NewLoginHandler builds the handler.
func NewLoginHandler(a Authenticator) *LoginHandler { return &LoginHandler{auth: a} }

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type loginResponse struct {
	AccessToken string `json:"accessToken"`
	TokenType   string `json:"tokenType"`
	ExpiresIn   int64  `json:"expiresIn"`
}

// Login validates the body, runs the use case and renders the token.
func (h *LoginHandler) Login(c fiber.Ctx) error {
	var req loginRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return httperror.Validation("malformed JSON body")
	}
	if req.Username == "" || req.Password == "" {
		return httperror.Validation("username and password are required")
	}
	tok, err := h.auth.Execute(c.Context(), domain.Credentials{Username: req.Username, Password: req.Password})
	if errors.Is(err, domain.ErrInvalidCredentials) {
		return httperror.Unauthorized("invalid credentials")
	}
	if err != nil {
		return err
	}
	return c.JSON(loginResponse{
		AccessToken: tok.Value,
		TokenType:   "Bearer",
		ExpiresIn:   int64(tok.ExpiresIn.Seconds()),
	})
}
