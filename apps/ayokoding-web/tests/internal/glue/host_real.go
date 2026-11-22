package glue

// host_real.go is the one glue file that touches the process, the network, or
// the file system for real. The unit path never calls these functions; the
// integration and e2e drivers do. The hermeticity ban excludes this file by
// path, and integration and e2e runs cover it, per the test-level contract.

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

// RequestedAdapter reports the BDD adapter and e2e binary the environment
// names. An empty adapter means the unit adapter.
func RequestedAdapter() (adapter, binary string) {
	return os.Getenv("AYOKODING_BDD_ADAPTER"), os.Getenv("AYOKODING_BIN")
}

// realFreePort returns an available loopback port for override scenarios.
func realFreePort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, fmt.Errorf("bdd: free port: %w", err)
	}
	defer func() { _ = listener.Close() }()
	return listener.Addr().(*net.TCPAddr).Port, nil
}

// realRootFS opens a configured source root on disk for the real server.
func realRootFS(dir string) fs.FS {
	return os.DirFS(dir)
}

// realStageCorpus writes files under a fresh temporary root and returns the
// root with its cleanup.
func realStageCorpus(files map[string]string) (string, func(), error) {
	root, err := os.MkdirTemp("", "ayokoding-web-corpus-")
	if err != nil {
		return "", nil, err
	}
	cleanup := func() { _ = os.RemoveAll(root) }
	for rel, body := range files {
		full := filepath.Join(root, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			cleanup()
			return "", nil, err
		}
		if err := os.WriteFile(full, []byte(body), 0o600); err != nil {
			cleanup()
			return "", nil, err
		}
	}
	return root, cleanup, nil
}

// realSharedFiles lists the read-only corpus files the rewrite consumes.
func realSharedFiles() []string {
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

// realSharedHashes fingerprints every shared corpus file that can be read.
func realSharedHashes() map[string]string {
	hashes := map[string]string{}
	for _, file := range realSharedFiles() {
		raw, err := os.ReadFile(file)
		if err != nil {
			continue
		}
		hashes[file] = sha256Hex(raw)
	}
	return hashes
}

// realSharedDrift returns the first shared corpus file whose bytes differ from
// the recorded fingerprint, or "" when none changed.
func realSharedDrift(recorded map[string]string) string {
	for _, file := range realSharedFiles() {
		raw, err := os.ReadFile(file)
		if err != nil {
			continue
		}
		if recorded[file] != sha256Hex(raw) {
			return file
		}
	}
	return ""
}

// realStubListener serves a stub responder on the loopback port for a
// coexistence scenario and returns its stop function.
func realStubListener(port int) (func(), error) {
	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
	if err != nil {
		return nil, fail("external port %d is busy; refusing to reuse another process", port)
	}
	server := &http.Server{Handler: http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = fmt.Fprint(writer, "<html><body>external</body></html>")
	})}
	go func() { _ = server.Serve(listener) }()
	return func() { _ = server.Close() }, nil
}

// callRemote performs one request against a live test server.
func (w *World) callRemote(base, method, target string) error {
	url := base + target
	if strings.HasPrefix(target, "http") {
		url = target
	}
	request, err := http.NewRequest(method, url, nil)
	if err != nil {
		return fmt.Errorf("bdd: build request: %w", err)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return fmt.Errorf("bdd: do request: %w", err)
	}
	defer func() { _ = response.Body.Close() }()
	raw, err := io.ReadAll(response.Body)
	if err != nil {
		return fmt.Errorf("bdd: read body: %w", err)
	}
	w.status = response.StatusCode
	w.header = response.Header
	w.body = string(raw)
	return nil
}

// realLaunchExpectExit runs the binary to completion for failure scenarios.
func realLaunchExpectExit(args []string, env map[string]string) (int, string, error) {
	var stderr bytes.Buffer
	cmd := exec.Command(SuiteBinary, args...)
	cmd.Env = os.Environ()
	for key, value := range env {
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

// startBinary launches the server binary with the given arguments and
// environment.
func startBinary(binary string, args []string, env map[string]string) (func(), error) {
	cmd := exec.Command(binary, args...)
	cmd.Env = os.Environ()
	for key, value := range env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("bdd: start binary: %w", err)
	}
	done := make(chan struct{})
	go func() {
		_ = cmd.Wait()
		close(done)
	}()
	return func() {
		_ = cmd.Process.Kill()
		<-done
	}, nil
}

// waitReady polls until the server answers or the deadline passes.
func waitReady(url string) error {
	host := strings.TrimPrefix(url, "http://")
	host = strings.TrimPrefix(host, "https://")
	if index := strings.IndexByte(host, '/'); index >= 0 {
		host = host[:index]
	}
	deadline := time.Now().Add(15 * time.Second)
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", host, time.Second)
		if err == nil {
			_ = conn.Close()
			response, err := http.Get(url) //nolint:gosec,noctx
			if err == nil {
				_, _ = io.Copy(io.Discard, response.Body)
				_ = response.Body.Close()
				if response.StatusCode == http.StatusOK {
					return nil
				}
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	return fmt.Errorf("bdd: server at %s never became ready", url)
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

// IntegrationCorpus lists the feature files the Go integration driver binds.
// browser-progress runs only through the Playwright home, which binds it by
// name (contract C13), so the Go driver leaves that one feature out.
func IntegrationCorpus() ([]string, error) {
	var paths []string
	err := filepath.WalkDir(Corpus[0], func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || filepath.Ext(path) != ".feature" {
			return nil
		}
		if filepath.Base(path) == "browser-progress.feature" {
			return nil
		}
		paths = append(paths, path)
		return nil
	})
	return paths, err
}
