package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/router"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

const testSecret = "test-secret-at-least-32-chars-long"

func newTestRouter() (*gin.Engine, *store.MemoryStore) {
	gin.SetMode(gin.TestMode)
	ms := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService(testSecret)
	r := router.NewRouter(ms, jwtSvc, &config.Config{})
	return r, ms
}

func doReq(r *gin.Engine, method, path string, body interface{}, token string) (int, map[string]interface{}) {
	var bodyReader io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var result map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &result)
	return w.Code, result
}

func registerAndLogin(t *testing.T, r *gin.Engine, username, email, password string) (string, string) {
	t.Helper()
	code, _ := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": username, "email": email, "password": password,
	}, "")
	if code != 201 {
		t.Fatalf("registration failed with %d", code)
	}
	code2, body2 := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": username, "password": password,
	}, "")
	if code2 != 200 {
		t.Fatalf("login failed with %d", code2)
	}
	accessTok, ok1 := body2["accessToken"].(string)
	refreshTok, ok2 := body2["refreshToken"].(string)
	if !ok1 || !ok2 {
		t.Fatalf("accessToken or refreshToken not found in login response")
	}
	return accessTok, refreshTok
}

func TestUnitHealthHandler(t *testing.T) {
	r, _ := newTestRouter()
	code, body := doReq(r, "GET", "/health", nil, "")
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}
	if body["status"] != "UP" {
		t.Errorf("expected status UP, got %v", body["status"])
	}
}

func TestUnitRegisterHandler(t *testing.T) {
	r, _ := newTestRouter()

	// Success.
	code, body := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code != 201 {
		t.Errorf("expected 201, got %d; body: %v", code, body)
	}
	if body["id"] == nil {
		t.Error("expected non-null id")
	}
	if _, ok := body["password"]; ok {
		t.Error("response should not include password field")
	}

	// Duplicate.
	code2, _ := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice2@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code2 != 409 {
		t.Errorf("expected 409 for duplicate, got %d", code2)
	}

	// Invalid email.
	code3, _ := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "bob", "email": "not-an-email", "password": "Str0ng#Pass1",
	}, "")
	if code3 != 400 {
		t.Errorf("expected 400 for invalid email, got %d", code3)
	}

	// Weak password.
	code4, _ := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "carol", "email": "carol@example.com", "password": "weak",
	}, "")
	if code4 != 400 {
		t.Errorf("expected 400 for weak password, got %d", code4)
	}

	// Invalid JSON.
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader([]byte("not json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}

	// Invalid username.
	code5, _ := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "a!", "email": "valid@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code5 != 400 {
		t.Errorf("expected 400 for invalid username, got %d", code5)
	}
}

