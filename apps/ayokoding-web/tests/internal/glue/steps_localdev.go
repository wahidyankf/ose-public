package glue

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func (w *World) StepExistingLearningSiteRunningPort3101() error {
	return w.startExternal(3101)
}

func (w *World) StepRewriteStartsWithoutPortOverride() error {
	w.env = map[string]string{}
	return w.launch()
}

func (w *World) StepRewriteServesBilingualEntryPagesPort3102() error {
	if w.resolvedPort != 3102 {
		return fail("resolved port = %d, want 3102", w.resolvedPort)
	}
	if !w.listenerStarted {
		return fail("rewrite listener did not start")
	}
	if err := w.get("/en"); err != nil {
		return err
	}
	if err := w.mustContain(`lang="en"`); err != nil {
		return err
	}
	if err := w.get("/id"); err != nil {
		return err
	}
	return w.mustContain(`lang="id"`)
}

func (w *World) StepExistingSiteStillAnswersRequestsPort3101() error {
	if !w.externalUp(3101) {
		return fail("existing site on 3101 is down")
	}
	if w.adapter == "unit" {
		return nil
	}
	return w.callRemote("http://127.0.0.1:3101", http.MethodGet, "/en")
}

func (w *World) StepAyokodingWebPortSetAvailableValidPort() error {
	port, err := freePort()
	if err != nil {
		return err
	}
	w.env = map[string]string{"AYOKODING_WEB_PORT": itoa(port)}
	return nil
}

func (w *World) StepRewriteStarts() error {
	return w.launch()
}

func (w *World) StepRewriteListensPort() error {
	want := w.env["AYOKODING_WEB_PORT"]
	if itoa(w.resolvedPort) != want {
		return fail("resolved port = %d, want %s", w.resolvedPort, want)
	}
	if !w.listenerStarted {
		return fail("rewrite listener did not start")
	}
	return w.get("/en")
}

func (w *World) StepExistingSiteSConfiguredPortRemainsUnchanged() error {
	if w.adapter == "unit" {
		return nil
	}
	if !w.externalUp(3101) {
		if err := w.startExternal(3101); err != nil {
			return err
		}
	}
	return w.callRemote("http://127.0.0.1:3101", http.MethodGet, "/en")
}

func (w *World) StepAyokodingWebPortContainsOneValidPort() error {
	port, err := freePort()
	if err != nil {
		return err
	}
	w.env = map[string]string{"AYOKODING_WEB_PORT": itoa(port)}
	return nil
}

func (w *World) StepRewriteLauncherReceivesDifferentValidPortThrough() error {
	other, err := freePort()
	if err != nil {
		return err
	}
	if itoa(other) == w.env["AYOKODING_WEB_PORT"] {
		other++
	}
	w.args = []string{"--port", itoa(other)}
	w.flagPort = itoa(other)
	return nil
}

func (w *World) StepListensExplicitFlagSPort() error {
	if err := w.launch(); err != nil {
		return err
	}
	if itoa(w.resolvedPort) != w.flagPort {
		return fail("resolved port = %d, want flag port %s", w.resolvedPort, w.flagPort)
	}
	return w.get("/en")
}

func (w *World) StepDoesListenEnvironmentValueSPort() error {
	if itoa(w.resolvedPort) == w.env["AYOKODING_WEB_PORT"] {
		return fail("rewrite used the environment port instead of the flag")
	}
	return nil
}

func (w *World) StepOnlyGenericPortVariableContainsDifferentValidPor() error {
	w.env = map[string]string{"PORT": "4100"}
	return nil
}

func (w *World) StepRewriteStartsWithoutPrefixedOverrideExplicitPort() error {
	return w.launch()
}

func (w *World) StepRewriteListensPort3102() error {
	if w.resolvedPort != 3102 {
		return fail("resolved port = %d, want 3102 (bare PORT ignored)", w.resolvedPort)
	}
	return w.get("/en")
}

func (w *World) StepAyokodingWebPortSetInvalidPortValue() error {
	w.env = map[string]string{"AYOKODING_WEB_PORT": "abc"}
	w.args = nil
	return nil
}

