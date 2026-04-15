package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

// ContextKey is used for storing values in gin context.
type ContextKey string

const (
	// ClaimsKey is the key used to store JWT claims in the Gin context.
	ClaimsKey ContextKey = "claims"
)

// JWTMiddleware creates a Gin middleware that validates Bearer JWT tokens.
func JWTMiddleware(jwtSvc *JWTService, st store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing or invalid authorization header"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := jwtSvc.ValidateToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid or expired token"})
			return
		}
		// Check if access token is blacklisted.
		blacklisted, err := st.IsAccessTokenBlacklisted(context.Background(), claims.ID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}
		if blacklisted {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "token has been revoked"})
			return
		}
		// Check user status.
		user, err := st.GetUserByID(context.Background(), claims.Subject)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "user not found"})
			return
		}
		if user.Status != "ACTIVE" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "account is not active"})
			return
		}
		c.Set(string(ClaimsKey), claims)
		c.Next()
	}
}
