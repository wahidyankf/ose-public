package bddintegration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"testing"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/parity"
)

// integrationSitemap has three entries on the old origin, one of them a repeat.
const integrationSitemap = `<urlset><url><loc>http://localhost:3101/en/browse</loc></url><url><loc>http://localhost:3101/en</loc></url><url><loc>http://localhost:3101/en</loc></url></urlset>`

// committedExport is the redirect export the inventory reads, relative to the repository root.
const committedExport = "apps/ayokoding-web/internal/web/testdata/www-redirects.json"

// parityIntegration is the state one scenario's steps share. It runs the
// command over real files in a temporary directory and a real loopback server.
type parityIntegration struct {
	t      *testing.T
	dir    string
	stdout bytes.Buffer
	stderr bytes.Buffer
	code   int
	mu     sync.Mutex
	served []string
	base   string
}

func registerParityToolsSteps(ctx *godog.ScenarioContext, t *testing.T) {
	w := &parityIntegration{t: t, dir: t.TempDir()}
	ctx.Given(`^the old site's sitemap has three entries, one of them a repeat of another$`, w.sitemapHasAnEntryTwice)
	ctx.When(`^the URL inventory command runs over the sitemap$`, w.runInventory)
	ctx.Then(`^the inventory lists each page address once, in sorted order$`, w.inventoryListsEachPageOnceSorted)
	ctx.Step(`^no inventory entry names a host$`, w.inventoryNamesNoHost)
	ctx.Given(`^an inventory lists a page that answers 200 and a page that answers 404$`, w.inventoryListsTwoPages)
	ctx.When(`^the gap report runs against the base address$`, w.runGapReport)
	ctx.Then(`^the page that answers 200 is classified as passing$`, w.pageThatAnswers200Passes)
	ctx.Then(`^the page that answers 404 is classified as failing and grouped under its cause$`, w.pageThatAnswers404FailsWithCause)
	ctx.Step(`^no redirect is followed$`, w.eachURLWasProbedOnceAndNoRedirectFollowed)
}

// host is the operating-system host with its output captured in the world.
func (w *parityIntegration) host() parity.Host {
	host := parity.OSHost()
	host.Stdout = &w.stdout
	host.Stderr = &w.stderr
	return host
}

func (w *parityIntegration) write(name, content string) (string, error) {
	path := filepath.Join(w.dir, name)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return "", err
	}
	return path, os.WriteFile(path, []byte(content), 0o644)
}

func (w *parityIntegration) sitemapHasAnEntryTwice() error {
	if _, err := w.write("routes/[locale]/page.tsx", ""); err != nil {
		return err
	}
	_, err := w.write("sitemap.xml", integrationSitemap)
	return err
}

func (w *parityIntegration) runInventory() error {
	sitemap := filepath.Join(w.dir, "sitemap.xml")
	routes := filepath.Join(w.dir, "routes")
	w.code = parity.Run([]string{
		"inventory",
		"--sitemap", sitemap,
		"--routes", routes,
		"--export", committedExport,
		"--source-revision", "fixture-rev",
	}, w.host())
	return nil
}

func (w *parityIntegration) inventoryListsEachPageOnceSorted() error {
	if w.code != 0 {
		return fmt.Errorf("inventory exited %d: %s", w.code, w.stderr.String())
	}
	var inv parity.Inventory
	if err := json.Unmarshal(w.stdout.Bytes(), &inv); err != nil {
		return fmt.Errorf("inventory is not JSON: %w", err)
	}
	if !slices.IsSorted(inv.URLs) {
		return fmt.Errorf("urls are not sorted: %q", inv.URLs)
	}
	if deduped := slices.Compact(slices.Clone(inv.URLs)); len(deduped) != len(inv.URLs) {
		return fmt.Errorf("urls repeat an entry: %q", inv.URLs)
	}
	if !slices.Contains(inv.URLs, "/en") || !slices.Contains(inv.URLs, "/id") {
		return fmt.Errorf("urls lack a sitemap or locale page: %q", inv.URLs)
	}
	return nil
}

func (w *parityIntegration) inventoryNamesNoHost() error {
	if strings.Contains(w.stdout.String(), "://") {
		return fmt.Errorf("inventory names a host: %s", w.stdout.String())
	}
	return nil
}

// inventoryListsTwoPages starts a loopback server that answers /en with 200,
// /en/does-not-exist with 404, and /en/moved with a 308 the report must not follow.
func (w *parityIntegration) inventoryListsTwoPages() error {
	server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		w.mu.Lock()
		w.served = append(w.served, r.URL.Path)
		w.mu.Unlock()
		switch r.URL.Path {
		case "/en":
			rw.WriteHeader(http.StatusOK)
		case "/en/moved":
			rw.Header().Set("Location", "/en")
			rw.WriteHeader(http.StatusPermanentRedirect)
		default:
			rw.WriteHeader(http.StatusNotFound)
		}
	}))
	w.t.Cleanup(server.Close)
	w.base = server.URL
	_, err := w.write("inventory.json", `{"sourceRevision":"fixture-rev","urls":["/en","/en/does-not-exist"],"redirects":[]}`)
	return err
}

func (w *parityIntegration) runGapReport() error {
	inventory := filepath.Join(w.dir, "inventory.json")
	w.code = parity.Run([]string{"gap-report", "--inventory", inventory, "--base-url", w.base}, w.host())
	return nil
}

func (w *parityIntegration) rowFor(url string) (string, error) {
	if w.code != 0 {
		return "", fmt.Errorf("gap report exited %d: %s", w.code, w.stderr.String())
	}
	for _, line := range strings.Split(w.stdout.String(), "\n") {
		if strings.Contains(line, "| "+url+" |") {
			return line, nil
		}
	}
	return "", fmt.Errorf("report has no row for %s:\n%s", url, w.stdout.String())
}

func (w *parityIntegration) pageThatAnswers200Passes() error {
	row, err := w.rowFor("/en")
	if err != nil {
		return err
	}
	if !strings.Contains(row, "| 200 | pass |") {
		return fmt.Errorf("200 page row = %q, want a passing 200", row)
	}
	return nil
}

func (w *parityIntegration) pageThatAnswers404FailsWithCause() error {
	row, err := w.rowFor("/en/does-not-exist")
	if err != nil {
		return err
	}
	if !strings.Contains(row, "| 404 | fail | no tree route |") {
		return fmt.Errorf("404 page row = %q, want a failing 404 grouped under its cause", row)
	}
	return nil
}

func (w *parityIntegration) eachURLWasProbedOnceAndNoRedirectFollowed() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	want := []string{"/en", "/en/does-not-exist"}
	if !slices.Equal(w.served, want) {
		return fmt.Errorf("server saw %q, want each inventory URL once and no redirect target", w.served)
	}
	return nil
}
