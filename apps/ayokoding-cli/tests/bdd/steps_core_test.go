package bdd_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/cucumber/godog"
)

// allZeroCommit is the 40-zero commit the stamped-build scenarios name.
const allZeroCommit = "0000000000000000000000000000000000000000"

// errStepFailed marks every step-assertion failure; the text after it names
// the mismatch.
var errStepFailed = errors.New("step assertion failed")

// world carries one scenario from Given through Then. The embedded level
// state holds what only the integration and end-to-end levels stage.
type world struct {
	levelState

	driver     Driver
	adapter    string
	env        map[string]string
	pending    []string
	version    string
	commit     string
	closeAfter int
	catalog    string
	result     Result
}

// run invokes args with the scenario environment and records the result.
func (w *world) run(args []string) error {
	result, err := w.driver.Invoke(Invocation{
		Args:            args,
		Env:             w.env,
		Version:         w.version,
		Commit:          w.commit,
		CloseAfterLines: w.closeAfter,
	})
	if err != nil {
		return fmt.Errorf("%w: invoke %q", errStepFailed, args)
	}
	w.result = result
	return nil
}

// given establishes the hermetic scenario context: stamps, environment
// variables, and in-process faults. Every other step goes to givenLevel.
func (w *world) given(text string) error {
	switch text {
	case `a build stamped with version "v0.0.0-test" and an all-zero commit`:
		w.version = "v0.0.0-test"
		w.commit = allZeroCommit
		return nil
	case `the environment variable NO_COLOR is set`:
		w.env["NO_COLOR"] = "1"
		return nil
	case `a fixture course with a failing run`:
		w.env["AYOKODING_FAULT"] = "failing-run"
		return nil
	case `the harness fails internally while checking a course`:
		w.env["AYOKODING_FAULT"] = "panic"
		w.pending = []string{"examples", "check", "--course", "demo"}
		return nil
	case `a reader that closes standard output after one line`:
		w.closeAfter = 1
		return nil
	default:
		return w.givenLevel(text)
	}
}

// when performs the hermetic scenario action. Every other step goes to
// whenLevel.
func (w *world) when(text string) error {
	switch text {
	case `I ask ayokoding-cli for help`:
		return w.run([]string{"--help"})
	case `I run ayokoding-cli with no arguments`:
		return w.run([]string{})
	case `I ask ayokoding-cli for its version`:
		return w.run([]string{"--version"})
	case `I run ayokoding-cli with the flag "--no-such-flag"`:
		return w.run([]string{"--no-such-flag"})
	case `I check that course with colour set to auto`:
		return w.run([]string{"examples", "check", "--course", "demo", "--color", "auto"})
	case `I check that course with colour set to "always"`:
		return w.run([]string{"examples", "check", "--course", "demo", "--color", "always"})
	case `I check that course with colour set to "never"`:
		return w.run([]string{"examples", "check", "--course", "demo", "--color", "never"})
	case `I list the toolchains with JSON output`:
		return w.run(w.toolchainsList("--output", "json"))
	case `the command ends`:
		if len(w.pending) == 0 {
			return fmt.Errorf("%w: no pending command for %q", errStepFailed, text)
		}
		return w.run(w.pending)
	case `I check a fixture course with many findings`:
		w.env["AYOKODING_FAULT"] = "spam"
		return w.run([]string{"examples", "check", "--course", "many"})
	default:
		return w.whenLevel(text)
	}
}

