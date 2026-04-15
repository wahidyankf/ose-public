package handler

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	contracts "github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/generated-contracts"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

// ListUsers handles GET /api/v1/admin/users.
func (h *Handler) ListUsers(c *gin.Context) {
	search := c.Query("search")
	pageStr := c.DefaultQuery("page", "0")
	sizeStr := c.DefaultQuery("size", "20")
	page, _ := strconv.Atoi(pageStr)
	size, _ := strconv.Atoi(sizeStr)
	if page < 0 {
		page = 0
	}
	if size < 1 {
		size = 20
	}
	q := store.ListUsersQuery{Search: search, Page: page, Size: size}
	users, total, err := h.store.ListUsers(c.Request.Context(), q)
	if err != nil {
		RespondError(c, err)
		return
	}
	content := make([]contracts.User, 0, len(users))
	for _, u := range users {
		content = append(content, domainUserToContract(u))
	}
	totalPages := int(math.Ceil(float64(total) / float64(size)))
	c.JSON(http.StatusOK, contracts.UserListResponse{
		Content:       content,
		TotalElements: int(total),
		TotalPages:    totalPages,
		Page:          page,
		Size:          size,
	})
}

// DisableUser handles POST /api/v1/admin/users/:id/disable.
func (h *Handler) DisableUser(c *gin.Context) {
	id := c.Param("id")
	var req contracts.DisableRequest
	_ = c.ShouldBindJSON(&req)
	user, err := h.store.GetUserByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	user.Status = domain.StatusDisabled
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
	c.JSON(http.StatusOK, gin.H{"message": "user disabled", "status": user.Status})
}

// EnableUser handles POST /api/v1/admin/users/:id/enable.
func (h *Handler) EnableUser(c *gin.Context) {
	id := c.Param("id")
	user, err := h.store.GetUserByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	user.Status = domain.StatusActive
	user.UpdatedAt = time.Now()
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user enabled", "status": user.Status})
}

// UnlockUser handles POST /api/v1/admin/users/:id/unlock.
func (h *Handler) UnlockUser(c *gin.Context) {
	id := c.Param("id")
	user, err := h.store.GetUserByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	user.Status = domain.StatusActive
	user.FailedLoginAttempts = 0
	user.UpdatedAt = time.Now()
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user unlocked", "status": user.Status})
}

// ForcePasswordReset handles POST /api/v1/admin/users/:id/force-password-reset.
func (h *Handler) ForcePasswordReset(c *gin.Context) {
	id := c.Param("id")
	_, err := h.store.GetUserByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	resetToken := uuid.New().String()
	c.JSON(http.StatusOK, contracts.PasswordResetResponse{Token: resetToken})
}
