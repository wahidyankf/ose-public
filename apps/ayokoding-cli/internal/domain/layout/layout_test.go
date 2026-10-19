package layout_test

import (
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
)

// courseWithUnits is an opted-in course with one example, one kata, and the
// capstone root, every unit covered.
func courseWithUnits() fstest.MapFS {
	return fstest.MapFS{
		"learning/code/ex-01-hello/run.yaml":          {Data: []byte("schema: ayokoding.run/v1\n")},
		"learning/code/ex-01-hello/example.py":        {Data: []byte("print('hi')\n")},
		"drilling/code/kata-01-nulls/before/kata.sql": {Data: []byte("SELECT 1\n")},
		"drilling/code/kata-01-nulls/run.yaml":        {Data: []byte("schema: ayokoding.run/v1\n")},
		"learning/capstone/code/run.yaml":             {Data: []byte("schema: ayokoding.run/v1\n")},
		"learning/capstone/code/app/server.py":        {Data: []byte("app = 1\n")},
		"learning/capstone/code/stage-02/worker.py":   {Data: []byte("w = 2\n")},
		"learning/code/README.md":                     {Data: []byte("# shared\n")},
		"learning/code/requirements.lock":             {Data: []byte("a==1\n")},
		"learning/lessons/hello.md":                   {Data: []byte("# Hello\n")},
	}
}

// TestDiscoverFindsExamplesKatasAndCapstone requires unit discovery across
// the three canonical roots with no finding on a clean course.
func TestDiscoverFindsExamplesKatasAndCapstone(t *testing.T) {
	units, findings := layout.Discover("demo", courseWithUnits())
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
	if len(units) != 3 {
		t.Fatalf("units=%+v, want 3", units)
	}
	want := map[string]string{
		"learning/code/ex-01-hello":   "example",
		"drilling/code/kata-01-nulls": "kata",
		"learning/capstone/code":      "capstone",
	}
	for _, unit := range units {
		if unit.Course != "demo" {
			t.Fatalf("unit=%+v, want course demo", unit)
		}
		kind, ok := want[unit.Path]
		if !ok {
			t.Fatalf("unit=%+v, want a canonical unit", unit)
		}
		if unit.Kind != kind {
			t.Fatalf("unit=%+v, want kind %q", unit, kind)
		}
		delete(want, unit.Path)
	}
	if len(want) != 0 {
		t.Fatalf("missing units=%q", want)
	}
}

// TestIsOptedIn requires any run.yaml anywhere to opt the course in.
func TestIsOptedIn(t *testing.T) {
	if !layout.IsOptedIn(courseWithUnits()) {
		t.Fatalf("covered course reads as not opted in")
	}
	misplaced := fstest.MapFS{
		"learning/run.yaml": {Data: []byte("schema: ayokoding.run/v1\n")},
	}
	if !layout.IsOptedIn(misplaced) {
		t.Fatalf("misplaced run.yaml does not opt the course in")
	}
	if layout.IsOptedIn(fstest.MapFS{"learning/lessons/hi.md": {Data: []byte("# Hi\n")}}) {
		t.Fatalf("course without a run.yaml reads as opted in")
	}
}

// TestDiscoverReportsFlatExample requires a flat ex-NN file to be a finding.
func TestDiscoverReportsFlatExample(t *testing.T) {
	files := fstest.MapFS{
		"learning/code/ex-03-loops.py":       {Data: []byte("print(1)\n")},
		"learning/code/ex-01-hello/run.yaml": {Data: []byte("schema: ayokoding.run/v1\n")},
	}
	_, findings := layout.Discover("demo", files)
	if len(findings) != 1 || findings[0].Code != finding.LayoutFlatExample {
		t.Fatalf("findings=%+v, want one flat-example", findings)
	}
	if findings[0].Path != "learning/code/ex-03-loops.py" || findings[0].Course != "demo" {
		t.Fatalf("finding=%+v, want the flat file named", findings[0])
	}
}

