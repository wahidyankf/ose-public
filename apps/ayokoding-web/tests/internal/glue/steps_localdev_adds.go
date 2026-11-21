package glue

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// fragmentReply is one htmx fragment answer captured by a When step.
type fragmentReply struct {
	target string
	status int
	body   string
}

// htmxFragments lists the fragment targets the fragment scenario requests.
var htmxFragments = []string{"/htmx/search?q=hello", "/htmx/benchmark", "/htmx/calculator"}

// corpusFiles is the file-backed corpus the another-corpus scenario points at.
// It mirrors the seed file fixture: one lesson, one course, and one path.
var corpusFiles = map[string]string{
	"content/en/learn/courses/go-basics/learning/hello-world.md": "---\ntitle: Hello World\ndescription: First program\nweight: 1\n---\n\n# Hello\n\nServed from disk.\n",
	"content/en/learn/courses/go-basics/_index.md":               "---\ntitle: Go Basics\ndescription: Learn Go\ncategory: fundamentals\nformat: course\nestimatedHours: 4\n---\n\nCourse index.\n",
	"manifests/careers/backend.json": `{
  "pathId": "careers/backend",
  "title": "Backend",
  "phases": [{"id": "fundamentals", "title": "Fundamentals", "courses": ["go-basics"]}]
}`,
}

func writeCorpusFile(path, body string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(body), 0o600)
}

// StepCorpusDirsNameAnotherRoot writes a temporary corpus and points the content
// and manifest variables at it. The directory is removed when the scenario closes.
func (w *World) StepCorpusDirsNameAnotherRoot() error {
	root, err := os.MkdirTemp("", "ayokoding-web-corpus-")
	if err != nil {
		return err
	}
	w.stops = append(w.stops, func() { _ = os.RemoveAll(root) })
	for rel, body := range corpusFiles {
		if err := writeCorpusFile(filepath.Join(root, rel), body); err != nil {
			return err
		}
	}
	port, err := freePort()
	if err != nil {
		return err
	}
	w.env = map[string]string{
		"AYOKODING_WEB_CONTENT_DIR":   filepath.Join(root, "content"),
		"AYOKODING_WEB_MANIFESTS_DIR": filepath.Join(root, "manifests"),
		"AYOKODING_WEB_PORT":          itoa(port),
	}
	return nil
}

// StepRewriteServesPagesPathsFromCorpus checks that a lesson and a course path
// come from the configured corpus, not the canned fixture.
func (w *World) StepRewriteServesPagesPathsFromCorpus() error {
	if err := w.get("/en/learn/courses/go-basics/learning/hello-world"); err != nil {
		return err
	}
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if err := w.mustContain("Served from disk."); err != nil {
		return err
	}
	if err := w.get("/en/learn/paths/careers/backend"); err != nil {
		return err
	}
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("Backend")
}

// StepReaderRequestsFragments requests the search, benchmark, and calculator
// fragments and keeps each reply for the Then step.
func (w *World) StepReaderRequestsFragments() error {
	w.fragments = nil
	for _, target := range htmxFragments {
		if err := w.get(target); err != nil {
			return err
		}
		w.fragments = append(w.fragments, fragmentReply{target: target, status: w.status, body: w.body})
	}
	return nil
}

// StepEachFragmentReturnsResultsWithoutPageLayout checks every fragment answers
// 200 with markup and no full document.
func (w *World) StepEachFragmentReturnsResultsWithoutPageLayout() error {
	if len(w.fragments) != len(htmxFragments) {
		return fail("requested %d fragments, want %d", len(w.fragments), len(htmxFragments))
	}
	for _, reply := range w.fragments {
		if reply.status != http.StatusOK {
			return fail("%s status = %d, want 200", reply.target, reply.status)
		}
		if strings.Contains(reply.body, "<html") {
			return fail("%s answered a full page, not a fragment", reply.target)
		}
		if strings.TrimSpace(reply.body) == "" {
			return fail("%s returned an empty fragment", reply.target)
		}
	}
	return nil
}

// StepReaderRequestsAsset requests one static asset or favicon path.
func (w *World) StepReaderRequestsAsset(path string) error {
	return w.get(path)
}

// StepAssetRespondsWithStatus checks the last asset reply's status code.
func (w *World) StepAssetRespondsWithStatus(status string) error {
	want, err := strconv.Atoi(status)
	if err != nil {
		return fail("status %q is not a number", status)
	}
	return w.mustStatus(want)
}

// StepRewriteStartsWithArgument starts the launcher with one argument. Unit
// resolves the configuration in process; integration runs the binary to exit.
func (w *World) StepRewriteStartsWithArgument(argument string) error {
	w.args = []string{argument}
	if w.adapter == "unit" {
		return w.resolve()
	}
	code, stderr, err := w.launchExpectExit()
	if err != nil {
		return err
	}
	if code == 0 {
		w.startErr = nil
		return nil
	}
	w.startErr = errors.New(stderr)
	return nil
}

// StepStartupFailsWithMessageNaming checks the refused startup names the bad input.
func (w *World) StepStartupFailsWithMessageNaming(naming string) error {
	if w.startErr == nil {
		return fail("startup was accepted; want a refusal naming %s", naming)
	}
	if !strings.Contains(w.startErr.Error(), naming) {
		return fail("message %q misses %s", w.startErr.Error(), naming)
	}
	return nil
}

// StepRewriteStartsWithFixtureSetBy starts the launcher with a fixture chosen
// by the --fixture flag or by AYOKODING_WEB_FIXTURE.
func (w *World) StepRewriteStartsWithFixtureSetBy(fixture, channel string) error {
	port, err := freePort()
	if err != nil {
		return err
	}
	w.env = map[string]string{"AYOKODING_WEB_PORT": itoa(port)}
	w.args = nil
	switch channel {
	case "--fixture flag":
		w.args = []string{"--fixture", fixture}
	case "AYOKODING_WEB_FIXTURE":
		w.env["AYOKODING_WEB_FIXTURE"] = fixture
	default:
		return fail("unknown fixture channel %q", channel)
	}
	return w.launch()
}

// StepCourseCatalogAnswersWithStatus requests the course catalog and checks its status.
func (w *World) StepCourseCatalogAnswersWithStatus(status string) error {
	want, err := strconv.Atoi(status)
	if err != nil {
		return fail("status %q is not a number", status)
	}
	if err := w.get("/en/learn/courses"); err != nil {
		return err
	}
	return w.mustStatus(want)
}
