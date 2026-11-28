package parity

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/fs"
	"slices"
	"strings"
	"testing"
	"testing/fstest"
)

// repoFiles is the in-memory repository the doubles expose: a root marker and
// a small route tree. Every Sub call returns the same tree.
func repoFiles() fstest.MapFS {
	return fstest.MapFS{
		"repo-config.yml":          {},
		"[locale]/page.tsx":        {},
		"[locale]/browse/page.tsx": {},
	}
}

// fakeHost returns a Host whose files live in files, whose probes answer from
// replies, and whose output goes to the returned buffers.
func fakeHost(files map[string]string, replies map[string]Reply) (Host, *bytes.Buffer, *bytes.Buffer, map[string]string) {
	stdout, stderr := &bytes.Buffer{}, &bytes.Buffer{}
	written := map[string]string{}
	host := Host{
		Working: "/repo",
		Sub:     func(string) fs.FS { return repoFiles() },
		ReadFile: func(name string) ([]byte, error) {
			data, ok := files[name]
			if !ok {
				return nil, fs.ErrNotExist
			}
			return []byte(data), nil
		},
		WriteFile: func(name string, data []byte, _ fs.FileMode) error {
			written[name] = string(data)
			return nil
		},
		Fetch: func(url string) (Reply, error) {
			reply, ok := replies[url]
			if !ok {
				return Reply{}, errors.New("no reply scripted")
			}
			return reply, nil
		},
		Stdout: stdout,
		Stderr: stderr,
	}
	return host, stdout, stderr, written
}

// failingWriter refuses every write, so a test can reach the write-error branch.
type failingWriter struct{}

func (failingWriter) Write([]byte) (int, error) { return 0, errors.New("disk full") }

const runSitemap = `<urlset><url><loc>http://localhost:3101/en/learn</loc></url><url><loc>http://localhost:3101/en</loc></url></urlset>`

func TestRunRejectsAnUnknownSubcommandAndNamesIt(t *testing.T) {
	host, _, stderr, _ := fakeHost(nil, nil)
	if code := Run([]string{"bogus"}, host); code == 0 {
		t.Fatal("exit 0 for an unknown subcommand, want a non-zero code")
	}
	if !strings.Contains(stderr.String(), "bogus") {
		t.Fatalf("stderr = %q, want it to name the subcommand", stderr.String())
	}
}

func TestRunWithoutASubcommandPrintsUsage(t *testing.T) {
	host, _, stderr, _ := fakeHost(nil, nil)
	if code := Run(nil, host); code == 0 {
		t.Fatal("exit 0 with no subcommand, want a non-zero code")
	}
	if !strings.Contains(stderr.String(), "usage") {
		t.Fatalf("stderr = %q, want a usage line", stderr.String())
	}
}

func TestRunInventoryWritesTheInventoryToTheOutFile(t *testing.T) {
	files := map[string]string{
		"/repo/evidence/sitemap.xml":                                        runSitemap,
		"/repo/apps/ayokoding-web/internal/web/testdata/www-redirects.json": "[]",
	}
	host, _, stderr, written := fakeHost(files, nil)
	args := []string{"inventory", "--sitemap", "evidence/sitemap.xml", "--source-revision", "abc123", "--out", "/repo/inventory.json"}
	if code := Run(args, host); code != 0 {
		t.Fatalf("exit %d, stderr %q", code, stderr.String())
	}
	var inv Inventory
	if err := json.Unmarshal([]byte(written["/repo/inventory.json"]), &inv); err != nil {
		t.Fatalf("written inventory is not JSON: %v", err)
	}
	// The two sitemap pages, plus the locale expansions of the two route files.
	want := []string{"/en", "/en/browse", "/en/learn", "/id", "/id/browse"}
	if !slices.Equal(inv.URLs, want) {
		t.Fatalf("urls = %q, want %q", inv.URLs, want)
	}
	if inv.SourceRevision != "abc123" {
		t.Fatalf("sourceRevision = %q, want abc123", inv.SourceRevision)
	}
}

