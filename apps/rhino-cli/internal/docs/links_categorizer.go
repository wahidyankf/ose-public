package docs

import "strings"

// CategorizeBrokenLink categorizes a broken link by pattern.
func CategorizeBrokenLink(link string) string {
	// Check patterns in order (most specific first)

	// Old ex-ru-* prefixes
	if strings.Contains(link, "ex-ru-") || strings.Contains(link, "ex__ru__") {
		return "Old ex-ru-* prefixes"
	}

	// workflows/ paths (but not governance/workflows/)
	if strings.Contains(link, "workflows/") && !strings.Contains(link, "governance/workflows/") {
		return "workflows/ paths"
	}

	// vision/ paths (but not governance/vision/)
	if strings.Contains(link, "vision/") && !strings.Contains(link, "governance/vision/") {
		return "vision/ paths"
	}

	// conventions README
	if strings.Contains(link, "conventions/README.md") {
		return "conventions README"
	}

	// Missing files
	if link == "CODE_OF_CONDUCT.md" || link == "CHANGELOG.md" {
		return "Missing files"
	}

	// Default category
	return "General/other paths"
}
