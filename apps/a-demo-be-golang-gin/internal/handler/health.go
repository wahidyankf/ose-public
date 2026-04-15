package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	contracts "github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/generated-contracts"
)

// Health handles GET /health.
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, contracts.HealthResponse{Status: "UP"})
}
