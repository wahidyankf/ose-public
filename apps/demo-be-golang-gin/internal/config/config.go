// Package config loads and provides application configuration from environment variables.
package config

import "os"

// Config holds the application configuration loaded from environment variables.
type Config struct {
	Port          string
	JWTSecret     string
	DatabaseURL   string
	EnableTestAPI bool
}

// Load reads configuration from environment variables with defaults.
func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8201"
	}
	jwtSecret := os.Getenv("APP_JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-jwt-secret-at-least-32-chars-long"
	}
	databaseURL := os.Getenv("DATABASE_URL")
	enableTestAPI := os.Getenv("ENABLE_TEST_API") == "true"
	return &Config{
		Port:          port,
		JWTSecret:     jwtSecret,
		DatabaseURL:   databaseURL,
		EnableTestAPI: enableTestAPI,
	}
}
