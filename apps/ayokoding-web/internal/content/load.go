package content

import (
	"errors"
	"fmt"
	"io/fs"
	"path"
	"sort"
	"strconv"
	"strings"
)

// Corpus track names inside a course. Course overviews live at the course
// root ("course"); legacy pages live outside courses ("legacy").
const (
	KindLearning = "learning"
	KindDrilling = "drilling"
	KindCourse   = "course"
	KindLegacy   = "legacy"
)

// LoadFS reads the real ayokoding-www corpus rooted at fsys and returns the
// file-backed catalog. It walks <locale>/learn/courses/<course>/
// ({learning,drilling}/<slug>.md plus the course overview.md) and
// <locale>/learn/legacy/**/*.md. Kind overviews map to the track slug
// ("learning", "drilling"); nested lessons keep their relative slug
// ("capstone/overview"); legacy pages join the rest path ("a/b/c").
//
// The caller chooses the root: the server passes os.DirFS of the configured
// content directory, and unit tests pass an in-memory tree. LoadFS reads only
// through fsys.
//
// A slug shared by learning/ and drilling/ inside one course fails the whole
// load with an error: publishing both would make one route ambiguous. Section
// metadata (_index.md), rants, root pages, and the learn hub have no serving
// routes and are skipped with a diagnostic; invalid frontmatter, unreadable
// sources, and missing titles are excluded per source with a diagnostic.
// Locales without a learn/ tree (the legacy Indonesian layout) contribute no
// pages. Unreadable subtrees contribute nothing; the learn-wide sweep reports
// every markdown source it can see but no route serves.
func LoadFS(fsys fs.FS) (*FakeStore, error) {
	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return nil, fmt.Errorf("content: read content root: %w", err)
	}
	var locales []string
	for _, entry := range entries {
		if entry.IsDir() {
			locales = append(locales, entry.Name())
		}
	}
	sort.Strings(locales)
	store := NewFakeStore(nil)
	for _, locale := range locales {
		if err := loadLocale(store, fsys, locale); err != nil {
			return nil, err
		}
	}
	return store, nil
}

// loadLocale loads one locale tree or records why it contributes no pages.
func loadLocale(store *FakeStore, fsys fs.FS, locale string) error {
	outside := skipOutsideLearn(fsys, locale)
	if info, err := fs.Stat(fsys, path.Join(locale, "learn")); err != nil || !info.IsDir() {
		store.Report(fmt.Sprintf("content: locale %q has no learn/ tree", locale))
		if outside != "" {
			store.Report(outside)
		}
		return nil
	}
	if outside != "" {
		store.Report(outside)
	}
	learnDir := path.Join(locale, "learn")
	if courseEntries, err := fs.ReadDir(fsys, path.Join(learnDir, "courses")); err == nil {
		for _, entry := range courseEntries {
			if !entry.IsDir() {
				continue
			}
			if err := loadCourse(store, fsys, learnDir, locale, entry.Name()); err != nil {
				return err
			}
		}
	} else if !errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("content: read courses: %w", err)
	}
	loadLegacy(store, fsys, learnDir, locale)
	sweepLearn(store, fsys, learnDir, locale)
	return nil
}

// loadCourse maps one courses/<course>/ tree into pages. Lessons come from
// learning/ and drilling/; course-root markdown (overview.md) maps to its
// basename with Kind "course". Files under other subdirectories have no
// serving route and stay for the learn-wide sweep to report.
func loadCourse(store *FakeStore, fsys fs.FS, learnDir, locale, course string) error {
	courseDir := path.Join(learnDir, "courses", course)
	seen := map[string]string{}
	for _, full := range listMarkdownFiles(fsys, courseDir) {
		rel := strings.TrimPrefix(full, courseDir+"/")
		display := "courses/" + course + "/" + rel
		if path.Base(rel) == "_index.md" {
			continue
		}
		var kind, slug string
		switch {
		case !strings.Contains(rel, "/"):
			kind, slug = KindCourse, strings.TrimSuffix(rel, ".md")
		case strings.HasPrefix(rel, KindLearning+"/"):
			kind, slug = KindLearning, kindSlug(KindLearning, strings.TrimPrefix(rel, KindLearning+"/"))
		case strings.HasPrefix(rel, KindDrilling+"/"):
			kind, slug = KindDrilling, kindSlug(KindDrilling, strings.TrimPrefix(rel, KindDrilling+"/"))
		default:
			continue
		}
		if other, exists := seen[slug]; exists && other != kind {
			return fmt.Errorf("content: slug collision in course %q: %q from learning/ and drilling/ (failing closed)", course, slug)
		}
		seen[slug] = kind
		store.loadPage(fsys, locale, course, kind, slug, full, display)
	}
	return nil
}

// kindSlug maps a kind-relative markdown path to its lesson slug. The track
// overview lands on the track slug so every course keeps routable,
// collision-free entry points; deeper files keep their relative slug.
func kindSlug(kind, rel string) string {
	slug := strings.TrimSuffix(rel, ".md")
	if slug == "overview" {
		return kind
	}
	return slug
}

