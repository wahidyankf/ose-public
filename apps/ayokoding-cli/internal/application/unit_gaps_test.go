package application_test

import (
	"context"
	"errors"
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errBoom stands in for a failing run.
var errBoom = errors.New("boom")

// errFS fails every open, standing in for unreadable content.
type errFS struct{}

func (errFS) Open(string) (fs.File, error) {
	return nil, fs.ErrNotExist
}

// TestValidateRejectsBadContent requires content failures to surface before
// any course runs.
func TestValidateRejectsBadContent(t *testing.T) {
	rows := []struct {
		name    string
		content fstest.MapFS
		courses []string
		code    string
	}{
		{
			name:    "unknown course names the argument",
			content: checkContent(),
			courses: []string{"zeta"},
			code:    finding.UsageInvalidArguments,
		},
		{
			name:    "file as course names the argument",
			content: fstest.MapFS{"zeta": &fstest.MapFile{Data: []byte("not a course")}},
			courses: []string{"zeta"},
			code:    finding.UsageInvalidArguments,
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			_, err := application.Validate(application.ValidateRequest{
				Content: row.content,
				Catalog: testCatalog(),
				Courses: row.courses,
			})
			if err == nil {
				t.Fatal("Validate=nil, want the usage error")
			}
			var coded *finding.Error
			if !errors.As(err, &coded) || coded.Code != row.code {
				t.Fatalf("Validate=%v, want code %q", err, row.code)
			}
		})
	}
}

// TestContentErrorsAreWrapped requires unreadable content to fail the read
// commands with a wrapped error.
func TestContentErrorsAreWrapped(t *testing.T) {
	if _, err := application.Validate(application.ValidateRequest{
		Content: errFS{},
		Catalog: testCatalog(),
	}); err == nil || !strings.Contains(err.Error(), "application: list courses") {
		t.Fatalf("Validate=%v, want the wrapped list failure", err)
	}
	if _, err := application.Affected(application.AffectedRequest{
		Content: errFS{},
		All:     true,
	}); err == nil || !strings.Contains(err.Error(), "application: list courses") {
		t.Fatalf("Affected=%v, want the wrapped list failure", err)
	}
	if _, err := application.Check(context.Background(), application.CheckRequest{
		Content: errFS{},
		Catalog: testCatalog(),
		All:     true,
		Runtime: &scriptedRuntime{run: okExecution("")},
	}); err == nil {
		t.Fatal("Check=nil, want the list failure")
	}
	if _, err := application.Sync(application.SyncRequest{Content: errFS{}}); err == nil {
		t.Fatal("Sync=nil, want the list failure")
	}
	if _, err := application.Coverage(application.CoverageRequest{Content: errFS{}}); err == nil {
		t.Fatal("Coverage=nil, want the list failure")
	}
}

// TestAffectedRejectsInvalidShard requires a malformed shard to fail the
// selection with a usage error.
func TestAffectedRejectsInvalidShard(t *testing.T) {
	_, err := application.Affected(application.AffectedRequest{
		Content: checkContent(),
		All:     true,
		Shard:   "bogus",
	})
	if err == nil {
		t.Fatal("Affected=nil, want the shard failure")
	}
	var coded *finding.Error
	if !errors.As(err, &coded) || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("Affected=%v, want the usage error", err)
	}
}

// TestCheckReportsInertSelection requires an all-inert tree to report the
// inert message with no findings and no run.
func TestCheckReportsInertSelection(t *testing.T) {
	content := fstest.MapFS{
		"quiet/learning/lessons/a.md": &fstest.MapFile{Data: []byte("# A\n")},
	}
	fake := &scriptedRuntime{run: okExecution("")}
	report, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		All:     true,
		Runtime: fake,
		RunID:   "test-inert-1",
	})
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if report.Message != application.InertMessage {
		t.Fatalf("Message=%q, want the inert message", report.Message)
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no run", len(fake.calls))
	}
}

// TestCheckPropagatesRunFailure requires a failing run to fail the check.
func TestCheckPropagatesRunFailure(t *testing.T) {
	failing := &scriptedRuntime{run: func(_ containerplan.Invocation, _ []byte) (application.Execution, error) {
		return application.Execution{}, errBoom
	}}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: checkContent(),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
		Runtime: failing,
		RunID:   "test-fail-1",
	})
	if err == nil || !strings.Contains(err.Error(), "boom") {
		t.Fatalf("Check=%v, want the run failure", err)
	}
}
