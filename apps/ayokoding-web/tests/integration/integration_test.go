package integration_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func fixturePath(t *testing.T, name string) string {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(file), "..", "fixtures", name)
}

func liveServer(t *testing.T) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(web.NewServer(web.Config{Port: 0}, web.SeedFixtureDeps("parity")).Handler())
	t.Cleanup(server.Close)
	return server
}

func noRedirectClient() *http.Client {
	return &http.Client{
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
}

func TestLiveHomeServesLocale(t *testing.T) {
	server := liveServer(t)
	for _, locale := range []string{"en", "id"} {
		response, err := http.Get(server.URL + "/" + locale) //nolint:gosec,noctx
		if err != nil {
			t.Fatalf("GET /%s: %v", locale, err)
		}
		body := readBody(t, response)
		if response.StatusCode != http.StatusOK {
			t.Fatalf("/%s status = %d, want 200", locale, response.StatusCode)
		}
		if !strings.Contains(body, `lang="`+locale+`"`) {
			t.Fatalf("/%s misses document language", locale)
		}
	}
}

func TestLiveRootRedirectsWithoutLoop(t *testing.T) {
	server := liveServer(t)
	response, err := noRedirectClient().Get(server.URL + "/") //nolint:gosec,noctx
	if err != nil {
		t.Fatalf("GET /: %v", err)
	}
	_ = response.Body.Close()
	if response.StatusCode != http.StatusPermanentRedirect {
		t.Fatalf("root status = %d, want 308", response.StatusCode)
	}
	location, _ := response.Location()
	if location == nil || location.Path != "/en" {
		t.Fatalf("root Location = %v, want /en", location)
	}
}

func TestLiveInventoryRedirects(t *testing.T) {
	raw, err := os.ReadFile(fixturePath(t, "redirects.json"))
	if err != nil {
		t.Fatalf("read redirects fixture: %v", err)
	}
	var inventory map[string]string
	if err := json.Unmarshal(raw, &inventory); err != nil {
		t.Fatalf("decode redirects fixture: %v", err)
	}
	if len(inventory) == 0 {
		t.Fatal("redirect inventory fixture must not be empty")
	}
	server := liveServer(t)
	for old, canonical := range inventory {
		response, err := noRedirectClient().Get(server.URL + old + "?from=local") //nolint:gosec,noctx
		if err != nil {
			t.Fatalf("GET %s: %v", old, err)
		}
		_ = response.Body.Close()
		if response.StatusCode != http.StatusPermanentRedirect {
			t.Fatalf("%s status = %d, want 308", old, response.StatusCode)
		}
		location, _ := response.Location()
		if location == nil || location.Path != canonical || location.Query().Get("from") != "local" {
			t.Fatalf("%s Location = %v, want %s?from=local", old, location, canonical)
		}
	}
}

func TestLiveLessonAndDraft(t *testing.T) {
	server := liveServer(t)
	response, err := http.Get(server.URL + "/en/learn/courses/go-basics/learning/hello-world") //nolint:gosec,noctx
	if err != nil {
		t.Fatalf("GET lesson: %v", err)
	}
	body := readBody(t, response)
	if response.StatusCode != http.StatusOK || !strings.Contains(body, "Hello World") {
		t.Fatalf("lesson = %d, want 200 with title", response.StatusCode)
	}
	draft, err := http.Get(server.URL + "/en/learn/courses/go-basics/learning/draft-note") //nolint:gosec,noctx
	if err != nil {
		t.Fatalf("GET draft: %v", err)
	}
	_ = readBody(t, draft)
	if draft.StatusCode != http.StatusNotFound {
		t.Fatalf("draft status = %d, want 404", draft.StatusCode)
	}
}

func TestFixtureVectorsDecode(t *testing.T) {
	benchRaw, err := os.ReadFile(fixturePath(t, "benchmark-vectors.json"))
	if err != nil {
		t.Fatalf("read benchmark fixture: %v", err)
	}
	var benchVectors map[string]benchmark.Result
	if err := json.Unmarshal(benchRaw, &benchVectors); err != nil {
		t.Fatalf("decode benchmark fixture: %v", err)
	}
	engine := benchmark.NewFakeEngine(benchVectors)
	result := engine.Score(benchmark.Filters{UseCase: "chat", PriceBand: "mid"})
	if len(result.Models) != 2 || result.Models[0].Name != "Model B" {
		t.Fatalf("fixture vector result = %+v, want ordered Model B first", result)
	}

	calcRaw, err := os.ReadFile(fixturePath(t, "calculator-vectors.json"))
	if err != nil {
		t.Fatalf("read calculator fixture: %v", err)
	}
	var calcVectors map[string]calculator.Estimate
	if err := json.Unmarshal(calcRaw, &calcVectors); err != nil {
		t.Fatalf("decode calculator fixture: %v", err)
	}
	calc := calculator.NewFakeEngine(calcVectors)
	estimate := calc.Compute(calculator.Inputs{City: "jakarta", Role: "mid", Mode: "standard", Workers: 1})
	if estimate.MonthlyCostUSD != 900 || estimate.MinRole != "mid" {
		t.Fatalf("fixture vector estimate = %+v, want costs 900 role mid", estimate)
	}
}

func TestFixtureLessonFrontmatter(t *testing.T) {
	raw, err := os.ReadFile(fixturePath(t, filepath.Join("lessons", "hello-world.en.md")))
	if err != nil {
		t.Fatalf("read lesson fixture: %v", err)
	}
	front, body := content.SplitFrontmatter(string(raw))
	meta, err := content.ParseFrontmatter(front)
	if err != nil {
		t.Fatalf("ParseFrontmatter: %v", err)
	}
	if meta["title"] != "Hello World" {
		t.Fatalf("title = %v, want Hello World", meta["title"])
	}
	if !strings.Contains(body, "# Hello") {
		t.Fatalf("body misses markdown heading: %q", body)
	}
}
