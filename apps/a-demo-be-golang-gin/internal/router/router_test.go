package router_test

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/router"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

func TestUnitNewRouter(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ms := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	r := router.NewRouter(ms, jwtSvc, &config.Config{})
	if r == nil {
		t.Fatal("expected non-nil router")
	}
	// Verify health route works.
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Errorf("expected 200 for /health, got %d", w.Code)
	}
}
