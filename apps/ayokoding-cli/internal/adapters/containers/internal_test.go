package containers

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errInternalExec stands in for a failed container CLI call.
var errInternalExec = errors.New("exit status 1")

// TestExitErrorReportsStatus pins the exit text the run mapping carries as data.
func TestExitErrorReportsStatus(t *testing.T) {
	if got := (&exitError{code: 3}).Error(); got != "containers: container exited 3" {
		t.Fatalf("exitError=%q, want the status text", got)
	}
}

// TestCommandForFallsBackToResolvedCLI requires an empty invocation binary
// to resolve through the configured CLI.
func TestCommandForFallsBackToResolvedCLI(t *testing.T) {
	runtime := &Runtime{CLI: "cfg-cli"}
	invoke := containerplan.Invocation{Binary: "", Args: nil}
	if got := runtime.commandFor(invoke); got != "cfg-cli" {
		t.Fatalf("commandFor=%q, want the configured CLI", got)
	}
}

// TestResolveCLIUsesConfiguredCLIOrDefault requires the CLI field to win
// and the empty field to mean the default podman, without reading the
// process environment.
func TestResolveCLIUsesConfiguredCLIOrDefault(t *testing.T) {
	if got := (&Runtime{CLI: "field-cli"}).ResolveCLI(); got != "field-cli" {
		t.Fatalf("ResolveCLI=%q, want the configured CLI", got)
	}
	if got := (&Runtime{}).ResolveCLI(); got != defaultContainerCLI {
		t.Fatalf("ResolveCLI=%q, want the default %q", got, defaultContainerCLI)
	}
}

// TestCommandForPrefersConfiguredCLIOverPlan requires the CLI field to
// win over the planned binary, and the plan to stand when the field is
// empty, without reading the process environment.
func TestCommandForPrefersConfiguredCLIOverPlan(t *testing.T) {
	configured := &Runtime{CLI: "cfg-cli"}
	invoke := containerplan.Invocation{Binary: "plan-cli", Args: nil}
	if got := configured.commandFor(invoke); got != "cfg-cli" {
		t.Fatalf("commandFor=%q, want the configured CLI", got)
	}
	plain := &Runtime{}
	if got := plain.commandFor(invoke); got != "plan-cli" {
		t.Fatalf("commandFor=%q, want the planned binary", got)
	}
	if got := plain.commandFor(containerplan.Invocation{}); got != defaultContainerCLI {
		t.Fatalf("commandFor=%q, want the default %q", got, defaultContainerCLI)
	}
}

// TestPollIntervalDefaultsToCatalogCadence requires an unconfigured runtime
// to poll on the catalog cadence.
func TestPollIntervalDefaultsToCatalogCadence(t *testing.T) {
	if got := (&Runtime{}).pollInterval(); got != defaultReadyPoll {
		t.Fatalf("pollInterval=%v, want the catalog cadence", got)
	}
	if got := (&Runtime{ReadyPoll: time.Second}).pollInterval(); got != time.Second {
		t.Fatalf("pollInterval=%v, want the configured interval", got)
	}
}

// TestMapStartErrorMapsSupervisorStatuses requires start failures to map to
// the 126/127 supervisor statuses and other failures to name the binary.
func TestMapStartErrorMapsSupervisorStatuses(t *testing.T) {
	rows := []struct {
		name string
		err  error
		code string
		text string
	}{
		{name: "missing binary is 127", err: fs.ErrNotExist, code: finding.EnvNotFound},
		{name: "unusable binary is 126", err: fs.ErrPermission, code: finding.EnvNotExecutable},
		{name: "other start failure names the binary", err: errInternalExec, text: "containers: start test-cli"},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			err := mapStartError("test-cli", row.err)
			if row.code != "" {
				coded, ok := errors.AsType[*finding.Error](err)
				if !ok || coded.Code != row.code {
					t.Fatalf("mapStartError=%v, want code %q", err, row.code)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), row.text) {
				t.Fatalf("mapStartError=%v, want %q", err, row.text)
			}
		})
	}
}

// TestBuilderRunMapsOutcomeToClosedCode requires a green build run to pass
// and a failed one to carry the closed build code with the log tail.
func TestBuilderRunMapsOutcomeToClosedCode(t *testing.T) {
	invoke := containerplan.Invocation{Binary: "podman", Args: []string{"build"}}
	built := Builder{Exec: func(context.Context, string, []string) (string, error) {
		return "built", nil
	}}
	if err := built.run(context.Background(), invoke); err != nil {
		t.Fatalf("run=%v, want nil", err)
	}
	failing := Builder{Exec: func(context.Context, string, []string) (string, error) {
		return "build log\n", errInternalExec
	}}
	err := failing.run(context.Background(), invoke)
	coded, isCoded := errors.AsType[*finding.Error](err)
	if !isCoded || coded.Code != envBuildFailed {
		t.Fatalf("run=%v, want the closed build code", err)
	}
	if !strings.Contains(coded.Message, "build log") {
		t.Fatalf("run message=%q, want the log tail", coded.Message)
	}
}

