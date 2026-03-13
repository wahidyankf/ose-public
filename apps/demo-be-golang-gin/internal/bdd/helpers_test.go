package bdd_test

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
)

func doRequest(r *gin.Engine, method, path string, body interface{}, token string) (*http.Response, []byte) {
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
	resp := w.Result()
	respBody, _ := io.ReadAll(resp.Body)
	return resp, respBody
}

func uploadFile(
	r interface {
		ServeHTTP(http.ResponseWriter, *http.Request)
	},
	path, filename, contentType string,
	content []byte,
	token string,
) (*http.Response, []byte) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	h := make(map[string][]string)
	h["Content-Disposition"] = []string{`form-data; name="file"; filename="` + filename + `"`}
	h["Content-Type"] = []string{contentType}
	part, _ := writer.CreatePart(h)
	_, _ = part.Write(content)
	_ = writer.Close()

	req := httptest.NewRequest(http.MethodPost, path, &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	resp := w.Result()
	respBody := w.Body.Bytes()
	return resp, respBody
}

func parseBody(body []byte) map[string]interface{} {
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	return result
}
