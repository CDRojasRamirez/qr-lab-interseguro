// Package config loads runtime configuration from environment variables.
package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
)

// Config holds the service settings.
type Config struct {
	Port         string
	StatsAPIURL  string
	StatsTimeout time.Duration
	LogLevel     string

	JWTIssuer        string
	JWTAudience      string
	JWTTTL           time.Duration
	JWTPrivateKeyPEM string

	// AuthUsername and AuthPassword are the demo credentials (see
	// auth/infrastructure.StaticCredentials).
	AuthUsername string
	AuthPassword string

	AllowedOrigins []string
	BodyLimit      int // bytes
}

// Load reads the environment applying defaults. It fails when no JWT private
// key is provided through JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH.
func Load() (Config, error) {
	key, err := loadPrivateKey()
	if err != nil {
		return Config{}, err
	}
	return Config{
		Port:             getenv("PORT", "8080"),
		StatsAPIURL:      getenv("STATS_API_URL", "http://localhost:3000"),
		StatsTimeout:     getDuration("STATS_TIMEOUT", 3*time.Second),
		LogLevel:         getenv("LOG_LEVEL", "info"),
		JWTIssuer:        getenv("JWT_ISSUER", "qr-go-api"),
		JWTAudience:      getenv("JWT_AUDIENCE", "qr-challenge"),
		JWTTTL:           getDuration("JWT_TTL", 15*time.Minute),
		JWTPrivateKeyPEM: key,
		AuthUsername:     getenv("AUTH_USERNAME", "admin"),
		AuthPassword:     getenv("AUTH_PASSWORD", "secret"),
		AllowedOrigins:   getList("ALLOWED_ORIGINS", []string{"http://localhost:4200"}),
		BodyLimit:        getInt("BODY_LIMIT", 512*1024),
	}, nil
}

// loadPrivateKey prefers the inline variable (accepting literal "\n" escapes)
// and falls back to the file named by JWT_PRIVATE_KEY_PATH.
func loadPrivateKey() (string, error) {
	if inline := os.Getenv("JWT_PRIVATE_KEY"); inline != "" {
		return strings.ReplaceAll(inline, `\n`, "\n"), nil
	}
	path := os.Getenv("JWT_PRIVATE_KEY_PATH")
	if path == "" {
		return "", errors.New("config: set JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("config: read JWT private key: %w", err)
	}
	return string(data), nil
}
