package content

import (
	"fmt"
	"sort"
	"strings"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"gopkg.in/yaml.v3"
)

// Page is one published content unit. P2 fills weight/title ordering,
// section behavior, and outline rules behind these fields. Kind records the
// source track inside a course ("learning", "drilling", "course" for the
// course overview, "legacy" for legacy pages); fixture pages leave it empty.
type Page struct {
	Locale       string
	Course       string
	Slug         string
	Kind         string
	Title        string
	Description  string
	BodyHTML     string
	Draft        bool
	Weight       int
	Section      string
	SectionTitle string
}

// FakeStore is the P1H in-memory content double. P2 replaces it with the
// file-backed catalog; the method set stays. The loader tracks consumed
// sources so the learn-wide sweep reports only unserved markdown.
type FakeStore struct {
	pages      []Page
	diagnostic []string
	showDrafts bool
	consumed   map[string]bool
}

// NewFakeStore seeds the in-memory double.
func NewFakeStore(pages []Page) *FakeStore {
	return &FakeStore{pages: pages, consumed: map[string]bool{}}
}

// ShowDrafts enables draft routes for owned test fixtures.
func (s *FakeStore) ShowDrafts(enabled bool) {
	s.showDrafts = enabled
}

// Published lists visible pages for a locale in catalog order.
func (s *FakeStore) Published(locale string) []Page {
	var visible []Page
	for _, page := range s.pages {
		if page.Locale != locale {
			continue
		}
		if page.Draft && !s.showDrafts {
			continue
		}
		visible = append(visible, page)
	}
	sort.SliceStable(visible, func(i, j int) bool {
		if visible[i].Weight != visible[j].Weight {
			return visible[i].Weight < visible[j].Weight
		}
		return visible[i].Title < visible[j].Title
	})
	return visible
}

// Find resolves one lesson; drafts stay hidden unless ShowDrafts is set.
func (s *FakeStore) Find(locale, course, slug string) (Page, bool) {
	for _, page := range s.pages {
		if page.Locale == locale && page.Course == course && page.Slug == slug {
			if page.Draft && !s.showDrafts {
				return Page{}, false
			}
			return page, true
		}
	}
	return Page{}, false
}

// Diagnostics reports skipped-source warnings such as invalid frontmatter.
func (s *FakeStore) Diagnostics() []string {
	return s.diagnostic
}

// Report records one skipped-source warning.
func (s *FakeStore) Report(diagnostic string) {
	s.diagnostic = append(s.diagnostic, diagnostic)
}

// SplitFrontmatter separates leading +++ or --- frontmatter from the body.
// A missing fence yields empty frontmatter and the whole source as body.
// strings.Split always yields at least one line, so no empty guard is needed.
func SplitFrontmatter(source string) (front, body string) {
	lines := strings.Split(source, "\n")
	fence := strings.TrimSpace(lines[0])
	if fence != "+++" && fence != "---" {
		return "", source
	}
	for index := 1; index < len(lines); index++ {
		if strings.TrimSpace(lines[index]) == fence {
			return strings.Join(lines[1:index], "\n"), strings.Join(lines[index+1:], "\n")
		}
	}
	return "", source
}

// ParseFrontmatter decodes YAML frontmatter into metadata.
func ParseFrontmatter(front string) (map[string]any, error) {
	meta := map[string]any{}
	if strings.TrimSpace(front) == "" {
		return meta, nil
	}
	if err := yaml.Unmarshal([]byte(front), &meta); err != nil {
		return nil, fmt.Errorf("content: parse frontmatter: %w", err)
	}
	return meta, nil
}

// RenderMarkdown converts GFM Markdown to HTML. P2 fills shortcodes, TOC,
// and link rules; the base pipeline is real.
func RenderMarkdown(source string) string {
	converter := goldmark.New(goldmark.WithExtensions(extension.GFM))
	var output strings.Builder
	if err := converter.Convert([]byte(source), &output); err != nil {
		return ""
	}
	return output.String()
}

// SanitizeHTML removes executable markup while keeping authored content.
func SanitizeHTML(html string) string {
	return bluemonday.UGCPolicy().Sanitize(html)
}
