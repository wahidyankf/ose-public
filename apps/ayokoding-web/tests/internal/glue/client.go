package glue

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"strings"

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

// freePort returns an available loopback port for override scenarios.
func freePort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, fmt.Errorf("bdd: free port: %w", err)
	}
	defer func() { _ = listener.Close() }()
	return listener.Addr().(*net.TCPAddr).Port, nil
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

// withScenarioEnv applies the given launcher variables to the process
// environment for one ResolveConfig call, then restores the previous state.
// Variables absent from the scenario are unset so ambient shell values cannot
// leak into a deterministic scenario.
func withScenarioEnv(env map[string]string, run func() error) error {
	type saved struct {
		value string
		ok    bool
	}
	previous := map[string]saved{}
	for _, key := range []string{"AYOKODING_WEB_PORT", "AYOKODING_WEB_FIXTURE", "PORT"} {
		value, ok := os.LookupEnv(key)
		previous[key] = saved{value, ok}
		if scenario, ok := env[key]; ok {
			_ = os.Setenv(key, scenario)
		} else {
			_ = os.Unsetenv(key)
		}
	}
	defer func() {
		for key, prior := range previous {
			if prior.ok {
				_ = os.Setenv(key, prior.value)
			} else {
				_ = os.Unsetenv(key)
			}
		}
	}()
	return run()
}

// resolve parses the launcher configuration from the world environment.
func (w *World) resolve() error {
	var cfg web.Config
	err := withScenarioEnv(w.env, func() error {
		var resolveErr error
		cfg, resolveErr = web.ResolveConfig(w.args)
		return resolveErr
	})
	if err != nil {
		w.startErr = err
		w.listenerStarted = false
		return nil
	}
	w.cfg = cfg
	w.resolvedPort = cfg.Port
	w.listenerStarted = true
	w.handler = web.NewServer(cfg, seedFixtureDeps()).Handler()
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

// launchExpectExit runs the binary to completion for failure scenarios.
func (w *World) launchExpectExit() (int, string, error) {
	var stderr bytes.Buffer
	cmd := exec.Command(SuiteBinary, w.args...)
	cmd.Env = os.Environ()
	for key, value := range w.env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		var exit *exec.ExitError
		if errors.As(err, &exit) {
			return exit.ExitCode(), stderr.String(), nil
		}
		return 0, stderr.String(), fmt.Errorf("bdd: run binary: %w", err)
	}
	return 0, stderr.String(), nil
}

// startExternal marks an external listener. Unit records the fake;
// integration binds a stub responder owned by the scenario.
func (w *World) startExternal(port int) error {
	if w.adapter == "unit" {
		w.external[port] = true
		return nil
	}
	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
	if err != nil {
		return fail("external port %d is busy; refusing to reuse another process", port)
	}
	server := &http.Server{Handler: http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = fmt.Fprint(writer, "<html><body>external</body></html>")
	})}
	go func() { _ = server.Serve(listener) }()
	w.stops = append(w.stops, func() { _ = server.Close() })
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
