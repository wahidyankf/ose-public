package parity

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io/fs"
	"net/url"
	"path"
	"slices"
	"strings"
)

// Redirect is one redirect source the old site serves, with the status it
// answers and the location it names. Sources may hold the ":path*" pattern.
type Redirect struct {
	Source   string `json:"source"`
	Status   int    `json:"status"`
	Location string `json:"location"`
}

// Inventory is the committed list of old-site URLs and redirect sources.
// It holds no host: every URL is a path.
type Inventory struct {
	SourceRevision string     `json:"sourceRevision"`
	URLs           []string   `json:"urls"`
	Redirects      []Redirect `json:"redirects"`
}

// BuildInventory assembles the inventory from the old sitemap, the redirect
// export, and the route patterns, all passed in as values. Every URL is a path,
// listed once and sorted; every redirect keeps the status its permanence sets.
func BuildInventory(sitemap []byte, export []byte, routes []string, sourceRevision string) (Inventory, error) {
	locations, err := sitemapPaths(sitemap)
	if err != nil {
		return Inventory{}, err
	}
	redirects, err := parseExport(export)
	if err != nil {
		return Inventory{}, err
	}
	urls := make([]string, 0, len(locations)+len(routes))
	seen := map[string]bool{}
	for _, candidate := range slices.Concat(locations, routes) {
		if !seen[candidate] {
			seen[candidate] = true
			urls = append(urls, candidate)
		}
	}
	slices.Sort(urls)
	return Inventory{SourceRevision: sourceRevision, URLs: urls, Redirects: redirects}, nil
}

// sitemapPaths returns the path of each sitemap location. The origin is
// dropped, so the inventory holds no host.
func sitemapPaths(sitemap []byte) ([]string, error) {
	var document struct {
		URLs []struct {
			Loc string `xml:"loc"`
		} `xml:"url"`
	}
	if err := xml.Unmarshal(sitemap, &document); err != nil {
		return nil, fmt.Errorf("sitemap: %w", err)
	}
	paths := make([]string, 0, len(document.URLs))
	for _, entry := range document.URLs {
		location, err := url.Parse(strings.TrimSpace(entry.Loc))
		if err != nil {
			return nil, fmt.Errorf("sitemap location %q: %w", entry.Loc, err)
		}
		paths = append(paths, pathOf(location))
	}
	return paths, nil
}

func pathOf(location *url.URL) string {
	if location.EscapedPath() == "" {
		return "/"
	}
	return location.EscapedPath()
}

// exportRule is one entry of the committed redirect export, as the www
// redirect modules declare it.
type exportRule struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Permanent   bool   `json:"permanent"`
}

// parseExport turns the export into redirect sources. Next.js answers a
// permanent redirect with 308 and a temporary one with 307.
func parseExport(export []byte) ([]Redirect, error) {
	var rules []exportRule
	if err := json.Unmarshal(export, &rules); err != nil {
		return nil, fmt.Errorf("redirect export: %w", err)
	}
	redirects := make([]Redirect, 0, len(rules))
	for _, rule := range rules {
		status := 307
		if rule.Permanent {
			status = 308
		}
		redirects = append(redirects, Redirect{Source: rule.Source, Status: status, Location: rule.Destination})
	}
	slices.SortFunc(redirects, func(a, b Redirect) int { return strings.Compare(a.Source, b.Source) })
	return redirects, nil
}

// RoutePatterns lists the page and route patterns the old app serves from its
// route tree. A locale segment expands to en and id. The tRPC transport (api)
// is not a page, and a dynamic segment such as the content catch-all is covered
// by the sitemap, so neither is listed here.
func RoutePatterns(routes fs.FS) ([]string, error) {
	var patterns []string
	err := fs.WalkDir(routes, ".", func(file string, _ fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		patterns = append(patterns, routePatterns(file)...)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("route tree: %w", err)
	}
	slices.Sort(patterns)
	return slices.Compact(patterns), nil
}

// routePatterns returns the URL patterns one route file serves, or none when
// the file is not a page or route. Metadata routes at the root name their file.
func routePatterns(file string) []string {
	switch file {
	case "robots.ts":
		return []string{"/robots.txt"}
	case "sitemap.ts":
		return []string{"/sitemap.xml"}
	}
	dir, base := path.Split(file)
	if base != "page.tsx" && base != "route.ts" {
		return nil
	}
	patterns := []string{""}
	for _, segment := range strings.Split(strings.Trim(dir, "/"), "/") {
		switch {
		case segment == "", strings.HasPrefix(segment, "("):
			continue
		case segment == "[locale]":
			patterns = extend(patterns, "en", "id")
		case segment == "api", strings.Contains(segment, "["):
			return nil
		default:
			patterns = extend(patterns, segment)
		}
	}
	for index := range patterns {
		if patterns[index] == "" {
			patterns[index] = "/"
		}
	}
	return patterns
}

// extend appends each part to each existing pattern, as one more path segment.
func extend(patterns []string, parts ...string) []string {
	var extended []string
	for _, pattern := range patterns {
		for _, part := range parts {
			extended = append(extended, pattern+"/"+part)
		}
	}
	return extended
}
