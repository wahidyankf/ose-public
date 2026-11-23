//go:build integration

package application_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// TestRunRecordWritesOnlyMissing requires --record to write the missing
// expected file with the run output while leaving existing files alone.
func TestRunRecordWritesOnlyMissing(t *testing.T) {
	files := map[string]string{
		"demo/learning/code/ex-01-two/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: first
    command: [python3, one.py]
    expect:
      exit: 0
      stdout: expected/first.stdout.txt
  - name: second
    command: [python3, two.py]
    expect:
      exit: 0
      stdout: expected/second.stdout.txt
`,
		"demo/learning/code/ex-01-two/one.py":                    "print('one')\n",
		"demo/learning/code/ex-01-two/two.py":                    "print('two')\n",
		"demo/learning/code/ex-01-two/expected/first.stdout.txt": "one\n",
	}
	content, root := writeDiskCourse(t, files)
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if strings.Contains(strings.Join(invoke.Args, " "), "one.py") {
			return application.Execution{Exit: 0, Stdout: "one\n"}, nil
		}
		return application.Execution{Exit: 0, Stdout: "two\n"}, nil
	}}
	req := baseRunRequest(content, fake)
	req.Record = true
	req.ContentDir = root
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "second.stdout.txt")
	written, readErr := os.ReadFile(filepath.Join(root, "demo/learning/code/ex-01-two/expected/second.stdout.txt"))
	if readErr != nil {
		t.Fatalf("missing file not recorded: %v", readErr)
	}
	if string(written) != "two\n" {
		t.Fatalf("recorded=%q, want the run output", written)
	}
	kept, readErr := os.ReadFile(filepath.Join(root, "demo/learning/code/ex-01-two/expected/first.stdout.txt"))
	if readErr != nil || string(kept) != "one\n" {
		t.Fatalf("existing file changed: %q, err=%v", kept, readErr)
	}
}