func TestUnitLoginHandler(t *testing.T) {
	r, _ := newTestRouter()
	doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")

	// Success.
	code, body := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "alice", "password": "Str0ng#Pass1",
	}, "")
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}
	if body["tokenType"] != "Bearer" {
		t.Errorf("expected Bearer token type, got %v", body["tokenType"])
	}

	// Wrong password.
	code2, _ := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "alice", "password": "WrongPass!",
	}, "")
	if code2 != 401 {
		t.Errorf("expected 401, got %d", code2)
	}

	// Non-existent user.
	code3, _ := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "ghost", "password": "Str0ng#Pass1",
	}, "")
	if code3 != 401 {
		t.Errorf("expected 401, got %d", code3)
	}

	// Invalid JSON.
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader([]byte("bad json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestUnitRefreshHandler(t *testing.T) {
	r, _ := newTestRouter()
	_, refreshToken := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	// Success.
	code, body := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
		"refreshToken": refreshToken,
	}, "")
	if code != 200 {
		t.Errorf("expected 200, got %d; body: %v", code, body)
	}

	// Invalid token (already used).
	code2, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{
		"refreshToken": refreshToken,
	}, "")
	if code2 != 401 {
		t.Errorf("expected 401 for revoked token, got %d", code2)
	}

	// Missing token.
	code3, _ := doReq(r, "POST", "/api/v1/auth/refresh", map[string]string{}, "")
	if code3 != 401 {
		t.Errorf("expected 401 for missing token, got %d", code3)
	}

	// Invalid JSON.
	req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader([]byte("bad json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestUnitLogoutHandler(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	// Success.
	code, _ := doReq(r, "POST", "/api/v1/auth/logout", map[string]string{}, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}

	// Idempotent - second logout.
	code2, _ := doReq(r, "POST", "/api/v1/auth/logout", map[string]string{}, accessToken)
	if code2 != 200 {
		t.Errorf("expected 200 for second logout, got %d", code2)
	}
}

func TestUnitLogoutAllHandler(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	code, _ := doReq(r, "POST", "/api/v1/auth/logout-all", nil, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}

	// Without token.
	code2, _ := doReq(r, "POST", "/api/v1/auth/logout-all", nil, "")
	if code2 != 401 {
		t.Errorf("expected 401 without token, got %d", code2)
	}
}

func TestUnitGetProfileHandler(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	code, body := doReq(r, "GET", "/api/v1/users/me", nil, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}
	if body["username"] != "alice" {
		t.Errorf("expected username alice, got %v", body["username"])
	}

	// Without token.
	code2, _ := doReq(r, "GET", "/api/v1/users/me", nil, "")
	if code2 != 401 {
		t.Errorf("expected 401, got %d", code2)
	}
}

func TestUnitUpdateProfileHandler(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	code, body := doReq(r, "PATCH", "/api/v1/users/me", map[string]string{"displayName": "Alice Smith"}, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d; body: %v", code, body)
	}
	if body["displayName"] != "Alice Smith" {
		t.Errorf("expected displayName Alice Smith, got %v", body["displayName"])
	}

	// Invalid JSON.
	req := httptest.NewRequest("PATCH", "/api/v1/users/me", bytes.NewReader([]byte("bad json")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestUnitChangePasswordHandler(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	code, _ := doReq(r, "POST", "/api/v1/users/me/password", map[string]string{
		"oldPassword": "Str0ng#Pass1", "newPassword": "NewPass#456",
	}, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}

	// Wrong old password.
	code2, _ := doReq(r, "POST", "/api/v1/users/me/password", map[string]string{
		"oldPassword": "WrongPass!", "newPassword": "AnotherPass#789",
	}, accessToken)
	if code2 != 401 {
		t.Errorf("expected 401, got %d", code2)
	}

	// Invalid JSON.
	req := httptest.NewRequest("POST", "/api/v1/users/me/password", bytes.NewReader([]byte("bad")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestUnitDeactivateHandler(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	code, _ := doReq(r, "POST", "/api/v1/users/me/deactivate", nil, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}

	// After deactivation, login should fail.
	code2, _ := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "alice", "password": "Str0ng#Pass1",
	}, "")
	if code2 != 401 {
		t.Errorf("expected 401 for deactivated account, got %d", code2)
	}
}

func TestUnitExpenseHandlers(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	// Create.
	code, body := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.50", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	if code != 201 {
		t.Errorf("expected 201, got %d; body: %v", code, body)
	}
	expID := bodyID(t, body)

	// Get.
	code2, body2 := doReq(r, "GET", "/api/v1/expenses/"+expID, nil, accessToken)
	if code2 != 200 {
		t.Errorf("expected 200, got %d", code2)
	}
	if body2["amount"] != "10.50" {
		t.Errorf("expected amount 10.50, got %v", body2["amount"])
	}

	// List.
	code3, body3 := doReq(r, "GET", "/api/v1/expenses", nil, accessToken)
	if code3 != 200 {
		t.Errorf("expected 200, got %d", code3)
	}
	_ = body3

	// Update.
	code4, body4 := doReq(r, "PUT", "/api/v1/expenses/"+expID, map[string]interface{}{
		"amount": "12.00", "currency": "USD", "category": "food",
		"description": "Updated lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	if code4 != 200 {
		t.Errorf("expected 200, got %d; body: %v", code4, body4)
	}

	// Summary.
	code5, _ := doReq(r, "GET", "/api/v1/expenses/summary", nil, accessToken)
	if code5 != 200 {
		t.Errorf("expected 200 for summary, got %d", code5)
	}

	// Delete.
	code6, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID, nil, accessToken)
	if code6 != 204 {
		t.Errorf("expected 204, got %d", code6)
	}

	// Get after delete - not found.
	code7, _ := doReq(r, "GET", "/api/v1/expenses/"+expID, nil, accessToken)
	if code7 != 404 {
		t.Errorf("expected 404 after delete, got %d", code7)
	}
}

func TestUnitExpenseInvalidCurrency(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	// Unsupported currency.
	code, _ := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.00", "currency": "EUR", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	if code != 400 {
		t.Errorf("expected 400 for unsupported currency, got %d", code)
	}

	// Negative amount.
	code2, _ := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "-10.00", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	if code2 != 400 {
		t.Errorf("expected 400 for negative amount, got %d", code2)
	}

	// Malformed amount (not a number).
	code3, _ := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "notanumber", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	if code3 != 400 {
		t.Errorf("expected 400 for malformed amount, got %d", code3)
	}

	// Invalid JSON.
	req := httptest.NewRequest("POST", "/api/v1/expenses", bytes.NewReader([]byte("bad")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUnitExpenseForbidden(t *testing.T) {
	r, _ := newTestRouter()
	aliceToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")
	bobToken, _ := registerAndLogin(t, r, "bob", "bob@example.com", "Str0ng#Pass2")

	// Alice creates expense.
	_, body := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.00", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, aliceToken)
	expID := bodyID(t, body)

	// Bob tries to get alice's expense.
	code, _ := doReq(r, "GET", "/api/v1/expenses/"+expID, nil, bobToken)
	if code != 403 {
		t.Errorf("expected 403 for forbidden access, got %d", code)
	}

	// Bob tries to delete alice's expense.
	code2, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID, nil, bobToken)
	if code2 != 403 {
		t.Errorf("expected 403 for forbidden delete, got %d", code2)
	}

	// Bob tries to update alice's expense.
	code3, _ := doReq(r, "PUT", "/api/v1/expenses/"+expID, map[string]interface{}{
		"amount": "20.00", "currency": "USD", "category": "food",
		"description": "Updated", "date": "2025-01-15", "type": "expense",
	}, bobToken)
	if code3 != 403 {
		t.Errorf("expected 403 for forbidden update, got %d", code3)
	}
}

func TestUnitTokenClaims(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	code, body := doReq(r, "GET", "/api/v1/tokens/claims", nil, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}
	if body["sub"] == nil {
		t.Error("expected non-null sub claim")
	}
	if body["iss"] == nil {
		t.Error("expected non-null iss claim")
	}
}

func TestUnitJWKS(t *testing.T) {
	r, _ := newTestRouter()
	code, body := doReq(r, "GET", "/.well-known/jwks.json", nil, "")
	if code != 200 {
		t.Errorf("expected 200, got %d", code)
	}
	if body["keys"] == nil {
		t.Error("expected non-null keys")
	}
}

func TestUnitPLReport(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	// Create income and expense entries.
	doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "5000.00", "currency": "USD", "category": "salary",
		"description": "Salary", "date": "2025-01-15", "type": "income",
	}, accessToken)
	doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "150.00", "currency": "USD", "category": "food",
		"description": "Food", "date": "2025-01-20", "type": "expense",
	}, accessToken)

	code, body := doReq(r, "GET", "/api/v1/reports/pl?startDate=2025-01-01&endDate=2025-01-31&currency=USD", nil, accessToken)
	if code != 200 {
		t.Errorf("expected 200, got %d; body: %v", code, body)
	}
	if body["totalIncome"] != "5000.00" {
		t.Errorf("expected totalIncome 5000.00, got %v", body["totalIncome"])
	}
	if body["totalExpense"] != "150.00" {
		t.Errorf("expected totalExpense 150.00, got %v", body["totalExpense"])
	}

	// Missing params.
	code2, _ := doReq(r, "GET", "/api/v1/reports/pl", nil, accessToken)
	if code2 != 400 {
		t.Errorf("expected 400 for missing params, got %d", code2)
	}

	// Invalid currency.
	code3, _ := doReq(r, "GET", "/api/v1/reports/pl?startDate=2025-01-01&endDate=2025-01-31&currency=EUR", nil, accessToken)
	if code3 != 400 {
		t.Errorf("expected 400 for invalid currency, got %d", code3)
	}
}

func TestUnitAttachmentHandlers(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	// Create an expense.
	_, expBody := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.00", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	expID := bodyID(t, expBody)

	// Upload attachment.
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	h := make(map[string][]string)
	h["Content-Disposition"] = []string{`form-data; name="file"; filename="receipt.jpg"`}
	h["Content-Type"] = []string{"image/jpeg"}
	part, _ := writer.CreatePart(h)
	_, _ = part.Write([]byte("fake image content"))
	_ = writer.Close()

	req := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 201 {
		t.Errorf("expected 201 for upload, got %d; body: %s", w.Code, w.Body.String())
	}
	var attBody map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &attBody)
	attID := bodyID(t, attBody)

	// List attachments.
	code2, body2 := doReq(r, "GET", "/api/v1/expenses/"+expID+"/attachments", nil, accessToken)
	if code2 != 200 {
		t.Errorf("expected 200, got %d", code2)
	}
	_ = body2

	// Upload unsupported type.
	var buf2 bytes.Buffer
	writer2 := multipart.NewWriter(&buf2)
	h2 := make(map[string][]string)
	h2["Content-Disposition"] = []string{`form-data; name="file"; filename="virus.exe"`}
	h2["Content-Type"] = []string{"application/octet-stream"}
	part2, _ := writer2.CreatePart(h2)
	_, _ = part2.Write([]byte("malware"))
	_ = writer2.Close()
	req2 := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", &buf2)
	req2.Header.Set("Content-Type", writer2.FormDataContentType())
	req2.Header.Set("Authorization", "Bearer "+accessToken)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != 415 {
		t.Errorf("expected 415 for unsupported type, got %d", w2.Code)
	}

	// Upload oversized file.
	var buf3 bytes.Buffer
	writer3 := multipart.NewWriter(&buf3)
	h3 := make(map[string][]string)
	h3["Content-Disposition"] = []string{`form-data; name="file"; filename="large.pdf"`}
	h3["Content-Type"] = []string{"application/pdf"}
	part3, _ := writer3.CreatePart(h3)
	_, _ = part3.Write(make([]byte, 11*1024*1024)) // 11MB
	_ = writer3.Close()
	req3 := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", &buf3)
	req3.Header.Set("Content-Type", writer3.FormDataContentType())
	req3.Header.Set("Authorization", "Bearer "+accessToken)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != 413 {
		t.Errorf("expected 413 for oversized file, got %d", w3.Code)
	}

	// Delete attachment.
	code4, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID+"/attachments/"+attID, nil, accessToken)
	if code4 != 204 {
		t.Errorf("expected 204, got %d", code4)
	}

	// Delete non-existent attachment.
	code5, _ := doReq(r, "DELETE", "/api/v1/expenses/"+expID+"/attachments/nonexistent", nil, accessToken)
	if code5 != 404 {
		t.Errorf("expected 404, got %d", code5)
	}
}