// TestDiscoverReportsUnplacedCode requires nested and non-unit code dirs to
// be findings while shared files stay silent.
func TestDiscoverReportsUnplacedCode(t *testing.T) {
	files := fstest.MapFS{
		"learning/coroutines/code/worker.py": {Data: []byte("w = 1\n")},
		"learning/code/scratch/notes.py":     {Data: []byte("n = 1\n")},
		"learning/code/README.md":            {Data: []byte("# shared\n")},
		"code/main.py":                       {Data: []byte("print(1)\n")},
	}
	_, findings := layout.Discover("demo", files)
	codes := map[string]bool{}
	for _, found := range findings {
		codes[found.Code+":"+found.Path] = true
	}
	for _, want := range []string{
		"ayokoding.layout.unplaced-code:learning/coroutines/code",
		"ayokoding.layout.unplaced-code:learning/code/scratch",
		"ayokoding.layout.unplaced-code:code",
	} {
		if !codes[want] {
			t.Fatalf("findings=%+v, want %q", findings, want)
		}
	}
	if len(findings) != 3 {
		t.Fatalf("findings=%+v, want exactly the three code dirs", findings)
	}
}

// TestMissingSpecs requires a unit without a run spec to be a finding.
func TestMissingSpecs(t *testing.T) {
	files := fstest.MapFS{
		"learning/code/ex-04-maps/main.py": {Data: []byte("m = {}\n")},
	}
	units, _ := layout.Discover("demo", files)
	if len(units) != 1 {
		t.Fatalf("units=%+v, want the uncovered unit", units)
	}
	findings := layout.MissingSpecs("demo", files, units)
	if len(findings) != 1 || findings[0].Code != finding.LayoutMissingRunspec {
		t.Fatalf("findings=%+v, want one missing-run-spec", findings)
	}
	if findings[0].Path != "learning/code/ex-04-maps" {
		t.Fatalf("finding=%+v, want the unit named", findings[0])
	}
	if report := layout.MissingSpecs("demo", courseWithUnits(), mustUnits(t, "demo", courseWithUnits())); len(report) != 0 {
		t.Fatalf("covered course reports %+v, want none", report)
	}
}

// mustUnits discovers units or fails the test.
func mustUnits(t *testing.T, course string, files fstest.MapFS) []layout.Unit {
	t.Helper()
	units, findings := layout.Discover(course, files)
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
	return units
}

// TestDiscoverReportsMisplacedSpec requires a run spec outside a unit folder
// to be a finding.
func TestDiscoverReportsMisplacedSpec(t *testing.T) {
	files := fstest.MapFS{
		"learning/run.yaml":                  {Data: []byte("schema: ayokoding.run/v1\n")},
		"learning/code/ex-01-hello/run.yaml": {Data: []byte("schema: ayokoding.run/v1\n")},
	}
	_, findings := layout.Discover("demo", files)
	if len(findings) != 1 || findings[0].Code != finding.LayoutMisplacedSpec {
		t.Fatalf("findings=%+v, want one misplaced-run-spec", findings)
	}
	if findings[0].Path != "learning/run.yaml" {
		t.Fatalf("finding=%+v, want the stray spec named", findings[0])
	}
}

// TestIsApplicable requires a code dir with files or a code fence to count.
func TestIsApplicable(t *testing.T) {
	if !layout.IsApplicable(courseWithUnits()) {
		t.Fatalf("course with code reads as not applicable")
	}
	fences := fstest.MapFS{
		"learning/lessons/fenced.md": {Data: []byte("# T\n\n```python\nprint(1)\n```\n")},
	}
	if !layout.IsApplicable(fences) {
		t.Fatalf("course with a code fence reads as not applicable")
	}
	prose := fstest.MapFS{
		"learning/lessons/prose.md": {Data: []byte("# T\n\nJust words.\n")},
	}
	if layout.IsApplicable(prose) {
		t.Fatalf("prose-only course reads as applicable")
	}
}