// TestBuilderRunnerFallsBackToRealExec requires the nil-Exec builder to
// select the real runner without starting it.
func TestBuilderRunnerFallsBackToRealExec(t *testing.T) {
	if (Builder{}).runner() == nil {
		t.Fatal("runner=nil, want the real CLI runner")
	}
}

// TestRuntimeRunnerFallsBackToSupervisedExec requires the nil-Exec runtime
// to select the supervised runner without starting it.
func TestRuntimeRunnerFallsBackToSupervisedExec(t *testing.T) {
	if (&Runtime{}).runner() == nil {
		t.Fatal("runner=nil, want the supervised runner")
	}
}

// TestFinishRunKeepsExitCode requires an injected container exit to carry
// its status with the split streams.
func TestFinishRunKeepsExitCode(t *testing.T) {
	invoke := containerplan.Invocation{Binary: "img"}
	result, err := finishRun(invoke, "out\n", "err\n", &exitError{code: 2})
	if err != nil {
		t.Fatalf("finishRun=%v, want nil", err)
	}
	if result.ExitCode != 2 || result.Output != "out\n" || result.Stderr != "err\n" {
		t.Fatalf("result=%+v, want the exit with the split streams", result)
	}
}

// TestSetProcessGroupLeadsChild requires the group setup to mark an
// unstarted command a group leader without starting it.
func TestSetProcessGroupLeadsChild(t *testing.T) {
	command := &exec.Cmd{}
	setProcessGroup(command)
	if command.SysProcAttr == nil {
		t.Fatal("SysProcAttr=nil, want the group leader marking")
	}
}

// TestKillProcessGroupSkipsUnstartedChild requires a command without a
// process to skip the group kill.
func TestKillProcessGroupSkipsUnstartedChild(t *testing.T) {
	killProcessGroup(&exec.Cmd{})
}

// TestRealExecReportsLocalExitStatus requires the real runner to report a
// local exit-zero binary as success and a failing one with the closed
// build code.
func TestRealExecReportsLocalExitStatus(t *testing.T) {
	invoke := containerplan.Invocation{Binary: "/bin/true"}
	if err := (Builder{}).run(context.Background(), invoke); err != nil {
		t.Fatalf("run=%v, want nil", err)
	}
	err := (Builder{}).run(context.Background(), containerplan.Invocation{Binary: "/bin/false"})
	coded, isCoded := errors.AsType[*finding.Error](err)
	if !isCoded || coded.Code != envBuildFailed {
		t.Fatalf("run=%v, want the closed build code", err)
	}
}

// TestWriteFilesFailsClosedOnMissingContext requires an unusable context to
// fail naming the context, and no files to succeed without touching disk.
func TestWriteFilesFailsClosedOnMissingContext(t *testing.T) {
	files := map[string][]byte{"Dockerfile": []byte("FROM x\n")}
	err := writeFiles("/no-such/context-ayokoding-test", files)
	if err == nil || !strings.Contains(err.Error(), "build context") {
		t.Fatalf("writeFiles=%v, want the context failure", err)
	}
	if err := writeFiles("/no-such/context-ayokoding-test", nil); err != nil {
		t.Fatalf("writeFiles=%v, want nil for no files", err)
	}
}

// TestLastLinesKeepsTailWindow requires a long log to keep only its tail and
// a short log to pass through whole.
func TestLastLinesKeepsTailWindow(t *testing.T) {
	var lines []string
	for i := 1; i <= 50; i++ {
		lines = append(lines, fmt.Sprintf("log-line-%02d", i))
	}
	kept := strings.Split(lastLines(strings.Join(lines, "\n")+"\n", logLinesKept), "\n")
	if len(kept) != logLinesKept {
		t.Fatalf("kept %d lines, want %d", len(kept), logLinesKept)
	}
	if kept[0] != "log-line-11" || kept[len(kept)-1] != "log-line-50" {
		t.Fatalf("window=%q..%q, want log-line-11..log-line-50", kept[0], kept[len(kept)-1])
	}
	if short := lastLines("only\n", logLinesKept); short != "only" {
		t.Fatalf("short log=%q, want it kept whole", short)
	}
}
