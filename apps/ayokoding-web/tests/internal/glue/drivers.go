package glue

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
)

// SuiteBinary is the freshly built server binary for drivers that bind real
// listeners. SuiteBaseURL is the suite server address. Suites set both once
// during setup.
var (
	SuiteBinary  string
	SuiteBaseURL string
)

// recordedRequest logs one client call for privacy assertions.
type recordedRequest struct {
	method string
	target string
	body   string
}

// Driver prepares the shared fixtures for one adapter.
type Driver interface {
	// Setup prepares shared servers; it returns a cleanup function.
	Setup(t *testing.T) (func(), error)
}

// UnitDriver runs the handler in process with in-memory doubles.
type UnitDriver struct{}

// Setup implements Driver.
func (UnitDriver) Setup(t *testing.T) (func(), error) { return func() {}, nil }

// BinaryDriver runs a real binary on 127.0.0.1 with a fixed test port.
type BinaryDriver struct {
	Binary string
	base   string
}

// Setup implements Driver.
func (d *BinaryDriver) Setup(t *testing.T) (func(), error) {
	t.Helper()
	// The binary owns 3191 per the test-listener convention; start it once
	// for the suite and stop it after.
	SuiteBaseURL = "http://127.0.0.1:3191"
	proc, err := startBinary(d.Binary, nil, map[string]string{"AYOKODING_WEB_PORT": "3191", "AYOKODING_WEB_FIXTURE": "parity"})
	if err != nil {
		return nil, err
	}
	d.base = "http://127.0.0.1:3191"
	if err := waitReady(d.base + "/en"); err != nil {
		proc()
		return nil, err
	}
	return proc, nil
}

// BuildBinary compiles the app server for drivers that bind real listeners.
func BuildBinary(t *testing.T) (string, error) {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	appRoot := filepath.Join(filepath.Dir(file), "..", "..", "..")
	binary := filepath.Join(t.TempDir(), "ayokoding-web-test")
	cmd := exec.Command("go", "build", "-trimpath", "-o", binary, "./cmd/ayokoding-web")
	cmd.Dir = appRoot
	if output, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("bdd: build binary: %w: %s", err, output)
	}
	return binary, nil
}

// Corpus holds the canonical web behaviours, four levels above the suites.
var Corpus = []string{filepath.Join("..", "..", "..", "..", "specs", "apps", "ayokoding", "web", "behaviours")}

// Success is the godog status reported when every scenario passes.
const Success = 0
