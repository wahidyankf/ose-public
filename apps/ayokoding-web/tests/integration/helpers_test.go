package integration_test

import (
	"io"
	"net/http"
	"testing"
)

// readBody drains and closes one integration response body.
func readBody(t *testing.T, response *http.Response) string {
	t.Helper()
	defer func() { _ = response.Body.Close() }()
	raw, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	return string(raw)
}
