package bdd_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"time"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/toolchains"
)

// allZeroCommit is the 40-zero commit the stamped-build scenarios name.
const allZeroCommit = "0000000000000000000000000000000000000000"

// errStepFailed marks every step-assertion failure; the text after it names
// the mismatch.
var errStepFailed = errors.New("step assertion failed")

// recipeState carries the derived-image recipe for the tag scenario.
type recipeState struct {
	set        bool
	id         string
	base       string
	dockerfile []byte
	before     string
}

// world carries one scenario from Given through Then.
type world struct {
	driver          Driver
	adapter         string
	env             map[string]string
	pending         []string
	version         string
	commit          string
	closeAfter      int
	content         string
	course          string
	unit            string
	catalog         string
	recipe          recipeState
	result          Result
	syncTemp        string
	hostEnv         map[string]hostValue
	cliBinary       string
	baseRev         string
	coverageCourses []string
	podmanCalls     []string
	podmanTag       string
	podmanStore     map[string]string
	podmanImage     string
	nativeTrace     []string
	nativeImageID   string
}

// fixturePath resolves a committed fixture file for every driver: the unit
// driver reads it in process, the binary drivers through an absolute flag.
func fixturePath(elem ...string) string {
	var callers [1]uintptr
	runtime.Callers(1, callers[:])
	frame, _ := runtime.CallersFrames(callers[:]).Next()
	base := filepath.Join(filepath.Dir(frame.File), "..", "testdata")
	return filepath.Join(append([]string{base}, elem...)...)
}

// fixtureCourses is the committed fixture course tree.
func fixtureCourses() string {
	return fixturePath("courses")
}

// pinnedCatalog is the pinned test catalog Phase 2 scenarios validate and
// list against. The embedded catalog carries PENDING digests and refuses to
// load until Phase 3 pins them, so tests inject this catalog file instead.
func pinnedCatalog() string {
	return fixturePath("catalog.yaml")
}

// requireFixture fails fast when a fixture the step names drifted.
func requireFixture(path string) error {
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("%w: fixture %q: %w", errStepFailed, path, err)
	}
	return nil
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

// given establishes scenario context: stamps, environment, fixtures, faults.
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
	case `an opted-in course`:
		w.content = fixtureCourses()
		w.course = "broken-layout"
		w.catalog = pinnedCatalog()
		return requireFixture(filepath.Join(w.content, w.course, "learning", "code", "ex-01-hello", "run.yaml"))
	case `the course has the file "learning/code/ex-03-loops.py"`:
		return requireFixture(filepath.Join(w.content, w.course, "learning", "code", "ex-03-loops.py"))
	case `the course has code under "learning/coroutines/code"`:
		return requireFixture(filepath.Join(w.content, w.course, "learning", "coroutines", "code", "worker.py"))
	case `the course has the unit "learning/code/ex-04-maps" without a run spec`:
		return requireFixture(filepath.Join(w.content, w.course, "learning", "code", "ex-04-maps", "main.py"))
	case `the course has a run spec at "learning/run.yaml"`:
		return requireFixture(filepath.Join(w.content, w.course, "learning", "run.yaml"))
	case `a unit whose run spec has the key "expected_output"`:
		return w.useUnit("ex-01-unknown-key")
	case `a unit whose run spec names the toolchain "cobol"`:
		return w.useUnit("ex-07-bad-toolchain")
	case `a unit whose run expects standard output from "../shared/out.txt"`:
		return w.useUnit("ex-28-escape")
	case `a unit whose run has the timeout "601s"`:
		return w.useUnit("ex-20-bad-timeout")
	case `a unit whose example run ignores standard output and states no invariant`:
		return w.useUnit("ex-32-no-invariant")
	case `a unit whose run spec declares a toolchain, a command, an exit status, and an expected output file`:
		return w.useUnit("ex-99-ok")
	case `a static unit with reason "desktop" and note "Needs a desktop shell."`:
		return w.useUnit("ex-10-static-bad-reason")
	case `a static unit with reason "ios" and note ""`:
		return w.useUnit("ex-11-static-no-note")
	case `a static unit that declares the "postgres" service`:
		return w.useUnit("ex-12-static-services")
	case `a catalog entry whose image has a tag but no digest`:
		w.catalog = fixturePath("catalog-unpinned.yaml")
		return requireFixture(w.catalog)
	case `the embedded catalog`:
		// Phase 2 stand-in: the embedded catalog is unpinned and refuses to
		// load, so the list shape is proved against the pinned test catalog.
		// Phase 3 repoints this step at the embedded catalog.
		w.catalog = pinnedCatalog()
		return requireFixture(w.catalog)
	case `a derived toolchain recipe`:
		w.recipe = recipeState{
			set:        true,
			id:         "shell",
			base:       "docker.io/library/debian:trixie@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			dockerfile: []byte("FROM debian@trixie\nRUN apt-get install -y bash\n"),
		}
		w.recipe.before = catalog.DerivedTag(w.recipe.id, w.recipe.base, w.recipe.dockerfile, nil)
		return nil
	default:
		return w.givenPhase5(text)
	}
}

// givenPhase5 establishes the Phase 5 run scenario context: fixture
// courses, environment faults, and the staged interrupt.
func (w *world) givenPhase5(text string) error {
	switch text {
	case `a unit whose program prints exactly its expected output and exits 0`:
		return w.useRunCourse("green-python", "")
	case `a unit whose program exits 3 where the run spec expects 0`:
		return w.useRunCourse("failing-run", "")
	case `a unit whose program prints a different second line than its expected file`:
		return w.useRunCourse("failing-run", "")
	case `a unit whose program writes a warning to standard error where the run spec expects it empty`:
		return w.useRunCourse("failing-run", "")
	case `a unit whose program runs longer than its two-second timeout`:
		return w.useRunCourse("failing-run", "")
	case `a unit with two runs, one with an expected output file and one without`:
		return w.useRecordCourse()
	case `a unit that declares the "postgres" service and queries it at host "postgres"`:
		return w.useServiceCourse()
	case `a unit whose program fetches a web address and prints the response`:
		return w.useRunCourse("network-attempt", "")
	case `the host environment contains the variable "SECRET_TOKEN"`:
		if err := w.useRunCourse("green-python", "learning/code/ex-03-env"); err != nil {
			return err
		}
		return w.setHostEnv("SECRET_TOKEN", "test-secret")
	case `a unit whose program prints an unseeded random number`:
		return w.useRunCourse("nondeterministic", "")
	case `a unit whose program overwrites its own source file`:
		return w.useRunCourse("green-python", "")
	case `a simulation unit whose program prints no summary line`:
		return w.useRunCourse("simulation", "")
	case `a simulation unit whose summary reads "seeds: 8 passed, 0 failed (of 8)"`:
		return w.useRunCourse("simulation", "")
	case `a simulation unit with 64 seeds`:
		return w.useRunCourse("simulation", "learning/code/ex-01-sim")
	case `a simulation unit that expects exit status 1 and an output listing seeds 4 and 31 as failing`:
		return w.useRunCourse("simulation", "learning/code/ex-04-bugdemo")
	case `a static unit with reason "ios", a note, and a validator command`:
		return w.useRunCourse("static-unit", "")
	case `an opted-in course with one unit`:
		w.content = fixtureCourses()
		w.course = "static-unit"
		w.catalog = ""
		w.unit = ""
		return requireFixture(filepath.Join(w.content, w.course, "learning", "code", "ex-01-parse", "run.yaml"))
	case `the container command does not exist`:
		return w.useMissingContainerCLI()
	case `the container command exists but is not executable`:
		return w.useUnusableContainerCLI()
	case `the container runtime reports that it is unavailable`:
		return w.useFakeContainerCLI(map[string]string{"FAKECONTAINER_DAEMON_DOWN": "1"})
	case `the unit declares a service that never reports ready`:
		return w.useNeverReadyService()
	case `a fixture course whose run is still executing`:
		return w.useSlowRunCourse()
	default:
		return w.givenPodman(text)
	}
}

