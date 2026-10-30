package web_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// TestHTMLResponsesAreNotStored locks the 004 common constraint: HTML and
// discovery responses use Cache-Control: no-store locally so authoring
// reloads stay observable.
func TestHTMLResponsesAreNotStored(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{
		"/en",
		"/en/learn/courses/go-basics/learning/hello-world",
		"/en/learn/courses/go-basics/learning/nope",
		"/en/search?q=hello",
		"/sitemap.xml",
		"/feed.xml",
		"/robots.txt",
	} {
		recorder := request(t, handler, http.MethodGet, target)
		if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
			t.Fatalf("GET %s Cache-Control = %q, want no-store", target, got)
		}
	}
}

// TestRedirectsAreNotStored extends the no-store contract to 308s, matching
// the manual wire recipe's redirect expectations.
func TestRedirectsAreNotStored(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{"/", "/EN?from=local", "/en/old-guide?from=local"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusPermanentRedirect {
			t.Fatalf("GET %s status = %d, want 308", target, recorder.Code)
		}
		if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
			t.Fatalf("GET %s Cache-Control = %q, want no-store", target, got)
		}
	}
}

// TestNotFoundHidesSourcePaths locks the privacy contract: the localized
// missing-page experience never discloses filesystem locations, handler
// internals, or listener addresses.
func TestNotFoundHidesSourcePaths(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{
		"/en/learn/courses/go-basics/learning/nope",
		"/id/learn/go-basics/nope",
		"/en/definitely-missing",
		"/robots-missing.txt",
	} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusNotFound {
			t.Fatalf("GET %s status = %d, want 404", target, recorder.Code)
		}
		for _, secret := range []string{"internal/", ".go:", "/home/", "127.0.0.1", "AYOKODING_WEB_"} {
			if strings.Contains(recorder.Body.String(), secret) {
				t.Fatalf("GET %s 404 body discloses %q", target, secret)
			}
		}
	}
}

// TestShellServesBothLocalesWithChrome locks AC-02 shell markers behind the
// route language: document language, header/footer/primary controls, skip
// link, focus indicator, viewport, responsive nav, theme hook, sidebar width,
// and the locale switch.
func TestShellServesBothLocalesWithChrome(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale)
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s status = %d, want 200", locale, recorder.Code)
		}
		body := recorder.Body.String()
		for _, marker := range []string{
			`lang="` + locale + `"`,
			`data-shell="header"`,
			`data-shell="footer"`,
			`<nav aria-label="primary">`,
			`href="#main"`,
			`id="main"`,
			`:focus-visible`,
			`name="viewport"`,
			`data-nav="mobile"`,
			`data-theme`,
			`--sidebar-width: 240px`,
			`data-locale-switch`,
			`data-locale-active`,
			`data-search-dialog`,
			`data-search-input`,
			`progress.js`,
		} {
			if !strings.Contains(body, marker) {
				t.Fatalf("/%s shell misses %q", locale, marker)
			}
		}
		if got := recorder.Header().Get("Content-Type"); got != "text/html; charset=utf-8" {
			t.Fatalf("/%s Content-Type = %q, want text/html", locale, got)
		}
	}
}

// TestConfigRejectsInvalidFixtureEnv locks the launcher contract: an unknown
// fixture through the environment fails instead of booting a fallback.
func TestConfigRejectsInvalidFixtureEnv(t *testing.T) {
	clearLauncherEnv(t)
	t.Setenv("AYOKODING_WEB_FIXTURE", "nope")
	if _, err := web.ResolveConfig(nil); err == nil {
		t.Fatal("unknown AYOKODING_WEB_FIXTURE must fail")
	}
}
