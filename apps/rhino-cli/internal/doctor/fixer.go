package doctor

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// InstallStep describes a single installation command.
type InstallStep struct {
	Description string   // "Install Go via Homebrew"
	Command     string   // "brew"
	Args        []string // ["install", "go"]
}

// InstallFunc returns the install steps for a tool on a given platform.
// Returns nil if the tool cannot be auto-installed on the given platform.
type InstallFunc func(required string, platform string) []InstallStep

// FixRunnerFunc executes an install command. Return nil on success.
type FixRunnerFunc func(command string, args ...string) error

// FixOptions configures the fix behavior.
type FixOptions struct {
	DryRun bool
	Runner FixRunnerFunc // nil = use real subprocess runner
}

// FixResult holds the outcome of a fix attempt.
type FixResult struct {
	Fixed     int
	Failed    int
	AlreadyOK int
	Skipped   int // tools without install commands
}

// fixRunner executes install commands. Overridable for testing.
var fixRunner = realFixRunner

func realFixRunner(command string, args ...string) error {
	cmd := exec.Command(command, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Fix attempts to install missing tools from the check result.
func Fix(result *DoctorResult, defs []toolDef, opts FixOptions, printf func(string, ...any)) FixResult {
	platform := runtime.GOOS
	runner := opts.Runner
	if runner == nil {
		runner = fixRunner
	}
	fr := FixResult{}

	for i, check := range result.Checks {
		if check.Status == StatusOK || check.Status == StatusWarning {
			fr.AlreadyOK++
			continue
		}
		// StatusMissing
		if i >= len(defs) || defs[i].installCmd == nil {
			printf("Skip: %s — no auto-install available\n", check.Name)
			fr.Skipped++
			continue
		}

		steps := defs[i].installCmd(check.RequiredVersion, platform)
		if len(steps) == 0 {
			printf("Skip: %s — no install steps for platform %s\n", check.Name, platform)
			fr.Skipped++
			continue
		}

		for _, step := range steps {
			if opts.DryRun {
				printf("Would install: %s via %s %s\n", check.Name, step.Command, strings.Join(step.Args, " "))
				continue
			}
			printf("Installing %s: %s\n", check.Name, step.Description)
			if err := runner(step.Command, step.Args...); err != nil {
				printf("  Failed: %v\n", err)
				fr.Failed++
				goto nextTool
			}
		}
		if !opts.DryRun {
			fr.Fixed++
		}
	nextTool:
	}

	return fr
}

// FixAll attempts to install missing tools detected by CheckAll.
// It rebuilds the tool definitions using the same options that were used for checking,
// then runs the fixer on the results.
func FixAll(result *DoctorResult, opts CheckOptions, fixOpts FixOptions, printf func(string, ...any)) FixResult {
	defs := buildToolDefs(opts.RepoRoot)
	if opts.Scope == ScopeMinimal {
		filtered := make([]toolDef, 0)
		for _, def := range defs {
			if MinimalTools[def.name] {
				filtered = append(filtered, def)
			}
		}
		defs = filtered
	}
	return Fix(result, defs, fixOpts, printf)
}

// FormatFixSummary produces a human-readable one-line summary of FixResult.
func FormatFixSummary(fr FixResult) string {
	return fmt.Sprintf("\nFix summary: %d fixed, %d failed, %d already OK\n",
		fr.Fixed, fr.Failed, fr.AlreadyOK)
}
