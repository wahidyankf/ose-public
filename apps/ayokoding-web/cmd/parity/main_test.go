package main

import (
	"bytes"
	"io"
	"io/fs"
	"os"
	"slices"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/parity"
)

// runMain drives main through its seams with one host double and the given
// arguments, restores the process state, and returns the exit code main gave.
func runMain(t *testing.T, args []string, host parity.Host) int {
	t.Helper()
	code := -1
	savedExit, savedHost, savedArgs := exit, hostFor, os.Args
	t.Cleanup(func() { exit, hostFor, os.Args = savedExit, savedHost, savedArgs })
	exit = func(c int) { code = c }
	hostFor = func() parity.Host { return host }
	os.Args = append([]string{"parity"}, args...)
	main()
	return code
}

func repoHost(stderr *bytes.Buffer, read *[]string) parity.Host {
	return parity.Host{
		Working: "/repo",
		Sub:     func(string) fs.FS { return fstest.MapFS{"repo-config.yml": {}} },
		ReadFile: func(name string) ([]byte, error) {
			*read = append(*read, name)
			return nil, fs.ErrNotExist
		},
		Stdout: io.Discard,
		Stderr: stderr,
	}
}

func TestMainExitsNonZeroForAnUnknownSubcommandAndNamesIt(t *testing.T) {
	var stderr bytes.Buffer
	var read []string
	code := runMain(t, []string{"bogus"}, repoHost(&stderr, &read))
	if code == 0 {
		t.Fatal("exit 0 for an unknown subcommand, want a non-zero code")
	}
	if !strings.Contains(stderr.String(), "bogus") {
		t.Fatalf("stderr = %q, want it to name the subcommand", stderr.String())
	}
}

func TestMainReachesEachSubcommandThroughTheHost(t *testing.T) {
	tests := []struct {
		name     string
		args     []string
		wantRead string
	}{
		{
			name:     "inventory reads its sitemap through the host",
			args:     []string{"inventory", "--sitemap", "sitemap.xml", "--source-revision", "abc123"},
			wantRead: "/repo/sitemap.xml",
		},
		{
			name:     "gap-report reads its inventory through the host",
			args:     []string{"gap-report", "--inventory", "inventory.json", "--base-url", "http://127.0.0.1:3102"},
			wantRead: "/repo/inventory.json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var stderr bytes.Buffer
			var read []string
			code := runMain(t, tt.args, repoHost(&stderr, &read))
			if code == 0 {
				t.Fatalf("exit 0 with an unreadable input, want a non-zero code; stderr %q", stderr.String())
			}
			if !slices.Contains(read, tt.wantRead) {
				t.Fatalf("host reads = %q, want %q", read, tt.wantRead)
			}
		})
	}
}
