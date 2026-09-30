package httperror

import (
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v3"
)

type envelope struct {
	Error payload `json:"error"`
}

type payload struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Details []string `json:"details"`
}

// ErrorHandler returns the Fiber error handler rendering the unified error
// body. It knows nothing about bounded contexts: those return *AppError.
// Unexpected errors are logged and never leaked to the client.
func ErrorHandler(log *slog.Logger) fiber.ErrorHandler {
	return func(c fiber.Ctx, err error) error {
		appErr := translate(err)
		if appErr.Status >= 500 {
			log.Error("request failed", "error", err, "path", c.Path(), "method", c.Method())
		}
		details := appErr.Details
		if details == nil {
			details = []string{}
		}
		return c.Status(appErr.Status).JSON(envelope{Error: payload{
			Code: appErr.Code, Message: appErr.Message, Details: details,
		}})
	}
}

func translate(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	var fe *fiber.Error
	if errors.As(err, &fe) {
		switch fe.Code {
		case fiber.StatusRequestEntityTooLarge:
			return New(fe.Code, CodePayloadTooLarge, "request body too large")
		case fiber.StatusNotFound:
			return New(fe.Code, CodeNotFound, "resource not found")
		case fiber.StatusMethodNotAllowed:
			return New(fe.Code, CodeMethodNotAllowed, "method not allowed")
		}
		if fe.Code >= 400 && fe.Code < 500 {
			return New(fe.Code, CodeValidation, fe.Message)
		}
		return New(fe.Code, CodeInternal, "internal server error")
	}
	return Internal()
}
