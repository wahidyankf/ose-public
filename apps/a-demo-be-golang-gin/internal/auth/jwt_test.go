package auth_test

import (
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func makeTestUser() *domain.User {
	return &domain.User{
		ID:       "test-user-id",
		Username: "testuser",
		Role:     domain.RoleUser,
	}
}

func TestUnitJWTGenerateAndValidateAccessToken(t *testing.T) {
	svc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	user := makeTestUser()
	token, jti, exp, err := svc.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}
	if token == "" {
		t.Error("expected non-empty token")
	}
	if jti == "" {
		t.Error("expected non-empty JTI")
	}
	if exp.Before(time.Now()) {
		t.Error("expected expiry in the future")
	}
	claims, err := svc.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.Subject != user.ID {
		t.Errorf("expected subject %s, got %s", user.ID, claims.Subject)
	}
	if claims.Username != user.Username {
		t.Errorf("expected username %s, got %s", user.Username, claims.Username)
	}
}

func TestUnitJWTGenerateAndValidateRefreshToken(t *testing.T) {
	svc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	user := makeTestUser()
	token, exp, err := svc.GenerateRefreshToken(user)
	if err != nil {
		t.Fatalf("GenerateRefreshToken failed: %v", err)
	}
	if token == "" {
		t.Error("expected non-empty token")
	}
	if exp.Before(time.Now()) {
		t.Error("expected expiry in the future")
	}
	claims, err := svc.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.Subject != user.ID {
		t.Errorf("expected subject %s, got %s", user.ID, claims.Subject)
	}
}

func TestUnitJWTValidateTokenInvalid(t *testing.T) {
	svc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	tests := []struct {
		name  string
		token string
	}{
		{"empty token", ""},
		{"malformed token", "not.a.token"},
		{"wrong signature", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.invalid"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.ValidateToken(tt.token)
			if err == nil {
				t.Error("expected error for invalid token")
			}
		})
	}
}

func TestUnitJWTWrongSigningKey(t *testing.T) {
	svc1 := auth.NewJWTService("secret1-at-least-32-chars-long-123")
	svc2 := auth.NewJWTService("secret2-at-least-32-chars-long-456")
	user := makeTestUser()
	token, _, _, err := svc1.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}
	_, err = svc2.ValidateToken(token)
	if err == nil {
		t.Error("expected error when validating with wrong key")
	}
}

func TestUnitJWKS(t *testing.T) {
	svc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	jwks := svc.JWKS()
	keys, ok := jwks["keys"]
	if !ok {
		t.Fatal("JWKS response does not contain 'keys'")
	}
	keySlice, ok := keys.([]map[string]interface{})
	if !ok || len(keySlice) == 0 {
		t.Fatal("JWKS 'keys' is empty or wrong type")
	}
}

func TestUnitAdminUser(t *testing.T) {
	svc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	admin := &domain.User{
		ID:       "admin-id",
		Username: "admin",
		Role:     domain.RoleAdmin,
	}
	token, _, _, err := svc.GenerateAccessToken(admin)
	if err != nil {
		t.Fatalf("GenerateAccessToken for admin failed: %v", err)
	}
	claims, err := svc.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.Role != "ADMIN" {
		t.Errorf("expected role ADMIN, got %s", claims.Role)
	}
}
