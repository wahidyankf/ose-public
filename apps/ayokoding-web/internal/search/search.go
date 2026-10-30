package search

import (
	"sort"
	"strings"
)

// resultLimit bounds one search response.
const resultLimit = 50

// Entry is one searchable unit: a lesson or a static tool page.
type Entry struct {
	Title   string
	Section string
	Excerpt string
	URL     string
	Locale  string
	Kind    string
	Body    string
}

// FakeIndex is the P1H in-memory search double. P2 replaces prefix matching
// with the ported FlexSearch-parity vectors; the method set stays.
type FakeIndex struct {
	entries []Entry
}

// NewFakeIndex seeds the in-memory double.
func NewFakeIndex(entries []Entry) *FakeIndex {
	return &FakeIndex{entries: entries}
}

// Search returns locale-scoped forward-prefix matches, titles before bodies,
// de-duplicated, capped to limit (default 20, hard cap 50).
func (x *FakeIndex) Search(query, locale string, limit int) []Entry {
	if limit <= 0 {
		limit = 20
	}
	if limit > resultLimit {
		limit = resultLimit
	}
	terms := tokenize(query)
	if len(terms) == 0 {
		return nil
	}
	var titles, bodies []Entry
	seen := map[string]bool{}
	for _, entry := range x.entries {
		if entry.Locale != locale {
			continue
		}
		if seen[entry.URL] {
			continue
		}
		switch matchEntry(entry, terms) {
		case matchTitle:
			seen[entry.URL] = true
			titles = append(titles, entry)
		case matchBody:
			seen[entry.URL] = true
			bodies = append(bodies, entry)
		case matchNone:
		}
	}
	merged := append(titles, bodies...)
	if len(merged) > limit {
		merged = merged[:limit]
	}
	return merged
}

type matchKind int

const (
	matchNone matchKind = iota
	matchTitle
	matchBody
)

// matchEntry reports a forward-prefix token hit, preferring titles.
func matchEntry(entry Entry, terms []string) matchKind {
	titleTokens := tokenize(entry.Title)
	bodyTokens := tokenize(entry.Body + " " + entry.Section)
	for _, term := range terms {
		titleHit := false
		for _, token := range titleTokens {
			if strings.HasPrefix(token, term) {
				titleHit = true
				break
			}
		}
		if titleHit {
			continue
		}
		bodyHit := false
		for _, token := range bodyTokens {
			if strings.HasPrefix(token, term) {
				bodyHit = true
				break
			}
		}
		if !bodyHit {
			return matchNone
		}
	}
	for _, term := range terms {
		for _, token := range titleTokens {
			if strings.HasPrefix(token, term) {
				return matchTitle
			}
		}
	}
	return matchBody
}

// tokenize lowercases words for prefix comparison.
func tokenize(text string) []string {
	var tokens []string
	for _, token := range strings.Fields(strings.ToLower(text)) {
		trimmed := strings.Trim(token, ".,;:!?()[]{}\"'")
		if trimmed != "" {
			tokens = append(tokens, trimmed)
		}
	}
	sort.Strings(tokens)
	return tokens
}