func TestUnitAdminHandlers(t *testing.T) {
	r, ms := newTestRouter()

	// Register alice.
	code, body := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")
	if code != 201 {
		t.Fatalf("alice registration failed: %v", body)
	}
	aliceID := bodyID(t, body)

	// Register superadmin and promote to ADMIN via store.
	code2, body2 := doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "superadmin", "email": "superadmin@example.com", "password": "Admin#Pass123",
	}, "")
	if code2 != 201 {
		t.Fatalf("superadmin registration failed: %v", body2)
	}
	adminID := bodyID(t, body2)

	importCtx := func() {
		adminUser, _ := ms.GetUserByID(context.TODO(), adminID)
		if adminUser != nil {
			adminUser.Role = "ADMIN"
			_ = ms.UpdateUser(context.TODO(), adminUser)
		}
	}
	importCtx()

	// Login as admin.
	_, body3 := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "superadmin", "password": "Admin#Pass123",
	}, "")
	adminToken, ok := body3["accessToken"].(string)
	if !ok {
		t.Fatalf("accessToken not found in admin login response")
	}

	// List users.
	code4, body4 := doReq(r, "GET", "/api/v1/admin/users", nil, adminToken)
	if code4 != 200 {
		t.Errorf("expected 200 for list users, got %d", code4)
	}
	_ = body4

	// List users with email filter.
	code5, _ := doReq(r, "GET", "/api/v1/admin/users?email=alice@example.com", nil, adminToken)
	if code5 != 200 {
		t.Errorf("expected 200 for filtered list, got %d", code5)
	}

	// Disable user.
	code6, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/disable", map[string]string{"reason": "test"}, adminToken)
	if code6 != 200 {
		t.Errorf("expected 200 for disable, got %d", code6)
	}

	// Enable user.
	code7, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/enable", nil, adminToken)
	if code7 != 200 {
		t.Errorf("expected 200 for enable, got %d", code7)
	}

	// Unlock user.
	code8, _ := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/unlock", nil, adminToken)
	if code8 != 200 {
		t.Errorf("expected 200 for unlock, got %d", code8)
	}

	// Force password reset.
	code9, body9 := doReq(r, "POST", "/api/v1/admin/users/"+aliceID+"/force-password-reset", nil, adminToken)
	if code9 != 200 {
		t.Errorf("expected 200 for force-password-reset, got %d", code9)
	}
	if body9["token"] == nil {
		t.Error("expected non-null token")
	}

	// Non-admin access.
	aliceToken, _ := registerAndLogin(t, r, "alice2", "alice2@example.com", "Str0ng#Pass1")
	code10, _ := doReq(r, "GET", "/api/v1/admin/users", nil, aliceToken)
	if code10 != 403 {
		t.Errorf("expected 403 for non-admin, got %d", code10)
	}

	// Not found.
	code11, _ := doReq(r, "GET", "/api/v1/admin/users/"+aliceID, nil, adminToken)
	_ = code11 // Route doesn't exist, 404 from gin

	code12, _ := doReq(r, "POST", "/api/v1/admin/users/nonexistent/disable", nil, adminToken)
	if code12 != 404 {
		t.Errorf("expected 404 for nonexistent user disable, got %d", code12)
	}

	code13, _ := doReq(r, "POST", "/api/v1/admin/users/nonexistent/enable", nil, adminToken)
	if code13 != 404 {
		t.Errorf("expected 404 for nonexistent user enable, got %d", code13)
	}

	code14, _ := doReq(r, "POST", "/api/v1/admin/users/nonexistent/unlock", nil, adminToken)
	if code14 != 404 {
		t.Errorf("expected 404 for nonexistent user unlock, got %d", code14)
	}

	code15, _ := doReq(r, "POST", "/api/v1/admin/users/nonexistent/force-password-reset", nil, adminToken)
	if code15 != 404 {
		t.Errorf("expected 404 for nonexistent user force-password-reset, got %d", code15)
	}
}

