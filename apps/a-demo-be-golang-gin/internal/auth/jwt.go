// Package auth provides JWT token management and HTTP middleware for authentication
// and authorization in the a-demo-be-golang-gin application.
package auth

import (
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

const (
	accessTokenDuration  = 15 * time.Minute
	refreshTokenDuration = 7 * 24 * time.Hour
	issuer               = "a-demo-be-golang-gin"
)

// Claims holds the JWT payload fields.
type Claims struct {
	jwt.RegisteredClaims
	Username string `json:"username"`
	Role     string `json:"role"`
}

// JWTService handles JWT generation and validation.
type JWTService struct {
	secret []byte
}

// NewJWTService creates a new JWTService with the given secret.
func NewJWTService(secret string) *JWTService {
	return &JWTService{secret: []byte(secret)}
}

// GenerateAccessToken generates a short-lived access token for the user.
func (s *JWTService) GenerateAccessToken(u *domain.User) (string, string, time.Time, error) {
	jti := uuid.New().String()
	exp := time.Now().Add(accessTokenDuration)
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID,
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(exp),
			ID:        jti,
		},
		Username: u.Username,
		Role:     string(u.Role),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return "", "", time.Time{}, fmt.Errorf("signing access token: %w", err)
	}
	return signed, jti, exp, nil
}

// GenerateRefreshToken generates a long-lived refresh token string.
func (s *JWTService) GenerateRefreshToken(u *domain.User) (string, time.Time, error) {
	jti := uuid.New().String()
	exp := time.Now().Add(refreshTokenDuration)
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID,
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(exp),
			ID:        jti,
		},
		Username: u.Username,
		Role:     string(u.Role),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("signing refresh token: %w", err)
	}
	return signed, exp, nil
}

// ValidateToken validates a JWT string and returns its claims.
func (s *JWTService) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, domain.NewUnauthorizedError("invalid or expired token")
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, domain.NewUnauthorizedError("invalid token claims")
	}
	return claims, nil
}

// JWKS returns a JWKS-compatible representation for the HMAC key.
// Since HMAC is symmetric, we expose a synthetic octet-sequence key.
func (s *JWTService) JWKS() map[string]interface{} {
	keyID := "default"
	encoded := base64.RawURLEncoding.EncodeToString(s.secret)
	return map[string]interface{}{
		"keys": []map[string]interface{}{
			{
				"kty": "oct",
				"kid": keyID,
				"alg": "HS256",
				"use": "sig",
				"k":   encoded,
			},
		},
	}
}
