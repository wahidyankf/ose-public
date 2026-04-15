package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/handler"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/router"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

// errStore is a Store implementation that can inject errors for specific operations.
// getUserByIDCallCount tracks how many times GetUserByID has been called, so we can
// let the JWT middleware pass (which calls GetUserByID once) but fail on handler's call.
type errStore struct {
	inner                         store.Store
	getUserByIDErr                error
	getUserByIDCallCount          int
	getUserByIDErrAfter           int // fail after this many calls (0 = fail immediately)
	getUserByUsernameErr          error
	updateUserErr                 error
	updateUserCallCount           int
	updateUserErrAfter            int // fail after this many calls
	createUserErr                 error
	listUsersErr                  error
	saveRefreshTokenErr           error
	getRefreshTokenErr            error
	revokeRefreshTokenErr         error
	revokeAllRefreshTokensForUser error
	blacklistAccessTokenErr       error
	isAccessTokenBlacklistedErr   error
	createExpenseErr              error
	getExpenseByIDErr             error
	listExpensesErr               error
	updateExpenseErr              error
	deleteExpenseErr              error
	sumExpensesByCurrencyErr      error
	createAttachmentErr           error
	getAttachmentByIDErr          error
	listAttachmentsErr            error
	deleteAttachmentErr           error
	plReportErr                   error
	resetDBErr                    error
}

var errForced = errors.New("forced error")

func (s *errStore) CreateUser(ctx context.Context, u *domain.User) error {
	if s.createUserErr != nil {
		return s.createUserErr
	}
	return s.inner.CreateUser(ctx, u)
}

func (s *errStore) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	if s.getUserByUsernameErr != nil {
		return nil, s.getUserByUsernameErr
	}
	return s.inner.GetUserByUsername(ctx, username)
}

func (s *errStore) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	if s.getUserByIDErr != nil {
		s.getUserByIDCallCount++
		if s.getUserByIDCallCount > s.getUserByIDErrAfter {
			return nil, s.getUserByIDErr
		}
	}
	return s.inner.GetUserByID(ctx, id)
}

func (s *errStore) UpdateUser(ctx context.Context, u *domain.User) error {
	if s.updateUserErr != nil {
		s.updateUserCallCount++
		if s.updateUserCallCount > s.updateUserErrAfter {
			return s.updateUserErr
		}
	}
	return s.inner.UpdateUser(ctx, u)
}

func (s *errStore) ListUsers(ctx context.Context, q store.ListUsersQuery) ([]*domain.User, int64, error) {
	if s.listUsersErr != nil {
		return nil, 0, s.listUsersErr
	}
	return s.inner.ListUsers(ctx, q)
}

func (s *errStore) SaveRefreshToken(ctx context.Context, t *domain.RefreshToken) error {
	if s.saveRefreshTokenErr != nil {
		return s.saveRefreshTokenErr
	}
	return s.inner.SaveRefreshToken(ctx, t)
}

func (s *errStore) GetRefreshToken(ctx context.Context, tokenStr string) (*domain.RefreshToken, error) {
	if s.getRefreshTokenErr != nil {
		return nil, s.getRefreshTokenErr
	}
	return s.inner.GetRefreshToken(ctx, tokenStr)
}

func (s *errStore) RevokeRefreshToken(ctx context.Context, tokenStr string) error {
	if s.revokeRefreshTokenErr != nil {
		return s.revokeRefreshTokenErr
	}
	return s.inner.RevokeRefreshToken(ctx, tokenStr)
}

func (s *errStore) RevokeAllRefreshTokensForUser(ctx context.Context, userID string) error {
	if s.revokeAllRefreshTokensForUser != nil {
		return s.revokeAllRefreshTokensForUser
	}
	return s.inner.RevokeAllRefreshTokensForUser(ctx, userID)
}

func (s *errStore) BlacklistAccessToken(ctx context.Context, jti string, expiresAt time.Time) error {
	if s.blacklistAccessTokenErr != nil {
		return s.blacklistAccessTokenErr
	}
	return s.inner.BlacklistAccessToken(ctx, jti, expiresAt)
}

func (s *errStore) IsAccessTokenBlacklisted(ctx context.Context, jti string) (bool, error) {
	if s.isAccessTokenBlacklistedErr != nil {
		return false, s.isAccessTokenBlacklistedErr
	}
	return s.inner.IsAccessTokenBlacklisted(ctx, jti)
}

func (s *errStore) CreateExpense(ctx context.Context, e *domain.Expense) error {
	if s.createExpenseErr != nil {
		return s.createExpenseErr
	}
	return s.inner.CreateExpense(ctx, e)
}

func (s *errStore) GetExpenseByID(ctx context.Context, id string) (*domain.Expense, error) {
	if s.getExpenseByIDErr != nil {
		return nil, s.getExpenseByIDErr
	}
	return s.inner.GetExpenseByID(ctx, id)
}

