package web_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func legacyDeps() web.Deps {
	deps := web.SeedFixtureDeps("parity")
	pages := append(deps.Content.Published("en"), content.Page{
		Locale: "en", Course: "legacy", Slug: "software-engineering/testing/tools/vitest/by-example/intermediate",
		Title: "Intermediate", Description: "Legacy leaf", Weight: 1, BodyHTML: "<h1>Intermediate</h1><p>Legacy body.</p>",
	})
	fresh := content.NewFakeStore(pages)
	fresh.ShowDrafts(false)
	deps.Content = fresh
	return deps
}

func TestSafePathAcceptsRoutablePaths(t *testing.T) {
	for _, slug := range []string{"hello-world", "setup", "v1.0", "my_slug", "capstone/overview", "software-engineering/testing/tools/vitest/by-example/intermediate"} {
		if !content.SafePath(slug) {
			t.Fatalf("SafePath(%q) = false, want true", slug)
		}
	}
}

func TestSafePathRejectsTraversal(t *testing.T) {
	for _, slug := range []string{"", ".", "..", "../setup", "a/../b", "a//b", "/leading", "trailing/", `back\slash`, "has space", "has:colon"} {
		if content.SafePath(slug) {
			t.Fatalf("SafePath(%q) = true, want false", slug)
		}
	}
}

func TestLegacyPageServesLikeLesson(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, legacyDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/legacy/software-engineering/testing/tools/vitest/by-example/intermediate")
	if recorder.Code != http.StatusOK {
		t.Fatalf("legacy status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "Intermediate") || !strings.Contains(body, "Legacy body") {
		t.Fatalf("legacy body misses title or article, got %q", body)
	}
	if !strings.Contains(body, `lang="en"`) {
		t.Fatal("legacy page must keep the route locale")
	}
}

func TestLegacyMissingPageIsLocalizedNotFound(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, legacyDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/legacy/no/such/page")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("missing legacy status = %d, want 404", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `lang="en"`) {
		t.Fatal("legacy not-found must keep the route locale")
	}
}

func TestLegacyUnavailableCatalogIsNotFound(t *testing.T) {
	deps := web.SeedFixtureDeps("unavailable-catalog")
	handler := web.NewServer(web.Config{Port: 3102}, deps).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/legacy/software-engineering/testing")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("unavailable legacy status = %d, want 404", recorder.Code)
	}
}

func TestUnsafeLessonSlugIsNotFound(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/courses/go-basics/learning/has%20space")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("unsafe lesson status = %d, want 404", recorder.Code)
	}
}

func TestUnsafeLegacyRestIsNotFound(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, legacyDeps()).Handler()
	for _, target := range []string{"/en/learn/legacy/has%20space", "/en/learn/legacy/no/such/page"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusNotFound {
			t.Fatalf("%s status = %d, want 404", target, recorder.Code)
		}
	}
	bare := request(t, handler, http.MethodGet, "/en/learn/legacy/")
	if bare.Code != http.StatusPermanentRedirect {
		t.Fatalf("/en/learn/legacy/ status = %d, want 308 to the canonical path", bare.Code)
	}
	if location := bare.Header().Get("Location"); location != "/en/learn/legacy" {
		t.Fatalf("/en/learn/legacy/ Location = %q, want canonical path", location)
	}
	canonical := request(t, handler, http.MethodGet, "/en/learn/legacy")
	if canonical.Code != http.StatusNotFound {
		t.Fatalf("/en/learn/legacy status = %d, want 404", canonical.Code)
	}
}