// useUnit points the scenario at one broken-runspec unit and fails fast when
// its run spec drifted.
func (w *world) useUnit(unit string) error {
	w.content = fixtureCourses()
	w.course = "broken-runspec"
	w.catalog = pinnedCatalog()
	w.unit = "learning/code/" + unit
	return requireFixture(filepath.Join(w.content, w.course, w.unit, "run.yaml"))
}

// useRunCourse points the scenario at one run fixture course and fails fast
// when its run spec drifted. Run scenarios use the embedded catalog, the
// same pinned images FIXTURE and SMOKE run against; the placeholder test
// catalog cannot pull.
func (w *world) useRunCourse(course, unit string) error {
	w.content = fixtureCourses()
	w.course = course
	w.catalog = ""
	w.unit = unit
	if err := requireFixture(filepath.Join(w.content, w.course)); err != nil {
		return err
	}
	if unit == "" {
		return nil
	}
	return requireFixture(filepath.Join(w.content, w.course, w.unit, "run.yaml"))
}

// useServiceLog aims the fake container log at a temporary file, so the
// cleanup step can prove every container and network went away. The After
// hook removes it.
func (w *world) useServiceLog() error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	return w.setHostEnv("FAKECONTAINER_LOG", filepath.Join(root, "fakecontainer.log"))
}

// useServiceCourse points the scenario at the postgres service fixture and
// aims the fake container log at a temporary file, so the cleanup step can
// prove every container and network went away. The After hook removes it.
func (w *world) useServiceCourse() error {
	if err := w.useRunCourse("services-postgres", ""); err != nil {
		return err
	}
	return w.useServiceLog()
}

// tempRoot returns the scenario scratch directory, creating it once. The
// After hook removes it with everything the scenario staged inside.
func (w *world) tempRoot() (string, error) {
	if w.syncTemp != "" {
		return w.syncTemp, nil
	}
	root, err := os.MkdirTemp("", "ayokoding-bdd-")
	if err != nil {
		return "", fmt.Errorf("%w: temporary scenario dir: %w", errStepFailed, err)
	}
	w.syncTemp = root
	return root, nil
}

// moduleRoot returns the CLI module directory holding the tests.
func moduleRoot() string {
	var callers [1]uintptr
	runtime.Callers(1, callers[:])
	frame, _ := runtime.CallersFrames(callers[:]).Next()
	return filepath.Dir(filepath.Dir(filepath.Dir(frame.File)))
}

// buildFakeContainer compiles the fake container CLI into the scenario
// scratch directory, so environment scenarios drive failures without
// touching the real daemon.
func (w *world) buildFakeContainer() (string, error) {
	root, err := w.tempRoot()
	if err != nil {
		return "", err
	}
	binary := filepath.Join(root, "fakecontainer")
	build := exec.CommandContext(context.Background(), "go", "build", "-trimpath", "-o", binary, "./tests/support/fakecontainer")
	build.Dir = moduleRoot()
	if output, err := build.CombinedOutput(); err != nil {
		return "", fmt.Errorf("%w: build fakecontainer: %w\n%s", errStepFailed, err, output)
	}
	return binary, nil
}

// useMissingContainerCLI points the scenario at a container command that
// does not exist.
func (w *world) useMissingContainerCLI() error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	return w.setHostEnv("AYOKODING_CONTAINER_CLI", filepath.Join(root, "no-such-cli"))
}

// useUnusableContainerCLI points the scenario at a container command file
// without the executable bit.
func (w *world) useUnusableContainerCLI() error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	stub := filepath.Join(root, "not-executable-cli")
	if err := os.WriteFile(stub, []byte("#!/bin/sh\nexit 0\n"), 0o644); err != nil {
		return fmt.Errorf("%w: write container stub: %w", errStepFailed, err)
	}
	return w.setHostEnv("AYOKODING_CONTAINER_CLI", stub)
}

// useFakeContainerCLI points the scenario at the fake container CLI with
// the scripted variables set.
func (w *world) useFakeContainerCLI(vars map[string]string) error {
	fake, err := w.buildFakeContainer()
	if err != nil {
		return err
	}
	if err := w.setHostEnv("AYOKODING_CONTAINER_CLI", fake); err != nil {
		return err
	}
	for key, value := range vars {
		if err := w.setHostEnv(key, value); err != nil {
			return err
		}
	}
	return nil
}

// fastReadyCatalog writes the embedded catalog with two-second service
// readiness bounds, so the never-ready scenario proves the 124 mapping and
// the teardown without waiting out the production minute. The bound itself
// is covered by containerplan unit tests over a fake clock.
func (w *world) fastReadyCatalog() (string, error) {
	raw := strings.ReplaceAll(string(toolchains.Bytes()), "readyTimeout: 60s", "readyTimeout: 2s")
	if _, err := catalog.Validated([]byte(raw)); err != nil {
		return "", fmt.Errorf("%w: fast catalog invalid: %w", errStepFailed, err)
	}
	root, err := w.tempRoot()
	if err != nil {
		return "", err
	}
	path := filepath.Join(root, "catalog-fastready.yaml")
	if err := os.WriteFile(path, []byte(raw), 0o600); err != nil {
		return "", fmt.Errorf("%w: write fast catalog: %w", errStepFailed, err)
	}
	return path, nil
}

// useNeverReadyService points the scenario at the lockfile-free postgres
// fixture with a fake runtime that never reports ready. No lockfile means
// no environment build: the readiness bound is the whole proof.
func (w *world) useNeverReadyService() error {
	if err := w.useRunCourse("services-unready", ""); err != nil {
		return err
	}
	if err := w.useServiceLog(); err != nil {
		return err
	}
	fake, err := w.buildFakeContainer()
	if err != nil {
		return err
	}
	if err := w.setHostEnv("AYOKODING_CONTAINER_CLI", fake); err != nil {
		return err
	}
	if err := w.setHostEnv("FAKECONTAINER_NEVER_READY", "1"); err != nil {
		return err
	}
	tweaked, err := w.fastReadyCatalog()
	if err != nil {
		return err
	}
	w.catalog = tweaked
	return nil
}

