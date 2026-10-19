package finding_test

import (
	"context"
	"errors"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errBoom is the static uncoded failure the mapping table falls through on.
var errBoom = errors.New("boom")

// TestExitCode pins the result-kind, environment, signal, and pipe mapping.
func TestExitCode(t *testing.T) {
	rows := []struct {
		name string
		err  error
		want int
	}{
		{"no failure is green", nil, 0},
		{"usage failure is 2", &finding.Error{Code: finding.UsageMissingSelection, Message: "selection"}, 2},
		{"invalid arguments are 2", &finding.Error{Code: finding.UsageInvalidArguments, Message: "flags"}, 2},
		{"recovered panic is 2", &finding.Error{Code: finding.InternalPanic, Message: "failure"}, 2},
		{"unknown failures are 2", errBoom, 2},
		{"service unready is 124", &finding.Error{Code: finding.EnvServiceUnready, Message: "wait"}, 124},
		{"runtime refused is 125", &finding.Error{Code: finding.EnvRuntimeRefused, Message: "daemon"}, 125},
		{"not executable is 126", &finding.Error{Code: finding.EnvNotExecutable, Message: "perm"}, 126},
		{"missing runtime is 127", &finding.Error{Code: finding.EnvNotFound, Message: "absent"}, 127},
		{"missing git is 127", &finding.Error{Code: finding.EnvGitNotFound, Message: "absent"}, 127},
		{"interrupted context is 130", context.Canceled, 130},
		{"SIGINT is 130", &finding.SignalError{Number: 2}, 130},
		{"SIGTERM is 143", &finding.SignalError{Number: 15}, 143},
		{"closed pipe is 141", &finding.PipeError{}, 141},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			if got := finding.ExitCode(row.err); got != row.want {
				t.Fatalf("ExitCode=%d, want %d", got, row.want)
			}
		})
	}
}

// TestResolveColor pins --color against NO_COLOR presence.
func TestResolveColor(t *testing.T) {
	rows := []struct {
		name    string
		flag    string
		noColor bool
		want    bool
	}{
		{"always with NO_COLOR still colours", "always", true, true},
		{"always without NO_COLOR colours", "always", false, true},
		{"never with NO_COLOR stays plain", "never", true, false},
		{"never without NO_COLOR stays plain", "never", false, false},
		{"auto with NO_COLOR stays plain", "auto", true, false},
		{"auto without NO_COLOR colours", "auto", false, true},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			if got := finding.ResolveColor(row.flag, row.noColor); got != row.want {
				t.Fatalf("ResolveColor(%q, noColor=%v)=%v, want %v",
					row.flag, row.noColor, got, row.want)
			}
		})
	}
}

// TestErrorStrings pins the human rendering of each failure type.
func TestErrorStrings(t *testing.T) {
	rows := []struct {
		name string
		err  error
		want string
	}{
		{"coded failure", &finding.Error{Code: finding.UsageMissingSelection, Message: "selection"}, "ayokoding.usage.missing-selection: selection"},
		{"closed pipe", &finding.PipeError{}, "standard output was closed by the reader"},
		{"fatal signal", &finding.SignalError{Number: 2}, "signal 2"},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			if got := row.err.Error(); got != row.want {
				t.Fatalf("Error()=%q, want %q", got, row.want)
			}
		})
	}
}

// TestEnvCodesMatchSupervisorTable pins the supervisor vocabulary
// tech-docs/005 fixes: the adapter and the contract scenarios name these
// literals, so a value drift breaks the suite loudly here first.
func TestEnvCodesMatchSupervisorTable(t *testing.T) {
	rows := []struct {
		name string
		got  string
		want string
	}{
		{"service never ready", finding.EnvServiceUnready, "ayokoding.env.service-not-ready"},
		{"daemon refused", finding.EnvRuntimeRefused, "ayokoding.env.container-runtime-unavailable"},
		{"unusable command", finding.EnvNotExecutable, "ayokoding.env.container-cli-not-executable"},
		{"missing command", finding.EnvNotFound, "ayokoding.env.container-cli-not-found"},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			if row.got != row.want {
				t.Fatalf("code=%q, want %q", row.got, row.want)
			}
		})
	}
}

// TestStatusesPublishesNine entries pins the help/exit contract table.
func TestStatusesPublishesNine(t *testing.T) {
	want := []int{0, 1, 2, 124, 125, 126, 127, 130, 141}
	got := finding.Statuses()
	if len(got) != len(want) {
		t.Fatalf("statuses=%d, want %d", len(got), len(want))
	}
	for index, code := range want {
		if got[index].Code != code {
			t.Fatalf("statuses[%d]=%d, want %d", index, got[index].Code, code)
		}
		if got[index].Meaning == "" {
			t.Fatalf("statuses[%d] carries no meaning", code)
		}
	}
}
