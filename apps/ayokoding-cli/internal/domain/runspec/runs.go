package runspec

import (
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// checkRuns checks the run count, every run in order, and name uniqueness.
func (check *checker) checkRuns(raw *specYAML, positions map[string]int) []Run {
	if len(raw.Runs) == 0 {
		check.failf(finding.RunspecMissingRuns, lineAt(positions, "runs"),
			"runs needs one to twenty entries")
		return nil
	}
	if len(raw.Runs) > maxRuns {
		check.failf(finding.RunspecTooManyRuns, lineAt(positions, "runs"),
			"runs holds %d entries, at most %d", len(raw.Runs), maxRuns)
		return nil
	}
	runs := make([]Run, 0, len(raw.Runs))
	for index := range raw.Runs {
		runs = append(runs, check.checkRun(&raw.Runs[index], positions, index))
	}
	check.checkDuplicateRuns(raw, positions)
	return runs
}

// checkDuplicateRuns reports every reused run name once, at its second
// occurrence.
func (check *checker) checkDuplicateRuns(raw *specYAML, positions map[string]int) {
	counts := map[string]int{}
	for index := range raw.Runs {
		counts[raw.Runs[index].Name]++
	}
	doubled := make([]string, 0, len(counts))
	for name, count := range counts {
		if name != "" && count >= 2 {
			doubled = append(doubled, name)
		}
	}
	sort.Strings(doubled)
	for _, name := range doubled {
		second := secondIndex(raw, name)
		check.failf(finding.RunspecDuplicateRun,
			lineAt(positions, runPath(second, "name"), "runs"),
			"duplicate run name %q", name)
	}
}

// secondIndex returns the second index carrying the run name.
func secondIndex(raw *specYAML, name string) int {
	found := 0
	for index := range raw.Runs {
		if raw.Runs[index].Name != name {
			continue
		}
		found++
		if found == 2 {
			return index
		}
	}
	return 0
}

// runPath names the dotted position of one run field.
func runPath(index int, fields ...string) string {
	var path strings.Builder
	path.WriteString("runs.")
	path.WriteString(strconv.Itoa(index))
	for _, field := range fields {
		path.WriteString(".")
		path.WriteString(field)
	}
	return path.String()
}

// checkRun checks one run entry and resolves its defaults.
func (check *checker) checkRun(raw *runYAML, positions map[string]int, index int) Run {
	var run Run
	run.Kind = kindExample
	run.Workdir = "."
	prefix := runPath(index)
	nameLine := lineAt(positions, prefix+".name", prefix, "runs")
	if raw.Name == "" || !runNamePattern.MatchString(raw.Name) {
		check.failf(finding.RunspecInvalidRunName, nameLine,
			"run name %q must match [a-z0-9][a-z0-9-]*", raw.Name)
	} else {
		run.Name = raw.Name
	}
	if raw.Kind != "" {
		if !runKinds[raw.Kind] {
			check.failf(finding.RunspecUnknownRunKind, lineAt(positions, prefix+".kind", prefix),
				"run kind %q must be example, test, or check", raw.Kind)
		} else {
			run.Kind = raw.Kind
		}
	}
	if len(raw.Command) == 0 {
		check.failf(finding.RunspecMissingCommand, nameLine,
			"run %q needs a command", run.Name)
	} else {
		run.Command = append([]string(nil), raw.Command...)
	}
	if raw.Workdir != "" {
		if !checkCoursePath(raw.Workdir) {
			check.failf(finding.RunspecPathEscape, lineAt(positions, prefix+".workdir", prefix),
				"workdir %q leaves the unit", raw.Workdir)
		} else {
			run.Workdir = raw.Workdir
		}
	}
	if raw.Stdin != "" {
		if !checkCoursePath(raw.Stdin) {
			check.failf(finding.RunspecPathEscape, lineAt(positions, prefix+".stdin", prefix),
				"stdin %q leaves the unit", raw.Stdin)
		} else {
			run.Stdin = raw.Stdin
		}
	}
	run.Env = check.checkEnv(raw, positions, prefix)
	run.Timeout = check.checkTimeout(raw, positions, prefix, run.Name)
	run.Simulation = raw.Simulation
	run.Expect = check.checkExpect(raw, positions, prefix, run.Kind, run.Name, nameLine)
	return run
}

// checkEnv checks every variable name against the pattern and the reserved
// set in sorted order, so output is deterministic.
func (check *checker) checkEnv(raw *runYAML, positions map[string]int, prefix string) map[string]string {
	if len(raw.Env) == 0 {
		return nil
	}
	keys := make([]string, 0, len(raw.Env))
	for key := range raw.Env {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	checked := make(map[string]string, len(raw.Env))
	for _, key := range keys {
		line := lineAt(positions, prefix+".env."+key, prefix+".env", prefix)
		switch {
		case !envNamePattern.MatchString(key):
			check.failf(finding.RunspecInvalidEnvName, line,
				"env key %q must match [A-Z][A-Z0-9_]*", key)
		case isReservedEnv(key):
			check.failf(finding.RunspecReservedEnv, line,
				"env key %q is reserved for the harness", key)
		default:
			checked[key] = raw.Env[key]
		}
	}
	return checked
}

// checkTimeout resolves the run timeout within one to six hundred seconds.
func (check *checker) checkTimeout(raw *runYAML, positions map[string]int, prefix, name string) time.Duration {
	if raw.Timeout == "" {
		return defaultTimeout
	}
	parsed, err := time.ParseDuration(raw.Timeout)
	if err != nil || parsed < minTimeout || parsed > maxTimeout {
		check.failf(finding.RunspecTimeoutOutOfRange, lineAt(positions, prefix+".timeout", prefix),
			"timeout %q of run %q must be 1s to 600s", raw.Timeout, name)
		return 0
	}
	return parsed
}

// checkExpect checks the expectation and resolves its defaults.
func (check *checker) checkExpect(raw *runYAML, positions map[string]int, prefix, kind, name string, nameLine int) Expectation {
	var expect Expectation
	expect.Stderr = "empty"
	if raw.Expect == nil {
		check.failf(finding.RunspecMissingExit, nameLine,
			"run %q needs an expected exit status", name)
		check.failf(finding.RunspecMissingStdout, nameLine,
			"run %q needs an expected standard output", name)
		return expect
	}
	want := raw.Expect
	expectLine := lineAt(positions, prefix+".expect", prefix)
	switch {
	case want.Exit == nil:
		check.failf(finding.RunspecMissingExit, expectLine,
			"run %q needs an expected exit status", name)
	case *want.Exit < 0 || *want.Exit > 255:
		check.failf(finding.RunspecExitOutOfRange, lineAt(positions, prefix+".expect.exit", prefix),
			"exit %d of run %q must be 0 to 255", *want.Exit, name)
	default:
		expect.Exit = *want.Exit
	}
	check.checkStdout(want, positions, prefix, kind, name, expectLine, &expect)
	check.checkStderr(want, positions, prefix, &expect)
	return expect
}

// checkStdout checks the expected standard output and the invariant rule.
func (check *checker) checkStdout(want *expectYAML, positions map[string]int, prefix, kind, name string, expectLine int, expect *Expectation) {
	switch want.Stdout {
	case "":
		check.failf(finding.RunspecMissingStdout, expectLine,
			"run %q needs an expected standard output", name)
	case ignoreWord:
		expect.Stdout = ignoreWord
		switch {
		case want.Invariant != "":
			expect.Invariant = want.Invariant
		case kind == kindExample:
			check.failf(finding.RunspecMissingInvariant, lineAt(positions, prefix+".expect.stdout", prefix),
				"run %q ignoring standard output needs an invariant", name)
		default:
			expect.Invariant = defaultCheckInvariant
		}
	default:
		check.checkStdoutFile(want, positions, prefix, expect)
	}
}

// checkStdoutFile checks a standard-output file value against the path rules.
func (check *checker) checkStdoutFile(want *expectYAML, positions map[string]int, prefix string, expect *Expectation) {
	line := lineAt(positions, prefix+".expect.stdout", prefix)
	switch {
	case !checkCoursePath(want.Stdout):
		check.failf(finding.RunspecPathEscape, line,
			"standard output %q leaves the unit", want.Stdout)
	case !strings.HasSuffix(want.Stdout, ".txt"):
		check.failf(finding.RunspecInvalidExpectFile, line,
			"standard output %q must be a .txt file", want.Stdout)
	default:
		expect.Stdout = want.Stdout
	}
	expect.Invariant = want.Invariant
}

// checkStderr checks the expected standard error word or file: empty,
// ignore, or a unit-relative .txt path. Path-shaped values follow the path
// rules; any other bare word is outside the vocabulary.
func (check *checker) checkStderr(want *expectYAML, positions map[string]int, prefix string, expect *Expectation) {
	switch {
	case want.Stderr == "":
		return
	case stderrWords[want.Stderr]:
		expect.Stderr = want.Stderr
		return
	}
	line := lineAt(positions, prefix+".expect.stderr", prefix)
	switch {
	case !checkCoursePath(want.Stderr):
		check.failf(finding.RunspecPathEscape, line,
			"standard error %q leaves the unit", want.Stderr)
	case !strings.Contains(want.Stderr, "/") && !strings.HasSuffix(want.Stderr, ".txt"):
		check.failf(finding.RunspecInvalidStderr, line,
			"standard error %q must be empty, ignore, or a .txt file", want.Stderr)
	case !strings.HasSuffix(want.Stderr, ".txt"):
		check.failf(finding.RunspecInvalidExpectFile, line,
			"standard error %q must be empty, ignore, or a .txt file", want.Stderr)
	default:
		expect.Stderr = want.Stderr
	}
}
