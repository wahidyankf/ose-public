package auth_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

func newMiddlewareTestRouter(ms *store.MemoryStore, jwtSvc *auth.JWTService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", auth.JWTMiddleware(jwtSvc, ms), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.GET("/admin-only", auth.JWTMiddleware(jwtSvc, ms), auth.AdminMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func makeTestUserInStore(ms *store.MemoryStore, id, username string, role domain.Role, status domain.UserStatus) {
	u := &domain.User{
		ID:           id,
		Username:     username,
		Email:        username + "@example.com",
		PasswordHash: "hash",
		Status:       status,
		Role:         role,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	_ = ms.CreateUser(context.Background(), u)
}

func TestUnitJWTMiddleware(t *testing.T) {
	ms := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	r := newMiddlewareTestRouter(ms, jwtSvc)

	// No Authorization header.
	req := httptest.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}

	// Non-Bearer header.
	req2 := httptest.NewRequest("GET", "/protected", nil)
	req2.Header.Set("Authorization", "Basic sometoken")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != 401 {
		t.Errorf("expected 401 for non-Bearer, got %d", w2.Code)
	}

	// Invalid token.
	req3 := httptest.NewRequest("GET", "/protected", nil)
	req3.Header.Set("Authorization", "Bearer invalid.token.here")
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != 401 {
		t.Errorf("expected 401 for invalid token, got %d", w3.Code)
	}

	// Valid token for active user.
	makeTestUserInStore(ms, "user1", "alice", domain.RoleUser, domain.StatusActive)
	user := &domain.User{ID: "user1", Username: "alice", Role: domain.RoleUser}
	token, _, _, err := jwtSvc.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}
	req4 := httptest.NewRequest("GET", "/protected", nil)
	req4.Header.Set("Authorization", "Bearer "+token)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	if w4.Code != 200 {
		t.Errorf("expected 200 for valid token, got %d", w4.Code)
	}

	// Blacklisted token.
	token2, jti2, exp2, _ := jwtSvc.GenerateAccessToken(user)
	_ = ms.BlacklistAccessToken(context.Background(), jti2, exp2)
	req5 := httptest.NewRequest("GET", "/protected", nil)
	req5.Header.Set("Authorization", "Bearer "+token2)
	w5 := httptest.NewRecorder()
	r.ServeHTTP(w5, req5)
	if w5.Code != 401 {
		t.Errorf("expected 401 for blacklisted token, got %d", w5.Code)
	}

	// Token for non-existent user.
	phantom := &domain.User{ID: "phantom-id", Username: "phantom", Role: domain.RoleUser}
	token3, _, _, _ := jwtSvc.GenerateAccessToken(phantom)
	req6 := httptest.NewRequest("GET", "/protected", nil)
	req6.Header.Set("Authorization", "Bearer "+token3)
	w6 := httptest.NewRecorder()
	r.ServeHTTP(w6, req6)
	if w6.Code != 401 {
		t.Errorf("expected 401 for non-existent user, got %d", w6.Code)
	}

	// Token for inactive user.
	makeTestUserInStore(ms, "user2", "inactiveuser", domain.RoleUser, domain.StatusInactive)
	inactiveUser := &domain.User{ID: "user2", Username: "inactiveuser", Role: domain.RoleUser}
	token4, _, _, _ := jwtSvc.GenerateAccessToken(inactiveUser)
	req7 := httptest.NewRequest("GET", "/protected", nil)
	req7.Header.Set("Authorization", "Bearer "+token4)
	w7 := httptest.NewRecorder()
	r.ServeHTTP(w7, req7)
	if w7.Code != 401 {
		t.Errorf("expected 401 for inactive user, got %d", w7.Code)
	}
}

func TestUnitAdminMiddleware(t *testing.T) {
	ms := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService("test-secret-at-least-32-chars-long")
	r := newMiddlewareTestRouter(ms, jwtSvc)

	// Regular user trying to access admin route.
	makeTestUserInStore(ms, "user1", "regularuser", domain.RoleUser, domain.StatusActive)
	user := &domain.User{ID: "user1", Username: "regularuser", Role: domain.RoleUser}
	token, _, _, _ := jwtSvc.GenerateAccessToken(user)
	req := httptest.NewRequest("GET", "/admin-only", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 403 {
		t.Errorf("expected 403 for regular user, got %d", w.Code)
	}

	// Admin user.
	makeTestUserInStore(ms, "admin1", "adminuser", domain.RoleAdmin, domain.StatusActive)
	admin := &domain.User{ID: "admin1", Username: "adminuser", Role: domain.RoleAdmin}
	adminToken, _, _, _ := jwtSvc.GenerateAccessToken(admin)
	req2 := httptest.NewRequest("GET", "/admin-only", nil)
	req2.Header.Set("Authorization", "Bearer "+adminToken)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != 200 {
		t.Errorf("expected 200 for admin user, got %d", w2.Code)
	}
}

// TestUnitAdminMiddlewareNoClaims tests AdminMiddleware with no claims in context.
func TestUnitAdminMiddlewareNoClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	// Apply admin middleware without JWT middleware (no claims set).
	r.GET("/admin-only", auth.AdminMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	req := httptest.NewRequest("GET", "/admin-only", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 401 {
		t.Errorf("expected 401 for no claims, got %d", w.Code)
	}
}

// TestUnitAdminMiddlewareWrongClaimsType tests with wrong claims type.
func TestUnitAdminMiddlewareWrongClaimsType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin-only", func(c *gin.Context) {
		// Set wrong type for claims.
		c.Set(string(auth.ClaimsKey), "wrong-type")
		c.Next()
	}, auth.AdminMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	req := httptest.NewRequest("GET", "/admin-only", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 401 {
		t.Errorf("expected 401 for wrong claims type, got %d", w.Code)
	}
}
