package application_test

import (
	"errors"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// validRunSpec is the minimal valid run.yaml the fixtures share.
const validRunSpec = `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`

// testCatalog is the pinned catalog selections validate against.
func testCatalog() catalog.Catalog {
	python := catalog.Toolchain{
		ID:           "python",
		Kind:         catalog.KindLanguage,
		Version:      "3.15.0",
		Image:        "docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Env:          nil,
		Install:      catalog.Install{},
		Build:        "",
		Platform:     "",
		Ready:        nil,
		ReadyTimeout: "",
		Connect:      nil,
	}
	postgres := catalog.Toolchain{
		ID:       "postgres",
		Kind:     catalog.KindService,
		Version:  "18.6",
		Image:    "docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		Env:      nil,
		Install:  catalog.Install{},
		Build:    "",
		Platform: "",
		Ready: []string{
			"pg_isready",
		},
		ReadyTimeout: "60s",
		Connect: map[string]string{
			"PGHOST": "postgres",
		},
	}
	return catalog.Catalog{Toolchains: []catalog.Toolchain{postgres, python}}
}

// testContent holds two opted-in courses and one inert course: alpha is
// clean, beta carries an unknown key, gamma has a unit but no run spec.
func testContent() fstest.MapFS {
	return fstest.MapFS{
		"alpha/learning/code/ex-01-a/run.yaml": {Data: []byte(validRunSpec)},
		"alpha/learning/code/ex-01-a/main.py":  {Data: []byte("print(1)\n")},
		"beta/learning/code/ex-01-b/run.yaml": {
			Data: []byte("schema: ayokoding.run/v1\ntoolchain: python\nexpected_output: x\n" + validRunSpec[len("schema: ayokoding.run/v1\ntoolchain: python\n"):]),
		},
		"beta/learning/code/ex-01-b/main.py":  {Data: []byte("print(1)\n")},
		"gamma/learning/code/ex-01-g/main.py": {Data: []byte("print(1)\n")},
		"gamma/learning/lessons/g.md":         {Data: []byte("# G\n")},
	}
}

// coursesOf returns the course of every finding.
func coursesOf(findings []finding.Finding) map[string]bool {
	courses := map[string]bool{}
	for _, found := range findings {
		courses[found.Course] = true
	}
	return courses
}

// TestValidateSelectsNamedCourse requires --course to cover exactly the
// named course.
func TestValidateSelectsNamedCourse(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content: testContent(),
		Catalog: testCatalog(),
		Courses: []string{"beta"},
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	if len(findings) != 1 || findings[0].Code != finding.RunspecUnknownKey {
		t.Fatalf("findings=%+v, want one unknown-key", findings)
	}
	if findings[0].Course != "beta" || findings[0].Line != 3 {
		t.Fatalf("finding=%+v, want beta line 3", findings[0])
	}
}

// TestValidateDefaultsToOptedIn requires the default selection to skip inert
// courses without reporting them.
func TestValidateDefaultsToOptedIn(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content: testContent(),
		Catalog: testCatalog(),
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	courses := coursesOf(findings)
	if courses["gamma"] {
		t.Fatalf("findings=%+v, inert gamma must be skipped", findings)
	}
	if !courses["beta"] || courses["alpha"] {
		t.Fatalf("findings=%+v, want beta findings only", findings)
	}
}

// TestValidateIncludesInert requires --include-inert to preview every
// course, including the inert one.
func TestValidateIncludesInert(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content:      testContent(),
		Catalog:      testCatalog(),
		IncludeInert: true,
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	courses := coursesOf(findings)
	if !courses["gamma"] || !courses["beta"] {
		t.Fatalf("findings=%+v, want beta and gamma", findings)
	}
	for _, found := range findings {
		if found.Course == "gamma" && found.Code != finding.LayoutMissingRunspec {
			t.Fatalf("gamma finding=%+v, want missing-run-spec", found)
		}
	}
}

// TestValidatePreviewsNamedInertCourse requires an explicitly named course to
// validate as if opted in.
func TestValidatePreviewsNamedInertCourse(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content: testContent(),
		Catalog: testCatalog(),
		Courses: []string{"gamma"},
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	if len(findings) != 1 || findings[0].Code != finding.LayoutMissingRunspec {
		t.Fatalf("findings=%+v, want one missing-run-spec", findings)
	}
}

// TestValidateRejectsUnknownCourse requires a named course that does not
// exist to be a usage error.
func TestValidateRejectsUnknownCourse(t *testing.T) {
	_, err := application.Validate(application.ValidateRequest{
		Content: testContent(),
		Catalog: testCatalog(),
		Courses: []string{"zeta"},
	})
	if err == nil {
		t.Fatalf("Validate succeeded, want invalid-arguments")
	}
	var coded *finding.Error
	if !errors.As(err, &coded) {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("code=%q, want invalid-arguments", coded.Code)
	}
}

// TestValidateSortsFindings requires deterministic finding order across
// courses.
func TestValidateSortsFindings(t *testing.T) {
	files := fstest.MapFS{
		"beta/learning/code/ex-01-b/run.yaml":  {Data: []byte("toolchain: python\n")},
		"alpha/learning/code/ex-01-a/run.yaml": {Data: []byte("toolchain: python\n")},
	}
	findings, err := application.Validate(application.ValidateRequest{
		Content: files,
		Catalog: testCatalog(),
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	if len(findings) < 2 {
		t.Fatalf("findings=%+v, want at least two", findings)
	}
	for i := 1; i < len(findings); i++ {
		prev, next := findings[i-1], findings[i]
		if prev.Course > next.Course {
			t.Fatalf("findings out of order: %+v after %+v", next, prev)
		}
	}
}

// TestListToolchainsSortsByID requires the list to follow id order.
func TestListToolchainsSortsByID(t *testing.T) {
	entries := application.ListToolchains(testCatalog())
	if len(entries) != 2 || entries[0].ID != "postgres" || entries[1].ID != "python" {
		t.Fatalf("entries=%+v, want postgres before python", entries)
	}
}
