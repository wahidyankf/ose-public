package bdd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/fs"
	"slices"
	"strings"
	"testing/fstest"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/parity"
)

// unitSitemap has three entries on the old origin, one of them a repeat.
const unitSitemap = `<urlset><url><loc>http://localhost:3101/en/browse</loc></url><url><loc>http://localhost:3101/en</loc></url><url><loc>http://localhost:3101/en</loc></url></urlset>`

const unitBase = "http://base.test"

// parityWorld is the state one scenario's steps share. Its host doubles answer
// from in-memory values, so the unit scope reads no disk and opens no socket.
type parityWorld struct {
	files   map[string]string
	replies map[string]parity.Reply
	probed  []string
	stdout  bytes.Buffer
	stderr  bytes.Buffer
	code    int
}

func registerParityToolsSteps(ctx *godog.ScenarioContext) {
	w := &parityWorld{files: map[string]string{}, replies: map[string]parity.Reply{}}
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

// host wires Run to the world's doubles. Every Sub call returns the same small
// route tree, and the working directory is the repository root marker's home.
func (w *parityWorld) host() parity.Host {
	return parity.Host{
		Working: "/repo",
		Sub: func(string) fs.FS {
			return fstest.MapFS{"repo-config.yml": {}, "[locale]/page.tsx": {}}
		},
		ReadFile: func(name string) ([]byte, error) {
			data, ok := w.files[name]
			if !ok {
				return nil, fs.ErrNotExist
			}
			return []byte(data), nil
		},
		WriteFile: func(string, []byte, fs.FileMode) error { return nil },
		Fetch: func(url string) (parity.Reply, error) {
			w.probed = append(w.probed, url)
			reply, ok := w.replies[url]
			if !ok {
				return parity.Reply{}, fmt.Errorf("no reply scripted for %s", url)
			}
			return reply, nil
		},
		Stdout: &w.stdout,
		Stderr: &w.stderr,
	}
}

func (w *parityWorld) sitemapHasAnEntryTwice() error {
	w.files["/repo/sitemap.xml"] = unitSitemap
	w.files["/repo/apps/ayokoding-web/internal/web/testdata/www-redirects.json"] = "[]"
	return nil
}

func (w *parityWorld) runInventory() error {
	w.code = parity.Run([]string{"inventory", "--sitemap", "sitemap.xml", "--source-revision", "fixture-rev"}, w.host())
	return nil
}

func (w *parityWorld) inventoryListsEachPageOnceSorted() error {
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
	if !slices.Contains(inv.URLs, "/en") || !slices.Contains(inv.URLs, "/en/browse") {
		return fmt.Errorf("urls lack a sitemap page: %q", inv.URLs)
	}
	return nil
}

func (w *parityWorld) inventoryNamesNoHost() error {
	if strings.Contains(w.stdout.String(), "://") {
		return fmt.Errorf("inventory names a host: %s", w.stdout.String())
	}
	return nil
}

func (w *parityWorld) inventoryListsTwoPages() error {
	w.files["/repo/inventory.json"] = `{"sourceRevision":"fixture-rev","urls":["/en","/en/does-not-exist"],"redirects":[]}`
	w.replies[unitBase+"/en"] = parity.Reply{Status: 200}
	w.replies[unitBase+"/en/does-not-exist"] = parity.Reply{Status: 404}
	return nil
}

func (w *parityWorld) runGapReport() error {
	w.code = parity.Run([]string{"gap-report", "--inventory", "inventory.json", "--base-url", unitBase}, w.host())
	return nil
}

// rowFor returns the report row for one URL. A row is `| url | status | class | cause | unit |`.
func (w *parityWorld) rowFor(url string) (string, error) {
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

func (w *parityWorld) pageThatAnswers200Passes() error {
	row, err := w.rowFor("/en")
	if err != nil {
		return err
	}
	if !strings.Contains(row, "| 200 | pass |") {
		return fmt.Errorf("200 page row = %q, want a passing 200", row)
	}
	return nil
}

func (w *parityWorld) pageThatAnswers404FailsWithCause() error {
	row, err := w.rowFor("/en/does-not-exist")
	if err != nil {
		return err
	}
	if !strings.Contains(row, "| 404 | fail | no tree route |") {
		return fmt.Errorf("404 page row = %q, want a failing 404 grouped under its cause", row)
	}
	return nil
}

func (w *parityWorld) eachURLWasProbedOnceAndNoRedirectFollowed() error {
	want := []string{unitBase + "/en", unitBase + "/en/does-not-exist"}
	if !slices.Equal(w.probed, want) {
		return fmt.Errorf("probes = %q, want each inventory URL once", w.probed)
	}
	return nil
}