func TestRunInventoryPrintsTheInventoryToStdoutWithoutAnOutFile(t *testing.T) {
	files := map[string]string{
		"/repo/sitemap.xml": runSitemap,
		"/repo/apps/ayokoding-web/internal/web/testdata/www-redirects.json": "[]",
	}
	host, stdout, stderr, _ := fakeHost(files, nil)
	args := []string{"inventory", "--sitemap", "sitemap.xml", "--source-revision", "abc123"}
	if code := Run(args, host); code != 0 {
		t.Fatalf("exit %d, stderr %q", code, stderr.String())
	}
	var inv Inventory
	if err := json.Unmarshal(stdout.Bytes(), &inv); err != nil {
		t.Fatalf("stdout is not the inventory JSON: %v", err)
	}
	if !slices.Contains(inv.URLs, "/en/learn") {
		t.Fatalf("urls = %q, want the sitemap page", inv.URLs)
	}
}

func TestRunGapReportPrintsTheReportForTheInventoryFile(t *testing.T) {
	inventory := `{"sourceRevision":"abc123","urls":["/en","/en/section"],"redirects":[]}`
	files := map[string]string{"/repo/inventory.json": inventory}
	replies := map[string]Reply{
		"http://127.0.0.1:3102/en":         {Status: 200},
		"http://127.0.0.1:3102/en/section": {Status: 404},
	}
	host, stdout, stderr, _ := fakeHost(files, replies)
	args := []string{"gap-report", "--inventory", "inventory.json", "--base-url", "http://127.0.0.1:3102/"}
	if code := Run(args, host); code != 0 {
		t.Fatalf("exit %d, stderr %q", code, stderr.String())
	}
	for _, want := range []string{"pass: 1", "fail: 1", "no tree route"} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("report lacks %q:\n%s", want, stdout.String())
		}
	}
}

func TestRunReportsUsageAndIOErrorsWithANonZeroCode(t *testing.T) {
	tests := []struct {
		name string
		args []string
		file string
	}{
		{name: "inventory without a sitemap", args: []string{"inventory"}},
		{name: "inventory with an unreadable sitemap", args: []string{"inventory", "--sitemap", "missing.xml", "--source-revision", "abc123"}},
		{name: "inventory with an unknown flag", args: []string{"inventory", "--nope"}},
		{name: "gap report without a base URL", args: []string{"gap-report", "--inventory", "inventory.json"}},
		{name: "gap report with an unknown flag", args: []string{"gap-report", "--nope"}},
		{name: "gap report with a malformed inventory", args: []string{"gap-report", "--inventory", "inventory.json", "--base-url", "http://x"}, file: "{"},
		{name: "gap report with a malformed base URL", args: []string{"gap-report", "--inventory", "inventory.json", "--base-url", "http://[::1"}, file: `{"urls":[]}`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			files := map[string]string{}
			if tt.file != "" {
				files["/repo/inventory.json"] = tt.file
			}
			host, _, stderr, _ := fakeHost(files, nil)
			if code := Run(tt.args, host); code == 0 {
				t.Fatalf("exit 0, want a non-zero code; stderr %q", stderr.String())
			}
		})
	}
}

func TestRunHelpExitsZero(t *testing.T) {
	host, _, _, _ := fakeHost(nil, nil)
	if code := Run([]string{"inventory", "-h"}, host); code != 0 {
		t.Fatalf("exit %d for -h, want 0", code)
	}
}

func TestRunRefusesAWorkingDirectoryOutsideTheRepository(t *testing.T) {
	host, _, stderr, _ := fakeHost(map[string]string{"/elsewhere/sitemap.xml": runSitemap}, nil)
	host.Working = "/elsewhere"
	host.Sub = func(string) fs.FS { return fstest.MapFS{} }
	args := []string{"inventory", "--sitemap", "/elsewhere/sitemap.xml", "--source-revision", "abc123"}
	if code := Run(args, host); code != 1 {
		t.Fatalf("exit %d, want 1; stderr %q", code, stderr.String())
	}
	if !strings.Contains(stderr.String(), "repo-config.yml") {
		t.Fatalf("stderr = %q, want it to name the missing marker", stderr.String())
	}
}

