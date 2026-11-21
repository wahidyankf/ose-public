package bdd_test

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// Step texts that the Phase 6 corpus review added to the CLI features. Each
// dispatcher falls through to these only after its own switch misses.
var (
	runSpecUnitStep      = regexp.MustCompile(`^the run spec of the unit "([^"]+)" in the broken course$`)
	runSpecFindingStep   = regexp.MustCompile(`^the run spec finding "([^"]+)" names "([^"]+)"$`)
	syncFindingStep      = regexp.MustCompile(`^the sync finding "([^"]+)" is reported$`)
	stderrCodeStep       = regexp.MustCompile(`^standard error names error code "([^"]+)"$`)
	syncNamedFindingStep = regexp.MustCompile(`^the sync finding "([^"]+)" names "([^"]+)"$`)
	runWithUnitStep      = regexp.MustCompile(`^I run the course by name with the unit "([^"]+)"$`)
	onlyUnitStep         = regexp.MustCompile(`^only the unit "([^"]+)" is run$`)
)

// greenPythonUnits are the other units of the green-python fixture course.
var greenPythonUnits = []string{"ex-02-range", "ex-03-env", "ex-04-immutable"}

// givenAdds establishes the context of the Phase 6 additions.
func (w *world) givenAdds(text string) (bool, error) {
	if match := runSpecUnitStep.FindStringSubmatch(text); match != nil {
		return true, w.useUnit(match[1])
	}
	switch text {
	case `the container command is replaced by a fake that logs its calls`:
		if err := w.useRunCourse("green-python", ""); err != nil {
			return true, err
		}
		if err := w.useFakeContainerCLI(nil); err != nil {
			return true, err
		}
		return true, w.useServiceLog()
	case `the container pull fails`:
		if err := w.useRunCourse("green-python", ""); err != nil {
			return true, err
		}
		return true, w.useFakeContainerCLI(map[string]string{"FAKECONTAINER_PULL_FAIL": "1"})
	case `git is not on the search path`:
		root, err := w.tempRoot()
		if err != nil {
			return true, err
		}
		return true, w.setHostEnv("PATH", root)
	case `a lesson with a range, fence, and line-ending fault`:
		return true, w.useSyncCourse("broken-sync")
	case `a course with two units whose programs both print their expected output`:
		return true, w.useRunCourse("green-python", "")
	case `the content tree holds the course "inert-course" without a run spec`:
		w.content = fixtureCourses()
		w.course = "inert-course"
		return true, nil
	case `a catalog file that lists the toolchains python and postgres`:
		w.catalog = fixturePath("catalog.yaml")
		return true, requireFixture(w.catalog)
	case `a unit whose program records its environment`:
		return true, w.useRunCourse("green-python", "learning/code/ex-03-env")
	}
	return false, nil
}

// whenAdds performs the action of the Phase 6 additions.
func (w *world) whenAdds(text string) (bool, error) {
	if match := runWithUnitStep.FindStringSubmatch(text); match != nil {
		return true, w.runRunCourse("--unit", match[1])
	}
	switch text {
	case `I list the toolchains with --no-input`:
		return true, w.run(w.toolchainsList("--no-input"))
	case `I list the toolchains with JSON output`:
		return true, w.run(w.toolchainsList("--output", "json"))
	case `I check that course with colour set to "always"`:
		return true, w.run([]string{"examples", "check", "--course", "demo", "--color", "always"})
	case `I check that course with colour set to "never"`:
		return true, w.run([]string{"examples", "check", "--course", "demo", "--color", "never"})
	case `I run "examples run" with "text" output and no selection`:
		return true, w.run([]string{"examples", "run", "--output", "text"})
	case `I run "examples run" with "json" output and no selection`:
		return true, w.run([]string{"examples", "run", "--output", "json"})
	case `I sync the content tree with --include-inert`:
		return true, w.run([]string{"examples", "sync", "--include-inert", "--content", w.content})
	case `I select all opted-in courses`:
		return true, w.run([]string{"examples", "affected", "--all", "--content", w.content, "--output", "json"})
	case `I run the examples changed since the base revision`:
		return true, w.run([]string{"examples", "run", "--since", "HEAD", "--content", w.content})
	case `I run the course by name with a single run`:
		return true, w.runRunCourse("--single-run")
	}
	return false, nil
}

