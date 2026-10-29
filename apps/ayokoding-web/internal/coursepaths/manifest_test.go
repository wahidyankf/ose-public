package coursepaths_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
)

const validManifest = `{
  "pathId": "careers/fundamentally-strong/software-engineer",
  "arc": "fundamentally-strong",
  "title": "Fundamentally Strong Software Engineer",
  "description": "Strong fundamentals.",
  "goals": ["capstone-solid-core"],
  "assumes": [],
  "phases": [
    {
      "id": "programming-foundations",
      "title": "Programming foundations",
      "kind": "core",
      "outcome": {"can": "write programs"},
      "courses": ["just-enough-python", {"id": "just-enough-bash", "framing": {"intro": "Start here."}}]
    },
    {
      "id": "first-working-software",
      "title": "Building working software",
      "kind": "core",
      "outcome": {"can": "build working software", "cannotYet": "explain the theory"},
      "courses": ["sql-essentials", "backend-essentials"]
    },
    {
      "id": "editor-and-shell",
      "title": "Editor and shell workflow",
      "kind": "extension",
      "courses": ["just-enough-nvim"]
    }
  ]
}`

const markedManifest = `{
  "pathId": "skills/sharia-accounting",
  "arc": "immediately-effective",
  "title": "Sharia Accounting",
  "description": "A practical accounting path.",
  "restructurePendingIn": "plan-06",
  "assumes": [],
  "phases": [
    {"id": "all-courses", "title": "Sharia Accounting", "kind": "core",
     "courses": ["accounting-foundations", "sharia-ledger-system-architecture"]}
  ]
}`

func TestValidatePathIDVariableDepth(t *testing.T) {
	for _, id := range []string{
		"careers/fundamentally-strong/software-engineer",
		"careers/interview-ready/software-engineer",
		"skills/sharia-accounting",
		"skills/conventional-erp",
		"careers/a/b/c",
	} {
		if err := coursepaths.ValidatePathID(id); err != nil {
			t.Fatalf("ValidatePathID(%q) = %v, want nil", id, err)
		}
	}
}

func TestValidatePathIDRejectsUnsafe(t *testing.T) {
	for _, id := range []string{
		"",
		"careers",
		"skills/",
		"/skills/x",
		"careers//x",
		"careers/x/",
		"careers/../x",
		"careers/./x",
		`careers/a\b`,
		"careers/UPPER",
		"careers/has space",
		"other/x",
		"careers/x?path=y",
	} {
		if err := coursepaths.ValidatePathID(id); err == nil {
			t.Fatalf("ValidatePathID(%q) = nil, want an error", id)
		}
	}
}

func TestParseManifestPhaseOrderAndCourseOrder(t *testing.T) {
	manifest, err := coursepaths.ParseManifest([]byte(validManifest))
	if err != nil {
		t.Fatalf("ParseManifest: %v", err)
	}
	if len(manifest.Phases) != 3 || manifest.Phases[0].ID != "programming-foundations" {
		t.Fatalf("phases = %+v, want manifest order", manifest.Phases)
	}
	want := []string{"just-enough-python", "just-enough-bash", "sql-essentials", "backend-essentials", "just-enough-nvim"}
	if strings.Join(manifest.CourseOrder, ",") != strings.Join(want, ",") {
		t.Fatalf("courseOrder = %q, want %q", manifest.CourseOrder, want)
	}
	if manifest.Phases[0].Kind != "core" || !manifest.Phases[0].HasOutcome {
		t.Fatalf("first phase = %+v, want core with outcome", manifest.Phases[0])
	}
	if manifest.Phases[2].Kind != "extension" || manifest.Phases[2].HasOutcome {
		t.Fatalf("extension phase = %+v, want no outcome", manifest.Phases[2])
	}
}

func TestParseManifestPreservesFraming(t *testing.T) {
	manifest, err := coursepaths.ParseManifest([]byte(validManifest))
	if err != nil {
		t.Fatalf("ParseManifest: %v", err)
	}
	if len(manifest.Phases) < 1 || len(manifest.Phases[0].Courses) < 2 {
		t.Fatalf("phases = %+v, want framed second course", manifest.Phases)
	}
	framed := manifest.Phases[0].Courses[1]
	if framed.ID != "just-enough-bash" || !framed.HasFraming || framed.Intro != "Start here." {
		t.Fatalf("framed ref = %+v, want id with intro", framed)
	}
	if plain := manifest.Phases[0].Courses[0]; plain.HasFraming || plain.ID != "just-enough-python" {
		t.Fatalf("plain ref = %+v, want bare id", plain)
	}
}

func TestParseManifestRejectsCoreWithoutOutcome(t *testing.T) {
	raw := `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D",
	  "phases": [{"id": "p", "title": "P", "kind": "core", "courses": ["c"]}]}`
	if _, err := coursepaths.ParseManifest([]byte(raw)); err == nil {
		t.Fatal("core phase without outcome must fail")
	}
}