// useSlowRunCourse stages the interrupt scenario: the failing-run course
// under a fake runtime whose executions sleep, with a built CLI binary to
// signal. The executions stay running until the interrupt arrives.
func (w *world) useSlowRunCourse() error {
	if err := w.useRunCourse("failing-run", ""); err != nil {
		return err
	}
	if err := w.useFakeContainerCLI(map[string]string{
		"FAKECONTAINER_SLEEP": "30",
	}); err != nil {
		return err
	}
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	if err := w.setHostEnv("FAKECONTAINER_LOG", filepath.Join(root, "fakecontainer.log")); err != nil {
		return err
	}
	binary, err := buildBinary("v0.0.0-test", allZeroCommit)
	if err != nil {
		return err
	}
	w.cliBinary = binary
	return nil
}

// useRecordCourse copies the failing-run course aside and drops the second
// expected file, so the recording scenario starts missing exactly one file
// and never touches the committed fixtures. The After hook removes the copy.
func (w *world) useRecordCourse() error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	target := filepath.Join(root, "record")
	if err := copySyncDir(filepath.Join(fixtureCourses(), "failing-run"), filepath.Join(target, "failing-run")); err != nil {
		return err
	}
	second := filepath.Join(target, "failing-run", "learning", "code", "ex-05-record", "expected", "second.stdout.txt")
	if err := os.Remove(second); err != nil {
		return fmt.Errorf("%w: drop recorded file %q: %w", errStepFailed, second, err)
	}
	w.content = target
	w.course = "failing-run"
	w.catalog = ""
	w.unit = ""
	return nil
}

// setHostEnv sets one host variable for the scenario in the test process
// and in the spawned drivers, restoring it in the After hook: the unit
// driver runs in process, the binary drivers inherit it.
func (w *world) setHostEnv(key, value string) error {
	if w.hostEnv == nil {
		w.hostEnv = map[string]hostValue{}
	}
	if _, tracked := w.hostEnv[key]; !tracked {
		previous, present := os.LookupEnv(key)
		w.hostEnv[key] = hostValue{body: previous, present: present}
	}
	w.env[key] = value
	if err := os.Setenv(key, value); err != nil {
		return fmt.Errorf("%w: set host variable %q: %w", errStepFailed, key, err)
	}
	return nil
}

// hostValue remembers one host variable for the After hook.
type hostValue struct {
	body    string
	present bool
}

// restoreHostEnv returns every scenario host variable to its before state.
func (w *world) restoreHostEnv() {
	for key, saved := range w.hostEnv {
		if saved.present {
			_ = os.Setenv(key, saved.body)
		} else {
			_ = os.Unsetenv(key)
		}
	}
	w.hostEnv = nil
}

// when performs the scenario action.
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
	case `I run "examples run" with JSON output and no selection`:
		return w.run([]string{"examples", "run", "--output", "json"})
	case `I check that course with colour set to auto`:
		return w.run([]string{"examples", "check", "--course", "demo", "--color", "auto"})
	case `the command ends`:
		if len(w.pending) == 0 {
			return fmt.Errorf("%w: no pending command for %q", errStepFailed, text)
		}
		return w.run(w.pending)
	case `I check a fixture course with many findings`:
		w.env["AYOKODING_FAULT"] = "spam"
		return w.run([]string{"examples", "check", "--course", "many"})
	case `I validate the course`:
		args := []string{"examples", "validate", "--course", w.course, "--content", w.content}
		if w.catalog != "" {
			args = append(args, "--catalog", w.catalog)
		}
		return w.run(args)
	case `I list the toolchains`:
		args := []string{"toolchains", "list"}
		if w.catalog != "" {
			args = append(args, "--catalog", w.catalog)
		}
		return w.run(args)
	case `one byte of its Dockerfile changes`:
		if !w.recipe.set {
			return fmt.Errorf("%w: no recipe for %q", errStepFailed, text)
		}
		w.recipe.dockerfile = append(w.recipe.dockerfile, '\n')
		return nil
	case `I check the course by name`:
		return w.runRunCourse()
	case `the harness runs a unit`:
		return w.runRunCourse("--unit", w.unit)
	case `I run the course by name with recording enabled`:
		return w.runRunCourse("--record")
	case `I run that unit with seed 17`:
		return w.runRunCourse("--unit", w.unit, "--seed", "17")
	case `the harness receives an interrupt`:
		return w.interruptRun()
	default:
		return w.whenPodman(text)
	}
}

