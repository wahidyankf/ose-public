package web_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// TestUnsafeIdentitiesAreNotFound locks the request-boundary half of the
// unsafe-identity contract: traversal, separators, NUL bytes, and unknown
// segments never resolve to content and never disclose source locations.
func TestUnsafeIdentitiesAreNotFound(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{
		"/en/learn/courses/go-basics/learning/.hidden",
		"/en/learn/courses/go-basics/learning/..",
		"/en/learn/courses/go-basics/learning/...",
		"/en/learn/courses/../go-basics",
		"/en/learn/courses/go-basics/learning/a%00b",
		"/en/learn/courses/go-basics/learning/a%2Fb",
		"/en/learn/courses/%2e%2e/nope",
		"/en/learn/paths/../courses",
		"/en/learn/courses/go-basics/learning/hello-world/extra",
		"/en/learn/courses/.hidden",
		"/en/learn/paths/a%20b",
	} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code == http.StatusOK {
			t.Fatalf("GET %s status = 200, want no content for unsafe identity", target)
		}
		for _, secret := range []string{"internal/", ".go:", "/home/", "127.0.0.1"} {
			if strings.Contains(recorder.Body.String(), secret) {
				t.Fatalf("GET %s response discloses %q", target, secret)
			}
		}
	}
}

// TestFirstValueQueryWins locks the codec contract the tools packets also
// rely on: raw query decoding keeps the first value for repeated fields,
// exactly as the old codecs implement it.
func TestFirstValueQueryWins(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/search?q=hello&q=benchmark")
	if recorder.Code != http.StatusOK {
		t.Fatalf("duplicate q status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "Hello World") {
		t.Fatal("duplicate q must honor the first value")
	}
	limited := request(t, handler, http.MethodGet, "/en/search?q=hello&limit=1&limit=50")
	if recorder.Code != http.StatusOK {
		t.Fatalf("duplicate limit status = %d, want 200", limited.Code)
	}
	if count(limited.Body.String(), "data-result=") != 1 {
		t.Fatal("duplicate limit must honor the first value")
	}
	pathed := request(t, handler, http.MethodGet, "/en/learn/courses/go-basics/learning/setup?path=backend-id&path=no-such-path")
	if !strings.Contains(pathed.Body.String(), `data-path-context="backend-id"`) {
		t.Fatal("duplicate path must honor the first value")
	}
}

// TestRedirectOrderAndNoLoop locks the ordered redirect middleware: the root
// enters the default locale, uppercase entries normalize once with the query
// preserved, inventory destinations keep the query, and unmatched routes stay
// missing on repeat without ever redirecting to themselves.
func TestRedirectOrderAndNoLoop(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	root := request(t, handler, http.MethodGet, "/")
	if root.Code != http.StatusPermanentRedirect || root.Header().Get("Location") != "/en" {
		t.Fatalf("root = %d %q, want 308 /en", root.Code, root.Header().Get("Location"))
	}
	upper := request(t, handler, http.MethodGet, "/EN/old-guide?from=local")
	if upper.Code != http.StatusPermanentRedirect || upper.Header().Get("Location") != "/en/old-guide?from=local" {
		t.Fatalf("uppercase inventory entry = %d %q, want one 308 to lowercase", upper.Code, upper.Header().Get("Location"))
	}
	inventory := request(t, handler, http.MethodGet, "/en/old-guide?from=local")
	if inventory.Code != http.StatusPermanentRedirect {
		t.Fatalf("inventory status = %d, want 308", inventory.Code)
	}
	destination := inventory.Header().Get("Location")
	if destination != "/en/learn/courses/go-basics/learning/hello-world?from=local" {
		t.Fatalf("inventory Location = %q, want canonical destination with query", destination)
	}
	landing := request(t, handler, http.MethodGet, "/en/learn/courses/go-basics/learning/hello-world?from=local")
	if landing.Code != http.StatusOK {
		t.Fatalf("redirect chain must terminate at content, got %d", landing.Code)
	}
	for _, target := range []string{"/ZZ/not-a-real-parity-page", "/en/not-a-real-parity-page"} {
		for repeat := 0; repeat < 2; repeat++ {
			recorder := request(t, handler, http.MethodGet, target)
			if recorder.Code != http.StatusNotFound {
				t.Fatalf("GET %s status = %d, want repeatable 404", target, recorder.Code)
			}
			if location := recorder.Header().Get("Location"); location == target {
				t.Fatalf("GET %s redirects to itself", target)
			}
		}
	}
}