func TestParseManifestRejectsUnexpectedMarker(t *testing.T) {
	raw := `{"pathId": "careers/x", "arc": "a", "title": "T", "description": "D",
	  "restructurePendingIn": "plan-06",
	  "phases": [{"id": "all-courses", "title": "T", "kind": "core", "courses": ["c"]}]}`
	if _, err := coursepaths.ParseManifest([]byte(raw)); err == nil {
		t.Fatal("marker outside the skills allowlist must fail")
	}
}

func TestParseManifestAcceptsTransitionalMarker(t *testing.T) {
	manifest, err := coursepaths.ParseManifest([]byte(markedManifest))
	if err != nil {
		t.Fatalf("ParseManifest marked: %v", err)
	}
	if !manifest.HasMarker || manifest.RestructurePendingIn != "plan-06" {
		t.Fatalf("manifest = %+v, want plan-06 marker", manifest)
	}
	if len(manifest.Phases) != 1 || len(manifest.CourseOrder) != 2 {
		t.Fatalf("marked manifest = %+v, want one all-courses phase", manifest)
	}
}

func TestParseManifestRejectsMarkedShapeViolation(t *testing.T) {
	raw := `{"pathId": "skills/sharia-accounting", "arc": "a", "title": "T", "description": "D",
	  "restructurePendingIn": "plan-06",
	  "phases": [
	    {"id": "one", "title": "One", "kind": "core", "courses": ["c"]},
	    {"id": "two", "title": "Two", "kind": "core", "courses": ["d"]}
	  ]}`
	if _, err := coursepaths.ParseManifest([]byte(raw)); err == nil {
		t.Fatal("marked manifest with two phases must fail")
	}
}

func TestLoadDirSkipsMalformedWithDiagnostic(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "careers"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "careers", "good.json"), []byte(validManifest), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "broken-manifest.json"), []byte("{nope"), 0o600); err != nil {
		t.Fatal(err)
	}
	paths, diagnostics := coursepaths.LoadManifestDir(root)
	if len(paths) != 1 || paths[0].PathID != "careers/fundamentally-strong/software-engineer" {
		t.Fatalf("paths = %+v, want the one valid manifest", paths)
	}
	if len(diagnostics) != 1 || !strings.Contains(diagnostics[0], "broken-manifest.json") {
		t.Fatalf("diagnostics = %q, want the malformed file", diagnostics)
	}
}

func TestLoadDirMissingRootIsEmptyState(t *testing.T) {
	paths, diagnostics := coursepaths.LoadManifestDir(filepath.Join(t.TempDir(), "no-such-root"))
	if len(paths) != 0 {
		t.Fatalf("paths = %+v, want empty state", paths)
	}
	if len(diagnostics) != 1 {
		t.Fatalf("diagnostics = %q, want one missing-root diagnostic", diagnostics)
	}
}

func TestActivePathContextFallback(t *testing.T) {
	store := fixtureStore()
	if id, ok := store.ResolvePathFallback("backend-id", "go-basics"); !ok || id != "backend-id" {
		t.Fatalf("ResolvePathFallback = %q %v, want backend-id true", id, ok)
	}
	if _, ok := store.ResolvePathFallback("no-such-path", "go-basics"); ok {
		t.Fatal("unknown path must fall back to canonical")
	}
	if _, ok := store.ResolvePathFallback("backend-id", "outline-only"); ok {
		t.Fatal("nonmember course must fall back to canonical")
	}
	if _, ok := store.ResolvePathFallback("", "go-basics"); ok {
		t.Fatal("absent path must fall back to canonical")
	}
}

func TestValidatePathIDKebabEdges(t *testing.T) {
	for _, id := range []string{"careers/-lead", "skills/trail-", "careers/a--b", "skills/a_b", "skills/a b", "skills/-", "careers/UPPER/deep", "skills/a/B"} {
		if err := coursepaths.ValidatePathID(id); err == nil {
			t.Fatalf("ValidatePathID(%q) = nil, want an error", id)
		}
	}
	if err := coursepaths.ValidatePathID("skills/a-1-b2/c3"); err != nil {
		t.Fatalf("ValidatePathID digits/hyphens = %v, want nil", err)
	}
}

func TestActivePathContextRejectsUnsafeIdentifiers(t *testing.T) {
	store := fixtureStore()
	for _, id := range []string{"../x", "a/b", ".", "..", `a\b`, "a..b", "backend-id/../x"} {
		if _, ok := store.ResolvePathFallback(id, "go-basics"); ok {
			t.Fatalf("ResolvePathFallback(%q) must fall back to canonical", id)
		}
	}
}

func manifestWith(phase, extra string) string {
	return `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D", "phases": [` + phase + `]}` + extra
}