// runRunCourse runs examples run over the scenario course with the scenario
// content and catalog, plus extra flags. A scenario focused on one unit
// checks that unit only. Until Phase 6 wires examples check, the run
// scenarios prove the execution half through run.
func (w *world) runRunCourse(extra ...string) error {
	args := []string{"examples", "run", "--course", w.course, "--content", w.content}
	if w.catalog != "" {
		args = append(args, "--catalog", w.catalog)
	}
	if w.unit != "" && !slices.Contains(extra, "--unit") {
		args = append(args, "--unit", w.unit)
	}
	return w.run(append(args, extra...))
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

// requireJSONError asserts standard error is one JSON document with a code.
func (w *world) requireJSONError(code string) error {
	trimmed := strings.TrimSpace(w.result.Stderr)
	if strings.Contains(trimmed, "\n") {
		return fmt.Errorf("%w: stderr holds more than one document (stderr=%q)",
			errStepFailed, w.result.Stderr)
	}
	var body struct {
		SchemaVersion int `json:"schemaVersion"`
		Error         struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal([]byte(trimmed), &body); err != nil {
		return fmt.Errorf("%w: stderr is not one JSON document (stderr=%q)", errStepFailed, w.result.Stderr)
	}
	if body.SchemaVersion != 1 {
		return fmt.Errorf("%w: schemaVersion=%d, want 1", errStepFailed, body.SchemaVersion)
	}
	if body.Error.Code != code {
		return fmt.Errorf("%w: code=%q, want %q", errStepFailed, body.Error.Code, code)
	}
	return nil
}

// thenContract asserts the command-line contract output: help text,
// version, usage errors, and colour discipline.
func (w *world) thenContract(text string) error {
	switch text {
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
	case `standard error is one JSON document with error code "ayokoding.usage.missing-selection"`:
		return w.requireJSONError("ayokoding.usage.missing-selection")
	case `neither stream contains an escape sequence`:
		if strings.Contains(w.result.Stdout, "\x1b") || strings.Contains(w.result.Stderr, "\x1b") {
			return fmt.Errorf("%w: streams carry colour (stdout=%q stderr=%q)",
				errStepFailed, w.result.Stdout, w.result.Stderr)
		}
		return nil
	default:
		return w.thenPhase2(text)
	}
}

// then asserts the scenario outcome.
func (w *world) then(text string) error {
	switch text {
	case `it exits with status 0`:
		return w.requireStatus(0)
	case `it exits with status 1`:
		return w.requireStatus(1)
	case `it exits with status 2`:
		return w.requireStatus(2)
	case `the exit status is 141`:
		return w.requireStatus(141)
	case `each failed run is labelled with the word "failed"`:
		return w.requireStdoutContains("failed")
	case `the run is labelled "passed"`:
		if err := w.requireStatus(0); err != nil {
			return err
		}
		return w.requireStdoutContains("passed")
	case `the run is labelled "failed"`:
		if err := w.requireStatus(1); err != nil {
			return err
		}
		return w.requireStdoutContains("failed")
	case `the replay is labelled "passed"`:
		if err := w.requireStatus(0); err != nil {
			return err
		}
		return w.requireStdoutContains("passed")
	case `only the validator command was executed`:
		// The harness never echoes program output: a green static label
		// proves the validator compared cleanly, and executing the Swift
		// program with the validator command would fail the run instead.
		if err := w.requireStatus(0); err != nil {
			return err
		}
		return w.requireStdoutContains("passed (static)")
	case `the unit is labelled "passed (static)"`:
		return w.requireStdoutContains("passed (static)")
	case `standard error names error code "ayokoding.internal.panic"`:
		return w.requireStderrContains("ayokoding.internal.panic")
	case `standard error contains no stack trace`:
		if strings.Contains(w.result.Stderr, "goroutine") {
			return fmt.Errorf("%w: stderr leaks a stack trace (stderr=%q)", errStepFailed, w.result.Stderr)
		}
		return nil
	default:
		return w.thenPodman(text)
	}
}

// thenPhase2 asserts the validate and list outcomes Phase 2 added.
func (w *world) thenPhase2(text string) error {
	switch text {
	case `the finding "ayokoding.layout.flat-example" names "learning/code/ex-03-loops.py"`:
		return w.requireFinding("ayokoding.layout.flat-example", "learning/code/ex-03-loops.py")
	case `the finding "ayokoding.layout.unplaced-code" names "learning/coroutines/code"`:
		return w.requireFinding("ayokoding.layout.unplaced-code", "learning/coroutines/code")
	case `the finding "ayokoding.layout.missing-run-spec" names "learning/code/ex-04-maps"`:
		return w.requireFinding("ayokoding.layout.missing-run-spec", "learning/code/ex-04-maps")
	case `the finding "ayokoding.layout.misplaced-run-spec" names "learning/run.yaml"`:
		return w.requireFinding("ayokoding.layout.misplaced-run-spec", "learning/run.yaml")
	case `the finding "ayokoding.runspec.unknown-key" names the unit and line of "expected_output"`:
		if err := w.requireFinding("ayokoding.runspec.unknown-key", "expected_output"); err != nil {
			return err
		}
		return w.requireFinding("ayokoding.runspec.unknown-key", "ex-01-unknown-key/run.yaml:3")
	case `the finding "ayokoding.runspec.unknown-toolchain" names "cobol"`:
		return w.requireFinding("ayokoding.runspec.unknown-toolchain", "cobol")
	case `the finding "ayokoding.runspec.path-escape" names "../shared/out.txt"`:
		return w.requireFinding("ayokoding.runspec.path-escape", "../shared/out.txt")
	case `the finding "ayokoding.runspec.timeout-out-of-range" names "601s"`:
		return w.requireFinding("ayokoding.runspec.timeout-out-of-range", "601s")
	case `the finding "ayokoding.runspec.missing-invariant" names the run`:
		return w.requireFinding("ayokoding.runspec.missing-invariant", "ex-32-no-invariant")
	case `no finding is reported for the unit`:
		// Validation covers the whole course, so sibling units fail while
		// the valid unit stays silent.
		if strings.Contains(w.result.Stdout, "ex-99-ok") {
			return fmt.Errorf("%w: clean unit reported (stdout=%q)", errStepFailed, w.result.Stdout)
		}
		return nil
	case `the finding "ayokoding.runspec.unknown-static-reason" is reported`:
		return w.requireFinding("ayokoding.runspec.unknown-static-reason", "ex-10-static-bad-reason")
	case `the finding "ayokoding.runspec.missing-static-note" is reported`:
		return w.requireFinding("ayokoding.runspec.missing-static-note", "ex-11-static-no-note")
	case `the finding "ayokoding.runspec.static-with-services" is reported`:
		return w.requireFinding("ayokoding.runspec.static-with-services", "ex-12-static-services")
	case `standard error names error code "ayokoding.catalog.unpinned-image"`:
		return w.requireStderrContains("ayokoding.catalog.unpinned-image")
	case `each line shows an id, a kind, a version, and a digest-pinned image`:
		return w.requireToolchainLines()
	case `its image tag changes`:
		if !w.recipe.set {
			return fmt.Errorf("%w: no recipe to compare", errStepFailed)
		}
		after := catalog.DerivedTag(w.recipe.id, w.recipe.base, w.recipe.dockerfile, nil)
		if after == w.recipe.before {
			return fmt.Errorf("%w: tag=%q unchanged after a recipe byte", errStepFailed, after)
		}
		return nil
	default:
		return w.thenPhase4(text)
	}
}

// requireFinding asserts a finding exit with the code and the name on
// standard output.
func (w *world) requireFinding(code, name string) error {
	if w.result.Status != 1 {
		return fmt.Errorf("%w: status=%d, want 1 (stdout=%q stderr=%q)",
			errStepFailed, w.result.Status, w.result.Stdout, w.result.Stderr)
	}
	if !strings.Contains(w.result.Stdout, code) || !strings.Contains(w.result.Stdout, name) {
		return fmt.Errorf("%w: stdout names no %q for %q (stdout=%q)",
			errStepFailed, name, code, w.result.Stdout)
	}
	return nil
}

// requireToolchainLines asserts every list line carries an id, a kind, a
// version, and a digest-pinned image.
func (w *world) requireToolchainLines() error {
	if w.result.Status != 0 {
		return fmt.Errorf("%w: status=%d, want 0 (stderr=%q)",
			errStepFailed, w.result.Status, w.result.Stderr)
	}
	for _, want := range []string{"python", "language", "3.15.0", "postgres", "service", "18.6", "@sha256:"} {
		if !strings.Contains(w.result.Stdout, want) {
			return fmt.Errorf("%w: stdout missing %q (stdout=%q)", errStepFailed, want, w.result.Stdout)
		}
	}
	for line := range strings.SplitSeq(strings.TrimSpace(w.result.Stdout), "\n") {
		if len(strings.Fields(line)) != 4 {
			return fmt.Errorf("%w: line %q shows no id, kind, version, image", errStepFailed, line)
		}
	}
	return nil
}

// registerSteps binds every corpus step through one dispatcher per keyword.
func registerSteps(ctx *godog.ScenarioContext, driver Driver, adapter string) {
	scenario := &world{driver: driver, adapter: adapter, env: map[string]string{}}
	ctx.Given(`^(.*)$`, scenario.given)
	ctx.When(`^(.*)$`, scenario.when)
	ctx.Then(`^(.*)$`, scenario.then)
	ctx.After(func(hookCtx context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
		scenario.restoreHostEnv()
		if scenario.syncTemp == "" {
			return hookCtx, nil
		}
		if err := os.RemoveAll(scenario.syncTemp); err != nil {
			return hookCtx, fmt.Errorf("%w: remove sync temp dir: %w", errStepFailed, err)
		}
		scenario.syncTemp = ""
		return hookCtx, nil
	})
}

// syncUnanchoredLesson is the isolation lesson for the unanchored-fence
// scenario: one bare block beside one illustration.
const syncUnanchoredLesson = "# Unanchored\n\n```python\nprint(\"unmarked\")\n```\n\n" +
	"<!-- harness: illustration -->\n\n```python\nprint(\"marked\")\n```\n"

// useSyncCourse points the scenario at one committed sync fixture course.
// Sync needs no catalog: it compares lesson fences with course files.
func (w *world) useSyncCourse(course string) error {
	w.content = fixtureCourses()
	w.course = course
	w.catalog = ""
	return requireFixture(filepath.Join(w.content, w.course))
}

// requireSyncFiles fails fast when a sync fixture the step names drifted.
func requireSyncFiles(content, course string, files ...string) error {
	for _, file := range files {
		if err := requireFixture(filepath.Join(content, course, file)); err != nil {
			return err
		}
	}
	return nil
}

// copySyncCourse copies one fixture course into a temporary courses root
// and points the scenario at it, so --write scenarios never touch
// committed fixtures. The After hook removes the copy.
func (w *world) copySyncCourse(course string) error {
	root, err := os.MkdirTemp("", "ayokoding-sync-")
	if err != nil {
		return fmt.Errorf("%w: temporary sync courses: %w", errStepFailed, err)
	}
	w.syncTemp = root
	if err := copySyncDir(filepath.Join(fixtureCourses(), course), filepath.Join(root, course)); err != nil {
		return err
	}
	w.content = root
	w.course = course
	w.catalog = ""
	return nil
}

// copySyncDir copies a directory tree of regular files.
func copySyncDir(source, destination string) error {
	entries, err := os.ReadDir(source)
	if err != nil {
		return fmt.Errorf("%w: read fixture dir %q: %w", errStepFailed, source, err)
	}
	if err := os.MkdirAll(destination, 0o700); err != nil {
		return fmt.Errorf("%w: create sync temp dir %q: %w", errStepFailed, destination, err)
	}
	for _, entry := range entries {
		from := filepath.Join(source, entry.Name())
		target := filepath.Join(destination, entry.Name())
		if entry.IsDir() {
			if err := copySyncDir(from, target); err != nil {
				return err
			}
			continue
		}
		body, err := os.ReadFile(from)
		if err != nil {
			return fmt.Errorf("%w: read fixture file %q: %w", errStepFailed, from, err)
		}
		//nolint:gosec // the copied names come from the committed fixture tree, never from scenario input.
		if err := os.WriteFile(target, body, 0o600); err != nil {
			return fmt.Errorf("%w: write sync temp file %q: %w", errStepFailed, target, err)
		}
	}
	return nil
}

// writeSyncFile replaces one file inside the scenario course.
func (w *world) writeSyncFile(name, body string) error {
	route := filepath.Join(w.content, w.course, name)
	if err := os.WriteFile(route, []byte(body), 0o600); err != nil {
		return fmt.Errorf("%w: write sync temp file %q: %w", errStepFailed, route, err)
	}
	return nil
}

// readSyncFile reads one file inside the scenario course.
func (w *world) readSyncFile(name string) (string, error) {
	body, err := os.ReadFile(filepath.Join(w.content, w.course, name))
	if err != nil {
		return "", fmt.Errorf("%w: read course file %q: %w", errStepFailed, name, err)
	}
	return string(body), nil
}

// givenSync establishes the markdown-file-sync scenario context.
func (w *world) givenSync(text string) error {
	switch text {
	case `a lesson block anchored to "learning/code/ex-01-hello/example.py" with the same bytes as the file`:
		if err := w.useSyncCourse("green-python"); err != nil {
			return err
		}
		return requireSyncFiles(w.content, w.course, "learning/lessons/hello.md", "learning/code/ex-01-hello/example.py")
	case `a lesson block anchored to "learning/code/ex-01-hello/example.py" that differs on its third line`:
		if err := w.useSyncCourse("broken-sync"); err != nil {
			return err
		}
		return requireSyncFiles(w.content, w.course, "learning/lessons/sync.md", "learning/code/ex-01-hello/example.py")
	case `a lesson block anchored to "learning/code/ex-09-gone/example.py", which does not exist`:
		if err := w.useSyncCourse("broken-sync"); err != nil {
			return err
		}
		if err := requireSyncFiles(w.content, w.course, "learning/lessons/sync.md"); err != nil {
			return err
		}
		if _, err := os.Stat(filepath.Join(w.content, w.course, "learning/code/ex-09-gone/example.py")); !os.IsNotExist(err) {
			return fmt.Errorf("%w: missing-file target exists", errStepFailed)
		}
		return nil
	case `a lesson block anchored to lines 3 to 5 of a ten-line file and holding exactly those lines`:
		if err := w.useSyncCourse("green-python"); err != nil {
			return err
		}
		return requireSyncFiles(w.content, w.course, "learning/lessons/range.md", "learning/code/ex-02-range/lines.py")
	case `a lesson with one unanchored "python" block and one "python" block marked as an illustration`:
		if err := w.copySyncCourse("green-python"); err != nil {
			return err
		}
		return w.writeSyncFile("learning/lessons/unanchored.md", syncUnanchoredLesson)
	case `a lesson with an "Output" block that has no anchor`:
		if err := w.useSyncCourse("broken-sync"); err != nil {
			return err
		}
		return requireSyncFiles(w.content, w.course, "learning/lessons/sync.md")
	case `the unit "learning/code/ex-05-sets" that no lesson anchor targets`:
		if err := w.useSyncCourse("broken-sync"); err != nil {
			return err
		}
		return requireSyncFiles(w.content, w.course, "learning/code/ex-05-sets/example.py")
	case `a lesson block anchored to a file whose bytes differ from the block`:
		if err := w.copySyncCourse("green-python"); err != nil {
			return err
		}
		body, err := w.readSyncFile("learning/lessons/hello.md")
		if err != nil {
			return err
		}
		corrupted := strings.Replace(body, `print("world")`, `print("CHANGED")`, 1)
		if corrupted == body {
			return fmt.Errorf("%w: lesson holds no third line to corrupt", errStepFailed)
		}
		return w.writeSyncFile("learning/lessons/hello.md", corrupted)
	default:
		return w.givenPhase6(text)
	}
}

// whenSync performs the markdown-file-sync scenario action.
func (w *world) whenSync(text string) error {
	switch text {
	case `I sync the course`:
		return w.run([]string{"examples", "sync", "--course", w.course, "--content", w.content})
	case `I sync the course with writing enabled`:
		return w.run([]string{"examples", "sync", "--course", w.course, "--content", w.content, "--write"})
	default:
		return w.whenPhase6(text)
	}
}

// syncFinding is one rendered sync finding line.
type syncFinding struct {
	course  string
	path    string
	line    int
	code    string
	message string
}

// syncResults parses standard output into finding lines.
func (w *world) syncResults() ([]syncFinding, error) {
	trimmed := strings.TrimSpace(w.result.Stdout)
	if trimmed == "" {
		return nil, nil
	}
	var findings []syncFinding
	for line := range strings.SplitSeq(trimmed, "\n") {
		course, rest, _ := strings.Cut(line, " ")
		head, tail, _ := strings.Cut(rest, ":")
		number, tail, _ := strings.Cut(tail, ":")
		code, message, _ := strings.Cut(tail, ":")
		parsed := syncFinding{
			course:  course,
			path:    head,
			code:    strings.TrimSpace(code),
			message: strings.TrimSpace(message),
		}
		count := 0
		for _, digit := range strings.TrimSpace(number) {
			if digit < '0' || digit > '9' {
				return nil, fmt.Errorf("%w: finding line %q carries no line number", errStepFailed, line)
			}
			count = count*10 + int(digit-'0')
		}
		parsed.line = count
		findings = append(findings, parsed)
	}
	return findings, nil
}

// requireSyncFinding asserts a finding exit whose output names every value
// and returns the matching findings.
func (w *world) requireSyncFinding(code string, names ...string) ([]syncFinding, error) {
	if w.result.Status != 1 {
		return nil, fmt.Errorf("%w: status=%d, want 1 (stdout=%q stderr=%q)",
			errStepFailed, w.result.Status, w.result.Stdout, w.result.Stderr)
	}
	for _, name := range names {
		if !strings.Contains(w.result.Stdout, name) {
			return nil, fmt.Errorf("%w: stdout names no %q for %q (stdout=%q)",
				errStepFailed, name, code, w.result.Stdout)
		}
	}
	findings, err := w.syncResults()
	if err != nil {
		return nil, err
	}
	var matches []syncFinding
	for _, found := range findings {
		if found.code == code {
			matches = append(matches, found)
		}
	}
	if len(matches) == 0 {
		return nil, fmt.Errorf("%w: stdout reports no %q (stdout=%q)", errStepFailed, code, w.result.Stdout)
	}
	return matches, nil
}

// lessonAnchorLine returns the 1-based line of the first anchor naming the
// target.
func (w *world) lessonAnchorLine(lesson, target string) (int, error) {
	body, err := w.readSyncFile(lesson)
	if err != nil {
		return 0, err
	}
	for index, line := range strings.Split(body, "\n") {
		if strings.Contains(line, target) && strings.Contains(line, "**") {
			return index + 1, nil
		}
	}
	return 0, fmt.Errorf("%w: lesson %q anchors no %q", errStepFailed, lesson, target)
}

// lessonFenceAfter returns the 1-based line of the first fence opening at
// or after the marker line.
func (w *world) lessonFenceAfter(lesson, marker string) (int, error) {
	body, err := w.readSyncFile(lesson)
	if err != nil {
		return 0, err
	}
	marked := false
	for index, line := range strings.Split(body, "\n") {
		if !marked {
			if strings.Contains(line, marker) {
				marked = true
			}
			continue
		}
		if strings.HasPrefix(line, "```") {
			return index + 1, nil
		}
	}
	return 0, fmt.Errorf("%w: lesson %q shows no fence after %q", errStepFailed, lesson, marker)
}

// snapshotCourse records every file body below the scenario course.
func (w *world) snapshotCourse() (map[string]string, error) {
	snapshot := map[string]string{}
	if err := snapshotSyncDir(filepath.Join(w.content, w.course), "", snapshot); err != nil {
		return nil, err
	}
	return snapshot, nil
}

// snapshotSyncDir records one directory tree into the snapshot.
func snapshotSyncDir(root, prefix string, snapshot map[string]string) error {
	entries, err := os.ReadDir(filepath.Join(root, prefix))
	if err != nil {
		return fmt.Errorf("%w: read course dir: %w", errStepFailed, err)
	}
	for _, entry := range entries {
		rel := entry.Name()
		if prefix != "" {
			rel = prefix + "/" + entry.Name()
		}
		if entry.IsDir() {
			if err := snapshotSyncDir(root, rel, snapshot); err != nil {
				return err
			}
			continue
		}
		body, err := os.ReadFile(filepath.Join(root, rel))
		if err != nil {
			return fmt.Errorf("%w: read course file: %w", errStepFailed, err)
		}
		snapshot[rel] = string(body)
	}
	return nil
}

// thenPhase4 asserts the markdown-file-sync scenario outcomes.
func (w *world) thenPhase4(text string) error {
	switch text {
	case `no sync finding is reported`:
		return w.thenSyncClean()
	case `the finding "ayokoding.sync.mismatch" names the lesson file, the anchor line, and the third line`:
		return w.thenSyncMismatch()
	case `the finding "ayokoding.sync.missing-file" names "learning/code/ex-09-gone/example.py"`:
		_, err := w.requireSyncFinding("ayokoding.sync.missing-file", "learning/code/ex-09-gone/example.py")
		return err
	case `exactly one finding "ayokoding.sync.unanchored-fence" is reported, for the unmarked block`:
		return w.thenSyncUnanchored()
	case `the finding "ayokoding.sync.unanchored-output" names the lesson line`:
		return w.thenSyncOutput()
	case `the finding "ayokoding.sync.unreferenced-unit" names "learning/code/ex-05-sets"`:
		_, err := w.requireSyncFinding("ayokoding.sync.unreferenced-unit", "learning/code/ex-05-sets")
		return err
	case `the lesson block holds the file's bytes`:
		return w.thenSyncRepaired()
	case `syncing again reports no finding and changes no file`:
		return w.thenSyncIdempotent()
	default:
		return w.thenPhase5(text)
	}
}

// thenPhase5 asserts the Phase 5 run outcomes: comparisons, determinism,
// simulation, and recording.
func (w *world) thenPhase5(text string) error {
	switch text {
	case `the finding "ayokoding.examples.exit-mismatch" names expected 0 and actual 3`:
		return w.requireFindingNames("ayokoding.examples.exit-mismatch", "expected exit 0", "actual 3")
	case `the finding "ayokoding.examples.stdout-mismatch" shows line 2 expected and actual`:
		return w.requireFindingNames("ayokoding.examples.stdout-mismatch", "line 2", "beta", "BETA")
	case `the finding "ayokoding.examples.stderr-mismatch" is reported`:
		return w.requireFindingNames("ayokoding.examples.stderr-mismatch")
	case `the finding "ayokoding.examples.run-timeout" is reported`:
		return w.requireFindingNames("ayokoding.examples.run-timeout")
	case `the missing expected file is written with the run's output`:
		body, err := w.readRunFile(filepath.Join("learning", "code", "ex-05-record", "expected", "second.stdout.txt"))
		if err != nil {
			return err
		}
		if body != "two\n" {
			return fmt.Errorf("%w: recorded file holds %q, want the run output", errStepFailed, body)
		}
		return nil
	case `no service container or network remains afterwards`:
		return w.requireServiceCleanup()
	case `the existing expected file is unchanged`:
		body, err := w.readRunFile(filepath.Join("learning", "code", "ex-05-record", "expected", "first.stdout.txt"))
		if err != nil {
			return err
		}
		if body != "one\n" {
			return fmt.Errorf("%w: existing file holds %q, want it unchanged", errStepFailed, body)
		}
		return nil
	case `the run's environment does not contain "SECRET_TOKEN"`:
		if err := w.requireStatus(0); err != nil {
			return err
		}
		if strings.Contains(w.result.Stdout, "SECRET_TOKEN") {
			return fmt.Errorf("%w: stdout leaks SECRET_TOKEN (stdout=%q)", errStepFailed, w.result.Stdout)
		}
		return w.requireStdoutContains("passed")
	case `the run's environment sets "TZ" to "UTC" and "SOURCE_DATE_EPOCH" to "0"`:
		return w.requireStdoutContains("passed")
	case `the finding "ayokoding.examples.nondeterministic" shows the first differing line`:
		return w.requireFindingNames("ayokoding.examples.nondeterministic", "line 1")
	case `the source file in the course is unchanged`:
		body, err := os.ReadFile(filepath.Join(fixtureCourses(), "green-python", "learning", "code", "ex-04-immutable", "sticky.py"))
		if err != nil {
			return fmt.Errorf("%w: read source file: %w", errStepFailed, err)
		}
		const want = "\"\"\"Overwrite its own source, proving runs see a temporary copy (fixture).\"\"\"\n" +
			"\n" +
			"with open(\"sticky.py\", \"w\") as handle:\n" +
			"    handle.write(\"vandalized\\n\")\n" +
			"print(\"still here\")\n"
		if string(body) != want {
			return fmt.Errorf("%w: source file changed (body=%q)", errStepFailed, body)
		}
		return nil
	default:
		return w.thenSimulation(text)
	}
}

// thenSimulation asserts the simulation summary and replay outcomes.
func (w *world) thenSimulation(text string) error {
	switch text {
	case `the finding "ayokoding.examples.simulation-summary" is reported`:
		return w.requireFindingNames("ayokoding.examples.simulation-summary")
	case `the finding "ayokoding.examples.simulation-summary" names the total 8`:
		return w.requireFindingNames("ayokoding.examples.simulation-summary", "8")
	case `the run receives AYOKODING_SEED set to "17"`:
		return w.requireStdoutContains("seed 17")
	case `standard output shows the trace for seed 17`:
		return w.requireStdoutContains("trace for seed 17")
	case `no expected-output comparison is made`:
		return w.requireStdoutContains("replay seed 17")
	default:
		return w.thenEnv(text)
	}
}

// thenEnv asserts the supervisor statuses and the interrupt teardown.
func (w *world) thenEnv(text string) error {
	switch text {
	case `it exits with status 124`:
		return w.requireStatus(124)
	case `it exits with status 125`:
		return w.requireStatus(125)
	case `it exits with status 126`:
		return w.requireStatus(126)
	case `it exits with status 127`:
		return w.requireStatus(127)
	case `it exits with status 130`:
		return w.requireStatus(130)
	case `standard error names error code "ayokoding.env.container-cli-not-found"`:
		return w.requireStderrContains("ayokoding.env.container-cli-not-found")
	case `standard error names error code "ayokoding.env.container-runtime-unavailable"`:
		return w.requireStderrContains("ayokoding.env.container-runtime-unavailable")
	case `every container and network labelled with this run is removed`:
		return w.requireRunCleanup()
	default:
		return w.thenPhase6(text)
	}
}

// interruptTimeout bounds the wait for the staged run to start before the
// interrupt arrives.
const interruptTimeout = 60 * time.Second

// interruptRun starts the staged course in a child CLI, waits until its
// first execution container starts, interrupts it, and records the outcome.
// Every driver takes this path: signals cannot target the in-process unit
// driver without killing the suite itself.
func (w *world) interruptRun() error {
	if w.cliBinary == "" {
		return fmt.Errorf("%w: no staged CLI binary for the interrupt", errStepFailed)
	}
	log, ok := w.env["FAKECONTAINER_LOG"]
	if !ok {
		return fmt.Errorf("%w: no fake container log for the interrupt", errStepFailed)
	}
	args := []string{"examples", "run", "--course", w.course, "--content", w.content}
	if w.catalog != "" {
		args = append(args, "--catalog", w.catalog)
	}
	cmd := exec.CommandContext(context.Background(), w.cliBinary, args...)
	cmd.Env = os.Environ()
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("%w: start staged run: %w", errStepFailed, err)
	}
	deadline := time.Now().Add(interruptTimeout)
	for {
		body, err := os.ReadFile(log)
		if err == nil && strings.Contains(string(body), "started ayokoding-") {
			break
		}
		if time.Now().After(deadline) {
			_ = cmd.Process.Kill()
			_, _ = cmd.Process.Wait()
			return fmt.Errorf("%w: staged run never started (stdout=%q stderr=%q)", errStepFailed, stdout.String(), stderr.String())
		}
		time.Sleep(100 * time.Millisecond)
	}
	if err := cmd.Process.Signal(os.Interrupt); err != nil {
		return fmt.Errorf("%w: interrupt staged run: %w", errStepFailed, err)
	}
	status := 0
	if err := cmd.Wait(); err != nil {
		var exitErr *exec.ExitError
		if !errors.As(err, &exitErr) {
			return fmt.Errorf("%w: wait staged run: %w", errStepFailed, err)
		}
		status = exitErr.ExitCode()
	}
	w.result = Result{Status: status, Stdout: stdout.String(), Stderr: stderr.String()}
	return nil
}

// startedContainers lists every execution container the fake log started.
func startedContainers(log string) []string {
	var names []string
	for line := range strings.Lines(log) {
		name, ok := strings.CutPrefix(strings.TrimSpace(line), "started ")
		if !ok || name == "" {
			continue
		}
		names = append(names, name)
	}
	return names
}

// requireRunCleanup asserts every started container was removed, and every
// created network with it.
func (w *world) requireRunCleanup() error {
	path, ok := w.env["FAKECONTAINER_LOG"]
	if !ok {
		return fmt.Errorf("%w: no fake container log for the interrupt", errStepFailed)
	}
	body, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("%w: read fake container log: %w", errStepFailed, err)
	}
	logged := string(body)
	started := startedContainers(logged)
	if len(started) == 0 {
		return fmt.Errorf("%w: log started no container (log=%q)", errStepFailed, logged)
	}
	for _, name := range started {
		if !strings.Contains(logged, "removed container "+name) {
			return fmt.Errorf("%w: container %q never removed (log=%q)", errStepFailed, name, logged)
		}
	}
	for line := range strings.Lines(logged) {
		network, ok := strings.CutPrefix(strings.TrimSpace(line), "created network ")
		if !ok || network == "" {
			continue
		}
		if !strings.Contains(logged, "removed network "+network) {
			return fmt.Errorf("%w: network %q never removed (log=%q)", errStepFailed, network, logged)
		}
	}
	return runtimeEmpty()
}

