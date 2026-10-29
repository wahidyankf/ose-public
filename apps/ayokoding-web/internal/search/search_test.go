package search_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/search"
)

func fixtureIndex() *search.FakeIndex {
	return search.NewFakeIndex([]search.Entry{
		{Title: "Hello World", Section: "Go Basics", Excerpt: "first program", URL: "/en/learn/go-basics/hello-world", Locale: "en", Kind: "lesson", Body: "print hello"},
		{Title: "Halo Dunia", Section: "Go Basics", Excerpt: "program pertama", URL: "/id/learn/go-basics/hello-world", Locale: "id", Kind: "lesson", Body: "cetak halo"},
		{Title: "AI Benchmark", Section: "Tools", Excerpt: "compare models", URL: "/en/tools/ai-benchmark", Locale: "en", Kind: "tool", Body: "benchmark models compare"},
	})
}

func TestSearchStaysInLocale(t *testing.T) {
	results := fixtureIndex().Search("hello", "en", 20)
	if len(results) == 0 {
		t.Fatal("expected at least one English result")
	}
	for _, entry := range results {
		if entry.Locale != "en" {
			t.Fatalf("result locale = %q, want en only", entry.Locale)
		}
		if entry.Title == "" || entry.Excerpt == "" {
			t.Fatalf("result %+v must show title and excerpt", entry)
		}
	}
}

func TestEmptyQueryClearsResults(t *testing.T) {
	if results := fixtureIndex().Search("   ", "en", 20); len(results) != 0 {
		t.Fatalf("whitespace query must clear results, got %d", len(results))
	}
}

func TestSearchFindsTools(t *testing.T) {
	results := fixtureIndex().Search("benchmark", "en", 20)
	found := false
	for _, entry := range results {
		if entry.Kind == "tool" {
			found = true
		}
	}
	if !found {
		t.Fatal("tool page must appear for its name query")
	}
}

func TestSearchRespectsLimit(t *testing.T) {
	if results := fixtureIndex().Search("hello", "en", 1); len(results) != 1 {
		t.Fatalf("limited results = %d, want 1", len(results))
	}
}

func TestSearchDefaultsAndClampsLimit(t *testing.T) {
	if results := fixtureIndex().Search("hello", "en", 0); len(results) == 0 {
		t.Fatal("zero limit must fall back to the default")
	}
	if results := fixtureIndex().Search("hello", "en", 5000); len(results) == 0 {
		t.Fatal("oversized limit must clamp instead of emptying")
	}
}

func TestSearchMatchesBodyOnlyTerms(t *testing.T) {
	results := fixtureIndex().Search("compare", "en", 20)
	if len(results) != 1 || results[0].Kind != "tool" {
		t.Fatalf("body-only match = %+v, want the benchmark tool", results)
	}
}

func TestSearchRequiresEveryTerm(t *testing.T) {
	if results := fixtureIndex().Search("hello compare", "en", 20); len(results) != 0 {
		t.Fatalf("split-term query must match nothing, got %+v", results)
	}
}

func TestSearchMergesTitleBeforeBody(t *testing.T) {
	results := fixtureIndex().Search("hello print", "en", 20)
	if len(results) == 0 || results[0].Kind != "lesson" {
		t.Fatalf("title match must merge first, got %+v", results)
	}
}

func TestSearchDeduplicatesByURL(t *testing.T) {
	index := search.NewFakeIndex([]search.Entry{
		{Title: "Hello World", Section: "Go Basics", Excerpt: "first", URL: "/en/a", Locale: "en", Kind: "lesson", Body: "hello"},
		{Title: "Hello World Copy", Section: "Go Basics", Excerpt: "second", URL: "/en/a", Locale: "en", Kind: "lesson", Body: "hello again"},
	})
	if results := index.Search("hello", "en", 20); len(results) != 1 {
		t.Fatalf("duplicate URLs must merge, got %+v", results)
	}
}

func TestSearchTruncatesToLimit(t *testing.T) {
	index := search.NewFakeIndex([]search.Entry{
		{Title: "Hello One", Section: "S", Excerpt: "e", URL: "/en/1", Locale: "en", Kind: "lesson", Body: "hello one"},
		{Title: "Hello Two", Section: "S", Excerpt: "e", URL: "/en/2", Locale: "en", Kind: "lesson", Body: "hello two"},
		{Title: "Hello Three", Section: "S", Excerpt: "e", URL: "/en/3", Locale: "en", Kind: "lesson", Body: "hello three"},
	})
	if results := index.Search("hello", "en", 2); len(results) != 2 {
		t.Fatalf("truncated results = %d, want 2", len(results))
	}
}

func TestSearchNegativeLimitFallsBack(t *testing.T) {
	if results := fixtureIndex().Search("hello", "en", -5); len(results) == 0 {
		t.Fatal("negative limit must fall back to the default")
	}
}

func TestSearchPunctuationOnlyClears(t *testing.T) {
	if results := fixtureIndex().Search("...", "en", 20); len(results) != 0 {
		t.Fatalf("punctuation-only query must clear, got %+v", results)
	}
}