func (s *errStore) ListExpenses(ctx context.Context, q store.ListExpensesQuery) ([]*domain.Expense, int64, error) {
	if s.listExpensesErr != nil {
		return nil, 0, s.listExpensesErr
	}
	return s.inner.ListExpenses(ctx, q)
}

func (s *errStore) UpdateExpense(ctx context.Context, e *domain.Expense) error {
	if s.updateExpenseErr != nil {
		return s.updateExpenseErr
	}
	return s.inner.UpdateExpense(ctx, e)
}

func (s *errStore) DeleteExpense(ctx context.Context, id string) error {
	if s.deleteExpenseErr != nil {
		return s.deleteExpenseErr
	}
	return s.inner.DeleteExpense(ctx, id)
}

func (s *errStore) SumExpensesByCurrency(ctx context.Context, userID string) ([]domain.CurrencySummary, error) {
	if s.sumExpensesByCurrencyErr != nil {
		return nil, s.sumExpensesByCurrencyErr
	}
	return s.inner.SumExpensesByCurrency(ctx, userID)
}

func (s *errStore) ExpenseSummaryByCurrency(ctx context.Context, userID string) ([]domain.ExpenseCurrencySummary, error) {
	return s.inner.ExpenseSummaryByCurrency(ctx, userID)
}

func (s *errStore) CreateAttachment(ctx context.Context, a *domain.Attachment) error {
	if s.createAttachmentErr != nil {
		return s.createAttachmentErr
	}
	return s.inner.CreateAttachment(ctx, a)
}

func (s *errStore) GetAttachmentByID(ctx context.Context, id string) (*domain.Attachment, error) {
	if s.getAttachmentByIDErr != nil {
		return nil, s.getAttachmentByIDErr
	}
	return s.inner.GetAttachmentByID(ctx, id)
}

func (s *errStore) ListAttachments(ctx context.Context, expenseID string) ([]*domain.Attachment, error) {
	if s.listAttachmentsErr != nil {
		return nil, s.listAttachmentsErr
	}
	return s.inner.ListAttachments(ctx, expenseID)
}

func (s *errStore) DeleteAttachment(ctx context.Context, id string) error {
	if s.deleteAttachmentErr != nil {
		return s.deleteAttachmentErr
	}
	return s.inner.DeleteAttachment(ctx, id)
}

func (s *errStore) PLReport(ctx context.Context, q store.PLReportQuery) (*domain.PLReport, error) {
	if s.plReportErr != nil {
		return nil, s.plReportErr
	}
	return s.inner.PLReport(ctx, q)
}

func (s *errStore) ResetDB(ctx context.Context) error {
	if s.resetDBErr != nil {
		return s.resetDBErr
	}
	return s.inner.ResetDB(ctx)
}

func (s *errStore) PromoteToAdmin(ctx context.Context, username string) error {
	return s.inner.PromoteToAdmin(ctx, username)
}

// bodyID extracts the "id" field from a response body, failing the test if not found.
func bodyID(t *testing.T, body map[string]interface{}) string {
	t.Helper()
	idVal, ok := body["id"].(string)
	if !ok {
		t.Fatal("expected 'id' field in response body")
	}
	return idVal
}

// newErrRouter creates a router with an errStore wrapping a real MemoryStore.
func newErrRouter(es *errStore) *gin.Engine {
	gin.SetMode(gin.TestMode)
	es.inner = store.NewMemoryStore()
	jwtSvc := auth.NewJWTService(testSecret)
	return router.NewRouter(es, jwtSvc, &config.Config{})
}

// newErrRouterWithTestAPI creates a router with EnableTestAPI enabled for testing test API handlers.
func newErrRouterWithTestAPI(es *errStore) *gin.Engine {
	gin.SetMode(gin.TestMode)
	es.inner = store.NewMemoryStore()
	jwtSvc := auth.NewJWTService(testSecret)
	return router.NewRouter(es, jwtSvc, &config.Config{EnableTestAPI: true})
}

const defaultErrStorePassword = "Str0ng#Pass1"

// registerAndLoginErrStore registers and logs in a user with an errStore router.
func registerAndLoginErrStore(t *testing.T, r *gin.Engine, username, email string) string {
	t.Helper()
	code, _ := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": username, "email": email, "password": defaultErrStorePassword,
	}, "")
	if code != 201 {
		t.Fatalf("registration failed with %d", code)
	}
	code2, body2 := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": username, "password": defaultErrStorePassword,
	}, "")
	if code2 != 200 {
		t.Fatalf("login failed with %d", code2)
	}
	token, ok := body2["accessToken"].(string)
	if !ok {
		t.Fatalf("accessToken not found in response")
	}
	return token
}