func (w *World) StepStartupFailsDiagnosticNamingAyokodingWebPort() error {
	if w.adapter == "unit" {
		if w.startErr == nil {
			if err := w.launch(); err != nil {
				return err
			}
		}
		if w.startErr == nil {
			return fail("invalid port was accepted")
		}
		if !strings.Contains(w.startErr.Error(), "AYOKODING_WEB_PORT") {
			return fail("diagnostic %q misses AYOKODING_WEB_PORT", w.startErr)
		}
		return nil
	}
	code, stderr, err := w.launchExpectExit()
	if err != nil {
		return err
	}
	if code == 0 {
		return fail("invalid port exited 0")
	}
	if !strings.Contains(stderr, "AYOKODING_WEB_PORT") {
		return fail("stderr %q misses AYOKODING_WEB_PORT", stderr)
	}
	return nil
}

func (w *World) StepRewriteListenerStartsFallbackPort() error {
	if w.listenerStarted {
		return fail("a fallback listener started despite invalid config")
	}
	return nil
}

func (w *World) StepExistingSiteRewriteDevelopmentServerRunning() error {
	if err := w.startExternal(3101); err != nil {
		return err
	}
	return w.startExternal(3102)
}

func (w *World) StepRewriteBrowserAcceptanceSuiteStarts() error {
	if w.adapter == "unit" {
		// Resolve the isolated test port through production config, not a flag.
		var cfg web.Config
		if err := withScenarioEnv(map[string]string{"AYOKODING_WEB_PORT": itoa(web.TestPort)}, func() error {
			var resolveErr error
			cfg, resolveErr = web.ResolveConfig(nil)
			return resolveErr
		}); err != nil {
			return err
		}
		if cfg.Port != web.TestPort {
			return fail("resolved port = %d, want TestPort %d", cfg.Port, web.TestPort)
		}
		w.cfg = cfg
		w.resolvedPort = cfg.Port
		w.listenerStarted = true
		w.handler = web.NewServer(cfg, seedFixtureDeps()).Handler()
		return nil
	}
	// The integration suite binary already owns 3191; the scenario
	// reuses it instead of binding a second listener.
	w.resolvedPort = 3191
	w.listenerStarted = true
	w.baseURL = SuiteBaseURL
	return nil
}

func (w *World) StepStartsOwnPhoenixServerPort3191() error {
	// The corpus names the pre-Go stack; the Go contract is that the
	// acceptance suite owns an isolated test server on 3191. The landing
	// unit rewords this step per tech-docs/005.
	if w.adapter == "unit" {
		if w.resolvedPort != web.TestPort || !w.listenerStarted {
			return fail("test server did not resolve port %d", web.TestPort)
		}
		// Bind a REAL listener on the resolved TestPort and serve one
		// request through the app handler. A second bind while the port is
		// taken fails here, so a conflicting listener cannot go undetected.
		address := fmt.Sprintf("127.0.0.1:%d", w.resolvedPort)
		listener, err := net.Listen("tcp", address)
		if err != nil {
			return fail("cannot bind TestPort %d: %v", w.resolvedPort, err)
		}
		server := &http.Server{Handler: w.handler}
		go func() { _ = server.Serve(listener) }()
		url := fmt.Sprintf("http://%s/en", address)
		response, err := http.Get(url) //nolint:gosec,noctx
		_ = server.Close()
		if err != nil {
			return fail("GET %s through real listener failed: %v", url, err)
		}
		defer func() { _ = response.Body.Close() }()
		if response.StatusCode != http.StatusOK {
			return fail("GET %s status = %d, want 200", url, response.StatusCode)
		}
		return nil
	}
	if w.baseURL == "" {
		return fail("test server on 3191 is down")
	}
	return w.get("/en")
}

func (w *World) StepLeavesBothDevelopmentServersRunningAfterSuiteFin() error {
	if !w.externalUp(3101) || !w.externalUp(3102) {
		return fail("development servers did not survive the suite")
	}
	return nil
}

