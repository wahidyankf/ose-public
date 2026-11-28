package parity

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"testing"
)

// scriptedFetch answers from a table and records each URL it was asked for, so
// a test can prove each URL was requested once and no redirect target was.
type scriptedFetch struct {
	replies map[string]Reply
	asked   []string
}

func (f *scriptedFetch) fetch(url string) (Reply, error) {
	f.asked = append(f.asked, url)
	reply, ok := f.replies[url]
	if !ok {
		return Reply{}, fmt.Errorf("no reply scripted for %s", url)
	}
	return reply, nil
}

func TestGapReportClassifiesEachStatusAndFollowsNoRedirect(t *testing.T) {
	inv := Inventory{URLs: []string{"/en", "/en/moved", "/en/does-not-exist"}}
	fake := &scriptedFetch{replies: map[string]Reply{
		"http://127.0.0.1:3102/en":                {Status: 200},
		"http://127.0.0.1:3102/en/moved":          {Status: 308, Location: "/en"},
		"http://127.0.0.1:3102/en/does-not-exist": {Status: 404},
	}}
	results, err := GapReport(inv, "http://127.0.0.1:3102", fake.fetch)
	if err != nil {
		t.Fatalf("GapReport: %v", err)
	}
	want := []Result{
		{URL: "/en", Status: 200, Class: "pass"},
		{URL: "/en/moved", Status: 308, Location: "/en", Class: "redirect"},
		{URL: "/en/does-not-exist", Status: 404, Class: "fail", Cause: "no tree route", Unit: "P4-Tree"},
	}
	if !slices.Equal(results, want) {
		t.Fatalf("results = %#v, want %#v", results, want)
	}
	wantAsked := []string{
		"http://127.0.0.1:3102/en",
		"http://127.0.0.1:3102/en/moved",
		"http://127.0.0.1:3102/en/does-not-exist",
	}
	if !slices.Equal(fake.asked, wantAsked) {
		t.Fatalf("requests = %q, want each URL once and no redirect target", fake.asked)
	}
}

func TestGapReportGroupsEachFailingURLByItsCause(t *testing.T) {
	redirects := []Redirect{{Source: "/en/old-redirect", Status: 308, Location: "/en"}}
	tests := []struct {
		name  string
		url   string
		cause string
		unit  string
	}{
		{name: "a nested lesson", url: "/en/learn/courses/just-enough-python/learning/beginner", cause: "nested lesson", unit: "P4-Tree"},
		{name: "a section with no tree route", url: "/en/section", cause: "no tree route", unit: "P4-Tree"},
		{name: "an Indonesian tree page", url: "/id/belajar/manusia", cause: "Indonesian tree", unit: "P4-Tree"},
		{name: "a missing browse index", url: "/en/browse", cause: "missing browse or tools index", unit: "P5-Surfaces"},
		{name: "a missing tools index", url: "/id/tools", cause: "missing browse or tools index", unit: "P5-Surfaces"},
		{name: "a search page", url: "/en/search", cause: "search", unit: "P4-Search"},
		{name: "a discovery document", url: "/robots.txt", cause: "discovery document", unit: "P5-Discovery"},
		{name: "a redirect source that does not answer 308", url: "/en/old-redirect", cause: "redirect gap", unit: "P4-Redirects"},
		{name: "a path outside both locales", url: "/unknown", cause: "other", unit: "owner triage"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inv := Inventory{URLs: []string{tt.url}, Redirects: redirects}
			fake := &scriptedFetch{replies: map[string]Reply{
				"http://127.0.0.1:3102" + tt.url: {Status: 404},
			}}
			results, err := GapReport(inv, "http://127.0.0.1:3102", fake.fetch)
			if err != nil {
				t.Fatalf("GapReport: %v", err)
			}
			if len(results) != 1 {
				t.Fatalf("results = %d, want 1", len(results))
			}
			got := results[0]
			if got.Class != "fail" || got.Cause != tt.cause || got.Unit != tt.unit {
				t.Fatalf("class=%q cause=%q unit=%q, want fail %q %q", got.Class, got.Cause, got.Unit, tt.cause, tt.unit)
			}
		})
	}
}

func TestGapReportFailsAnUnreachableURLWithStatusZero(t *testing.T) {
	inv := Inventory{URLs: []string{"/en"}}
	fetch := func(string) (Reply, error) { return Reply{}, errors.New("connection refused") }
	results, err := GapReport(inv, "http://127.0.0.1:1", fetch)
	if err != nil {
		t.Fatalf("GapReport: %v", err)
	}
	want := []Result{{URL: "/en", Status: 0, Class: "fail", Cause: "other", Unit: "owner triage"}}
	if !slices.Equal(results, want) {
		t.Fatalf("results = %#v, want %#v", results, want)
	}
}

func TestGapReportRefusesAMalformedBaseURLBeforeAnyRequest(t *testing.T) {
	fake := &scriptedFetch{}
	if _, err := GapReport(Inventory{URLs: []string{"/en"}}, "http://[::1", fake.fetch); err == nil {
		t.Fatal("GapReport accepted a malformed base URL, want an error")
	}
	if len(fake.asked) != 0 {
		t.Fatalf("requests = %q, want none after a refused base URL", fake.asked)
	}
}

func TestRenderGapReportCountsEachClassAndNamesEachCauseUnit(t *testing.T) {
	results := []Result{
		{URL: "/en", Status: 200, Class: "pass"},
		{URL: "/en/moved", Status: 308, Location: "/en", Class: "redirect"},
		{URL: "/en/section", Status: 404, Class: "fail", Cause: "no tree route", Unit: "P4-Tree"},
	}
	got := RenderGapReport(results)
	for _, want := range []string{
		"pass: 1",
		"redirect: 1",
		"fail: 1",
		"no tree route",
		"P4-Tree",
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("report lacks %q:\n%s", want, got)
		}
	}
}