func TestRunReportsWriteFailuresWithExitOne(t *testing.T) {
	files := map[string]string{
		"/repo/sitemap.xml": runSitemap,
		"/repo/apps/ayokoding-web/internal/web/testdata/www-redirects.json": "[]",
		"/repo/inventory.json": `{"urls":["/en"]}`,
	}
	host, _, stderr, _ := fakeHost(files, nil)
	host.WriteFile = func(string, []byte, fs.FileMode) error { return errors.New("disk full") }
	args := []string{"inventory", "--sitemap", "sitemap.xml", "--source-revision", "abc123", "--out", "inventory.json"}
	if code := Run(args, host); code != 1 {
		t.Fatalf("exit %d, want 1; stderr %q", code, stderr.String())
	}
	host, _, stderr, _ = fakeHost(files, map[string]Reply{"http://base/en": {Status: 200}})
	host.Stdout = failingWriter{}
	if code := Run([]string{"inventory", "--sitemap", "sitemap.xml", "--source-revision", "abc123"}, host); code != 1 {
		t.Fatalf("inventory stdout failure: exit %d, want 1; stderr %q", code, stderr.String())
	}
	if code := Run([]string{"gap-report", "--inventory", "inventory.json", "--base-url", "http://base"}, host); code != 1 {
		t.Fatalf("gap-report stdout failure: exit %d, want 1; stderr %q", code, stderr.String())
	}
}

func TestRunInventoryReportsEachUnreadableOrMalformedInput(t *testing.T) {
	routesFail := func(h *Host) {
		routesDir := h.Sub
		h.Sub = func(dir string) fs.FS {
			if strings.HasSuffix(dir, "/app") {
				return failingFS{}
			}
			return routesDir(dir)
		}
	}
	tests := []struct {
		name   string
		files  map[string]string
		mutate func(*Host)
	}{
		{name: "a missing redirect export", files: map[string]string{"/repo/sitemap.xml": runSitemap}},
		{name: "a malformed sitemap", files: map[string]string{
			"/repo/sitemap.xml": "<urlset><url>",
			"/repo/apps/ayokoding-web/internal/web/testdata/www-redirects.json": "[]",
		}},
		{name: "an unreadable route tree", files: map[string]string{
			"/repo/sitemap.xml": runSitemap,
			"/repo/apps/ayokoding-web/internal/web/testdata/www-redirects.json": "[]",
		}, mutate: routesFail},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			host, _, stderr, _ := fakeHost(tt.files, nil)
			if tt.mutate != nil {
				tt.mutate(&host)
			}
			args := []string{"inventory", "--sitemap", "sitemap.xml", "--source-revision", "abc123"}
			if code := Run(args, host); code != 1 {
				t.Fatalf("exit %d, want 1; stderr %q", code, stderr.String())
			}
		})
	}
}

func TestRunGapReportReportsAnOutsideRepositoryOrAMissingInventory(t *testing.T) {
	outside, _, _, _ := fakeHost(map[string]string{"/elsewhere/inventory.json": `{"urls":[]}`}, nil)
	outside.Working = "/elsewhere"
	outside.Sub = func(string) fs.FS { return fstest.MapFS{} }
	if code := Run([]string{"gap-report", "--inventory", "/elsewhere/inventory.json", "--base-url", "http://x"}, outside); code != 1 {
		t.Fatalf("outside the repository: exit %d, want 1", code)
	}
	missing, _, stderr, _ := fakeHost(nil, nil)
	if code := Run([]string{"gap-report", "--inventory", "absent.json", "--base-url", "http://x"}, missing); code != 1 {
		t.Fatalf("missing inventory: exit %d, want 1; stderr %q", code, stderr.String())
	}
}