// TestUnitHandlerClaimsTypeErrors tests the !ok path for JWT claims type assertion.
func TestUnitHandlerClaimsTypeErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	jwtSvc := auth.NewJWTService(testSecret)
	ms := store.NewMemoryStore()
	h := handler.New(ms, jwtSvc)

	tests := []struct {
		name    string
		method  string
		path    string
		handler gin.HandlerFunc
	}{
		{"GetProfile no claims", "GET", "/test", h.GetProfile},
		{"UpdateProfile no claims", "PATCH", "/test", h.UpdateProfile},
		{"ChangePassword no claims", "POST", "/test", h.ChangePassword},
		{"Deactivate no claims", "POST", "/test", h.Deactivate},
		{"CreateExpense no claims", "POST", "/test", h.CreateExpense},
		{"GetExpense no claims", "GET", "/test", h.GetExpense},
		{"ListExpenses no claims", "GET", "/test", h.ListExpenses},
		{"UpdateExpense no claims", "PUT", "/test", h.UpdateExpense},
		{"DeleteExpense no claims", "DELETE", "/test", h.DeleteExpense},
		{"ExpenseSummary no claims", "GET", "/test", h.ExpenseSummary},
		{"UploadAttachment no claims", "POST", "/test", h.UploadAttachment},
		{"ListAttachments no claims", "GET", "/test", h.ListAttachments},
		{"DeleteAttachment no claims", "DELETE", "/test", h.DeleteAttachment},
		{"TokenClaims no claims", "GET", "/test", h.TokenClaims},
		{"LogoutAll no claims", "POST", "/test", h.LogoutAll},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			// Set wrong type for claims key to trigger !ok path.
			r.Handle(tt.method, "/test", func(c *gin.Context) {
				c.Set(string(auth.ClaimsKey), "wrong-type-string")
				c.Next()
			}, tt.handler)
			req := httptest.NewRequest(tt.method, "/test", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != http.StatusUnauthorized {
				t.Errorf("%s: expected 401, got %d; body: %s", tt.name, w.Code, w.Body.String())
			}
		})
	}
}

// TestUnitRefreshHandlerErrorPaths tests error paths in the Refresh handler.
func TestUnitRefreshHandlerErrorPaths(t *testing.T) {
	// Test Bearer header path for refresh_token.
	t.Run("refresh via Authorization header", func(t *testing.T) {
		r, _ := newTestRouter()
		_, refreshToken := registerAndLogin(t, r, "alice_refresh", "alice_refresh@example.com", "Str0ng#Pass1")

		req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader([]byte(`{}`)))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+refreshToken)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != 200 {
			t.Errorf("expected 200 for refresh via header, got %d; body: %s", w.Code, w.Body.String())
		}
	})

	// Test GetRefreshToken error (non-existent token).
	t.Run("non-existent refresh token", func(t *testing.T) {
		r, _ := newTestRouter()
		code, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
			"refreshToken": "nonexistent-token",
		}, "")
		if code != 401 {
			t.Errorf("expected 401 for non-existent token, got %d", code)
		}
	})

	// Test expired refresh token path.
	t.Run("expired refresh token", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		registerAndLoginErrStore(t, r, "alice_exp", "alice_exp@example.com")

		// Save a manually expired refresh token.
		expiredRT := &domain.RefreshToken{
			ID:        "expired-rt-id",
			UserID:    "some-user",
			TokenHash: "expired-token-str",
			ExpiresAt: time.Now().Add(-time.Hour), // already expired
		}
		_ = es.inner.SaveRefreshToken(context.Background(), expiredRT)

		code, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
			"refreshToken": "expired-token-str",
		}, "")
		if code != 401 {
			t.Errorf("expected 401 for expired token, got %d", code)
		}
	})

	// Test user not found during refresh.
	t.Run("user not found during refresh", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)

		// Save a valid refresh token pointing to non-existent user.
		validRT := &domain.RefreshToken{
			ID:        "orphan-rt-id",
			UserID:    "nonexistent-user",
			TokenHash: "orphan-token-str",
			ExpiresAt: time.Now().Add(time.Hour),
		}
		_ = es.inner.SaveRefreshToken(context.Background(), validRT)

		code, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
			"refreshToken": "orphan-token-str",
		}, "")
		if code != 401 {
			t.Errorf("expected 401 for user not found, got %d", code)
		}
	})

	// Test inactive user during refresh.
	t.Run("inactive user during refresh", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		_, refreshToken := registerAndLogin(t, r, "inactive_user", "inactive@example.com", "Str0ng#Pass1")

		// Deactivate the user.
		u, _ := es.inner.GetUserByUsername(context.Background(), "inactive_user")
		u.Status = domain.StatusInactive
		_ = es.inner.UpdateUser(context.Background(), u)

		code, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
			"refreshToken": refreshToken,
		}, "")
		if code != 401 {
			t.Errorf("expected 401 for inactive user, got %d", code)
		}
	})

	// Test RevokeRefreshToken error.
	t.Run("RevokeRefreshToken error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		_, refreshToken := registerAndLogin(t, r, "alice_revoke", "alice_revoke@example.com", "Str0ng#Pass1")

		es.revokeRefreshTokenErr = errForced
		code, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
			"refreshToken": refreshToken,
		}, "")
		if code != 500 {
			t.Errorf("expected 500 for RevokeRefreshToken error, got %d", code)
		}
	})

	// Test SaveRefreshToken error during refresh.
	t.Run("SaveRefreshToken error during refresh", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		_, refreshToken := registerAndLogin(t, r, "alice_save_err", "alice_save_err@example.com", "Str0ng#Pass1")

		es.saveRefreshTokenErr = errForced
		code, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
			"refreshToken": refreshToken,
		}, "")
		if code != 500 {
			t.Errorf("expected 500 for SaveRefreshToken error, got %d", code)
		}
	})
}

