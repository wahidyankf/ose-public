package glue

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"path"
	"strings"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// sha256Hex fingerprints one shared source for the no-rewrite proof.
func sha256Hex(raw []byte) string {
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}

// errStepFailed marks every step-assertion failure; the text after it names
// the mismatch.
var errStepFailed = fmt.Errorf("step assertion failed")

func fail(format string, args ...any) error {
	return fmt.Errorf("%w: %s", errStepFailed, fmt.Sprintf(format, args...))
}

// unitPortBase is the first port a unit scenario is handed. The unit adapter
// binds no socket, so these numbers only name the port a resolved launcher
// configuration would use.
const unitPortBase = 40000

// freePort returns a loopback port for override scenarios. The unit adapter
// hands out distinct numbers from a fixed base; the integration and e2e
// adapters ask the operating system for a free port.
func (w *World) freePort() (int, error) {
	if w.adapter == "unit" {
		w.portSeq++
		return unitPortBase + w.portSeq, nil
	}
	return realFreePort()
}

// call performs one recorded request against the in-process handler (unit)
// or the scenario server (integration/e2e).
func (w *World) call(method, target string) error {
	w.requests = append(w.requests, recordedRequest{method: method, target: target})
	if w.baseURL != "" {
		return w.callRemote(w.baseURL, method, target)
	}
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(method, target, nil)
	w.handler.ServeHTTP(recorder, request)
	w.status = recorder.Code
	w.header = recorder.Header()
	w.body = recorder.Body.String()
	return nil
}

// get performs one recorded GET.
func (w *World) get(target string) error {
	return w.call(http.MethodGet, target)
}

func (w *World) mustStatus(want int) error {
	if w.status != want {
		return fail("status = %d, want %d (body %.200q)", w.status, want, w.body)
	}
	return nil
}

func (w *World) mustContain(fragment string) error {
	if !strings.Contains(w.body, fragment) {
		return fail("body misses %q (body %.300q)", fragment, w.body)
	}
	return nil
}

func (w *World) mustNotContain(fragment string) error {
	if strings.Contains(w.body, fragment) {
		return fail("body must not contain %q", fragment)
	}
	return nil
}

func (w *World) location() string {
	if w.header == nil {
		return ""
	}
	return w.header.Get("Location")
}

// scenarioEnvironment reads launcher variables from the scenario record only.
// A variable the scenario leaves out is unset, so no ambient process value can
// leak into a deterministic scenario.
func scenarioEnvironment(env map[string]string) web.Environment {
	return func(key string) (string, bool) {
		value, ok := env[key]
		return value, ok
	}
}

// refusedRoot stands for a source root the operating system refused.
type refusedRoot struct{}

func (refusedRoot) Open(string) (fs.File, error) { return nil, fs.ErrPermission }

// openRoot opens a configured source root. The unit adapter serves only the
// corpora the scenario staged in memory; the other adapters read disk.
func (w *World) openRoot(dir string) fs.FS {
	if w.adapter != "unit" {
		return realRootFS(dir)
	}
	tree, err := fs.Sub(w.unitTree, strings.TrimPrefix(dir, "/"))
	if err != nil {
		return refusedRoot{}
	}
	return tree
}

// sources is the seed's port for this scenario: the recorded launcher
// variables and the source roots the adapter opens.
func (w *World) sources() web.Sources {
	return web.Sources{Environment: scenarioEnvironment(w.env), Root: w.openRoot}
}

// stageCorpus places a corpus under a scenario root and returns that root. The
// unit adapter keeps the files in memory; the other adapters write a temporary
// directory that the scenario removes when it closes.
func (w *World) stageCorpus(files map[string]string) (string, error) {
	if w.adapter == "unit" {
		w.corpusSeq++
		root := fmt.Sprintf("unit-corpus/%d", w.corpusSeq)
		for rel, body := range files {
			w.unitTree[path.Join(root, rel)] = &fstest.MapFile{Data: []byte(body)}
		}
		return "/" + root, nil
	}
	root, cleanup, err := realStageCorpus(files)
	if err != nil {
		return "", err
	}
	w.stops = append(w.stops, cleanup)
	return root, nil
}

// resolve parses the launcher configuration from the scenario environment.
func (w *World) resolve() error {
	cfg, err := web.ResolveConfig(w.args, scenarioEnvironment(w.env))
	if err != nil {
		w.startErr = err
		w.listenerStarted = false
		return nil
	}
	// The seed reads the source-root and draft variables through the scenario
	// sources, so it serves the configured fixture.
	deps := web.SeedFixtureDeps(cfg.Fixture, w.sources())
	w.cfg = cfg
	w.resolvedPort = cfg.Port
	w.listenerStarted = true
	w.handler = web.NewServer(cfg, deps).Handler()
	return nil
}

// launch starts the rewrite. Unit records the resolved listener without
// binding a socket; integration/e2e start a scenario binary.
func (w *World) launch() error {
	if err := w.resolve(); err != nil {
		return err
	}
	if w.startErr != nil {
		return nil
	}
	if w.adapter == "unit" {
		return nil
	}
	port := w.resolvedPort
	env := map[string]string{}
	for key, value := range w.env {
		env[key] = value
	}
	proc, err := startBinary(SuiteBinary, w.args, env)
	if err != nil {
		if strings.Contains(err.Error(), "address already in use") {
			return fail("port %d is busy; refusing to reuse another process", port)
		}
		return err
	}
	w.stops = append(w.stops, proc)
	w.baseURL = fmt.Sprintf("http://127.0.0.1:%d", port)
	if err := waitReady(w.baseURL + "/en"); err != nil {
		return err
	}
	return nil
}

// launchExpectExit reports how a failure scenario exits. The unit adapter starts
// no process: it resolves the configuration the binary would resolve and reports
// the launcher's diagnostic as the exit. Other adapters run the binary.
func (w *World) launchExpectExit() (int, string, error) {
	if w.adapter != "unit" {
		return realLaunchExpectExit(w.args, w.env)
	}
	if _, err := web.ResolveConfig(w.args, scenarioEnvironment(w.env)); err != nil {
		return 1, fmt.Sprintf("ayokoding-web: %v\n", err), nil
	}
	return 0, "", nil
}

// startExternal marks an external listener. Unit records the fake;
// integration binds a stub responder owned by the scenario.
func (w *World) startExternal(port int) error {
	if w.adapter == "unit" {
		w.external[port] = true
		return nil
	}
	stop, err := realStubListener(port)
	if err != nil {
		return err
	}
	w.stops = append(w.stops, stop)
	w.external[port] = true
	return nil
}

// externalUp reports whether an external listener is recorded.
func (w *World) externalUp(port int) bool {
	return w.external[port]
}

// CloseScenario stops scenario-owned servers and stubs.
func (w *World) CloseScenario() {
	for index := len(w.stops) - 1; index >= 0; index-- {
		w.stops[index]()
	}
	w.stops = nil
}
