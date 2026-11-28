// Command ayokoding-web serves the bilingual learning site with the
// standard library HTTP stack and htmx fragment endpoints.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// host is the process surface the launcher touches: launcher variables,
// source roots, the listener, shutdown signals, and diagnostics. main supplies
// the operating-system implementation; unit tests supply doubles.
type host struct {
	environment web.Environment
	root        func(dir string) fs.FS
	working     string
	listen      func(address string) (net.Listener, error)
	notify      func(parent context.Context) (context.Context, context.CancelFunc)
	stderr      io.Writer
}

// exit and hostFor are the process seams main uses. The real process keeps
// os.Exit and osHost; unit tests replace them with doubles.
var (
	exit    = os.Exit
	hostFor = osHost
)

func main() {
	exit(run(os.Args[1:], hostFor()))
}

// osHost wires the launcher to the real process, snapshotting the honored
// launcher variables once at the boundary into the Environment seam.
func osHost() host {
	working, _ := os.Getwd()
	return host{
		environment: web.OSEnvironment(),
		root:        os.DirFS,
		working:     working,
		listen: func(address string) (net.Listener, error) {
			return net.Listen("tcp", address)
		},
		notify: func(parent context.Context) (context.Context, context.CancelFunc) {
			return signal.NotifyContext(parent, syscall.SIGINT, syscall.SIGTERM)
		},
		stderr: os.Stderr,
	}
}

func run(args []string, process host) int {
	cfg, err := web.ResolveConfig(args, process.environment)
	if err != nil {
		_, _ = fmt.Fprintf(process.stderr, "ayokoding-web: %v\n", err)
		return 1
	}
	ctx, stop := process.notify(context.Background())
	defer stop()
	sources := web.Sources{Environment: process.environment, Root: process.root, Working: process.working}
	if cfg.Fixture == "" {
		corpus, err := web.ResolveCorpus(sources)
		if err != nil {
			_, _ = fmt.Fprintf(process.stderr, "ayokoding-web: %v\n", err)
			return 1
		}
		_, _ = fmt.Fprintf(process.stderr, "ayokoding-web: serving the real corpus: content %s, manifests %s\n", corpus.ContentDir, corpus.ManifestsDir)
	}
	deps, err := web.SeedDeps(cfg, sources)
	if err != nil {
		_, _ = fmt.Fprintf(process.stderr, "ayokoding-web: %v\n", err)
		return 1
	}
	server := web.NewServer(cfg, deps)
	listener, err := process.listen("127.0.0.1:" + strconv.Itoa(cfg.Port))
	if err != nil {
		_, _ = fmt.Fprintf(process.stderr, "ayokoding-web: listen: %v\n", err)
		return 1
	}
	httpServer := &http.Server{Handler: server.Handler()}
	go func() {
		<-ctx.Done()
		_ = httpServer.Close()
	}()
	if err := httpServer.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
		_, _ = fmt.Fprintf(process.stderr, "ayokoding-web: serve: %v\n", err)
		return 1
	}
	return 0
}
