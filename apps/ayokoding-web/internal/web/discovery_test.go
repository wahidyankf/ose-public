package web_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// TestSitemapListsOnlyPublished locks the sitemap half of AC-10: a
// successful XML response listing canonical published routes, with drafts
// and removed routes absent.
func TestSitemapListsOnlyPublished(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/sitemap.xml")
	if recorder.Code != http.StatusOK {
		t.Fatalf("sitemap status = %d, want 200", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "application/xml; charset=utf-8" {
		t.Fatalf("sitemap Content-Type = %q", got)
	}
	body := recorder.Body.String()
	for _, marker := range []string{"<urlset", "/en/learn/courses/go-basics/learning/hello-world", "/id/learn/courses/go-basics/learning/hello-world"} {
		if !strings.Contains(body, marker) {
			t.Fatalf("sitemap misses %q", marker)
		}
	}
	for _, absent := range []string{"draft-note", "removed-page"} {
		if strings.Contains(body, absent) {
			t.Fatalf("sitemap must not list %q", absent)
		}
	}
}

// TestFeedExposesEligibleEntries locks the RSS half of AC-10: a successful
// feed response carrying the existing entries with canonical destinations,
// while drafts stay absent.
func TestFeedExposesEligibleEntries(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/feed.xml")
	if recorder.Code != http.StatusOK {
		t.Fatalf("feed status = %d, want 200", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "application/rss+xml; charset=utf-8" {
		t.Fatalf("feed Content-Type = %q, want application/rss+xml", got)
	}
	body := recorder.Body.String()
	for _, marker := range []string{"<rss", "<item>", "Hello World", "<language>en</language>", "<guid>"} {
		if !strings.Contains(body, marker) {
			t.Fatalf("feed misses %q", marker)
		}
	}
	if strings.Contains(body, "Draft") || strings.Contains(body, "draft-note") {
		t.Fatal("feed must not expose drafts")
	}
}

// TestDiscoveryUnavailableCatalogIsGeneric locks the failure half of the
// discovery contract: when the owned fixture cannot build the catalog, the
// sitemap and feed return a generic server error that names no filesystem
// location instead of masking the outage as an empty 200 page.
func TestDiscoveryUnavailableCatalogIsGeneric(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("unavailable-catalog")).Handler()
	for _, target := range []string{"/sitemap.xml", "/feed.xml"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusInternalServerError {
			t.Fatalf("GET %s status = %d, want 500 for unavailable catalog", target, recorder.Code)
		}
		for _, secret := range []string{"internal/", ".go", "/home/", "/tmp/", "content/", "catalog"} {
			if strings.Contains(recorder.Body.String(), secret) {
				t.Fatalf("GET %s 500 body discloses %q", target, secret)
			}
		}
		if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
			t.Fatalf("GET %s Cache-Control = %q, want no-store", target, got)
		}
	}
}

// TestContentUnavailableCatalogIsGeneric extends the same failure policy to
// page and search rendering: an unavailable catalog never masquerades as a
// 200 empty page or a 404 miss.
func TestContentUnavailableCatalogIsGeneric(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("unavailable-catalog")).Handler()
	for _, target := range []string{
		"/en/learn/courses/go-basics/learning/hello-world",
		"/en/learn/courses/go-basics",
		"/en/learn/courses",
		"/en/learn/paths/backend-id",
		"/en/search?q=hello",
		"/htmx/search?q=hello",
	} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusInternalServerError {
			t.Fatalf("GET %s status = %d, want 500 for unavailable catalog", target, recorder.Code)
		}
	}
}

// TestRobotsContractAndUnknownText locks the robots half of AC-10: stable
// plain-text crawling instructions, while any other text path keeps the
// normal not-found response.
func TestRobotsContractAndUnknownText(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/robots.txt")
	if recorder.Code != http.StatusOK {
		t.Fatalf("robots status = %d, want 200", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "text/plain; charset=utf-8" {
		t.Fatalf("robots Content-Type = %q", got)
	}
	for _, marker := range []string{"User-agent: *", "Allow: /", "Sitemap: /sitemap.xml"} {
		if !strings.Contains(recorder.Body.String(), marker) {
			t.Fatalf("robots misses %q", marker)
		}
	}
	unknown := request(t, handler, http.MethodGet, "/other.txt")
	if unknown.Code != http.StatusNotFound {
		t.Fatalf("unknown text path status = %d, want 404", unknown.Code)
	}
}
