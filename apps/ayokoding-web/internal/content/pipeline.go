package content

import (
	"path"
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

// Heading is one table-of-contents entry: a stable anchor ID, its text, and
// the normalized body level in [2,4].
type Heading struct {
	ID    string
	Text  string
	Level int
}

// LinkContext describes the page a relative Markdown link resolves from: its
// locale, its content slug, and whether it is a section index whose
// containing directory is the slug itself rather than its dirname.
type LinkContext struct {
	Locale    string
	Slug      string
	IsSection bool
}

// SafeSlug reports whether s is a safe content identity segment: non-empty
// ASCII letters, digits, '-' or '_' only. It rejects traversal (".", ".."),
// separators, whitespace, NUL/control characters, and percent-encoded input
// so unvalidated URL text never becomes a source lookup.
func SafeSlug(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if r > unicode.MaxASCII {
			return false
		}
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_' {
			continue
		}
		return false
	}
	return true
}

// SafePath validates a slash-joined rest path (legacy content addresses).
// Every segment must satisfy the single-segment rule, so dots inside a name
// ("v1.0") and multi-segment addresses ("capstone/overview") pass while
// empty segments, ".", "..", whitespace, backslashes, and non-ASCII fail.
func SafePath(path string) bool {
	if path == "" {
		return false
	}
	for _, segment := range strings.Split(path, "/") {
		if segment == "" || segment == "." || segment == ".." {
			return false
		}
		if strings.ContainsAny(segment, "\\ \t\n\r") {
			return false
		}
		for _, r := range segment {
			if r == '.' || r == '-' || r == '_' {
				continue
			}
			if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' {
				continue
			}
			return false
		}
	}
	return true
}

// SlugifyHeading derives a stable heading anchor in the rehype-slug spirit:
// lowercase with non letter/digit runs folded to single dashes.
func SlugifyHeading(text string) string {
	var builder strings.Builder
	dash := false
	for _, r := range strings.ToLower(text) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
			dash = false
			continue
		}
		if !dash && builder.Len() > 0 {
			builder.WriteByte('-')
			dash = true
		}
	}
	return strings.Trim(builder.String(), "-")
}

// NormalizeHeadingLevels ports the existing reader's relative shift/clamp
// rule: the page title owns h1, so the first body heading maps to h2 and
// every other body heading shifts by the same delta, clamped to [h2,h6].
// It returns the shifted levels in document order.
func NormalizeHeadingLevels(levels []int) []int {
	if len(levels) == 0 {
		return nil
	}
	delta := 2 - levels[0]
	shifted := make([]int, len(levels))
	for index, level := range levels {
		shifted[index] = min(6, max(2, level+delta))
	}
	return shifted
}

// ExtractTOC returns the h2-h4 entries (already normalized) with slugified
// stable IDs. Duplicate texts take -1, -2 suffixes so anchors stay unique.
func ExtractTOC(levels []int, texts []string) []Heading {
	var entries []Heading
	seen := map[string]int{}
	for index, level := range levels {
		if index >= len(texts) {
			break
		}
		if level < 2 || level > 4 {
			continue
		}
		base := SlugifyHeading(texts[index])
		if base == "" {
			continue
		}
		id := base
		if count := seen[base]; count > 0 {
			id = base + "-" + strconv.Itoa(count)
		}
		seen[base]++
		entries = append(entries, Heading{ID: id, Text: texts[index], Level: level})
	}
	return entries
}

// TransformShortcodes ports the existing shortcode preprocessing: Hugo
// callout/tabs/tab/youtube/steps shortcodes become allowed data-* render
// nodes. Anything else passes through unchanged, and the transform never
// emits template directives.
func TransformShortcodes(source string) string {
	result := replaceShortcode(source,
		`{{<\s*callout\s+type="([^"]+)"\s*>}}([\s\S]*?){{<\s*/callout\s*>}}`,
		func(groups []string) string {
			return `<div data-callout="` + groups[1] + "\">\n\n" + strings.TrimSpace(groups[2]) + "\n\n</div>"
		})
	result = replaceShortcode(result,
		`{{<\s*tabs\s+items="([^"]+)"\s*>}}([\s\S]*?){{<\s*/tabs\s*>}}`,
		func(groups []string) string {
			tabs := replaceShortcode(groups[2],
				`{{<\s*tab\s*>}}([\s\S]*?){{<\s*/tab\s*>}}`,
				func(inner []string) string {
					return "<div data-tab>\n\n" + strings.TrimSpace(inner[1]) + "\n\n</div>"
				})
			return `<div data-tabs="` + groups[1] + "\">\n\n" + strings.TrimSpace(tabs) + "\n\n</div>"
		})
	result = replaceShortcode(result,
		`{{<\s*youtube\s+([^\s>]+)\s*>}}`,
		func(groups []string) string {
			return `<div data-youtube="` + groups[1] + `"></div>`
		})
	result = replaceShortcode(result,
		`{{% steps %}}([\s\S]*?){{% /steps %}}`,
		func(groups []string) string {
			return "<div data-steps>\n\n" + strings.TrimSpace(groups[1]) + "\n\n</div>"
		})
	return result
}

// replaceShortcode rewrites every non-overlapping match of pattern with the
// rendering built from its capture groups.
func replaceShortcode(source, pattern string, render func(groups []string) string) string {
	expression := regexp.MustCompile(pattern)
	return expression.ReplaceAllStringFunc(source, func(match string) string {
		return render(expression.FindStringSubmatch(match))
	})
}

// absoluteHref matches hrefs that are already resolved: external schemes,
// site-root paths, and in-page anchors.
var absoluteHref = regexp.MustCompile(`^(https?:|mailto:|tel:|/|#)`)

// ResolveContentHref ports the existing content-link rewrite: absolute hrefs
// (external schemes, site-root paths, in-page anchors), non-".md" targets,
// and a nil context pass through unchanged. Otherwise the relative target
// resolves against the current page's containing directory and maps to the
// clean locale URL, preserving any heading fragment.
func ResolveContentHref(href string, context *LinkContext) string {
	if context == nil || absoluteHref.MatchString(href) {
		return href
	}
	pathPart, hash := splitHash(href)
	if !strings.HasSuffix(pathPart, ".md") {
		return href
	}
	currentDir := path.Dir("/" + context.Slug)
	if context.IsSection {
		currentDir = "/" + context.Slug
	}
	resolved := path.Join(currentDir, pathPart)
	slug := strings.TrimPrefix(resolved, "/")
	slug = strings.TrimSuffix(slug, ".md")
	if slug == "_index" {
		slug = ""
	} else {
		slug = strings.TrimSuffix(slug, "/_index")
	}
	url := ContentURL(context.Locale, slug)
	if hash != "" {
		return url + hash
	}
	return url
}

// splitHash separates one href into its path and its heading fragment.
func splitHash(href string) (pathPart, hash string) {
	if index := strings.IndexByte(href, '#'); index >= 0 {
		return href[:index], href[index:]
	}
	return href, ""
}

// ContentURL maps an on-disk content slug to its public URL: the empty or
// "_index" slug is the locale home, anything else joins under the locale. An
// optional path identifier appends the preserved path context.
func ContentURL(locale, slug string, pathID ...string) string {
	normalized := strings.Trim(strings.TrimSpace(slug), "/")
	base := "/" + locale
	if normalized != "" && normalized != "_index" {
		base += "/" + normalized
	}
	if len(pathID) > 0 && pathID[0] != "" {
		return base + "?path=" + pathID[0]
	}
	return base
}
