// Command ayokoding-web serves the bilingual learning site with the
// standard library HTTP stack and htmx fragment endpoints.
package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func main() {
	os.Exit(run(os.Args[1:]))
}

func run(args []string) int {
	cfg, err := web.ResolveConfig(args)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: %v\n", err)
		return 1
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	server := web.NewServer(cfg, web.SeedFixtureDeps(cfg.Fixture))
	listener, err := net.Listen("tcp", "127.0.0.1:"+strconv.Itoa(cfg.Port))
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: listen: %v\n", err)
		return 1
	}
	httpServer := &http.Server{Handler: server.Handler()}
	go func() {
		<-ctx.Done()
		_ = httpServer.Close()
	}()
	if err := httpServer.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: serve: %v\n", err)
		return 1
	}
	return 0
}