func TestParseManifestRejectsInvalidFiles(t *testing.T) {
	cases := map[string]string{
		"malformed JSON":        `{nope`,
		"unknown field":         `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D", "bogus": 1, "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"bad path id":           `{"pathId": "bad", "arc": "a", "title": "T", "description": "D", "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"missing arc":           `{"pathId": "skills/x", "title": "T", "description": "D", "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"missing title":         `{"pathId": "skills/x", "arc": "a", "description": "D", "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"missing description":   `{"pathId": "skills/x", "arc": "a", "title": "T", "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"unknown marker":        `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D", "restructurePendingIn": "plan-99", "phases": [{"id": "all-courses", "title": "T", "kind": "core", "courses": ["c"]}]}`,
		"marked with goals":     `{"pathId": "skills/sharia-accounting", "arc": "a", "title": "T", "description": "D", "restructurePendingIn": "plan-06", "goals": ["c"], "phases": [{"id": "all-courses", "title": "T", "kind": "core", "courses": ["c"]}]}`,
		"bad assumes":           `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D", "assumes": ["BAD"], "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"bad goals":             `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D", "goals": ["a/b"], "phases": [{"id": "p", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}]}`,
		"no phases":             `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D", "phases": []}`,
		"bad phase id":          manifestWith(`{"id": "BAD", "title": "P", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}`, ""),
		"phase without title":   manifestWith(`{"id": "p", "title": "", "kind": "core", "outcome": {"can": "c"}, "courses": ["c"]}`, ""),
		"bad phase kind":        manifestWith(`{"id": "p", "title": "P", "kind": "other", "courses": ["c"]}`, ""),
		"outcome without can":   manifestWith(`{"id": "p", "title": "P", "kind": "core", "outcome": {}, "courses": ["c"]}`, ""),
		"phase without courses": manifestWith(`{"id": "p", "title": "P", "kind": "extension", "courses": []}`, ""),
		"bad course string":     manifestWith(`{"id": "p", "title": "P", "kind": "extension", "courses": ["BAD"]}`, ""),
		"numeric course ref":    manifestWith(`{"id": "p", "title": "P", "kind": "extension", "courses": [42]}`, ""),
		"course unknown field":  manifestWith(`{"id": "p", "title": "P", "kind": "extension", "courses": [{"id": "c", "bogus": 1}]}`, ""),
		"framed bad id":         manifestWith(`{"id": "p", "title": "P", "kind": "extension", "courses": [{"id": "BAD"}]}`, ""),
	}
	for name, raw := range cases {
		if _, err := coursepaths.ParseManifest([]byte(raw)); err == nil {
			t.Fatalf("%s: ParseManifest = nil, want an error", name)
		}
	}
}

func TestParseManifestFramingOutro(t *testing.T) {
	raw := `{"pathId": "skills/x", "arc": "a", "title": "T", "description": "D",
	  "phases": [{"id": "p", "title": "P", "kind": "extension",
	    "courses": [{"id": "c", "framing": {"intro": "In.", "outro": "Out."}}]}]}`
	manifest, err := coursepaths.ParseManifest([]byte(raw))
	if err != nil {
		t.Fatalf("ParseManifest: %v", err)
	}
	ref := manifest.Phases[0].Courses[0]
	if !ref.HasFraming || ref.Intro != "In." || ref.Outro != "Out." {
		t.Fatalf("framed ref = %+v, want intro and outro", ref)
	}
}

func TestLoadDirNestedLayoutAndUnreadable(t *testing.T) {
	root := t.TempDir()
	deep := filepath.Join(root, "careers", "fundamentally-strong")
	if err := os.MkdirAll(deep, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(deep, "software-engineer.json"), []byte(validManifest), 0o600); err != nil {
		t.Fatal(err)
	}
	second := `{"pathId": "skills/a-path", "arc": "a", "title": "A", "description": "D",
	  "phases": [{"id": "p", "title": "P", "kind": "extension", "courses": ["c"]}]}`
	if err := os.MkdirAll(filepath.Join(root, "skills"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "skills", "a-path.json"), []byte(second), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "notes.txt"), []byte("not a manifest"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("no-such-target", filepath.Join(root, "ghost.json")); err != nil {
		t.Fatal(err)
	}
	paths, diagnostics := coursepaths.LoadManifestDir(root)
	if len(paths) != 2 || paths[0].PathID != "careers/fundamentally-strong/software-engineer" || paths[1].PathID != "skills/a-path" {
		t.Fatalf("paths = %+v, want both nested manifests in order", paths)
	}
	if len(diagnostics) != 1 || !strings.Contains(diagnostics[0], "ghost.json") {
		t.Fatalf("diagnostics = %q, want the unreadable file", diagnostics)
	}
}

func TestCheckPrerequisiteOrderViolation(t *testing.T) {
	order := []string{"go-web", "go-basics"}
	prereqs := map[string][]string{"go-web": {"go-basics"}}
	violations := coursepaths.CheckPrerequisiteOrder(order, prereqs)
	if len(violations) != 1 || violations[0].CourseID != "go-web" || violations[0].MissingPrerequisiteID != "go-basics" {
		t.Fatalf("violations = %+v, want one go-web/go-basics row", violations)
	}
	if got := coursepaths.CheckPrerequisiteOrder([]string{"go-basics", "go-web"}, prereqs); len(got) != 0 {
		t.Fatalf("ordered violations = %+v, want none", got)
	}
	if got := coursepaths.CheckPrerequisiteOrder([]string{"go-web"}, map[string][]string{"go-web": {"ghost"}}); len(got) != 0 {
		t.Fatalf("unknown-id violations = %+v, want none (resolver miss)", got)
	}
}
