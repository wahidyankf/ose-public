package cli_test

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// Fixture roots the validate and list tests read. They are committed files;
// the tests never write.
const (
	fixtureCoursesRoot  = "../../../tests/testdata/courses"
	fixtureCatalog      = "../../../tests/testdata/catalog.yaml"
	fixtureCatalogLoose = "../../../tests/testdata/catalog-unpinned.yaml"
)

// validateRow is one examples validate or toolchains list case.
type validateRow struct {
	name       string
	args       []string
	wantStatus int
	wantOut    []string
	wantErr    []string
}

// validateRows holds the Phase 2 command cases.
func validateRows() []validateRow {
	pinned := []string{"--content", fixtureCoursesRoot, "--catalog", fixtureCatalog}
	return []validateRow{
		{
			name:       "valid static course passes with empty output",
			args:       append([]string{"examples", "validate", "--course", "static-course"}, pinned...),
			wantStatus: 0,
		},
		{
			name:       "broken layout reports every placement finding",
			args:       append([]string{"examples", "validate", "--course", "broken-layout"}, pinned...),
			wantStatus: 1,
			wantOut: []string{
				"ayokoding.layout.flat-example",
				"learning/code/ex-03-loops.py",
				"ayokoding.layout.unplaced-code",
				"learning/coroutines/code",
				"ayokoding.layout.missing-run-spec",
				"learning/code/ex-04-maps",
				"ayokoding.layout.misplaced-run-spec",
				"learning/run.yaml",
			},
		},
		{
			name:       "broken run spec reports the unknown key with its line",
			args:       append([]string{"examples", "validate", "--course", "broken-runspec"}, pinned...),
			wantStatus: 1,
			wantOut: []string{
				"ayokoding.runspec.unknown-key",
				"learning/code/ex-01-unknown-key/run.yaml:3",
			},
		},
		{
			name:       "default selection skips the inert course",
			args:       append([]string{"examples", "validate"}, pinned...),
			wantStatus: 1,
			wantOut:    []string{"ayokoding.runspec.unknown-key"},
		},
		{
			name:       "named inert course previews its missing spec",
			args:       append([]string{"examples", "validate", "--course", "inert-course"}, pinned...),
			wantStatus: 1,
			wantOut:    []string{"ayokoding.layout.missing-run-spec"},
		},
		{
			name:       "unknown course is a usage error",
			args:       append([]string{"examples", "validate", "--course", "zeta"}, pinned...),
			wantStatus: 2,
			wantErr:    []string{"ayokoding.usage.invalid-arguments"},
		},
		{
			name:       "pinned embedded catalog validates the course",
			args:       []string{"examples", "validate", "--course", "static-course", "--content", fixtureCoursesRoot},
			wantStatus: 0,
		},
		{
			name:       "toolchain list names every id kind version and image",
			args:       []string{"toolchains", "list", "--catalog", fixtureCatalog},
			wantStatus: 0,
			wantOut: []string{
				"python",
				"language",
				"3.15.0",
				"@sha256:",
				"postgres",
				"service",
				"18.6",
			},
		},
		{
			name:       "unpinned catalog file refuses the list",
			args:       []string{"toolchains", "list", "--catalog", fixtureCatalogLoose},
			wantStatus: 2,
			wantErr:    []string{"ayokoding.catalog.unpinned-image"},
		},
		{
			name:       "pinned embedded catalog lists the entries",
			args:       []string{"toolchains", "list"},
			wantStatus: 0,
			wantOut:    []string{"python", "@sha256:"},
		},
	}
}

