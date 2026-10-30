package web_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func redirectTarget(t *testing.T, handler http.Handler, target string) (int, string) {
	t.Helper()
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, target, nil)
	handler.ServeHTTP(recorder, request)
	return recorder.Code, recorder.Header().Get("Location")
}

func TestOrderedRedirectLocaleEntryFirst(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	for source, destination := range map[string]string{
		"/":                 "/en",
		"/EN":               "/en",
		"/ID":               "/id",
		"/EN/learn/courses": "/en/learn/courses",
	} {
		code, location := redirectTarget(t, handler, source)
		if code != http.StatusPermanentRedirect {
			t.Fatalf("%s status = %d, want 308", source, code)
		}
		if location != destination {
			t.Fatalf("%s Location = %q, want %q", source, location, destination)
		}
	}
}

func TestOrderedRedirectContentNamespaceStripsC(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	code, location := redirectTarget(t, handler, "/en/c/learn/software-engineering")
	if code != http.StatusPermanentRedirect {
		t.Fatalf("content-namespace status = %d, want 308", code)
	}
	if location != "/en/learn/software-engineering" {
		t.Fatalf("content-namespace Location = %q", location)
	}
}

func TestOrderedRedirectLearnReorgTemporaryUses307(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	code, location := redirectTarget(t, handler, "/en/learn/software-engineering/software-architecture/by-example")
	if code != http.StatusTemporaryRedirect {
		t.Fatalf("learn-reorg temporary status = %d, want 307", code)
	}
	if location != "/en/learn/software-engineering/software-architecture/by-example/overview" {
		t.Fatalf("learn-reorg Location = %q", location)
	}
}

func TestOrderedRedirectCourseRehomeWinsOverLegacyBucket(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	code, location := redirectTarget(t, handler, "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner")
	if code != http.StatusPermanentRedirect {
		t.Fatalf("course-rehome status = %d, want 308", code)
	}
	if location != "/en/learn/courses/just-enough-python/learning/beginner" {
		t.Fatalf("course-rehome Location = %q", location)
	}
}

func TestOrderedRedirectLearnHomeExactOnly(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	code, location := redirectTarget(t, handler, "/en/learn/overview")
	if code != http.StatusPermanentRedirect || location != "/en/learn" {
		t.Fatalf("learn-home = %d %q, want 308 /en/learn", code, location)
	}
}

func TestOrderedRedirectThreeBucketLast(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	code, location := redirectTarget(t, handler, "/en/learn/software-engineering/overview")
	if code != http.StatusPermanentRedirect {
		t.Fatalf("three-bucket status = %d, want 308", code)
	}
	if location != "/en/learn/legacy/software-engineering/overview" {
		t.Fatalf("three-bucket Location = %q", location)
	}
}

func TestOrderedRedirectPreservesQuery(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	code, location := redirectTarget(t, handler, "/en/learn/software-engineering/overview?from=nav")
	if code != http.StatusPermanentRedirect {
		t.Fatalf("query status = %d, want 308", code)
	}
	if location != "/en/learn/legacy/software-engineering/overview?from=nav" {
		t.Fatalf("query Location = %q", location)
	}
}

func TestOrderedRedirectRetiredRootsToCourses(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, web.SeedFixtureDeps("parity")).Handler()
	for _, source := range []string{
		"/en/learn/fundamentally-strong",
		"/en/learn/fundamentally-strong/software-engineer",
		"/en/learn/fundamentally-strong/software-engineer/overview",
	} {
		code, location := redirectTarget(t, handler, source)
		if code != http.StatusPermanentRedirect || location != "/en/learn/courses" {
			t.Fatalf("%s = %d %q, want 308 /en/learn/courses", source, code, location)
		}
	}
}
