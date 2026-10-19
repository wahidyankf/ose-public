// Package selection maps changed files to course slugs and splits a
// selection into stable shards by sorted slug.
package selection

import (
	"sort"
	"strconv"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// Selection modes: a changed-file subset or every opted-in course.
const (
	ModeAffected = "affected"
	ModeFull     = "full"
)

// ToolchainsPrefix is the repo-relative path prefix whose change selects
// every opted-in course.
const ToolchainsPrefix = "apps/ayokoding-cli/toolchains/"

// Selection is one resolved course set: the mode, the selected slugs in
// sorted order, and the changed-but-not-opted-in slugs as inert.
type Selection struct {
	Mode    string
	Courses []string
	Inert   []string
}

// Changed maps repo-relative changed paths onto opted-in course slugs.
// contentPrefix is the repo-relative content root; a changed path selects
// the course named by its next segment. Any path below ToolchainsPrefix
// selects every opted-in course instead.
func Changed(paths []string, contentPrefix string, optedIn []string) Selection {
	known := map[string]bool{}
	for _, slug := range optedIn {
		known[slug] = true
	}
	picked := map[string]bool{}
	inert := map[string]bool{}
	full := false
	for _, changed := range paths {
		if strings.HasPrefix(changed, ToolchainsPrefix) {
			full = true
			continue
		}
		slug, ok := courseOf(changed, contentPrefix)
		if !ok {
			continue
		}
		if known[slug] {
			picked[slug] = true
		} else {
			inert[slug] = true
		}
	}
	if full {
		courses := append([]string(nil), optedIn...)
		sort.Strings(courses)
		return Selection{Mode: ModeFull, Courses: courses, Inert: sortedKeys(inert)}
	}
	return Selection{Mode: ModeAffected, Courses: sortedKeys(picked), Inert: sortedKeys(inert)}
}

// All selects every opted-in course.
func All(optedIn []string) Selection {
	courses := append([]string(nil), optedIn...)
	sort.Strings(courses)
	return Selection{Mode: ModeFull, Courses: courses}
}

// Named selects the named courses as a changed-file subset.
func Named(courses []string) Selection {
	return Selection{Mode: ModeAffected, Courses: append([]string(nil), courses...)}
}

// ParseShard parses a "K/N" shard: the 1-based shard K of N total shards.
func ParseShard(text string) (int, int, error) {
	invalid := &finding.Error{Code: finding.UsageInvalidArguments, Message: "shard " + text + " must be K/N"}
	kept, total, ok := strings.Cut(text, "/")
	if !ok || strings.Contains(total, "/") {
		return 0, 0, invalid
	}
	shard, err := strconv.Atoi(kept)
	if err != nil {
		return 0, 0, invalid
	}
	count, err := strconv.Atoi(total)
	if err != nil {
		return 0, 0, invalid
	}
	if err := checkShard(shard, count); err != nil {
		return 0, 0, err
	}
	return shard, count, nil
}

// Shard keeps the slugs of shard K of N total shards over sorted slugs.
func Shard(courses []string, shard, total int) ([]string, error) {
	if err := checkShard(shard, total); err != nil {
		return nil, err
	}
	sorted := append([]string(nil), courses...)
	sort.Strings(sorted)
	var kept []string
	for index, slug := range sorted {
		if index%total == shard-1 {
			kept = append(kept, slug)
		}
	}
	return kept, nil
}

// ApplyShard keeps the shard text names, or every course when text is
// empty.
func ApplyShard(courses []string, text string) ([]string, error) {
	if text == "" {
		return courses, nil
	}
	shard, total, err := ParseShard(text)
	if err != nil {
		return nil, err
	}
	return Shard(courses, shard, total)
}

// checkShard requires a 1-based shard inside its total.
func checkShard(shard, total int) error {
	if total < 1 || shard < 1 || shard > total {
		return &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "shard must name K of N with 1 <= K <= N",
		}
	}
	return nil
}

// courseOf names the course a repo-relative path sits below: the next
// segment under the content root, or the first segment without one.
func courseOf(changed, contentPrefix string) (string, bool) {
	rest := changed
	if contentPrefix != "" {
		prefix := strings.TrimSuffix(contentPrefix, "/") + "/"
		if !strings.HasPrefix(changed, prefix) {
			return "", false
		}
		rest = strings.TrimPrefix(changed, prefix)
	}
	slug, _, _ := strings.Cut(rest, "/")
	if slug == "" || slug == "." || slug == ".." {
		return "", false
	}
	return slug, true
}

// sortedKeys lists a slug set in sorted order.
func sortedKeys(set map[string]bool) []string {
	slugs := make([]string, 0, len(set))
	for slug := range set {
		slugs = append(slugs, slug)
	}
	sort.Strings(slugs)
	return slugs
}
