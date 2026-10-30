package benchmark_test

import (
	"html/template"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

// fragmentTemplate parses the coordinated htmx fragment template. The
// handler wiring that executes this template in production belongs to the
// bindings packet; this test pins the template name and its data contract.
func fragmentTemplate(t *testing.T) *template.Template {
	t.Helper()
	path := filepath.Join("..", "..", "web", "templates", "benchmark-fragment.html")
	parsed, err := template.ParseFiles(path)
	if err != nil {
		t.Fatalf("ParseFiles: %v", err)
	}
	return parsed
}

func renderFragment(t *testing.T, parsed *template.Template, fragment benchmark.Fragment) string {
	t.Helper()
	var out strings.Builder
	if err := parsed.ExecuteTemplate(&out, "benchmark-fragment", fragment); err != nil {
		t.Fatalf("ExecuteTemplate: %v", err)
	}
	return out.String()
}

func TestBenchmarkFragmentTemplateRendersRows(t *testing.T) {
	dataset := loadDataset(t)
	fragment := benchmark.DecodeFragment(mustParseBenchmarkQuery(t, "harness=cursor"), dataset, "en")
	body := renderFragment(t, fragmentTemplate(t), fragment)
	for _, marker := range []string{
		`data-fragment="benchmark"`, `data-tool-filters`, `data-encoded-state="harness=cursor"`,
		`data-tool-results`, `data-count="29"`, `data-model="`,
		`value="cursor"`, `data-codec-note`, "<ol", "</ol>",
	} {
		if !strings.Contains(body, marker) {
			t.Fatalf("fragment misses %q", marker)
		}
	}
	if strings.Contains(body, "data-empty-state") || strings.Contains(body, "data-invalid-filters") {
		t.Fatal("row fragment must show neither the empty nor the invalid state")
	}
}

func TestBenchmarkFragmentTemplateRendersEmptyState(t *testing.T) {
	dataset := loadDataset(t)
	fragment := benchmark.BuildFragment(dataset, benchmark.UrlState{Tier: "no-such-tier"}, "en")
	body := renderFragment(t, fragmentTemplate(t), fragment)
	if !strings.Contains(body, "data-empty-state") {
		t.Fatal("empty fragment must show the empty state")
	}
	if strings.Contains(body, "data-tool-results") {
		t.Fatal("empty fragment must list no results")
	}
}

func TestBenchmarkFragmentTemplateRendersInvalidFilters(t *testing.T) {
	dataset := loadDataset(t)
	fragment := benchmark.DecodeFragment(mustParseBenchmarkQuery(t, "harness[cursor]=1"), dataset, "en")
	body := renderFragment(t, fragmentTemplate(t), fragment)
	if !strings.Contains(body, "data-invalid-filters") || !strings.Contains(body, "invalid_filters") {
		t.Fatal("invalid fragment must name the invalid_filters state")
	}
}
