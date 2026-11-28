package integration_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// TestDefaultStartServesTheRealCorpusOverHTTP starts the launcher's default
// configuration over httptest on the real repository. The real lesson answers
// 200 and the fixture-only lesson answers 404, so the default serves the corpus.
func TestDefaultStartServesTheRealCorpusOverHTTP(t *testing.T) {
	working, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd: %v", err)
	}
	noLauncher := func(string) (string, bool) { return "", false }
	cfg, err := web.ResolveConfig(nil, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	deps, err := web.SeedDeps(cfg, web.Sources{Environment: noLauncher, Root: os.DirFS, Working: working})
	if err != nil {
		t.Fatalf("SeedDeps: %v", err)
	}
	server := httptest.NewServer(web.NewServer(cfg, deps).Handler())
	t.Cleanup(server.Close)

	for path, want := range map[string]int{
		"/en/learn/courses/just-enough-python/learning/beginner": http.StatusOK,
		"/en/learn/courses/go-basics/learning/hello-world":       http.StatusNotFound,
	} {
		response, err := http.Get(server.URL + path)
		if err != nil {
			t.Fatalf("GET %s: %v", path, err)
		}
		_ = response.Body.Close()
		if response.StatusCode != want {
			t.Fatalf("GET %s = %d, want %d", path, response.StatusCode, want)
		}
	}
}

// TestDefaultStartRendersCopyControlsForRealFences checks the real pipeline's
// fenced-code contract over HTTP: a real Go fence on a published lesson carries
// its language label, the pre language, and a copy control.
func TestDefaultStartRendersCopyControlsForRealFences(t *testing.T) {
	working, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd: %v", err)
	}
	noLauncher := func(string) (string, bool) { return "", false }
	cfg, err := web.ResolveConfig(nil, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	deps, err := web.SeedDeps(cfg, web.Sources{Environment: noLauncher, Root: os.DirFS, Working: working})
	if err != nil {
		t.Fatalf("SeedDeps: %v", err)
	}
	server := httptest.NewServer(web.NewServer(cfg, deps).Handler())
	t.Cleanup(server.Close)

	response, err := http.Get(server.URL + "/en/learn/courses/backend-essentials-with-go/learning/beginner")
	if err != nil {
		t.Fatalf("GET lesson: %v", err)
	}
	defer func() { _ = response.Body.Close() }()
	raw, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("read lesson: %v", err)
	}
	body := string(raw)
	for _, want := range []string{`data-language="go"`, `data-code-language-label`, `data-copy="true"`} {
		if !strings.Contains(body, want) {
			t.Fatalf("real Go fence lacks %q", want)
		}
	}
}