func TestUnitMiddlewareErrors(t *testing.T) {
	r, _ := newTestRouter()

	// No auth header.
	code, _ := doReq(r, "GET", "/api/v1/users/me", nil, "")
	if code != 401 {
		t.Errorf("expected 401 for no auth, got %d", code)
	}

	// Invalid token format.
	req := httptest.NewRequest("GET", "/api/v1/users/me", nil)
	req.Header.Set("Authorization", "InvalidFormat")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 401 {
		t.Errorf("expected 401 for invalid auth format, got %d", w.Code)
	}

	// Bad token.
	code2, _ := doReq(r, "GET", "/api/v1/users/me", nil, "bad.token.value")
	if code2 != 401 {
		t.Errorf("expected 401 for bad token, got %d", code2)
	}
}

func TestUnitExpenseWithUnit(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	qty := 50.5
	code, body := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "75000", "currency": "IDR", "category": "fuel",
		"description": "Petrol", "date": "2025-01-15", "type": "expense",
		"quantity": qty, "unit": "liter",
	}, accessToken)
	if code != 201 {
		t.Errorf("expected 201, got %d; body: %v", code, body)
	}
	if body["unit"] != "liter" {
		t.Errorf("expected unit liter, got %v", body["unit"])
	}

	// Unsupported unit.
	code2, _ := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.00", "currency": "USD", "category": "misc",
		"description": "Cargo", "date": "2025-01-15", "type": "expense",
		"quantity": 5.0, "unit": "fathom",
	}, accessToken)
	if code2 != 400 {
		t.Errorf("expected 400 for unsupported unit, got %d", code2)
	}
}

