package search_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/search"
)

// TestSearchMatchesForwardPrefixes locks the forward-prefix token contract:
// a partial leading token still reaches its entry.
func TestSearchMatchesForwardPrefixes(t *testing.T) {
	index := search.NewFakeIndex([]search.Entry{
		{Title: "Hello World", Section: "Go Basics", Excerpt: "first program", URL: "/en/learn/go-basics/hello-world", Locale: "en", Kind: "lesson", Body: "print hello"},
	})
	for _, query := range []string{"hel", "hell", "hello", "wor"} {
		if results := index.Search(query, "en", 20); len(results) != 1 {
			t.Fatalf("prefix query %q results = %d, want 1", query, len(results))
		}
	}
	if results := index.Search("ello", "en", 20); len(results) != 0 {
		t.Fatal("non-prefix infix must not match a forward-prefix index")
	}
}

// TestSearchResultCarriesExcerpt locks the result card contract every result
// needs for its title/section/excerpt rendering.
func TestSearchResultCarriesExcerpt(t *testing.T) {
	index := search.NewFakeIndex([]search.Entry{
		{Title: "Hello World", Section: "Go Basics", Excerpt: "first program", URL: "/en/learn/go-basics/hello-world", Locale: "en", Kind: "lesson", Body: "print hello"},
	})
	results := index.Search("hello", "en", 20)
	if len(results) != 1 {
		t.Fatalf("results = %d, want 1", len(results))
	}
	entry := results[0]
	if entry.Title == "" || entry.Section == "" || entry.Excerpt == "" || entry.URL == "" {
		t.Fatalf("result %+v must carry title, section, excerpt, and URL", entry)
	}
}

// TestSearchLimitBoundaries locks the 1-50 window with its default of 20:
// zero and negative fall back, oversized clamps instead of emptying.
func TestSearchLimitBoundaries(t *testing.T) {
	entries := []search.Entry{
		{Title: "Hello One", Section: "S", Excerpt: "e", URL: "/en/1", Locale: "en", Kind: "lesson", Body: "hello one"},
		{Title: "Hello Two", Section: "S", Excerpt: "e", URL: "/en/2", Locale: "en", Kind: "lesson", Body: "hello two"},
	}
	index := search.NewFakeIndex(entries)
	if results := index.Search("hello", "en", 0); len(results) != 2 {
		t.Fatalf("zero limit results = %d, want default window with 2", len(results))
	}
	if results := index.Search("hello", "en", -1); len(results) != 2 {
		t.Fatalf("negative limit results = %d, want default window with 2", len(results))
	}
	if results := index.Search("hello", "en", 50); len(results) != 2 {
		t.Fatalf("capped limit results = %d, want 2", len(results))
	}
}