// runtimeEmpty checks the same selected runtime used by the scenario.
func runtimeEmpty() error {
	runtime := &containers.Runtime{}
	psOut, err := runtime.Run(context.Background(), containerplan.Invocation{Binary: "", Args: []string{"ps", "-a", "--filter", "label=ayokoding.run", "--format", "{{.Names}}"}}, nil)
	if err != nil {
		return fmt.Errorf("%w: list labelled containers: %w", errStepFailed, err)
	}
	if psOut.ExitCode != 0 || strings.TrimSpace(psOut.Output) != "" {
		return fmt.Errorf("%w: labelled containers remain or listing failed: %q", errStepFailed, psOut.Output)
	}
	lsOut, err := runtime.Run(context.Background(), containerplan.Invocation{Binary: "", Args: []string{"network", "ls", "--filter", "name=ayokoding-", "--format", "{{.Name}}"}}, nil)
	if err != nil {
		return fmt.Errorf("%w: list harness networks: %w", errStepFailed, err)
	}
	if lsOut.ExitCode != 0 || strings.TrimSpace(lsOut.Output) != "" {
		return fmt.Errorf("%w: harness networks remain or listing failed: %q", errStepFailed, lsOut.Output)
	}
	return nil
}

// requireServiceCleanup asserts the ordered teardown: with the fake
// runtime the log records every service container removed before the
// network; with the real daemon the labelled resources are simply gone.
func (w *world) requireServiceCleanup() error {
	if path, ok := w.env["FAKECONTAINER_LOG"]; ok {
		if body, err := os.ReadFile(path); err == nil && len(bytes.TrimSpace(body)) != 0 {
			logged := string(body)
			remove := strings.Index(logged, "rm -f")
			network := strings.Index(logged, "network rm")
			if remove < 0 || network < 0 || remove > network {
				return fmt.Errorf("%w: log misses the ordered teardown (log=%q)", errStepFailed, logged)
			}
		}
	}
	return runtimeEmpty()
}