// TestUnitLogoutWithRefreshToken tests logout with a refresh_token in the body.
func TestUnitLogoutWithRefreshToken(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, refreshToken := registerAndLogin(t, r, "logout_user", "logout@example.com", "Str0ng#Pass1")

	code, _ := doReq(r, "POST", "/api/v1/auth/logout", map[string]string{
		"refreshToken": refreshToken,
	}, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}
}

// TestUnitLogoutAllRevokeError tests LogoutAll when RevokeAllRefreshTokensForUser fails.
func TestUnitLogoutAllRevokeError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	accessToken := registerAndLoginErrStore(t, r, "alice_la", "alice_la@example.com")

	es.revokeAllRefreshTokensForUser = errForced
	code, _ := doReq(r, "POST", "/api/v1/auth/logout-all", nil, accessToken)
	if code != 500 {
		t.Errorf("expected 500, got %d", code)
	}
}

// TestUnitGetProfileStoreError tests GetProfile when store.GetUserByID fails.
func TestUnitGetProfileStoreError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	accessToken := registerAndLoginErrStore(t, r, "alice_gp", "alice_gp@example.com")

	// Let JWT middleware's GetUserByID call pass (1 call), fail on 2nd call (handler's).
	es.getUserByIDErr = domain.NewNotFoundError("user not found")
	es.getUserByIDErrAfter = 1
	code, _ := doReq(r, "GET", "/api/v1/users/me", nil, accessToken)
	if code != 404 {
		t.Errorf("expected 404, got %d", code)
	}
}

// TestUnitUpdateProfileStoreError tests UpdateProfile when store fails.
func TestUnitUpdateProfileStoreError(t *testing.T) {
	t.Run("GetUserByID error in handler", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_up", "alice_up@example.com")

		// Let JWT middleware's GetUserByID call pass (1 call), fail on 2nd (handler's).
		es.getUserByIDErr = domain.NewNotFoundError("not found")
		es.getUserByIDErrAfter = 1
		code, _ := doReq(r, "PATCH", "/api/v1/users/me", map[string]string{"displayName": "New Name"}, accessToken)
		if code != 404 {
			t.Errorf("expected 404 for GetUserByID error, got %d", code)
		}
	})

	t.Run("UpdateUser error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_up2", "alice_up2@example.com")

		es.updateUserErr = errForced
		code2, _ := doReq(r, "PATCH", "/api/v1/users/me", map[string]string{"displayName": "New Name"}, accessToken)
		if code2 != 500 {
			t.Errorf("expected 500 for UpdateUser error, got %d", code2)
		}
	})
}

// TestUnitChangePasswordStoreError tests ChangePassword when store fails.
func TestUnitChangePasswordStoreError(t *testing.T) {
	t.Run("GetUserByID error in handler", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_cp", "alice_cp@example.com")

		// Let JWT middleware's call pass (1), fail on 2nd (handler's).
		es.getUserByIDErr = domain.NewNotFoundError("not found")
		es.getUserByIDErrAfter = 1
		code, _ := doReq(r, "POST", "/api/v1/users/me/password", map[string]string{
			"oldPassword": "Str0ng#Pass1", "newPassword": "NewPass#456",
		}, accessToken)
		if code != 404 {
			t.Errorf("expected 404 for GetUserByID error, got %d", code)
		}
	})

	t.Run("UpdateUser error after password match", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_cp2", "alice_cp2@example.com")

		es.updateUserErr = errForced
		code2, _ := doReq(r, "POST", "/api/v1/users/me/password", map[string]string{
			"oldPassword": "Str0ng#Pass1", "newPassword": "NewPass#456",
		}, accessToken)
		if code2 != 500 {
			t.Errorf("expected 500 for UpdateUser error, got %d", code2)
		}
	})
}

