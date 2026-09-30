// Command api is the composition root of the Go API: it only builds and
// wires the object graph, then runs the server with graceful shutdown.
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"

	authapp "qrchallenge/go-api/internal/auth/application"
	authinfra "qrchallenge/go-api/internal/auth/infrastructure"
	"qrchallenge/go-api/internal/factorization/application"
	"qrchallenge/go-api/internal/factorization/domain"
	fhttp "qrchallenge/go-api/internal/factorization/infrastructure/http"
	"qrchallenge/go-api/internal/factorization/infrastructure/statsclient"
	"qrchallenge/go-api/internal/server"
	"qrchallenge/go-api/internal/shared/config"
	"qrchallenge/go-api/internal/shared/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		logger.New("error").Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	log := logger.New(cfg.LogLevel)
	slog.SetDefault(log)

	tokens, err := authinfra.NewRS256(cfg.JWTPrivateKeyPEM, cfg.JWTIssuer, cfg.JWTAudience, cfg.JWTTTL)
	if err != nil {
		log.Error("invalid JWT key", "error", err)
		os.Exit(1)
	}
	login := authapp.NewLogin(authinfra.NewStaticCredentials(cfg.AuthUsername, cfg.AuthPassword), tokens)

	stats := statsclient.New(cfg.StatsAPIURL, statsclient.NewHTTPClient(cfg.StatsTimeout))
	factorize := application.NewFactorizeMatrix(domain.NewGivensDecomposer(), stats)

	app := server.New(server.Dependencies{
		Log:            log,
		AllowedOrigins: cfg.AllowedOrigins,
		BodyLimit:      cfg.BodyLimit,
		Login:          authinfra.NewLoginHandler(login),
		Factorization:  fhttp.NewHandler(factorize),
		Tokens:         tokens,
	})
	app.Hooks().OnListen(func(d fiber.ListenData) error {
		log.Info("server started", "port", d.Port)
		return nil
	})

	serveErr := make(chan error, 1)
	go func() {
		serveErr <- app.Listen(":"+cfg.Port, fiber.ListenConfig{DisableStartupMessage: true})
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	select {
	case err := <-serveErr:
		log.Error("server stopped unexpectedly", "error", err)
		os.Exit(1)
	case <-stop:
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Error("graceful shutdown failed", "error", err)
	}
	log.Info("server stopped")
}