// requireFindingNames asserts one finding line carries the code and every
// name with exit status 1.
func (w *world) requireFindingNames(code string, names ...string) error {
	if w.result.Status != 1 {
		return fmt.Errorf("%w: status=%d, want 1 (stdout=%q stderr=%q)",
			errStepFailed, w.result.Status, w.result.Stdout, w.result.Stderr)
	}
	for line := range strings.SplitSeq(w.result.Stdout, "\n") {
		if !strings.Contains(line, code) {
			continue
		}
		matched := true
		for _, name := range names {
			if !strings.Contains(line, name) {
				matched = false
			}
		}
		if matched {
			return nil
		}
	}
	return fmt.Errorf("%w: stdout names no %q with %q (stdout=%q)",
		errStepFailed, code, names, w.result.Stdout)
}

// readRunFile reads one file inside the scenario course.
func (w *world) readRunFile(name string) (string, error) {
	body, err := os.ReadFile(filepath.Join(w.content, w.course, name))
	if err != nil {
		return "", fmt.Errorf("%w: read course file %q: %w", errStepFailed, name, err)
	}
	return string(body), nil
}

// thenSyncClean asserts a sync with no findings and an empty output.
func (w *world) thenSyncClean() error {
	if w.result.Status != 0 {
		return fmt.Errorf("%w: status=%d, want 0 (stdout=%q stderr=%q)",
			errStepFailed, w.result.Status, w.result.Stdout, w.result.Stderr)
	}
	if strings.TrimSpace(w.result.Stdout) != "" {
		return fmt.Errorf("%w: stdout not empty (stdout=%q)", errStepFailed, w.result.Stdout)
	}
	return nil
}

