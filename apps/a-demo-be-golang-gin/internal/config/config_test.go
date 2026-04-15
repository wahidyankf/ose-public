package config_test

import (
	"os"
	"testing"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/config"
)

func mustUnsetenv(t *testing.T, key string) {
	t.Helper()
	if err := os.Unsetenv(key); err != nil {
		t.Fatalf("failed to unset %s: %v", key, err)
	}
}

func mustSetenv(t *testing.T, key, val string) {
	t.Helper()
	if err := os.Setenv(key, val); err != nil {
		t.Fatalf("failed to set %s: %v", key, err)
	}
}

func TestUnitConfigLoad(t *testing.T) {
	t.Run("defaults", func(t *testing.T) {
		mustUnsetenv(t, "PORT")
		mustUnsetenv(t, "APP_JWT_SECRET")
		mustUnsetenv(t, "DATABASE_URL")
		cfg := config.Load()
		if cfg.Port != "8201" {
			t.Errorf("expected default port 8201, got %s", cfg.Port)
		}
		if cfg.JWTSecret == "" {
			t.Error("expected default JWT secret to be non-empty")
		}
		if cfg.DatabaseURL != "" {
			t.Errorf("expected empty DATABASE_URL, got %s", cfg.DatabaseURL)
		}
	})

	t.Run("custom values", func(t *testing.T) {
		mustSetenv(t, "PORT", "9000")
		mustSetenv(t, "APP_JWT_SECRET", "my-secret")
		mustSetenv(t, "DATABASE_URL", "postgres://localhost/test")
		defer func() {
			mustUnsetenv(t, "PORT")
			mustUnsetenv(t, "APP_JWT_SECRET")
			mustUnsetenv(t, "DATABASE_URL")
		}()
		cfg := config.Load()
		if cfg.Port != "9000" {
			t.Errorf("expected port 9000, got %s", cfg.Port)
		}
		if cfg.JWTSecret != "my-secret" {
			t.Errorf("expected jwt secret 'my-secret', got %s", cfg.JWTSecret)
		}
		if cfg.DatabaseURL != "postgres://localhost/test" {
			t.Errorf("expected database URL, got %s", cfg.DatabaseURL)
		}
	})
}
