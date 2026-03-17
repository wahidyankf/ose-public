package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	openapi_types "github.com/oapi-codegen/runtime/types"
	"golang.org/x/crypto/bcrypt"

	contracts "github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/generated-contracts"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

// domainUserToContract converts a domain.User to contracts.User.
func domainUserToContract(user *domain.User) contracts.User {
	return contracts.User{
		Id:          user.ID,
		Username:    user.Username,
		Email:       openapi_types.Email(user.Email),
		DisplayName: user.DisplayName,
		Status:      contracts.UserStatus(user.Status),
		Roles:       []string{string(user.Role)},
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}

// GetProfile handles GET /api/v1/users/me.
func (h *Handler) GetProfile(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	// Check whether the access token has been blacklisted (e.g. after logout).
	// This replicates the middleware guard for callers that invoke the handler
	// directly without going through the router (e.g. integration tests).
	blacklisted, err := h.store.IsAccessTokenBlacklisted(context.Background(), claims.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	if blacklisted {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "token has been revoked"})
		return
	}
	user, err := h.store.GetUserByID(c.Request.Context(), claims.Subject)
	if err != nil {
		RespondError(c, err)
		return
	}
	// Reject access if the account has been disabled or deactivated.
	if user.Status != domain.StatusActive {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "account is not active"})
		return
	}
	c.JSON(http.StatusOK, domainUserToContract(user))
}

// UpdateProfile handles PATCH /api/v1/users/me.
func (h *Handler) UpdateProfile(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var req contracts.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	user, err := h.store.GetUserByID(c.Request.Context(), claims.Subject)
	if err != nil {
		RespondError(c, err)
		return
	}
	user.DisplayName = req.DisplayName
	user.UpdatedAt = time.Now()
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusOK, domainUserToContract(user))
}

// ChangePassword handles POST /api/v1/users/me/password.
func (h *Handler) ChangePassword(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var req contracts.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	user, err := h.store.GetUserByID(c.Request.Context(), claims.Subject)
	if err != nil {
		RespondError(c, err)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	user.PasswordHash = string(hash)
	user.UpdatedAt = time.Now()
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password changed"})
}

// Deactivate handles POST /api/v1/users/me/deactivate.
func (h *Handler) Deactivate(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	user, err := h.store.GetUserByID(c.Request.Context(), claims.Subject)
	if err != nil {
		RespondError(c, err)
		return
	}
	user.Status = domain.StatusInactive
	user.UpdatedAt = time.Now()
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		RespondError(c, err)
		return
	}
	// Revoke all tokens.
	if err := h.store.RevokeAllRefreshTokensForUser(c.Request.Context(), user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "account deactivated"})
}
