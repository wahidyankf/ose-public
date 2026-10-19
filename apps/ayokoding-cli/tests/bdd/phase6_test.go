package bdd_test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
)

// phaseRunSpec is the minimal valid run spec the selection and coverage
// steps stage: the embedded catalog pins the python toolchain.
const phaseRunSpec = `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`

// phaseLesson anchors one unit's program with its expected output, so the
// staged course stays clean in every static phase.
func phaseLesson(unit string) string {
	return "**`learning/code/" + unit + "/example.py`**\n\n```python\nprint('hello')\n```\n\n" +
		"**Output** (`learning/code/" + unit + "/expected/main.stdout.txt`):\n\n```text\nhello\n```\n"
}

// selectionJSON decodes one affected JSON payload.
type selectionJSON struct {
	Mode    string   `json:"mode"`
	Courses []string `json:"courses"`
	Inert   []string `json:"inert"`
}

// worldFile writes one file below the scenario root, creating parents.
func (w *world) worldFile(name, body string) error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	route := filepath.Join(root, filepath.FromSlash(name))
	if err := os.MkdirAll(filepath.Dir(route), 0o700); err != nil {
		return fmt.Errorf("%w: create scenario dir: %w", errStepFailed, err)
	}
	if err := os.WriteFile(route, []byte(body), 0o600); err != nil {
		return fmt.Errorf("%w: write scenario file %q: %w", errStepFailed, name, err)
	}
	return nil
}

// stageOptedCourse stages one opted-in course with a valid run spec per
// named unit and a lesson anchoring every file.
func (w *world) stageOptedCourse(slug string, units ...string) error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	w.content = filepath.Join(root, "courses")
	var lesson strings.Builder
	for _, unit := range units {
		if err := w.worldFile("courses/"+slug+"/learning/code/"+unit+"/run.yaml", phaseRunSpec); err != nil {
			return err
		}
		if err := w.worldFile("courses/"+slug+"/learning/code/"+unit+"/example.py", "print('hello')\n"); err != nil {
			return err
		}
		if err := w.worldFile("courses/"+slug+"/learning/code/"+unit+"/expected/main.stdout.txt", "hello\n"); err != nil {
			return err
		}
		lesson.WriteString("# " + slug + "\n\n" + phaseLesson(unit) + "\n")
	}
	return w.worldFile("courses/"+slug+"/learning/lessons/hello.md", lesson.String())
}

// stageInertCourse stages one course without a run spec: code with a
// plain lesson.
func (w *world) stageInertCourse(slug string) error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	w.content = filepath.Join(root, "courses")
	if err := w.worldFile("courses/"+slug+"/learning/code/ex-01-g/main.py", "print(1)\n"); err != nil {
		return err
	}
	return w.worldFile("courses/"+slug+"/learning/lessons/g.md", "# G\n")
}

// runRepoGit runs one git command at the scenario repository root.
func (w *world) runRepoGit(args ...string) error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	cmd := exec.CommandContext(context.Background(), "git", args...)
	cmd.Dir = root
	cmd.Env = os.Environ()
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%w: git %q: %w\n%s", errStepFailed, args, err, output)
	}
	return nil
}

// commitRepoBase commits the staged files and records the base revision.
func (w *world) commitRepoBase() error {
	if err := w.runRepoGit("init"); err != nil {
		return err
	}
	if err := w.runRepoGit("config", "user.email", "bdd@example.com"); err != nil {
		return err
	}
	if err := w.runRepoGit("config", "user.name", "BDD"); err != nil {
		return err
	}
	if err := w.runRepoGit("add", "-A"); err != nil {
		return err
	}
	if err := w.runRepoGit("-c", "user.email=bdd@example.com", "-c", "user.name=BDD",
		"commit", "-m", "base"); err != nil {
		return err
	}
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	cmd := exec.CommandContext(context.Background(), "git", "rev-parse", "HEAD")
	cmd.Dir = root
	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("%w: read base revision: %w", errStepFailed, err)
	}
	w.baseRev = strings.TrimSpace(string(output))
	return nil
}

// commitRepoChange commits the current working tree as a second commit.
func (w *world) commitRepoChange(message string) error {
	if err := w.runRepoGit("add", "-A"); err != nil {
		return err
	}
	return w.runRepoGit("-c", "user.email=bdd@example.com", "-c", "user.name=BDD",
		"commit", "-m", message)
}