// then asserts the hermetic scenario outcome. Every other step goes to
// thenLevel.
func (w *world) then(text string) error {
	switch text {
	case `it exits with status 0`:
		return w.requireStatus(0)
	case `it exits with status 2`:
		return w.requireStatus(2)
	case `the exit status is 141`:
		return w.requireStatus(141)
	case `each failed run is labelled with the word "failed"`:
		return w.requireStdoutContains("failed")
	case `standard error names error code "ayokoding.internal.panic"`:
		return w.requireStderrContains("ayokoding.internal.panic")
	case `standard error contains no stack trace`:
		if strings.Contains(w.result.Stderr, "goroutine") {
			return fmt.Errorf("%w: stderr leaks a stack trace (stderr=%q)", errStepFailed, w.result.Stderr)
		}
		return nil
	case `standard output lists the commands "examples" and "toolchains"`:
		return w.requireStdoutContains("examples", "toolchains")
	case `standard output lists the exit statuses 0, 1, 2, 124, 125, 126, 127, 130, and 141 with their meanings`:
		return w.requireStdoutContains("Exit statuses", "0", "1", "2", "124", "125", "126", "127", "130", "141")
	case `standard output is empty`:
		if w.result.Stdout != "" {
			return fmt.Errorf("%w: stdout not empty (stdout=%q)", errStepFailed, w.result.Stdout)
		}
		return nil
	case `standard error shows the usage`:
		return w.requireStderrContains("Usage:")
	case `standard output names version "v0.0.0-test", the all-zero commit, and the catalog hash`:
		return w.requireVersionNames()
	case `neither stream contains an escape sequence`:
		if strings.Contains(w.result.Stdout, "\x1b") || strings.Contains(w.result.Stderr, "\x1b") {
			return fmt.Errorf("%w: streams carry colour (stdout=%q stderr=%q)",
				errStepFailed, w.result.Stdout, w.result.Stderr)
		}
		return nil
	case `the colour in the output is "present"`:
		return w.requireColour(true)
	case `the colour in the output is "absent"`:
		return w.requireColour(false)
	case `standard output is one JSON document`:
		return w.requireJSONDocument()
	default:
		return w.thenLevel(text)
	}
}

// requireStatus asserts the recorded exit status.
func (w *world) requireStatus(want int) error {
	if w.result.Status != want {
		return fmt.Errorf("%w: status=%d, want %d (stdout=%q stderr=%q)",
			errStepFailed, w.result.Status, want, w.result.Stdout, w.result.Stderr)
	}
	return nil
}

// requireStdoutContains asserts standard output names every value.
func (w *world) requireStdoutContains(values ...string) error {
	for _, value := range values {
		if !strings.Contains(w.result.Stdout, value) {
			return fmt.Errorf("%w: stdout missing %q (stdout=%q)", errStepFailed, value, w.result.Stdout)
		}
	}
	return nil
}

// requireStderrContains asserts standard error names every value.
func (w *world) requireStderrContains(values ...string) error {
	for _, value := range values {
		if !strings.Contains(w.result.Stderr, value) {
			return fmt.Errorf("%w: stderr missing %q (stderr=%q)", errStepFailed, value, w.result.Stderr)
		}
	}
	return nil
}

// requireVersionNames asserts the version names the build, commit, and catalog.
func (w *world) requireVersionNames() error {
	for _, value := range []string{w.version, w.commit, "catalog "} {
		if !strings.Contains(w.result.Stdout, value) {
			return fmt.Errorf("%w: version names no %q (stdout=%q)", errStepFailed, value, w.result.Stdout)
		}
	}
	return nil
}

// toolchainsList builds the toolchain list command with the scenario catalog.
func (w *world) toolchainsList(extra ...string) []string {
	args := []string{"toolchains", "list"}
	if w.catalog != "" {
		args = append(args, "--catalog", w.catalog)
	}
	return append(args, extra...)
}

// requireColour asserts that either stream carries an escape sequence, or
// that neither does.
func (w *world) requireColour(present bool) error {
	coloured := strings.Contains(w.result.Stdout, "\x1b") || strings.Contains(w.result.Stderr, "\x1b")
	if coloured != present {
		return fmt.Errorf("%w: colour present=%t, want %t (stdout=%q stderr=%q)",
			errStepFailed, coloured, present, w.result.Stdout, w.result.Stderr)
	}
	return nil
}

// requireJSONDocument asserts standard output is one JSON document.
func (w *world) requireJSONDocument() error {
	if err := w.requireStatus(0); err != nil {
		return err
	}
	var document any
	if err := json.Unmarshal([]byte(strings.TrimSpace(w.result.Stdout)), &document); err != nil {
		return fmt.Errorf("%w: stdout is not one JSON document (stdout=%q)", errStepFailed, w.result.Stdout)
	}
	return nil
}

// registerSteps binds every corpus step through one dispatcher per keyword,
// then lets the level add its own hooks.
func registerSteps(ctx *godog.ScenarioContext, driver Driver, adapter string) {
	scenario := &world{driver: driver, adapter: adapter, env: map[string]string{}}
	ctx.Given(`^(.*)$`, scenario.given)
	ctx.When(`^(.*)$`, scenario.when)
	ctx.Then(`^(.*)$`, scenario.then)
	scenario.registerHooks(ctx)
}