// thenAdds asserts the outcome of the Phase 6 additions.
func (w *world) thenAdds(text string) (bool, error) {
	if match := syncFindingStep.FindStringSubmatch(text); match != nil {
		if err := w.requireStatus(1); err != nil {
			return true, err
		}
		return true, w.requireStdoutContains(match[1])
	}
	if match := runSpecFindingStep.FindStringSubmatch(text); match != nil {
		return true, w.requireFinding(match[1], match[2])
	}
	if match := syncNamedFindingStep.FindStringSubmatch(text); match != nil {
		return true, w.requireFinding(match[1], match[2])
	}
	if match := stderrCodeStep.FindStringSubmatch(text); match != nil {
		return true, w.requireStderrContains(match[1])
	}
	if match := onlyUnitStep.FindStringSubmatch(text); match != nil {
		return true, w.requireOnlyUnit(match[1])
	}
	switch text {
	case `the colour in the output is "present"`:
		return true, w.requireColour(true)
	case `the colour in the output is "absent"`:
		return true, w.requireColour(false)
	case `standard output is one JSON document`:
		return true, w.requireJSONDocument()
	case `the list names only the toolchains python and postgres`:
		return true, w.requireOnlyToolchains("python", "postgres")
	case `the run reports its first comparison and no nondeterministic finding`:
		return true, w.requireFirstComparisonOnly()
	case `the fake container CLI logs a started container`:
		return true, w.requireFakeStarted()
	}
	return false, nil
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

// requireOnlyToolchains asserts the list names exactly the wanted toolchains.
func (w *world) requireOnlyToolchains(want ...string) error {
	if err := w.requireStatus(0); err != nil {
		return err
	}
	lines := strings.Split(strings.TrimSpace(w.result.Stdout), "\n")
	if len(lines) != len(want) {
		return fmt.Errorf("%w: %d list lines, want %d (stdout=%q)", errStepFailed, len(lines), len(want), w.result.Stdout)
	}
	for _, name := range want {
		if !strings.Contains(w.result.Stdout, name) {
			return fmt.Errorf("%w: list misses %q (stdout=%q)", errStepFailed, name, w.result.Stdout)
		}
	}
	return nil
}

// requireOnlyUnit asserts the run reports the wanted unit and no sibling.
func (w *world) requireOnlyUnit(unit string) error {
	if err := w.requireStatus(0); err != nil {
		return err
	}
	if !strings.Contains(w.result.Stdout, unit) {
		return fmt.Errorf("%w: stdout misses unit %q (stdout=%q)", errStepFailed, unit, w.result.Stdout)
	}
	for _, sibling := range greenPythonUnits {
		if strings.Contains(w.result.Stdout, sibling) {
			return fmt.Errorf("%w: stdout ran sibling unit %q (stdout=%q)", errStepFailed, sibling, w.result.Stdout)
		}
	}
	return nil
}

// requireFirstComparisonOnly asserts the run made one comparison: the stdout
// mismatch of its first output, with no nondeterminism finding from a second run.
func (w *world) requireFirstComparisonOnly() error {
	if !strings.Contains(w.result.Stdout, "ayokoding.examples.stdout-mismatch") {
		return fmt.Errorf("%w: no first comparison reported (stdout=%q)", errStepFailed, w.result.Stdout)
	}
	if strings.Contains(w.result.Stdout, "ayokoding.examples.nondeterministic") {
		return fmt.Errorf("%w: second run reported nondeterminism (stdout=%q)", errStepFailed, w.result.Stdout)
	}
	return nil
}

// requireFakeStarted asserts the fake container CLI logged a started container.
func (w *world) requireFakeStarted() error {
	path := os.Getenv("FAKECONTAINER_LOG")
	if path == "" {
		return fmt.Errorf("%w: no fake container log is set", errStepFailed)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("%w: read fake container log: %w", errStepFailed, err)
	}
	if !strings.Contains(string(raw), "started ") {
		return fmt.Errorf("%w: fake container log holds no started container (log=%q)", errStepFailed, raw)
	}
	return nil
}
