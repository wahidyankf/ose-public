package handler_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/handler"
)

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

func TestUnitRespondError(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
	}{
		{"validation error", domain.NewValidationError("bad input", "field"), http.StatusBadRequest},
		{"not found error", domain.NewNotFoundError("not found"), http.StatusNotFound},
		{"forbidden error", domain.NewForbiddenError("forbidden"), http.StatusForbidden},
		{"conflict error", domain.NewConflictError("conflict"), http.StatusConflict},
		{"unauthorized error", domain.NewUnauthorizedError("unauthorized"), http.StatusUnauthorized},
		{"file too large error", domain.NewFileTooLargeError("too big"), http.StatusRequestEntityTooLarge},
		{"unsupported media type error", domain.NewUnsupportedMediaTypeError("bad type"), http.StatusUnsupportedMediaType},
		{"generic error", &domain.DomainError{Code: domain.DomainErrorCode(999), Message: "unknown"}, http.StatusInternalServerError},
		{"plain error", fmt.Errorf("some error"), http.StatusInternalServerError},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := setupRouter()
			r.GET("/test", func(c *gin.Context) {
				handler.RespondError(c, tt.err)
			})
			req := httptest.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("expected status %d, got %d; body: %s", tt.wantStatus, w.Code, w.Body.String())
			}
			var body map[string]interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Errorf("response is not valid JSON: %v", err)
			}
		})
	}
}
