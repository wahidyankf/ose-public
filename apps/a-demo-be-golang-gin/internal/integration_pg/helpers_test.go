//go:build integration_pg

package integration_pg_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
)

// buildGinContext creates a minimal *gin.Context for direct handler invocation.
// It sets up the ResponseRecorder and populates Gin path params and JWT claims
// without going through any HTTP router or middleware.
func buildGinContext(method, rawPath string, bodyObj interface{}, token string, params gin.Params, jwtSvc *auth.JWTService) (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Build the raw HTTP request so handlers can call c.Request.Context().
	var bodyBytes []byte
	if bodyObj != nil {
		bodyBytes, _ = json.Marshal(bodyObj)
	}
	req, _ := http.NewRequest(method, rawPath, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	c.Request = req

	// Set path params (e.g. :id, :aid).
	c.Params = params

	// Inject JWT claims directly into the Gin context, bypassing middleware.
	if token != "" && jwtSvc != nil {
		claims, err := jwtSvc.ValidateToken(token)
		if err == nil {
			c.Set(string(auth.ClaimsKey), claims)
		}
	}

	return c, w
}

// readResponse reads the recorder body as a JSON map.
func readResponse(w *httptest.ResponseRecorder) map[string]interface{} {
	var result map[string]interface{}
	body := w.Body.Bytes()
	if len(body) > 0 {
		_ = json.Unmarshal(body, &result)
	}
	return result
}

// buildMultipartGinContext creates a *gin.Context suitable for file upload handlers.
// The file is encoded as multipart form data directly into the request body.
func buildMultipartGinContext(rawPath, filename, contentType string, content []byte, token string, params gin.Params, jwtSvc *auth.JWTService) (*gin.Context, *httptest.ResponseRecorder) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	h := make(map[string][]string)
	h["Content-Disposition"] = []string{fmt.Sprintf(`form-data; name="file"; filename="%s"`, filename)}
	h["Content-Type"] = []string{contentType}
	part, _ := writer.CreatePart(h)
	_, _ = part.Write(content)
	_ = writer.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest(http.MethodPost, rawPath, &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	c.Request = req
	c.Params = params

	if token != "" && jwtSvc != nil {
		claims, err := jwtSvc.ValidateToken(token)
		if err == nil {
			c.Set(string(auth.ClaimsKey), claims)
		}
	}

	return c, w
}

// parseBody unmarshals a JSON byte slice into a map.
func parseBody(body []byte) map[string]interface{} {
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	return result
}
