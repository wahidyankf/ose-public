package glue

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// World carries one scenario from Given through Then.
type World struct {
	adapter         string
	cfg             web.Config
	handler         http.Handler
	env             map[string]string
	args            []string
	status          int
	header          http.Header
	body            string
	requests        []recordedRequest
	resolvedPort    int
	listenerStarted bool
	startErr        error
	// baseURL routes client calls to a scenario server; empty means the
	// in-process handler (unit).
	baseURL string
	// stops cleans up scenario-owned servers and stubs.
	stops []func()
	// external records coexistence listeners (unit fakes, integration stubs).
	external map[int]bool
	// progress browser doubles: rewrite origin, existing-site origin, and
	// unrelated site settings that reset must preserve.
	progress         *progressDouble
	existingProgress *progressDouble
	settings         map[string]string
	progressPage     string
	focus            string
	// tool journey state.
	journey      string
	benchFilters benchmark.Filters
	benchResult  benchmark.Result
	calcInputs   calculator.Inputs
	calcResult   calculator.Estimate
	// path journey state.
	pathID      string
	courseID    string
	history     []string
	r6FirstBody string
	// search journey state.
	searchOpen   bool
	searchQuery  string
	searchPicked string
	// shell journey state.
	locale        string
	theme         string
	sidebarWidth  int
	mobileNavOpen bool
	viewportWidth string
	// content journey state.
	diagnostic string
	shortcode  string
	clipboard  string
	// local-dev journey state.
	flagPort string
	hashes   map[string]string
}

// NewWorld builds the per-scenario state for the named adapter.
func NewWorld(adapter string) *World {
	deps := seedFixtureDeps()
	var cfg web.Config
	_ = withScenarioEnv(map[string]string{}, func() error {
		var resolveErr error
		cfg, resolveErr = web.ResolveConfig(nil)
		return resolveErr
	})
	cfg.Port = web.DefaultPort
	return &World{
		adapter:          adapter,
		cfg:              cfg,
		handler:          web.NewServer(cfg, deps).Handler(),
		env:              map[string]string{},
		external:         map[int]bool{},
		progress:         newProgressDouble(),
		existingProgress: newProgressDouble(),
		settings:         map[string]string{"theme": "light", "ayokoding-sidebar-width": "240"},
		locale:           "en",
		theme:            "light",
		sidebarWidth:     240,
	}
}

// seedFixtureDeps delegates to the shared production seed so the unit driver
// serves the same canned corpus as the binary.
func seedFixtureDeps() web.Deps {
	return web.SeedFixtureDeps("parity")
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
