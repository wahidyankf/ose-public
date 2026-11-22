//go:build integration

package application_test

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// executionSource extracts the /work bind source from a planned invocation.
func executionSource(invoke containerplan.Invocation) string {
	for index, arg := range invoke.Args {
		if arg == "--mount" && index+1 < len(invoke.Args) {
			mount := invoke.Args[index+1]
			const prefix = "type=bind,source="
			rest, _, _ := strings.Cut(strings.TrimPrefix(mount, prefix), ",target=")
			if strings.HasPrefix(mount, prefix) {
				return rest
			}
		}
	}
	return ""
}

// TestRunExecutionsUseFreshCopies requires each execution to see a pristine
// working copy: a program mutating its own source must not poison the
// second execution.
func TestRunExecutionsUseFreshCopies(t *testing.T) {
	sources := []string{}
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		source := executionSource(invoke)
		sources = append(sources, source)
		program := source + "/learning/code/ex-01-hello/example.py"
		body, err := os.ReadFile(program)
		if err != nil {
			return application.Execution{}, fmt.Errorf("test: read working copy: %w", err)
		}
		if string(body) != "print('hello')\n" {
			return application.Execution{Exit: 0, Stdout: "second sees dirt\n"}, nil
		}
		if err := os.WriteFile(program, []byte("vandalized\n"), 0o644); err != nil {
			return application.Execution{}, fmt.Errorf("test: vandalize working copy: %w", err)
		}
		return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(sources) != 2 || sources[0] == sources[1] {
		t.Fatalf("sources=%q, want two distinct working copies", sources)
	}
}
