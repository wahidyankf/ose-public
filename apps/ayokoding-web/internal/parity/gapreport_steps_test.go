package parity

import (
	"errors"
	"testing"
)

func TestRedirectSourceSetNamesEachDeclaredSource(t *testing.T) {
	sources := redirectSourceSet([]Redirect{{Source: "/en/old"}, {Source: "/id/lama"}})
	if len(sources) != 2 || !sources["/en/old"] || !sources["/id/lama"] {
		t.Fatalf("sources = %v, want both declared sources", sources)
	}
	if empty := redirectSourceSet(nil); len(empty) != 0 {
		t.Fatalf("empty table gave %v, want no sources", empty)
	}
}

func TestProbePageRequestsTheURLOnceAndClassifiesTheReply(t *testing.T) {
	var requested []string
	fetch := func(url string) (Reply, error) {
		requested = append(requested, url)
		return Reply{Status: 308, Location: "/en"}, nil
	}
	got := probePage("/moved", "http://base", fetch, map[string]bool{})
	if len(requested) != 1 || requested[0] != "http://base/moved" {
		t.Fatalf("requested %q, want one request for http://base/moved", requested)
	}
	want := Result{URL: "/moved", Status: 308, Location: "/en", Class: "redirect"}
	if got != want {
		t.Fatalf("probePage = %+v, want %+v", got, want)
	}
}

func TestProbePageFailsAnUnreachablePageWithoutAStatus(t *testing.T) {
	fetch := func(string) (Reply, error) { return Reply{}, errors.New("connection refused") }
	got := probePage("/en/x", "http://base", fetch, map[string]bool{})
	want := Result{URL: "/en/x", Class: "fail", Cause: "other", Unit: "owner triage"}
	if got != want {
		t.Fatalf("probePage for an unreachable page = %+v, want %+v", got, want)
	}
}

func TestUnreachableIsAFailWithOwnerTriage(t *testing.T) {
	want := Result{URL: "/en/x", Class: "fail", Cause: "other", Unit: "owner triage"}
	if got := unreachable("/en/x"); got != want {
		t.Fatalf("unreachable = %+v, want %+v", got, want)
	}
}

func TestClassifyGroupsAFailingPageByItsCause(t *testing.T) {
	got := classify("/en/does-not-exist", Reply{Status: 404}, map[string]bool{})
	if got.Class != "fail" || got.Cause != "no tree route" || got.Unit != "P4-Tree" {
		t.Fatalf("classify 404 = %+v, want a fail in the no tree route cause", got)
	}
	gap := classify("/en/moved-away", Reply{Status: 404}, map[string]bool{"/en/moved-away": true})
	if gap.Cause != "redirect gap" || gap.Unit != "P4-Redirects" {
		t.Fatalf("classify a redirect source = %+v, want the redirect gap cause", gap)
	}
}

func TestClassifyLeavesPassingAndRedirectPagesWithoutACause(t *testing.T) {
	for _, status := range []int{200, 308} {
		got := classify("/en", Reply{Status: status}, map[string]bool{})
		if got.Cause != "" || got.Unit != "" {
			t.Fatalf("status %d carries cause %q and unit %q, want neither", status, got.Cause, got.Unit)
		}
	}
}

func TestClassOfMapsEachStatusToItsClass(t *testing.T) {
	tests := []struct {
		status int
		want   string
	}{
		{status: 200, want: "pass"},
		{status: 308, want: "redirect"},
		{status: 301, want: "fail"},
		{status: 404, want: "fail"},
		{status: 500, want: "fail"},
		{status: 0, want: "fail"},
	}
	for _, tt := range tests {
		if got := classOf(tt.status); got != tt.want {
			t.Fatalf("classOf(%d) = %q, want %q", tt.status, got, tt.want)
		}
	}
}
