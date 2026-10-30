package web_test

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// TestSearchFragmentSuccess locks the 004 search-fragment success path: an
// ordered de-duplicated HTML fragment with title/excerpt links for the
// mounted locale, echoing the query so newer input can retire late results.
func TestSearchFragmentSuccess(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/htmx/search?q=hello")
	if recorder.Code != http.StatusOK {
		t.Fatalf("fragment status = %d, want 200", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "text/html; charset=utf-8" {
		t.Fatalf("fragment Content-Type = %q", got)
	}
	if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("fragment Cache-Control = %q, want no-store", got)
	}
	body := recorder.Body.String()
	for _, marker := range []string{"Hello World", "first program", "/en/learn/courses/go-basics/learning/hello-world", `data-query="hello"`} {
		if !strings.Contains(body, marker) {
			t.Fatalf("fragment misses %q", marker)
		}
	}
	if strings.Contains(body, "data-search-invalid") {
		t.Fatal("successful fragment must not carry the invalid state")
	}
}

// TestSearchFragmentClearsOnWhitespace locks the empty-dialog path: a
// whitespace-only input clears stale results without an error.
func TestSearchFragmentClearsOnWhitespace(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/htmx/search?q=%20%20")
	if recorder.Code != http.StatusOK {
		t.Fatalf("whitespace fragment status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	if strings.Contains(body, "data-search-results") || strings.Contains(body, "Hello World") {
		t.Fatal("whitespace input must clear stale results")
	}
	if !strings.Contains(body, "data-search-empty") {
		t.Fatal("cleared dialog must stay usable with the empty state")
	}
}

// TestSearchFragmentRejectsInvalid locks the malformed-request path: a
// missing query, an out-of-range limit, or an unexpected field returns the
// stable inline invalid-search state with an empty result list and no crash.
func TestSearchFragmentRejectsInvalid(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{
		"/htmx/search",
		"/htmx/search?limit=20",
		"/htmx/search?q=hello&limit=abc",
		"/htmx/search?q=hello&limit=0",
		"/htmx/search?q=hello&limit=51",
		"/htmx/search?q=hello&limit=999",
		"/htmx/search?q=hello&locale=id",
		"/htmx/search?q=hello&unexpected=1",
		"/htmx/search?q=%12&limit=999",
	} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusOK {
			t.Fatalf("GET %s status = %d, want 200 with inline invalid state", target, recorder.Code)
		}
		body := recorder.Body.String()
		if !strings.Contains(body, "data-search-invalid") || !strings.Contains(body, "invalid_search") {
			t.Fatalf("GET %s must carry the invalid-search state, got %q", target, body)
		}
		if strings.Contains(body, "data-search-results") || strings.Contains(body, "Hello World") {
			t.Fatalf("GET %s must not list results beside the invalid state", target)
		}
	}
}

// TestSearchFragmentLocaleFromMountedPage locks locale derivation: the
// fragment serves the mounted page route's locale, defaulting to English
// when the page URL is absent.
func TestSearchFragmentLocaleFromMountedPage(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/htmx/search?q=hello")
	if strings.Contains(recorder.Body.String(), "/id/") {
		t.Fatal("default fragment must stay in the English locale")
	}
	mounted := httptest.NewRequest(http.MethodGet, "/htmx/search?q=halo", nil)
	mounted.Header.Set("HX-Current-URL", "http://localhost:3102/id/learn/go-basics/hello-world")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, mounted)
	if response.Code != http.StatusOK {
		t.Fatalf("mounted fragment status = %d, want 200", response.Code)
	}
	body := response.Body.String()
	if !strings.Contains(body, "Halo Dunia") {
		t.Fatalf("mounted fragment must serve the page locale, got %q", body)
	}
	if strings.Contains(body, "Hello World") {
		t.Fatal("mounted fragment must not leak the other locale")
	}
	referrer := httptest.NewRequest(http.MethodGet, "/htmx/search?q=halo", nil)
	referrer.Header.Set("Referer", "http://localhost:3102/id/learn/go-basics/hello-world")
	referred := httptest.NewRecorder()
	handler.ServeHTTP(referred, referrer)
	if !strings.Contains(referred.Body.String(), "Halo Dunia") {
		t.Fatal("referrer page route must also select the fragment locale")
	}
	broken := httptest.NewRequest(http.MethodGet, "/htmx/search?q=hello", nil)
	broken.Header.Set("HX-Current-URL", "\x7f")
	fallback := httptest.NewRecorder()
	handler.ServeHTTP(fallback, broken)
	if fallback.Code != http.StatusOK || strings.Contains(fallback.Body.String(), "/id/") {
		t.Fatal("an unparsable page URL must fall back to the English locale")
	}
}

// TestSearchFragmentRejectsMalformedEncoding locks the malformed-query half
// of the invalid-search contract: an undecodable query pair answers the
// inline invalid state instead of crashing.
func TestSearchFragmentRejectsMalformedEncoding(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	malformed := &http.Request{
		Method: http.MethodGet,
		URL:    &url.URL{Path: "/htmx/search", RawQuery: "q=%zz"},
		Header: http.Header{},
	}
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, malformed)
	if recorder.Code != http.StatusOK {
		t.Fatalf("malformed fragment status = %d, want 200 with inline invalid state", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "invalid_search") {
		t.Fatal("malformed encoding must carry the invalid-search state")
	}
}

// TestSearchFragmentFirstValueWins locks first-value decoding on the
// fragment: repeated query fields honor their first occurrence.
func TestSearchFragmentFirstValueWins(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/htmx/search?q=hello&q=benchmark")
	if !strings.Contains(recorder.Body.String(), "Hello World") {
		t.Fatal("repeated q must honor the first value")
	}
	limited := request(t, handler, http.MethodGet, "/htmx/search?q=hello&limit=1&limit=50")
	if count(limited.Body.String(), "data-result=") != 1 {
		t.Fatal("repeated limit must honor the first value")
	}
}