func (w *World) StepSharedMarkdownManifestsHaveRecordedByteHashes() error {
	w.hashes = map[string]string{}
	for _, file := range sharedSourceFiles() {
		raw, err := os.ReadFile(file)
		if err != nil {
			continue
		}
		w.hashes[file] = sha256Hex(raw)
	}
	if len(w.hashes) == 0 && w.adapter != "unit" {
		return fail("no shared sources found to hash")
	}
	return nil
}

func (w *World) StepDeveloperStartsRewriteBrowsesCoursePages() error {
	if err := w.launch(); err != nil {
		return err
	}
	for _, target := range []string{"/en", "/en/learn/courses", "/en/learn/courses/go-basics/learning/hello-world"} {
		if err := w.get(target); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepMarkdownManifestByteHashesRemainUnchanged() error {
	if w.adapter == "unit" {
		for _, request := range w.requests {
			if request.method != http.MethodGet {
				return fail("unit request %s %s would mutate sources", request.method, request.target)
			}
		}
		// Unit must never touch the developer corpus: the file-backed root
		// stays unset so the canned fixture serves.
		if value, ok := os.LookupEnv("AYOKODING_WEB_CONTENT_DIR"); ok && strings.TrimSpace(value) != "" {
			return fail("AYOKODING_WEB_CONTENT_DIR=%q is set in unit context; unit must use the fixture", value)
		}
		// Fixture-only slug resolves; a real-corpus-only slug 404s, proving
		// the unit handler serves the fixture, not the developer checkout.
		if err := w.get("/en/learn/courses/go-basics/learning/hello-world"); err != nil {
			return err
		}
		if err := w.mustStatus(http.StatusOK); err != nil {
			return err
		}
		if err := w.get("/en/learn/courses/just-enough-python"); err != nil {
			return err
		}
		return w.mustStatus(http.StatusNotFound)
	}
	for _, file := range sharedSourceFiles() {
		raw, err := os.ReadFile(file)
		if err != nil {
			continue
		}
		if w.hashes[file] != sha256Hex(raw) {
			return fail("shared source changed: %s", file)
		}
	}
	return nil
}

func (w *World) StepRewriteDoesRunContentIndexGeneratorImplicitly() error {
	for _, request := range w.requests {
		if request.method != http.MethodGet {
			return fail("request %s %s looks like an implicit generator", request.method, request.target)
		}
	}
	return nil
}

func (w *World) StepOtherLearningContentPlansUnfinished() error {
	return nil
}

func (w *World) StepCurrentSharedCorpusHasValidCommittedState() error {
	return nil
}

func (w *World) StepRewriteLoadsCommittedCorpus() error {
	return w.launch()
}

func (w *World) StepServesAvailableContentManifestsFromState() error {
	if err := w.get("/en/learn/courses/go-basics/learning/hello-world"); err != nil {
		return err
	}
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.get("/en/learn/paths/backend-id")
}

func (w *World) StepDoesWaitAnotherPlanFinish() error {
	return w.mustStatus(http.StatusOK)
}

// itoa renders a port without importing strconv in every step file.
func itoa(port int) string {
	if port == 0 {
		return "0"
	}
	digits := []byte{}
	for value := port; value > 0; value /= 10 {
		digits = append([]byte{byte('0' + value%10)}, digits...)
	}
	return string(digits)
}

// sharedSourceFiles walks the read-only corpus roots the rewrite consumes.
func sharedSourceFiles() []string {
	_, file, _, _ := runtime.Caller(0)
	appRoot := filepath.Join(filepath.Dir(file), "..", "..", "..")
	roots := []string{
		filepath.Join(appRoot, "..", "ayokoding-www", "content"),
		filepath.Join(appRoot, "..", "ayokoding-www", "src", "features", "course-paths", "manifests"),
	}
	var files []string
	for _, root := range roots {
		_ = filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
			if err != nil || entry.IsDir() {
				return nil
			}
			files = append(files, path)
			return nil
		})
	}
	return files
}
