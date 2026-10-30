package calculator_test

import (
	"html/template"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

// fragmentTemplate parses the coordinated htmx fragment template. The
// handler wiring that executes this template in production belongs to the
// bindings packet; this test pins the template name and its data contract.
func fragmentTemplate(t *testing.T) *template.Template {
	t.Helper()
	path := filepath.Join("..", "..", "web", "templates", "calculator-fragment.html")
	parsed, err := template.ParseFiles(path)
	if err != nil {
		t.Fatalf("ParseFiles: %v", err)
	}
	return parsed
}

func renderFragment(t *testing.T, parsed *template.Template, fragment calculator.FragmentData) string {
	t.Helper()
	var out strings.Builder
	if err := parsed.ExecuteTemplate(&out, "calculator-fragment", fragment); err != nil {
		t.Fatalf("ExecuteTemplate: %v", err)
	}
	return out.String()
}

func TestCalculatorFragmentTemplateRendersEstimate(t *testing.T) {
	dataset, matrix := loadData(t)
	state, _ := decodeCalculatorState(t, dataset, "region=asean&country=id&city=jakarta&tab=savings&gross=3000")
	fragment := calculator.BuildFragment(dataset, matrix, state, "en")
	body := renderFragment(t, fragmentTemplate(t), fragment)
	for _, marker := range []string{
		`data-fragment="calculator"`, `data-input-form`, `data-encoded-state="`,
		`data-tool-estimate`, `data-cost`, `data-saving`, `data-min-role`,
		`value="jakarta"`, `value="3000"`, "<dl", "</dl>",
		`<select name="city"`, `<select name="tab"`, `data-filter-reset`,
	} {
		if !strings.Contains(body, marker) {
			t.Fatalf("fragment misses %q", marker)
		}
	}
	if strings.Contains(body, "data-fallback-state") || strings.Contains(body, "data-invalid-filters") {
		t.Fatal("estimate fragment must show neither the fallback nor the invalid state")
	}
}

func TestCalculatorFragmentTemplateRendersFallbackState(t *testing.T) {
	dataset, matrix := loadData(t)
	fragment := calculator.DecodeFragment(mustParseCalculatorQuery(t, "tab=min-role&target=Infinity&city=no-such-city"), dataset, matrix, "en")
	if !fragment.Empty {
		t.Fatal("infinite target must be the empty state")
	}
	if fragment.NeedsCity {
		t.Fatal("a reconciled-away city keeps the fallback behavior, not guidance")
	}
	body := renderFragment(t, fragmentTemplate(t), fragment)
	if !strings.Contains(body, "data-fallback-state") {
		t.Fatal("empty fragment must show the fallback state")
	}
	if strings.Contains(body, "data-tool-estimate") || strings.Contains(body, "data-estimate-guidance") {
		t.Fatal("empty fragment must render no estimate and no guidance")
	}
}

func TestCalculatorFragmentTemplateRendersGuidance(t *testing.T) {
	dataset, matrix := loadData(t)
	state, _ := decodeCalculatorState(t, dataset, "")
	fragment := calculator.BuildFragment(dataset, matrix, state, "en")
	if !fragment.NeedsCity {
		t.Fatal("a missing city selection must request guidance")
	}
	body := renderFragment(t, fragmentTemplate(t), fragment)
	if !strings.Contains(body, "data-estimate-guidance") {
		t.Fatal("guidance fragment must explain that a city selection is needed")
	}
	if strings.Contains(body, "data-tool-estimate") || strings.Contains(body, "data-fallback-state") {
		t.Fatal("guidance fragment must render neither the estimate nor the fallback state")
	}
}

func TestCalculatorFragmentTemplateRendersInvalidFilters(t *testing.T) {
	dataset, matrix := loadData(t)
	fragment := calculator.DecodeFragment(mustParseCalculatorQuery(t, "tab=cost&salary=5000"), dataset, matrix, "en")
	body := renderFragment(t, fragmentTemplate(t), fragment)
	if !strings.Contains(body, "data-invalid-filters") || !strings.Contains(body, "invalid_filters") {
		t.Fatal("invalid fragment must name the invalid_filters state")
	}
}
