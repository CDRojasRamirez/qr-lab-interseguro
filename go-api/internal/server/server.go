// Package server builds the Fiber application: middleware chain, routes and
// error handling. It only wires adapters injected through Dependencies.
package server

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/gofiber/fiber/v3/middleware/requestid"

	authdomain "qrchallenge/go-api/internal/auth/domain"
	authinfra "qrchallenge/go-api/internal/auth/infrastructure"
	fhttp "qrchallenge/go-api/internal/factorization/infrastructure/http"
	"qrchallenge/go-api/internal/shared/httperror"
)

// Dependencies are the collaborators injected by the composition root.
type Dependencies struct {
	Log            *slog.Logger
	AllowedOrigins []string
	BodyLimit      int
	Login          *authinfra.LoginHandler
	Factorization  *fhttp.Handler
	Tokens         authdomain.TokenVerifier
}

// New builds the Fiber app with all middleware and routes registered.
func New(d Dependencies) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: httperror.ErrorHandler(d.Log),
		BodyLimit:    d.BodyLimit,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(requestLogger(d.Log))
	app.Use(cors.New(cors.Config{
		AllowOrigins: d.AllowedOrigins,
		AllowMethods: []string{fiber.MethodGet, fiber.MethodPost, fiber.MethodOptions},
		AllowHeaders: []string{fiber.HeaderAuthorization, fiber.HeaderContentType},
	}))

	app.Get("/health", func(c fiber.Ctx) error { return c.JSON(fiber.Map{"status": "ok"}) })
	app.Get("/openapi.yaml", serveSpec)
	app.Get("/docs", serveDocs)

	v1 := app.Group("/api/v1")
	v1.Post("/auth/login", d.Login.Login)
	v1.Post("/factorizations", authinfra.RequireJWT(d.Tokens), d.Factorization.Factorize)
	return app
}