// TestUnitDeactivateStoreError tests Deactivate when store fails.
func TestUnitDeactivateStoreError(t *testing.T) {
	t.Run("GetUserByID error in handler", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_da", "alice_da@example.com")

		// Let JWT middleware's call pass (1), fail on 2nd (handler's).
		es.getUserByIDErr = domain.NewNotFoundError("not found")
		es.getUserByIDErrAfter = 1
		code, _ := doReq(r, "POST", "/api/v1/users/me/deactivate", nil, accessToken)
		if code != 404 {
			t.Errorf("expected 404 for GetUserByID error, got %d", code)
		}
	})

	t.Run("UpdateUser error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_da2", "alice_da2@example.com")

		es.updateUserErr = errForced
		code2, _ := doReq(r, "POST", "/api/v1/users/me/deactivate", nil, accessToken)
		if code2 != 500 {
			t.Errorf("expected 500 for UpdateUser error, got %d", code2)
		}
	})

	t.Run("RevokeAllRefreshTokensForUser error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_da3", "alice_da3@example.com")

		es.revokeAllRefreshTokensForUser = errForced
		code3, _ := doReq(r, "POST", "/api/v1/users/me/deactivate", nil, accessToken)
		if code3 != 500 {
			t.Errorf("expected 500 for RevokeAllRefreshTokensForUser error, got %d", code3)
		}
	})
}

// TestUnitExpenseStoreErrors tests expense handler error paths.
func TestUnitExpenseStoreErrors(t *testing.T) {
	t.Run("CreateExpense store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ce", "alice_ce@example.com")

		es.createExpenseErr = errForced
		code, _ := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		if code != 500 {
			t.Errorf("expected 500 for CreateExpense error, got %d", code)
		}
	})

	t.Run("GetExpense store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ge", "alice_ge@example.com")

		es.getExpenseByIDErr = domain.NewNotFoundError("not found")
		code, _ := doReq(r, "GET", "/api/v1/expenses/nonexistent", nil, accessToken)
		if code != 404 {
			t.Errorf("expected 404 for GetExpense error, got %d", code)
		}
	})

	t.Run("ListExpenses store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_le", "alice_le@example.com")

		es.listExpensesErr = errForced
		code, _ := doReq(r, "GET", "/api/v1/expenses", nil, accessToken)
		if code != 500 {
			t.Errorf("expected 500 for ListExpenses error, got %d", code)
		}
	})

	t.Run("UpdateExpense GetExpenseByID error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ue", "alice_ue@example.com")

		es.getExpenseByIDErr = domain.NewNotFoundError("not found")
		code, _ := doReq(r, "PUT", "/api/v1/expenses/nonexistent", map[string]interface{}{
			"amount": "20.00", "currency": "USD", "category": "food",
			"description": "Updated", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		if code != 404 {
			t.Errorf("expected 404 for UpdateExpense GetExpense error, got %d", code)
		}
	})

	t.Run("UpdateExpense UpdateExpense store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ue2", "alice_ue2@example.com")

		// Create expense first.
		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		es.updateExpenseErr = errForced
		code, _ := doReq(r, "PUT", "/api/v1/expenses/"+expID, map[string]interface{}{
			"amount": "20.00", "currency": "USD", "category": "food",
			"description": "Updated", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		if code != 500 {
			t.Errorf("expected 500 for UpdateExpense store error, got %d", code)
		}
	})

	t.Run("UpdateExpense invalid currency in body", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ue3", "alice_ue3@example.com")

		// Create expense first.
		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		// Update with bad currency.
		code, _ := doReq(r, "PUT", "/api/v1/expenses/"+expID, map[string]interface{}{
			"amount": "20.00", "currency": "EUR", "category": "food",
			"description": "Updated", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		if code != 400 {
			t.Errorf("expected 400 for invalid currency in update, got %d", code)
		}
	})

	t.Run("UpdateExpense negative amount in body", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ue4", "alice_ue4@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		code, _ := doReq(r, "PUT", "/api/v1/expenses/"+expID, map[string]interface{}{
			"amount": "-5.00", "currency": "USD", "category": "food",
			"description": "Updated", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		if code != 400 {
			t.Errorf("expected 400 for negative amount in update, got %d", code)
		}
	})

	t.Run("UpdateExpense invalid unit in body", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ue5", "alice_ue5@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		code, _ := doReq(r, "PUT", "/api/v1/expenses/"+expID, map[string]interface{}{
			"amount": "20.00", "currency": "USD", "category": "food",
			"description": "Updated", "date": "2025-01-15", "type": "expense",
			"unit": "fathom",
		}, accessToken)
		if code != 400 {
			t.Errorf("expected 400 for invalid unit in update, got %d", code)
		}
	})

	t.Run("DeleteExpense GetExpenseByID error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_de", "alice_de@example.com")

		es.getExpenseByIDErr = domain.NewNotFoundError("not found")
		code, _ := doReq(r, "DELETE", "/api/v1/expenses/nonexistent", nil, accessToken)
		if code != 404 {
			t.Errorf("expected 404, got %d", code)
		}
	})

	t.Run("DeleteExpense store delete error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_de2", "alice_de2@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		es.deleteExpenseErr = errForced
		code, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID, nil, accessToken)
		if code != 500 {
			t.Errorf("expected 500 for DeleteExpense store error, got %d", code)
		}
	})

	t.Run("ExpenseSummary store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_es", "alice_es@example.com")

		es.sumExpensesByCurrencyErr = errForced
		code, _ := doReq(r, "GET", "/api/v1/expenses/summary", nil, accessToken)
		if code != 500 {
			t.Errorf("expected 500, got %d", code)
		}
	})
}