// loadLegacy maps learn/legacy/**/*.md into Course "legacy" pages whose slug
// joins the rest path; _index.md files stay section metadata for the sweep.
func loadLegacy(store *FakeStore, fsys fs.FS, learnDir, locale string) {
	legacyDir := path.Join(learnDir, "legacy")
	for _, full := range listMarkdownFiles(fsys, legacyDir) {
		rel := strings.TrimPrefix(full, legacyDir+"/")
		if path.Base(rel) == "_index.md" {
			continue
		}
		slug := strings.TrimSuffix(rel, ".md")
		display := "legacy/" + rel
		store.loadPage(fsys, locale, KindLegacy, KindLegacy, slug, full, display)
	}
}

// sweepLearn reports every learn/ markdown source that produced no page:
// section metadata stays out of the catalog, and anything else has no
// serving route.
func sweepLearn(store *FakeStore, fsys fs.FS, learnDir, locale string) {
	var sectionMeta int
	for _, full := range listMarkdownFiles(fsys, learnDir) {
		rel := strings.TrimPrefix(full, learnDir+"/")
		if store.consumed[rel] {
			continue
		}
		if path.Base(rel) == "_index.md" {
			sectionMeta++
			continue
		}
		store.Report(fmt.Sprintf("content: skipped %q (no routes serve it)", locale+"/learn/"+rel))
	}
	if sectionMeta > 0 {
		store.Report(fmt.Sprintf("content: skipped %d section-metadata (_index.md) files under %q (no routes serve them)", sectionMeta, locale+"/learn"))
	}
}

// listMarkdownFiles returns every markdown source under root as sorted full
// fs paths. Unreadable subtrees contribute nothing; callers surface gaps.
func listMarkdownFiles(fsys fs.FS, root string) []string {
	var out []string
	stack := []string{root}
	for len(stack) > 0 {
		dir := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		entries, _ := fs.ReadDir(fsys, dir)
		for _, entry := range entries {
			full := path.Join(dir, entry.Name())
			if entry.IsDir() {
				stack = append(stack, full)
			} else if strings.HasSuffix(entry.Name(), ".md") {
				out = append(out, full)
			}
		}
	}
	sort.Strings(out)
	return out
}

// loadPage parses one markdown source into a published page and marks it
// consumed for the learn-wide sweep. Unreadable sources, invalid frontmatter,
// and missing titles are excluded with a diagnostic.
func (s *FakeStore) loadPage(fsys fs.FS, locale, course, kind, slug, full, display string) {
	s.consumed[display] = true
	raw, err := fs.ReadFile(fsys, full)
	if err != nil {
		s.Report(fmt.Sprintf("content: excluded %q: unreadable source", display))
		return
	}
	front, body := SplitFrontmatter(string(raw))
	meta, err := ParseFrontmatter(front)
	if err != nil {
		s.Report(fmt.Sprintf("content: excluded %q: invalid frontmatter", display))
		return
	}
	title := frontString(meta["title"])
	if title == "" {
		s.Report(fmt.Sprintf("content: excluded %q: missing title", display))
		return
	}
	// The render context is the locale-relative source path, so relative links resolve from the file's own directory.
	diskSlug := strings.TrimSuffix(strings.TrimPrefix(full, locale+"/"), ".md")
	rendered := RenderPage(body, RenderContext{Locale: locale, Slug: diskSlug})
	s.pages = append(s.pages, Page{
		Locale:      locale,
		Course:      course,
		Slug:        slug,
		Kind:        kind,
		Title:       title,
		Description: frontString(meta["description"]),
		BodyHTML:    rendered.HTML,
		TOC:         rendered.TOC,
		Draft:       frontBool(meta["draft"]),
		Weight:      frontInt(meta["weight"]),
	})
}

// skipOutsideLearn summarizes markdown sources outside a locale's learn/
// tree (rants, about pages, or a legacy non-learn layout): none have routes.
// It returns "" when there is nothing to skip.
func skipOutsideLearn(fsys fs.FS, locale string) string {
	count := 0
	seen := map[string]bool{}
	var names []string
	for _, full := range listMarkdownFiles(fsys, locale) {
		rel := strings.TrimPrefix(full, locale+"/")
		if rel == "learn" || strings.HasPrefix(rel, "learn/") {
			continue
		}
		count++
		top := strings.Split(rel, "/")[0]
		if info, err := fs.Stat(fsys, path.Join(locale, top)); err == nil && info.IsDir() {
			top += "/"
		}
		if !seen[top] {
			seen[top] = true
			names = append(names, top)
		}
	}
	if count == 0 {
		return ""
	}
	sort.Strings(names)
	noun := "sources"
	if count == 1 {
		noun = "source"
	}
	return fmt.Sprintf("content: skipped %d markdown %s outside %q under %s (no routes serve them)", count, noun, locale+"/learn", strings.Join(names, ", "))
}

// frontString coerces optional frontmatter text.
func frontString(value any) string {
	text, _ := value.(string)
	return strings.TrimSpace(text)
}

// frontInt coerces optional frontmatter weights and hour estimates.
func frontInt(value any) int {
	switch number := value.(type) {
	case int:
		return number
	case string:
		if parsed, err := strconv.Atoi(strings.TrimSpace(number)); err == nil {
			return parsed
		}
	}
	return 0
}

// frontBool coerces the optional draft flag.
func frontBool(value any) bool {
	flag, _ := value.(bool)
	return flag
}
