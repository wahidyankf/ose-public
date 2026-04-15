package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

// RespondError maps a domain error to the appropriate HTTP response.
func RespondError(c *gin.Context, err error) {
	var de *domain.DomainError
	if errors.As(err, &de) {
		switch de.Code {
		case domain.ErrValidation:
			c.JSON(http.StatusBadRequest, gin.H{"message": de.Message, "field": de.Field})
		case domain.ErrNotFound:
			c.JSON(http.StatusNotFound, gin.H{"message": de.Message})
		case domain.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"message": de.Message})
		case domain.ErrConflict:
			c.JSON(http.StatusConflict, gin.H{"message": de.Message})
		case domain.ErrUnauthorized:
			c.JSON(http.StatusUnauthorized, gin.H{"message": de.Message})
		case domain.ErrFileTooLarge:
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"message": de.Message})
		case domain.ErrUnsupportedMediaType:
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"message": de.Message})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		}
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
}