// TestUnitAttachmentStoreErrors tests attachment handler error paths.
func TestUnitAttachmentStoreErrors(t *testing.T) {
	t.Run("UploadAttachment GetExpenseByID error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ua", "alice_ua@example.com")

		es.getExpenseByIDErr = domain.NewNotFoundError("not found")
		var buf bytes.Buffer
		w := multipartFile(&buf, []byte("data"))
		req := httptest.NewRequest("POST", "/api/v1/expenses/nonexistent/attachments", &buf)
		req.Header.Set("Content-Type", w.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+accessToken)
		wr := httptest.NewRecorder()
		r.ServeHTTP(wr, req)
		if wr.Code != 404 {
			t.Errorf("expected 404, got %d", wr.Code)
		}
	})

	t.Run("UploadAttachment forbidden (different user)", func(t *testing.T) {
		r, _ := newTestRouter()
		aliceToken, _ := registerAndLogin(t, r, "alice_uf", "alice_uf@example.com", "Str0ng#Pass1")
		bobToken, _ := registerAndLogin(t, r, "bob_uf", "bob_uf@example.com", "Str0ng#Pass2")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, aliceToken)
		expID := bodyID(t, expBody)

		var buf bytes.Buffer
		w := multipartFile(&buf, []byte("data"))
		req := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", &buf)
		req.Header.Set("Content-Type", w.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+bobToken)
		wr := httptest.NewRecorder()
		r.ServeHTTP(wr, req)
		if wr.Code != 403 {
			t.Errorf("expected 403, got %d", wr.Code)
		}
	})

	t.Run("UploadAttachment CreateAttachment error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_ca", "alice_ca@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		es.createAttachmentErr = errForced
		var buf bytes.Buffer
		mw := multipartFile(&buf, []byte("data"))
		req := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", &buf)
		req.Header.Set("Content-Type", mw.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+accessToken)
		wr := httptest.NewRecorder()
		r.ServeHTTP(wr, req)
		if wr.Code != 500 {
			t.Errorf("expected 500, got %d", wr.Code)
		}
	})

	t.Run("ListAttachments GetExpenseByID error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_la2", "alice_la2@example.com")

		es.getExpenseByIDErr = domain.NewNotFoundError("not found")
		code, _ := doReq(r, "GET", "/api/v1/expenses/nonexistent/attachments", nil, accessToken)
		if code != 404 {
			t.Errorf("expected 404, got %d", code)
		}
	})

	t.Run("ListAttachments forbidden", func(t *testing.T) {
		r, _ := newTestRouter()
		aliceToken, _ := registerAndLogin(t, r, "alice_la3", "alice_la3@example.com", "Str0ng#Pass1")
		bobToken, _ := registerAndLogin(t, r, "bob_la3", "bob_la3@example.com", "Str0ng#Pass2")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, aliceToken)
		expID := bodyID(t, expBody)

		code, _ := doReq(r, "GET", "/api/v1/expenses/"+expID+"/attachments", nil, bobToken)
		if code != 403 {
			t.Errorf("expected 403, got %d", code)
		}
	})

	t.Run("ListAttachments store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_la4", "alice_la4@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		es.listAttachmentsErr = errForced
		code, _ := doReq(r, "GET", "/api/v1/expenses/"+expID+"/attachments", nil, accessToken)
		if code != 500 {
			t.Errorf("expected 500, got %d", code)
		}
	})

	t.Run("DeleteAttachment GetExpenseByID error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_datt", "alice_datt@example.com")

		es.getExpenseByIDErr = domain.NewNotFoundError("not found")
		code, _ := doReq(r, "DELETE", "/api/v1/expenses/nonexistent/attachments/attid", nil, accessToken)
		if code != 404 {
			t.Errorf("expected 404, got %d", code)
		}
	})

	t.Run("DeleteAttachment forbidden", func(t *testing.T) {
		r, _ := newTestRouter()
		aliceToken, _ := registerAndLogin(t, r, "alice_datt2", "alice_datt2@example.com", "Str0ng#Pass1")
		bobToken, _ := registerAndLogin(t, r, "bob_datt2", "bob_datt2@example.com", "Str0ng#Pass2")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, aliceToken)
		expID := bodyID(t, expBody)

		code, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID+"/attachments/attid", nil, bobToken)
		if code != 403 {
			t.Errorf("expected 403, got %d", code)
		}
	})

	t.Run("DeleteAttachment GetAttachmentByID error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_datt3", "alice_datt3@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		es.getAttachmentByIDErr = domain.NewNotFoundError("not found")
		code, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID+"/attachments/nonexistent", nil, accessToken)
		if code != 404 {
			t.Errorf("expected 404, got %d", code)
		}
	})

	t.Run("DeleteAttachment mismatched expenseID", func(t *testing.T) {
		r, _ := newTestRouter()
		aliceToken, _ := registerAndLogin(t, r, "alice_dm", "alice_dm@example.com", "Str0ng#Pass1")

		_, expBody1 := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch1", "date": "2025-01-15", "type": "expense",
		}, aliceToken)
		expID1 := bodyID(t, expBody1)

		_, expBody2 := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "20.00", "currency": "USD", "category": "food",
			"description": "Lunch2", "date": "2025-01-15", "type": "expense",
		}, aliceToken)
		expID2 := bodyID(t, expBody2)

		// Upload attachment to expense 1.
		var buf bytes.Buffer
		mw := multipartFile(&buf, []byte("data"))
		req := httptest.NewRequest("POST", "/api/v1/expenses/"+expID1+"/attachments", &buf)
		req.Header.Set("Content-Type", mw.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+aliceToken)
		wr := httptest.NewRecorder()
		r.ServeHTTP(wr, req)
		var attBody map[string]interface{}
		_ = json.Unmarshal(wr.Body.Bytes(), &attBody)
		attID := bodyID(t, attBody)

		// Try to delete attachment using expense 2's ID.
		code, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID2+"/attachments/"+attID, nil, aliceToken)
		if code != 404 {
			t.Errorf("expected 404 for mismatched expenseID, got %d", code)
		}
	})

	t.Run("DeleteAttachment store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_datt4", "alice_datt4@example.com")

		_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
			"amount": "10.00", "currency": "USD", "category": "food",
			"description": "Lunch", "date": "2025-01-15", "type": "expense",
		}, accessToken)
		expID := bodyID(t, expBody)

		// Upload attachment.
		var buf bytes.Buffer
		mw := multipartFile(&buf, []byte("data"))
		req := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", &buf)
		req.Header.Set("Content-Type", mw.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+accessToken)
		wr := httptest.NewRecorder()
		r.ServeHTTP(wr, req)
		var attBody map[string]interface{}
		_ = json.Unmarshal(wr.Body.Bytes(), &attBody)
		attID := bodyID(t, attBody)

		es.deleteAttachmentErr = errForced
		code, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID+"/attachments/"+attID, nil, accessToken)
		if code != 500 {
			t.Errorf("expected 500, got %d", code)
		}
	})
}

