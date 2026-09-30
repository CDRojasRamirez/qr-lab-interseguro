package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv("JWT_PRIVATE_KEY", "KEY")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Port != "8080" || cfg.JWTIssuer != "qr-go-api" || cfg.JWTAudience != "qr-challenge" {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
	if cfg.JWTTTL != 15*time.Minute || cfg.BodyLimit != 512*1024 {
		t.Fatalf("unexpected ttl/body limit: %+v", cfg)
	}
	if len(cfg.AllowedOrigins) != 1 || cfg.AllowedOrigins[0] != "http://localhost:4200" {
		t.Fatalf("origins = %v", cfg.AllowedOrigins)
	}
}

func TestLoadInlineKeyUnescapesNewlines(t *testing.T) {
	t.Setenv("JWT_PRIVATE_KEY", `A\nB`)
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.JWTPrivateKeyPEM != "A\nB" {
		t.Fatalf("got %q", cfg.JWTPrivateKeyPEM)
	}
}

func TestLoadKeyFromPath(t *testing.T) {
	p := filepath.Join(t.TempDir(), "private.pem")
	if err := os.WriteFile(p, []byte("FROMFILE"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("JWT_PRIVATE_KEY", "")
	t.Setenv("JWT_PRIVATE_KEY_PATH", p)
	cfg, err := Load()
	if err != nil || cfg.JWTPrivateKeyPEM != "FROMFILE" {
		t.Fatalf("got %q, %v", cfg.JWTPrivateKeyPEM, err)
	}
}

func TestLoadMissingKeyFails(t *testing.T) {
	t.Setenv("JWT_PRIVATE_KEY", "")
	t.Setenv("JWT_PRIVATE_KEY_PATH", "")
	if _, err := Load(); err == nil {
		t.Fatal("expected error for missing key")
	}
}

func TestLoadUnreadableKeyPathFails(t *testing.T) {
	t.Setenv("JWT_PRIVATE_KEY", "")
	t.Setenv("JWT_PRIVATE_KEY_PATH", filepath.Join(t.TempDir(), "nope.pem"))
	if _, err := Load(); err == nil {
		t.Fatal("expected error for unreadable key path")
	}
}

func TestLoadOriginsList(t *testing.T) {
	t.Setenv("JWT_PRIVATE_KEY", "K")
	t.Setenv("ALLOWED_ORIGINS", "http://a.com, http://b.com ,")
	cfg, _ := Load()
	if len(cfg.AllowedOrigins) != 2 || cfg.AllowedOrigins[1] != "http://b.com" {
		t.Fatalf("origins = %v", cfg.AllowedOrigins)
	}
}