func TestUnitAccountLockout(t *testing.T) {
	r, _ := newTestRouter()
	doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")

	// Trigger 5 failed attempts.
	for i := 0; i < 5; i++ {
		doReq(r, "POST", "/api/v1/auth/login", map[string]string{
			"username": "alice", "password": "WrongPass!",
		}, "")
	}

	// Now the account should be locked.
	code, _ := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "alice", "password": "Str0ng#Pass1",
	}, "")
	if code != 401 {
		t.Errorf("expected 401 for locked account, got %d", code)
	}
}

func TestUnitDisabledAccountLogin(t *testing.T) {
	r, ms := newTestRouter()
	doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")

	// Disable alice directly via store.
	importCtx2 := func() {
		aliceUser, _ := ms.GetUserByUsername(context.TODO(), "alice")
		if aliceUser != nil {
			aliceUser.Status = "DISABLED"
			_ = ms.UpdateUser(context.TODO(), aliceUser)
		}
	}
	importCtx2()

	code, _ := doReq(r, "POST", "/api/v1/auth/login", map[string]string{
		"username": "alice", "password": "Str0ng#Pass1",
	}, "")
	if code != 401 {
		t.Errorf("expected 401 for disabled account, got %d", code)
	}
}

func TestUnitExpenseUpdateInvalidJSON(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	_, body := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.00", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	expID := bodyID(t, body)

	// Invalid JSON for update.
	req := httptest.NewRequest("PUT", "/api/v1/expenses/"+expID, bytes.NewReader([]byte("bad json")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for invalid JSON in update, got %d", w.Code)
	}
}

func TestUnitAttachmentNoFile(t *testing.T) {
	r, _ := newTestRouter()
	accessToken, _ := registerAndLogin(t, r, "alice", "alice@example.com", "Str0ng#Pass1")

	_, body := doReq(r, "POST", "/api/v1/expenses", map[string]interface{}{
		"amount": "10.00", "currency": "USD", "category": "food",
		"description": "Lunch", "date": "2025-01-15", "type": "expense",
	}, accessToken)
	expID := bodyID(t, body)

	// Upload without file field.
	req := httptest.NewRequest("POST", "/api/v1/expenses/"+expID+"/attachments", nil)
	req.Header.Set("Content-Type", "multipart/form-data; boundary=----")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Errorf("expected 400 for missing file, got %d", w.Code)
	}
}