// thenSyncMismatch asserts the mismatch names the lesson, the anchor
// line, and the third body line.
func (w *world) thenSyncMismatch() error {
	matches, err := w.requireSyncFinding("ayokoding.sync.mismatch", "learning/lessons/sync.md", "line 3")
	if err != nil {
		return err
	}
	anchor, err := w.lessonAnchorLine("learning/lessons/sync.md", "learning/code/ex-01-hello/example.py")
	if err != nil {
		return err
	}
	for _, match := range matches {
		if match.path == "learning/lessons/sync.md" && match.line == anchor && strings.Contains(match.message, "line 3") {
			return nil
		}
	}
	return fmt.Errorf("%w: no mismatch names the lesson, anchor line %d, and body line 3", errStepFailed, anchor)
}

// thenSyncUnanchored asserts the only finding is the unmarked block.
func (w *world) thenSyncUnanchored() error {
	if w.result.Status != 1 {
		return fmt.Errorf("%w: status=%d, want 1 (stdout=%q stderr=%q)",
			errStepFailed, w.result.Status, w.result.Stdout, w.result.Stderr)
	}
	findings, err := w.syncResults()
	if err != nil {
		return err
	}
	if len(findings) != 1 {
		return fmt.Errorf("%w: %d findings, want exactly one (stdout=%q)",
			errStepFailed, len(findings), w.result.Stdout)
	}
	fence, err := w.lessonFenceAfter("learning/lessons/unanchored.md", "# Unanchored")
	if err != nil {
		return err
	}
	found := findings[0]
	if found.code != "ayokoding.sync.unanchored-fence" || found.path != "learning/lessons/unanchored.md" || found.line != fence {
		return fmt.Errorf("%w: finding %+v is not the unmarked block at line %d", errStepFailed, found, fence)
	}
	return nil
}

