package http

import (
	"context"
	"encoding/json"

	"github.com/gofiber/fiber/v3"

	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/shared/httperror"
)

// Factorizer is the inbound port used by the handler; the FactorizeMatrix
// use case satisfies it.
type Factorizer interface {
	Execute(ctx context.Context, cmd application.FactorizeCommand) (application.FactorizeResult, error)
}

// Handler exposes the factorization use case over HTTP.
type Handler struct{ uc Factorizer }

// NewHandler builds the handler.
func NewHandler(uc Factorizer) *Handler { return &Handler{uc: uc} }

// Factorize serves POST /api/v1/factorizations. It passes the request
// context (which may carry the bearer token) down to the use case.
func (h *Handler) Factorize(c fiber.Ctx) error {
	var req factorizeRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return httperror.Validation("malformed JSON body")
	}
	if req.Matrix == nil {
		return httperror.Validation("field matrix is required")
	}
	res, err := h.uc.Execute(c.Context(), toCommand(req))
	if err != nil {
		return toAppError(err)
	}
	return c.JSON(toResponse(res))
}