// phase6Givens routes Phase 6 given text to its stager: staged courses
// with real git history behind them.
var phase6Givens = map[string]func(*world) error{
	`opted-in courses "alpha" and "beta" and an inert course "gamma"`:                            (*world).stageAlphaBetaGamma,
	`files changed in "alpha" and "gamma" since the base revision`:                               (*world).changeAlphaGamma,
	`opted-in courses "alpha" and "beta"`:                                                        (*world).stageAlphaBeta,
	`the toolchain catalog changed since the base revision`:                                      (*world).changeToolchains,
	`opted-in courses "a1", "a2", "a3", "a4", and "a5"`:                                          (*world).stageShards,
	`an opted-in course whose two units both have valid run specs and whose lessons are in sync`: (*world).stageCoveredTwoUnits,
	`a course with no code folder and no code block`:                                             (*world).stageNoCode,
	`two applicable courses of which one is covered`:                                             (*world).stageHalfCovered,
	`an opted-in course with three illustration blocks and one static unit`:                      (*world).stageIllustratedStatic,
	`a content tree in which no course has a run spec`:                                           (*world).stageInertTree,
	`a course without a run spec whose lesson changed since the base revision`:                   (*world).changeInertLesson,
	`a course without a run spec whose lesson block differs from its file`:                       (*world).stageInertMismatch,
}

// givenPhase6 establishes the selection, coverage, and inert scenario
// context through the stager the text names.
func (w *world) givenPhase6(text string) error {
	stage, ok := phase6Givens[text]
	if !ok {
		return fmt.Errorf("%w: unknown given step %q", errStepFailed, text)
	}
	return stage(w)
}

// stageAlphaBetaGamma stages two opted-in courses with one inert course.
func (w *world) stageAlphaBetaGamma() error {
	if err := w.stageOptedCourse("alpha", "ex-01-hello"); err != nil {
		return err
	}
	if err := w.stageOptedCourse("beta", "ex-01-hello"); err != nil {
		return err
	}
	return w.stageInertCourse("gamma")
}

// changeAlphaGamma commits the staged tree, then changes the alpha and
// gamma lessons in a second commit.
func (w *world) changeAlphaGamma() error {
	if err := w.commitRepoBase(); err != nil {
		return err
	}
	if err := w.worldFile("courses/alpha/learning/lessons/hello.md", "# Alpha changed\n"); err != nil {
		return err
	}
	if err := w.worldFile("courses/gamma/learning/lessons/g.md", "# G changed\n"); err != nil {
		return err
	}
	return w.commitRepoChange("change alpha and gamma")
}

// stageAlphaBeta stages two opted-in courses.
func (w *world) stageAlphaBeta() error {
	if err := w.stageOptedCourse("alpha", "ex-01-hello"); err != nil {
		return err
	}
	return w.stageOptedCourse("beta", "ex-01-hello")
}

// changeToolchains commits the staged tree, then changes the toolchain
// catalog in a second commit.
func (w *world) changeToolchains() error {
	if err := w.commitRepoBase(); err != nil {
		return err
	}
	if err := w.worldFile("apps/ayokoding-cli/toolchains/python/Dockerfile", "FROM scratch\n"); err != nil {
		return err
	}
	return w.commitRepoChange("change the toolchain catalog")
}

// stageShards stages five opted-in courses for the shard split.
func (w *world) stageShards() error {
	for _, slug := range []string{"a1", "a2", "a3", "a4", "a5"} {
		if err := w.stageOptedCourse(slug, "ex-01-hello"); err != nil {
			return err
		}
	}
	return nil
}

// stageCoveredTwoUnits stages one opted-in course with two covered units.
func (w *world) stageCoveredTwoUnits() error {
	w.course = "alpha"
	return w.stageOptedCourse("alpha", "ex-01-hello", "ex-02-range")
}

// stageNoCode stages one course with a fenceless lesson and nothing else.
func (w *world) stageNoCode() error {
	w.course = "docs"
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	w.content = filepath.Join(root, "courses")
	return w.worldFile("courses/docs/learning/lessons/about.md", "# About\n")
}

// stageHalfCovered stages one covered course with one applicable but
// uncovered course.
func (w *world) stageHalfCovered() error {
	if err := w.stageOptedCourse("alpha", "ex-01-hello"); err != nil {
		return err
	}
	w.coverageCourses = []string{"alpha", "beta"}
	return w.stageInertCourse("beta")
}

// stageIllustratedStatic stages one opted-in course with a static unit
// and three illustration blocks.
func (w *world) stageIllustratedStatic() error {
	w.course = "alpha"
	return w.stageStaticIllustratedCourse()
}

// stageInertTree stages one course without a run spec.
func (w *world) stageInertTree() error {
	w.course = "gamma"
	return w.stageInertCourse("gamma")
}

