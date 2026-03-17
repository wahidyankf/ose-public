package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

const maxFailedAttempts = 5

// RegisterRequest is the request body for user registration.
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest is the request body for login.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Register handles POST /api/v1/auth/register.
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if err := domain.ValidateUsername(req.Username); err != nil {
		RespondError(c, err)
		return
	}
	if err := domain.ValidateEmail(req.Email); err != nil {
		RespondError(c, err)
		return
	}
	if err := domain.ValidatePasswordStrength(req.Password); err != nil {
		RespondError(c, err)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	user := &domain.User{
		ID:           uuid.New().String(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		DisplayName:  req.Username,
		Status:       domain.StatusActive,
		Role:         domain.RoleUser,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := h.store.CreateUser(c.Request.Context(), user); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"id":           user.ID,
		"username":     user.Username,
		"email":        user.Email,
		"display_name": user.DisplayName,
		"status":       user.Status,
		"role":         user.Role,
	})
}

// Login handles POST /api/v1/auth/login.
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	user, err := h.store.GetUserByUsername(c.Request.Context(), req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}
	if user.Status == domain.StatusInactive {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account has been deactivated"})
		return
	}
	if user.Status == domain.StatusDisabled {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account has been disabled"})
		return
	}
	if user.Status == domain.StatusLocked {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account is locked"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		user.FailedAttempts++
		if user.FailedAttempts >= maxFailedAttempts {
			now := time.Now()
			user.Status = domain.StatusLocked
			user.LockedAt = &now
		}
		user.UpdatedAt = time.Now()
		_ = h.store.UpdateUser(c.Request.Context(), user)
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}
	// Reset failed attempts on successful login.
	user.FailedAttempts = 0
	user.LockedAt = nil
	user.UpdatedAt = time.Now()
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	accessToken, _, _, err := h.jwtSvc.GenerateAccessToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	refreshTokenStr, refreshExp, err := h.jwtSvc.GenerateRefreshToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	rt := &domain.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		TokenStr:  refreshTokenStr,
		ExpiresAt: refreshExp,
	}
	if err := h.store.SaveRefreshToken(c.Request.Context(), rt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshTokenStr,
		"tokenType":    "Bearer",
	})
}

// Refresh handles POST /api/v1/auth/refresh.
func (h *Handler) Refresh(c *gin.Context) {
	var body map[string]string
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	refreshTokenStr := body["refreshToken"]
	if refreshTokenStr == "" {
		// Try Authorization header.
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			refreshTokenStr = strings.TrimPrefix(header, "Bearer ")
		}
	}
	if refreshTokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "refresh token is required"})
		return
	}
	rt, err := h.store.GetRefreshToken(c.Request.Context(), refreshTokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid or expired refresh token"})
		return
	}
	// Check user status before validating token state so deactivated/disabled
	// users receive an informative message rather than a generic "invalid token".
	user, err := h.store.GetUserByID(c.Request.Context(), rt.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "user not found"})
		return
	}
	if user.Status == domain.StatusInactive {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account has been deactivated"})
		return
	}
	if user.Status == domain.StatusDisabled {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account has been disabled"})
		return
	}
	if user.Status != domain.StatusActive {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account has been deactivated"})
		return
	}
	if rt.Revoked {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
		return
	}
	if time.Now().After(rt.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "refresh token has expired"})
		return
	}
	// Revoke old refresh token.
	if err := h.store.RevokeRefreshToken(c.Request.Context(), refreshTokenStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	// Issue new tokens.
	accessToken, _, _, err := h.jwtSvc.GenerateAccessToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	newRefreshStr, refreshExp, err := h.jwtSvc.GenerateRefreshToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	newRT := &domain.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		TokenStr:  newRefreshStr,
		ExpiresAt: refreshExp,
	}
	if err := h.store.SaveRefreshToken(c.Request.Context(), newRT); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"accessToken":  accessToken,
		"refreshToken": newRefreshStr,
		"tokenType":    "Bearer",
	})
}

// Logout handles POST /api/v1/auth/logout.
func (h *Handler) Logout(c *gin.Context) {
	var body map[string]string
	_ = c.ShouldBindJSON(&body)
	refreshTokenStr := body["refreshToken"]
	if refreshTokenStr != "" {
		_ = h.store.RevokeRefreshToken(c.Request.Context(), refreshTokenStr)
	}
	// Blacklist the access token if provided.
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := h.jwtSvc.ValidateToken(tokenStr)
		if err == nil {
			exp := claims.ExpiresAt.Time
			_ = h.store.BlacklistAccessToken(context.Background(), claims.ID, exp)
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// LogoutAll handles POST /api/v1/auth/logout-all (requires JWT middleware).
func (h *Handler) LogoutAll(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	if err := h.store.RevokeAllRefreshTokensForUser(c.Request.Context(), claims.Subject); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	// Also blacklist the current access token.
	exp := claims.ExpiresAt.Time
	_ = h.store.BlacklistAccessToken(context.Background(), claims.ID, exp)
	c.JSON(http.StatusOK, gin.H{"message": "all sessions logged out"})
}