// thenSyncOutput asserts the output finding names its lesson line.
func (w *world) thenSyncOutput() error {
	matches, err := w.requireSyncFinding("ayokoding.sync.unanchored-output")
	if err != nil {
		return err
	}
	fence, err := w.lessonFenceAfter("learning/lessons/sync.md", "**Output**")
	if err != nil {
		return err
	}
	for _, match := range matches {
		if match.line == fence {
			return nil
		}
	}
	return fmt.Errorf("%w: no unanchored-output names lesson line %d", errStepFailed, fence)
}

// thenSyncRepaired asserts the written lesson block holds the file bytes.
func (w *world) thenSyncRepaired() error {
	lesson, err := w.readSyncFile("learning/lessons/hello.md")
	if err != nil {
		return err
	}
	target, err := w.readSyncFile("learning/code/ex-01-hello/example.py")
	if err != nil {
		return err
	}
	if !strings.Contains(lesson, target) {
		return fmt.Errorf("%w: lesson block holds no file bytes (lesson=%q target=%q)", errStepFailed, lesson, target)
	}
	return nil
}

// thenSyncIdempotent asserts a second sync reports nothing and changes no
// file.
func (w *world) thenSyncIdempotent() error {
	before, err := w.snapshotCourse()
	if err != nil {
		return err
	}
	if err := w.run([]string{"examples", "sync", "--course", w.course, "--content", w.content}); err != nil {
		return err
	}
	if err := w.thenSyncClean(); err != nil {
		return err
	}
	after, err := w.snapshotCourse()
	if err != nil {
		return err
	}
	if len(after) != len(before) {
		return fmt.Errorf("%w: second sync changed the file set", errStepFailed)
	}
	for name, body := range before {
		if after[name] != body {
			return fmt.Errorf("%w: second sync changed %q", errStepFailed, name)
		}
	}
	return nil
}