// changeInertLesson stages one course without a run spec, then changes
// its lesson since the base revision.
func (w *world) changeInertLesson() error {
	w.course = "gamma"
	if err := w.stageInertCourse("gamma"); err != nil {
		return err
	}
	if err := w.commitRepoBase(); err != nil {
		return err
	}
	if err := w.worldFile("courses/gamma/learning/lessons/g.md", "# G changed\n"); err != nil {
		return err
	}
	return w.commitRepoChange("change the inert lesson")
}

// stageInertMismatch stages one course without a run spec whose lesson
// block differs from its file.
func (w *world) stageInertMismatch() error {
	w.course = "gamma"
	if err := w.stageInertCourse("gamma"); err != nil {
		return err
	}
	mismatch := "**`learning/code/ex-01-g/main.py`**\n\n```python\nprint('CHANGED')\n```\n"
	return w.worldFile("courses/gamma/learning/lessons/g.md", "# G\n\n"+mismatch)
}

// stageStaticIllustratedCourse stages one opted-in course with a static
// unit and three illustration blocks.
func (w *world) stageStaticIllustratedCourse() error {
	root, err := w.tempRoot()
	if err != nil {
		return err
	}
	w.content = filepath.Join(root, "courses")
	spec := "schema: ayokoding.run/v1\ntoolchain: python\nmode: static\n" +
		"static:\n  reason: ios\n  note: Syntax only.\n" +
		"runs:\n  - name: parse\n    command: [python3, check.py]\n    expect:\n      exit: 0\n      stdout: expected/parse.stdout.txt\n"
	if err := w.worldFile("courses/alpha/learning/code/ex-01-s/run.yaml", spec); err != nil {
		return err
	}
	if err := w.worldFile("courses/alpha/learning/code/ex-01-s/check.py", "print(1)\n"); err != nil {
		return err
	}
	if err := w.worldFile("courses/alpha/learning/code/ex-01-s/expected/parse.stdout.txt", "1\n"); err != nil {
		return err
	}
	lesson := "# S\n\n**`learning/code/ex-01-s/check.py`**\n\n```python\nprint(1)\n```\n\n" +
		"**Output** (`learning/code/ex-01-s/expected/parse.stdout.txt`):\n\n```text\n1\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(2)\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(3)\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(4)\n```\n"
	return w.worldFile("courses/alpha/learning/lessons/s.md", lesson)
}

// whenPhase6 performs the selection, coverage, and inert scenario action.
func (w *world) whenPhase6(text string) error {
	switch text {
	case `I list the affected selection since the base revision`:
		return w.run([]string{
			"examples", "affected", "--since", w.baseRev,
			"--content", w.content, "--output", "json",
		})
	case `I select all courses as shard 2 of 2`:
		return w.run([]string{
			"examples", "affected", "--all", "--shard", "2/2",
			"--content", w.content, "--output", "json",
		})
	case `I run "examples check" with no course, no base revision, and no "all"`:
		return w.run([]string{"examples", "check"})
	case `I report coverage`:
		return w.run([]string{"examples", "coverage", "--course", w.course, "--content", w.content})
	case `I report coverage with a minimum of 100 percent`:
		args := []string{"examples", "coverage", "--content", w.content, "--min-percent", "100"}
		for _, slug := range w.coverageCourses {
			args = append(args, "--course", slug)
		}
		return w.run(args)
	case `I check the content tree for changes since the base revision`:
		root, err := w.tempRoot()
		if err != nil {
			return err
		}
		if err := w.setHostEnv("AYOKODING_CONTAINER_CLI", filepath.Join(root, "no-such-cli")); err != nil {
			return err
		}
		// Without a staged history the tree itself is the base revision:
		// nothing changed since it, so nothing is selected.
		if w.baseRev == "" {
			if err := w.commitRepoBase(); err != nil {
				return err
			}
		}
		return w.run([]string{"examples", "check", "--since", w.baseRev, "--content", w.content})
	case `I sync that course by name`:
		return w.run([]string{"examples", "sync", "--course", w.course, "--content", w.content})
	default:
		return fmt.Errorf("%w: unknown when step %q", errStepFailed, text)
	}
}

// decodedSelection parses the affected JSON payload of the last run.
func (w *world) decodedSelection() (selectionJSON, error) {
	var document selectionJSON
	if err := json.Unmarshal([]byte(w.result.Stdout), &document); err != nil {
		return document, fmt.Errorf("%w: decode selection (stdout=%q)", errStepFailed, w.result.Stdout)
	}
	return document, nil
}

