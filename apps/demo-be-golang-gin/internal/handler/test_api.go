// Package handler provides HTTP request handlers for the demo-be-golang-gin REST API,
// including authentication, expense management, attachments, and admin operations.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ResetDB handles POST /api/v1/test/reset-db.
// It deletes all user-created data and is only available when ENABLE_TEST_API=true.
func (h *Handler) ResetDB(c *gin.Context) {
	if err := h.store.ResetDB(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Database reset successful"})
}

// PromoteAdmin handles POST /api/v1/test/promote-admin.
// It sets the role of the given username to "ADMIN" and is only available when ENABLE_TEST_API=true.
func (h *Handler) PromoteAdmin(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username required"})
		return
	}
	if err := h.store.PromoteToAdmin(c.Request.Context(), body.Username); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User " + body.Username + " promoted to ADMIN"})
}