// TestUnitReportStoreError tests PLReport handler error paths.
func TestUnitReportStoreError(t *testing.T) {
	t.Run("PLReport no claims", func(t *testing.T) {
		gin.SetMode(gin.TestMode)
		jwtSvc := auth.NewJWTService(testSecret)
		ms := store.NewMemoryStore()
		h := handler.New(ms, jwtSvc)

		r := gin.New()
		r.GET("/test", func(c *gin.Context) {
			c.Set(string(auth.ClaimsKey), "wrong-type")
			c.Next()
		}, h.PLReport)
		req := httptest.NewRequest("GET", "/test?startDate=2025-01-01&endDate=2025-01-31&currency=USD", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != 401 {
			t.Errorf("expected 401, got %d", w.Code)
		}
	})

	t.Run("PLReport store error", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouter(es)
		accessToken := registerAndLoginErrStore(t, r, "alice_pl", "alice_pl@example.com")

		es.plReportErr = errForced
		code, _ := doReq(r, "GET", "/api/v1/reports/pl?startDate=2025-01-01&endDate=2025-01-31&currency=USD", nil, accessToken)
		if code != 500 {
			t.Errorf("expected 500, got %d", code)
		}
	})
}

// TestUnitAdminListUsersError tests ListUsers error paths.
func TestUnitAdminListUsersError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	adminToken := setupAdminToken(t, r, es)

	es.listUsersErr = errForced
	code, _ := doReq(r, "GET", "/api/v1/admin/users", nil, adminToken)
	if code != 500 {
		t.Errorf("expected 500, got %d", code)
	}
}