// TestValidateAndList runs the Phase 2 commands against the fixture courses
// and the pinned test catalog.
func TestValidateAndList(t *testing.T) {
	for _, row := range validateRows() {
		t.Run(row.name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer
			status := cli.Execute(context.Background(), row.args, cli.Options{
				Stdout: &stdout,
				Stderr: &stderr,
			})
			if status != row.wantStatus {
				t.Fatalf("status=%d, want %d (stdout=%q stderr=%q)",
					status, row.wantStatus, stdout.String(), stderr.String())
			}
			for _, want := range row.wantOut {
				if !strings.Contains(stdout.String(), want) {
					t.Fatalf("stdout missing %q (stdout=%q)", want, stdout.String())
				}
			}
			for _, want := range row.wantErr {
				if !strings.Contains(stderr.String(), want) {
					t.Fatalf("stderr missing %q (stderr=%q)", want, stderr.String())
				}
			}
		})
	}
}

// findingsDocument is the machine-readable validate payload.
type findingsDocument struct {
	SchemaVersion int `json:"schemaVersion"`
	Findings      []struct {
		Code    string `json:"code"`
		Course  string `json:"course"`
		Path    string `json:"path"`
		Line    int    `json:"line"`
		Message string `json:"message"`
	} `json:"findings"`
}

// toolchainsDocument is the machine-readable list payload.
type toolchainsDocument struct {
	SchemaVersion int `json:"schemaVersion"`
	Toolchains    []struct {
		ID      string `json:"id"`
		Kind    string `json:"kind"`
		Version string `json:"version"`
		Image   string `json:"image"`
	} `json:"toolchains"`
}

// TestValidateJSONFindingsShape requires the JSON payload to carry the
// finding shape code, course, path, line, and message.
func TestValidateJSONFindingsShape(t *testing.T) {
	args := []string{
		"examples", "validate", "--course", "broken-layout",
		"--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json",
	}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	var body findingsDocument
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &body); err != nil {
		t.Fatalf("stdout is not one JSON document: %v (stdout=%q)", err, stdout.String())
	}
	if body.SchemaVersion != 1 || len(body.Findings) == 0 {
		t.Fatalf("body=%+v, want versioned findings", body)
	}
	for _, found := range body.Findings {
		if found.Code == "" || found.Course == "" || found.Path == "" || found.Message == "" {
			t.Fatalf("finding=%+v, want code, course, path, line, message", found)
		}
	}
}

// TestValidateJSONIsDeterministic renders the same findings twice and
// requires byte-identical output.
func TestValidateJSONIsDeterministic(t *testing.T) {
	args := []string{
		"examples", "validate", "--course", "broken-runspec",
		"--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json",
	}
	var first, second bytes.Buffer
	var discard bytes.Buffer
	if status := cli.Execute(context.Background(), args, cli.Options{Stdout: &first, Stderr: &discard}); status != 1 {
		t.Fatalf("status=%d, want 1", status)
	}
	if status := cli.Execute(context.Background(), args, cli.Options{Stdout: &second, Stderr: &discard}); status != 1 {
		t.Fatalf("status=%d, want 1", status)
	}
	if first.String() != second.String() {
		t.Fatalf("renders differ:\n%s\n%s", first.String(), second.String())
	}
}

// TestListJSONShape requires the toolchain list payload to carry id, kind,
// version, and image per entry.
func TestListJSONShape(t *testing.T) {
	args := []string{"toolchains", "list", "--catalog", fixtureCatalog, "--output", "json"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stderr=%q)", status, stderr.String())
	}
	var body toolchainsDocument
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &body); err != nil {
		t.Fatalf("stdout is not one JSON document: %v (stdout=%q)", err, stdout.String())
	}
	if body.SchemaVersion != 1 || len(body.Toolchains) != 2 {
		t.Fatalf("body=%+v, want two toolchains", body)
	}
	for _, entry := range body.Toolchains {
		if entry.ID == "" || entry.Kind == "" || entry.Version == "" || entry.Image == "" {
			t.Fatalf("entry=%+v, want id, kind, version, image", entry)
		}
	}
	if body.Toolchains[0].ID != "postgres" || body.Toolchains[1].ID != "python" {
		t.Fatalf("entries=%+v, want id order", body.Toolchains)
	}
}
