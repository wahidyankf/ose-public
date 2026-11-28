package glue

import (
	"path"
	"strconv"
	"strings"
	"testing/fstest"
)

// unitRepoRoot is the fake repository the unit adapter stages for the default
// corpus scenarios. Its working directory sits two levels below the root, as
// the launcher's working directory does in the repository.
const (
	unitRepoRoot   = "/unit-repo"
	unitWorkingDir = unitRepoRoot + "/apps/ayokoding-web"
	envFixture     = "AYOKODING_WEB_FIXTURE"
	envContentDir  = "AYOKODING_WEB_CONTENT_DIR"
)

// unitRealRepoFiles is the minimal real-corpus layout the default start
// discovers: the repository marker, one published lesson of the real content
// root, and one path manifest of the real manifests root.
var unitRealRepoFiles = map[string]string{
	"repo-config.yml": "# unit repository marker\n",
	"apps/ayokoding-www/content/en/learn/courses/just-enough-python/_index.md":            "---\ntitle: Just Enough Python\ndescription: Python basics\ncategory: fundamentals\nformat: course\n---\n\nCourse index.\n",
	"apps/ayokoding-www/content/en/learn/courses/just-enough-python/learning/beginner.md": "---\ntitle: Beginner\ndescription: First steps\nweight: 1\n---\n\n# Beginner\n\nServed from the real corpus.\n",
	"apps/ayokoding-www/src/features/course-paths/manifests/careers/backend.json": `{
  "pathId": "careers/backend",
  "title": "Backend",
  "phases": [{"id": "fundamentals", "title": "Fundamentals", "courses": ["just-enough-python"]}]
}`,
}

// launchEnv is the environment a launch sees. A scenario that names no corpus
// is a fixture scenario, so the glue selects the parity fixture for it and its
// canned assertions keep their data. A default-corpus scenario sets realCorpus
// and launches with the environment it names.
func (w *World) launchEnv() map[string]string {
	env := make(map[string]string, len(w.env)+1)
	for key, value := range w.env {
		env[key] = value
	}
	if w.realCorpus || hasFixtureChoice(w.args, env) {
		return env
	}
	env[envFixture] = "parity"
	return env
}

// hasFixtureChoice reports whether the scenario already names a fixture by
// flag or by variable.
func hasFixtureChoice(args []string, env map[string]string) bool {
	if _, ok := env[envFixture]; ok {
		return true
	}
	for _, argument := range args {
		if argument == "--fixture" || strings.HasPrefix(argument, "--fixture=") {
			return true
		}
	}
	return false
}

// workingDir is the launcher's working directory for the scenario: the fake
// repository for the unit adapter, the test process directory otherwise.
func (w *World) workingDir() string {
	if w.adapter == "unit" {
		return unitWorkingDir
	}
	return realWorkingDir()
}

// StepNoFixtureIsSelected starts a default-corpus scenario with no fixture flag
// or variable. The unit adapter stages the fake repository the default start
// discovers; the other adapters read the repository the test runs in.
func (w *World) StepNoFixtureIsSelected() error {
	w.realCorpus = true
	w.args = nil
	port, err := w.freePort()
	if err != nil {
		return err
	}
	w.env = map[string]string{"AYOKODING_WEB_PORT": itoa(port)}
	if w.adapter != "unit" {
		return nil
	}
	repo := strings.TrimPrefix(unitRepoRoot, "/")
	for rel, body := range unitRealRepoFiles {
		w.unitTree[path.Join(repo, rel)] = &fstest.MapFile{Data: []byte(body)}
	}
	return nil
}

// StepRewriteStartsWithNoFixture starts the launcher with no fixture selection.
func (w *World) StepRewriteStartsWithNoFixture() error {
	return w.launch()
}

// StepReaderRequestsLesson requests one lesson and keeps the reply for the
// following Then step.
func (w *World) StepReaderRequestsLesson(target string) error {
	return w.get(target)
}

// StepLessonAnswersRequestedWithStatus checks the last reply's status.
func (w *World) StepLessonAnswersRequestedWithStatus(status string) error {
	want, err := strconv.Atoi(status)
	if err != nil {
		return fail("status %q is not a number", status)
	}
	return w.mustStatus(want)
}

// StepLessonAnswersWithStatus requests one lesson and checks its status.
func (w *World) StepLessonAnswersWithStatus(target, status string) error {
	if err := w.StepReaderRequestsLesson(target); err != nil {
		return err
	}
	return w.StepLessonAnswersRequestedWithStatus(status)
}

// StepFixtureIsSelected selects a named fixture for the scenario and starts the
// launcher on it, so the scenario's requests reach the fixture server.
func (w *World) StepFixtureIsSelected(fixture string) error {
	port, err := w.freePort()
	if err != nil {
		return err
	}
	w.realCorpus = false
	w.args = nil
	w.env = map[string]string{"AYOKODING_WEB_PORT": itoa(port), envFixture: fixture}
	return w.launch()
}

// StepContentDirCannotBeRead names a content directory the operating system
// refuses. The unit adapter names a path no staged tree holds, so every open
// fails. The other adapters create a directory with no permissions and remove
// it when the scenario closes.
func (w *World) StepContentDirCannotBeRead() error {
	w.realCorpus = true
	w.args = nil
	port, err := w.freePort()
	if err != nil {
		return err
	}
	dir := "/unreadable-content"
	if w.adapter != "unit" {
		var cleanup func()
		if dir, cleanup, err = realUnreadableDir(); err != nil {
			return err
		}
		w.stops = append(w.stops, cleanup)
	}
	w.env = map[string]string{envContentDir: dir, "AYOKODING_WEB_PORT": itoa(port)}
	return nil
}

// StepRewriteLaunchedFailsToStart runs the launcher expecting a refusal and
// keeps its exit status and diagnostic for the Then step.
func (w *World) StepRewriteLaunchedFailsToStart() error {
	code, stderr, err := w.launchExpectExit()
	if err != nil {
		return err
	}
	w.exitCode = code
	w.exitStderr = stderr
	return nil
}

// StepStartupFailsNamingContentDir checks the refusal exits non-zero and names
// the content-directory setting.
func (w *World) StepStartupFailsNamingContentDir() error {
	if w.exitCode == 0 {
		return fail("startup was accepted; want a refusal naming %s", envContentDir)
	}
	if !strings.Contains(w.exitStderr, envContentDir) {
		return fail("diagnostic %q misses %s", w.exitStderr, envContentDir)
	}
	return nil
}

// StepNoRewriteListenerStarts checks that the refused launch opened no listener.
func (w *World) StepNoRewriteListenerStarts() error {
	if w.listenerStarted || w.exitCode == 0 {
		return fail("a rewrite listener opened despite the refusal")
	}
	return nil
}