// phase6Thens routes Phase 6 then text to its assertion.
var phase6Thens = map[string]func(*world, string) error{
	`the mode is "affected"`: (*world).thenSelectionMode,
	`the mode is "full"`:     (*world).thenSelectionMode,
	`the selected courses are exactly "alpha"`: func(w *world, _ string) error {
		return w.requireSelected("alpha")
	},
	`the selected courses are "alpha" and "beta"`: func(w *world, _ string) error {
		return w.requireSelected("alpha", "beta")
	},
	`the selected courses are exactly "a2" and "a4"`: func(w *world, _ string) error {
		return w.requireSelected("a2", "a4")
	},
	`"gamma" is listed as inert`: (*world).thenGammaInert,
	`the course is listed as "inert"`: func(w *world, _ string) error {
		return w.requireStdoutContains("inert", w.course)
	},
	`standard error names error code "ayokoding.usage.missing-selection"`: func(w *world, _ string) error {
		return w.requireStderrContains("ayokoding.usage.missing-selection")
	},
	`the course is reported as covered with 2 of 2 units`: (*world).thenCoveredTwoUnits,
	`the course is listed as not applicable`: func(w *world, _ string) error {
		return w.requireStdoutContains("not applicable")
	},
	`it is not counted in the percentage`: func(w *world, _ string) error {
		return w.requireStdoutContains("0 of 0 applicable courses covered")
	},
	`the report shows 50 percent`: func(w *world, _ string) error {
		return w.requireStdoutContains("50%")
	},
	`the finding "ayokoding.coverage.below-minimum" is reported`: (*world).thenBelowMinimum,
	`the course shows 3 illustration blocks and 1 static unit`: func(w *world, _ string) error {
		return w.requireStdoutContains("3 illustration blocks", "1 static unit")
	},
	`standard output says "0 opted-in courses; nothing to run"`: func(w *world, _ string) error {
		return w.requireStdoutContains("0 opted-in courses; nothing to run")
	},
	`no container was started`:                                     (*world).thenNoContainer,
	`the mismatch is reported with code "ayokoding.sync.mismatch"`: (*world).thenPhase6SyncMismatch,
}

// thenPhase6 asserts the selection, coverage, and inert outcomes through
// the assertion the text names.
func (w *world) thenPhase6(text string) error {
	assert, ok := phase6Thens[text]
	if !ok {
		return fmt.Errorf("%w: unknown then step %q", errStepFailed, text)
	}
	return assert(w, text)
}

// thenSelectionMode asserts the affected mode the text names.
func (w *world) thenSelectionMode(text string) error {
	document, err := w.decodedSelection()
	if err != nil {
		return err
	}
	want := strings.Trim(strings.TrimPrefix(text, "the mode is "), `"`)
	if document.Mode != want {
		return fmt.Errorf("%w: mode=%q, want %q", errStepFailed, document.Mode, want)
	}
	return nil
}

// thenGammaInert asserts gamma lists as inert.
func (w *world) thenGammaInert(_ string) error {
	document, err := w.decodedSelection()
	if err != nil {
		return err
	}
	if !slices.Contains(document.Inert, "gamma") {
		return fmt.Errorf("%w: inert=%q, want gamma", errStepFailed, document.Inert)
	}
	return nil
}

// thenCoveredTwoUnits asserts the covered course with 2 of 2 units.
func (w *world) thenCoveredTwoUnits(_ string) error {
	if err := w.requireStatus(0); err != nil {
		return err
	}
	return w.requireStdoutContains("covered", "2 of 2 units")
}

// thenBelowMinimum asserts the below-minimum finding with exit 1.
func (w *world) thenBelowMinimum(_ string) error {
	if err := w.requireStatus(1); err != nil {
		return err
	}
	return w.requireStdoutContains("ayokoding.coverage.below-minimum")
}

// thenNoContainer asserts the run never touched a container: the poisoned
// container CLI would fail any runtime call, so exit 0 proves none.
func (w *world) thenNoContainer(_ string) error {
	if _, poisoned := w.env["AYOKODING_CONTAINER_CLI"]; !poisoned {
		return fmt.Errorf("%w: container CLI was never poisoned", errStepFailed)
	}
	return w.requireStatus(0)
}

// thenPhase6SyncMismatch asserts the sync mismatch with exit 1.
func (w *world) thenPhase6SyncMismatch(_ string) error {
	if err := w.requireStatus(1); err != nil {
		return err
	}
	return w.requireStdoutContains("ayokoding.sync.mismatch")
}

// requireSelected asserts the affected JSON payload names exactly the
// wanted courses.
func (w *world) requireSelected(want ...string) error {
	document, err := w.decodedSelection()
	if err != nil {
		return err
	}
	if !slices.Equal(document.Courses, want) {
		return fmt.Errorf("%w: courses=%q, want %q", errStepFailed, document.Courses, want)
	}
	return nil
}
