package web

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestRenderFailure Guards the defensive template error branch.
func TestRenderFailure(t *testing.T) {
	server := NewServer(Config{Port: 3102}, Deps{})
	recorder := httptest.NewRecorder()
	server.render(recorder, "no-such-template", nil)
	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("render failure status = %d, want 500", recorder.Code)
	}
}