// TestUnitAdminDisableUserUpdateError tests DisableUser UpdateUser error.
func TestUnitAdminDisableUserUpdateError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	adminToken := setupAdminToken(t, r, es)

	// Register alice.
	code, aliceBody := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice_dis_upd", "email": "alice_dis_upd@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code != 201 {
		t.Fatalf("alice registration failed")
	}
	aliceID := bodyID(t, aliceBody)

	// updateUserErrAfter=0 means fail on first UpdateUser call.
	// But we need to let the login's UpdateUser (reset failed attempts) pass first.
	// The admin endpoint calls UpdateUser once, so we fail on call 1.
	// We need to let the login UpdateUser for admin pass (that already happened in setupAdminToken).
	es.updateUserErr = errForced
	es.updateUserErrAfter = 0
	code2, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/disable", nil, adminToken)
	if code2 != 500 {
		t.Errorf("expected 500, got %d", code2)
	}
}

// TestUnitAdminEnableUserUpdateError tests EnableUser UpdateUser error.
func TestUnitAdminEnableUserUpdateError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	adminToken := setupAdminToken(t, r, es)

	code, aliceBody := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice_ena_upd", "email": "alice_ena_upd@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code != 201 {
		t.Fatalf("alice registration failed")
	}
	aliceID := bodyID(t, aliceBody)

	es.updateUserErr = errForced
	es.updateUserErrAfter = 0
	code2, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/enable", nil, adminToken)
	if code2 != 500 {
		t.Errorf("expected 500, got %d", code2)
	}
}

// TestUnitAdminUnlockUserUpdateError tests UnlockUser UpdateUser error.
func TestUnitAdminUnlockUserUpdateError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	adminToken := setupAdminToken(t, r, es)

	code, aliceBody := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice_unl_upd", "email": "alice_unl_upd@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code != 201 {
		t.Fatalf("alice registration failed")
	}
	aliceID := bodyID(t, aliceBody)

	es.updateUserErr = errForced
	es.updateUserErrAfter = 0
	code2, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/unlock", nil, adminToken)
	if code2 != 500 {
		t.Errorf("expected 500, got %d", code2)
	}
}

// TestUnitAdminDisableUserRevokeError tests DisableUser when RevokeAllRefreshTokensForUser fails.
func TestUnitAdminDisableUserRevokeError(t *testing.T) {
	es := &errStore{}
	r := newErrRouter(es)
	adminToken := setupAdminToken(t, r, es)

	code, aliceBody := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice_dis_rev", "email": "alice_dis_rev@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code != 201 {
		t.Fatalf("alice registration failed")
	}
	aliceID := bodyID(t, aliceBody)

	es.revokeAllRefreshTokensForUser = errForced
	code2, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/disable", nil, adminToken)
	if code2 != 500 {
		t.Errorf("expected 500, got %d", code2)
	}
}

// setupAdminToken registers a user, promotes to admin, and returns an admin access token.
func setupAdminToken(t *testing.T, r *gin.Engine, es *errStore) string {
	t.Helper()
	code, adminBody := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "superadmin_err", "email": "superadmin_err@example.com", "password": "Admin#Pass123",
	}, "")
	if code != 201 {
		t.Fatalf("admin registration failed: %d", code)
	}
	adminID := bodyID(t, adminBody)

	// Promote to admin.
	u, _ := es.inner.GetUserByID(context.Background(), adminID)
	u.Role = domain.RoleAdmin
	_ = es.inner.UpdateUser(context.Background(), u)

	// Login.
	_, body := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "superadmin_err", "password": "Admin#Pass123",
	}, "")
	tok, ok := body["accessToken"].(string)
	if !ok {
		t.Fatalf("accessToken not found in admin login response")
	}
	return tok
}

// multipartFile creates a multipart writer with a file field and returns it.
// filename is fixed to "receipt.jpg" and content type to "image/jpeg" for test simplicity.
func multipartFile(buf *bytes.Buffer, content []byte) *multipart.Writer {
	writer := multipart.NewWriter(buf)
	h := make(map[string][]string)
	h["Content-Disposition"] = []string{`form-data; name="file"; filename="receipt.jpg"`}
	h["Content-Type"] = []string{"image/jpeg"}
	part, _ := writer.CreatePart(h)
	_, _ = part.Write(content)
	_ = writer.Close()
	return writer
}

// TestUnitTestAPIStoreErrors tests error paths for the test API handlers.
func TestUnitTestAPIStoreErrors(t *testing.T) {
	t.Run("ResetDB store error returns 500", func(t *testing.T) {
		es := &errStore{}
		r := newErrRouterWithTestAPI(es)
		es.resetDBErr = errForced
		code, _ := doReq(r, "POST", "/api/v1/test/reset-db", nil, "")
		if code != 500 {
			t.Errorf("expected 500 for ResetDB store error, got %d", code)
		}
	})
}