// newTestAPIRouter creates a router with EnableTestAPI enabled.
func newTestAPIRouter() (*gin.Engine, *store.MemoryStore) { //nolint:unparam // ms used in future tests
	gin.SetMode(gin.TestMode)
	ms := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService(testSecret)
	r := router.NewRouter(ms, jwtSvc, &config.Config{EnableTestAPI: true})
	return r, ms
}

func TestUnitTestAPIResetDB(t *testing.T) {
	r, _ := newTestAPIRouter()

	// Register a user so there is data in the store.
	doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")

	// Reset the database via test API.
	code, body := doReq(r, "POST", "/api/v1/test/reset-db", nil, "")
	if code != 200 {
		t.Errorf("expected 200 for reset-db, got %d; body: %v", code, body)
	}
	if body["message"] != "Database reset successful" {
		t.Errorf("unexpected reset-db message: %v", body["message"])
	}
}

func TestUnitTestAPIPromoteAdmin(t *testing.T) {
	r, _ := newTestAPIRouter()

	// Register alice first.
	doReq(r, "POST", "/api/v1/auth/register", map[string]string{
		"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1",
	}, "")

	// Promote alice to admin.
	code, body := doReq(r, "POST", "/api/v1/test/promote-admin", map[string]string{
		"username": "alice",
	}, "")
	if code != 200 {
		t.Errorf("expected 200 for promote-admin, got %d; body: %v", code, body)
	}

	// Missing username returns 400.
	code2, _ := doReq(r, "POST", "/api/v1/test/promote-admin", map[string]string{}, "")
	if code2 != 400 {
		t.Errorf("expected 400 for missing username, got %d", code2)
	}

	// Non-existent username returns 404.
	code3, _ := doReq(r, "POST", "/api/v1/test/promote-admin", map[string]string{
		"username": "ghost",
	}, "")
	if code3 != 404 {
		t.Errorf("expected 404 for non-existent username, got %d", code3)
	}
}
