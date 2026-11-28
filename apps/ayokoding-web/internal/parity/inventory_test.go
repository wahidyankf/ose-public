package parity

import (
	"encoding/json"
	"io/fs"
	"slices"
	"strings"
	"testing"
	"testing/fstest"
)

// sitemapWithDuplicate lists three addresses on the old origin, one of them twice.
const sitemapWithDuplicate = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://localhost:3101/en/learn</loc></url>
  <url><loc>http://localhost:3101/en</loc></url>
  <url><loc>http://localhost:3101/en/learn</loc></url>
</urlset>`

func TestBuildInventoryListsEachPageOnceSortedWithNoHost(t *testing.T) {
	inv, err := BuildInventory([]byte(sitemapWithDuplicate), []byte("[]"), nil, "abc123")
	if err != nil {
		t.Fatalf("BuildInventory: %v", err)
	}
	want := []string{"/en", "/en/learn"}
	if !slices.Equal(inv.URLs, want) {
		t.Fatalf("urls = %q, want %q", inv.URLs, want)
	}
	if inv.SourceRevision != "abc123" {
		t.Fatalf("sourceRevision = %q, want abc123", inv.SourceRevision)
	}
	if inv.Redirects == nil || len(inv.Redirects) != 0 {
		t.Fatalf("redirects = %#v, want an empty array", inv.Redirects)
	}
	raw, err := json.Marshal(inv)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if strings.Contains(string(raw), "://") {
		t.Fatalf("inventory names a host: %s", raw)
	}
}

func TestBuildInventoryKeepsEachRedirectSourceWithTheStatusItsPermanenceSets(t *testing.T) {
	export := `[
	  {"source":"/b","destination":"/en/b","permanent":false},
	  {"source":"/a/:path*","destination":"/en/:path*","permanent":true}
	]`
	inv, err := BuildInventory([]byte(sitemapWithDuplicate), []byte(export), nil, "abc123")
	if err != nil {
		t.Fatalf("BuildInventory: %v", err)
	}
	want := []Redirect{
		{Source: "/a/:path*", Status: 308, Location: "/en/:path*"},
		{Source: "/b", Status: 307, Location: "/en/b"},
	}
	if !slices.Equal(inv.Redirects, want) {
		t.Fatalf("redirects = %#v, want %#v", inv.Redirects, want)
	}
}

func TestBuildInventoryRefusesMalformedInputs(t *testing.T) {
	tests := []struct {
		name    string
		sitemap string
		export  string
	}{
		{name: "a malformed sitemap", sitemap: "<urlset><url>", export: "[]"},
		{name: "a malformed redirect export", sitemap: sitemapWithDuplicate, export: "{"},
		{name: "a location that is not a URL", sitemap: `<urlset><url><loc>http://[::1</loc></url></urlset>`, export: "[]"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := BuildInventory([]byte(tt.sitemap), []byte(tt.export), nil, "abc123"); err == nil {
				t.Fatal("BuildInventory accepted the input, want an error")
			}
		})
	}
}

func TestRoutePatternsExpandLocalesAndLeaveOutTheRPCTransportAndTheContentCatchAll(t *testing.T) {
	routes := fstest.MapFS{
		"(entry)/page.tsx":                      {},
		"[locale]/page.tsx":                     {},
		"[locale]/(content)/browse/page.tsx":    {},
		"[locale]/(content)/[...slug]/page.tsx": {},
		"[locale]/tools/page.tsx":               {},
		"[locale]/tools/ai-benchmark/page.tsx":  {},
		"api/trpc/[trpc]/route.ts":              {},
		"feed.xml/route.ts":                     {},
		"robots.ts":                             {},
		"sitemap.ts":                            {},
	}
	got, err := RoutePatterns(routes)
	if err != nil {
		t.Fatalf("RoutePatterns: %v", err)
	}
	want := []string{
		"/", "/en", "/en/browse", "/en/tools", "/en/tools/ai-benchmark",
		"/feed.xml", "/id", "/id/browse", "/id/tools", "/id/tools/ai-benchmark",
		"/robots.txt", "/sitemap.xml",
	}
	if !slices.Equal(got, want) {
		t.Fatalf("patterns = %q, want %q", got, want)
	}
}

// failingFS refuses every open, so the walk reports its error.
type failingFS struct{}

func (failingFS) Open(string) (fs.File, error) { return nil, fs.ErrPermission }

func TestRoutePatternsReportsAnUnreadableRouteTree(t *testing.T) {
	if _, err := RoutePatterns(failingFS{}); err == nil {
		t.Fatal("RoutePatterns read an unreadable tree, want an error")
	}
}

func TestBuildInventoryNamesAnOriginOnlyLocationAsTheRoot(t *testing.T) {
	sitemap := `<urlset><url><loc>http://localhost:3101</loc></url></urlset>`
	inv, err := BuildInventory([]byte(sitemap), []byte("[]"), nil, "abc123")
	if err != nil {
		t.Fatalf("BuildInventory: %v", err)
	}
	if want := []string{"/"}; !slices.Equal(inv.URLs, want) {
		t.Fatalf("urls = %q, want %q", inv.URLs, want)
	}
}
