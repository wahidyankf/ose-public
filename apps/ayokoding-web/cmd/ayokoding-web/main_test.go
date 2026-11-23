package main

import (
	"bytes"
	"context"
	"errors"
	"io/fs"
	"net"
	"os"
	"strings"
	"sync"
	"testing"
)

// noLauncher reports every launcher variable as unset.
func noLauncher(string) (string, bool) { return "", false }

// refusedRoot stands for a source root the operating system refused.
func refusedRoot(string) fs.FS { return refusedFS{} }

type refusedFS struct{}

func (refusedFS) Open(string) (fs.File, error) { return nil, fs.ErrPermission }

// immediateNotify returns a context that is already canceled, as a shutdown
// signal that arrived before the server started.
func immediateNotify(parent context.Context) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(parent)
	cancel()
	return ctx, cancel
}

// quietNotify returns a context that stays live until the launcher stops.
func quietNotify(parent context.Context) (context.Context, context.CancelFunc) {
	return context.WithCancel(parent)
}

// blockingListener accepts no connection until it is closed, as an idle
// listener does, and then reports the closure.
type blockingListener struct {
	once   sync.Once
	closed chan struct{}
	addr   net.Addr
}

func newBlockingListener() *blockingListener {
	return &blockingListener{closed: make(chan struct{}), addr: &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: 3102}}
}

func (l *blockingListener) Accept() (net.Conn, error) {
	<-l.closed
	return nil, net.ErrClosed
}

func (l *blockingListener) Close() error {
	l.once.Do(func() { close(l.closed) })
	return nil
}

func (l *blockingListener) Addr() net.Addr { return l.addr }

// refusingListener fails every accept, as a broken socket does.
type refusingListener struct{ addr net.Addr }

func (refusingListener) Accept() (net.Conn, error) {
	return nil, errors.New("accept refused")
}

func (refusingListener) Close() error { return nil }

func (l refusingListener) Addr() net.Addr { return l.addr }

func testHost(stderr *bytes.Buffer, listen func(string) (net.Listener, error), notify func(context.Context) (context.Context, context.CancelFunc)) host {
	return host{
		environment: noLauncher,
		root:        refusedRoot,
		listen:      listen,
		notify:      notify,
		stderr:      stderr,
	}
}

func TestRunRejectsInvalidFlag(t *testing.T) {
	var stderr bytes.Buffer
	listened := false
	process := testHost(&stderr, func(string) (net.Listener, error) {
		listened = true
		return nil, errors.New("must not listen")
	}, quietNotify)
	if status := run([]string{"--bogus"}, process); status != 1 {
		t.Fatalf("status = %d, want 1 for an unknown flag", status)
	}
	if listened {
		t.Fatal("an invalid configuration must not open a listener")
	}
	if !strings.Contains(stderr.String(), `unknown flag "--bogus"`) {
		t.Fatalf("stderr = %q, want the unknown-flag diagnostic", stderr.String())
	}
}

func TestRunReportsListenFailure(t *testing.T) {
	var stderr bytes.Buffer
	process := testHost(&stderr, func(address string) (net.Listener, error) {
		if address != "127.0.0.1:3102" {
			t.Fatalf("listen address = %q, want the loopback default port", address)
		}
		return nil, errors.New("address in use")
	}, quietNotify)
	if status := run(nil, process); status != 1 {
		t.Fatalf("status = %d, want 1 when the listener cannot bind", status)
	}
	if !strings.Contains(stderr.String(), "listen: address in use") {
		t.Fatalf("stderr = %q, want the listen diagnostic", stderr.String())
	}
}

func TestRunServesUntilShutdown(t *testing.T) {
	var stderr bytes.Buffer
	// The shutdown context is already canceled, so the serve goroutine closes
	// the server at once and run returns without a timer.
	listener := newBlockingListener()
	process := testHost(&stderr, func(string) (net.Listener, error) { return listener, nil }, immediateNotify)
	if status := run([]string{"--port", "3300", "--fixture", "parity"}, process); status != 0 {
		t.Fatalf("status = %d, want 0 after a clean shutdown; stderr %q", status, stderr.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("clean shutdown must not write diagnostics, got %q", stderr.String())
	}
}

func TestRunReportsServeFailure(t *testing.T) {
	var stderr bytes.Buffer
	process := testHost(&stderr, func(string) (net.Listener, error) {
		return refusingListener{addr: &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: 3102}}, nil
	}, quietNotify)
	if status := run(nil, process); status != 1 {
		t.Fatalf("status = %d, want 1 when serving fails", status)
	}
	if !strings.Contains(stderr.String(), "serve: accept refused") {
		t.Fatalf("stderr = %q, want the serve diagnostic", stderr.String())
	}
}

func TestMainExitsWithTheRunStatus(t *testing.T) {
	var stderr bytes.Buffer
	code := -1
	savedExit, savedHost, savedArgs := exit, hostFor, os.Args
	t.Cleanup(func() { exit, hostFor, os.Args = savedExit, savedHost, savedArgs })
	exit = func(status int) { code = status }
	hostFor = func() host { return testHost(&stderr, nil, quietNotify) }
	os.Args = []string{"ayokoding-web", "--bogus"}
	main()
	if code != 1 {
		t.Fatalf("exit status = %d, want 1 for an unknown flag", code)
	}
}

func TestOSHostWiresEveryProcessSurface(t *testing.T) {
	process := osHost()
	if process.environment == nil || process.root == nil || process.listen == nil || process.notify == nil || process.stderr == nil {
		t.Fatalf("osHost left a process surface unwired: %+v", process)
	}
	// An address that does not parse fails before any socket is opened.
	if _, err := process.listen("not-an-address"); err == nil {
		t.Fatal("listen must reject an unparsable address")
	}
	ctx, stop := process.notify(context.Background())
	stop()
	<-ctx.Done()
	if process.root("unused") == nil {
		t.Fatal("root must return a file system")
	}
}
