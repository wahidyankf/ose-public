package parity

import (
	"fmt"
	"net/url"
	"slices"
	"strings"
)

// Result is the outcome of one inventory URL: its status, its class, and, for
// a failing URL, the cause group and the unit that closes it.
type Result struct {
	URL      string
	Status   int
	Location string
	Class    string
	Cause    string
	Unit     string
}

// GapReport requests every inventory URL once, with no retries, and classifies
// each response by status only: 200 passes, 308 is recorded as a redirect and
// not followed, and anything else fails. A request that cannot be made fails
// with status 0.
func GapReport(inv Inventory, baseURL string, fetch func(url string) (Reply, error)) ([]Result, error) {
	if _, err := url.Parse(baseURL); err != nil {
		return nil, fmt.Errorf("base URL %q: %w", baseURL, err)
	}
	redirectSources := map[string]bool{}
	for _, redirect := range inv.Redirects {
		redirectSources[redirect.Source] = true
	}
	results := make([]Result, 0, len(inv.URLs))
	for _, page := range inv.URLs {
		reply, err := fetch(baseURL + page)
		if err != nil {
			cause, unit := "other", "owner triage"
			results = append(results, Result{URL: page, Class: "fail", Cause: cause, Unit: unit})
			continue
		}
		results = append(results, classify(page, reply, redirectSources))
	}
	return results, nil
}

func classify(page string, reply Reply, redirectSources map[string]bool) Result {
	result := Result{URL: page, Status: reply.Status, Location: reply.Location}
	switch reply.Status {
	case 200:
		result.Class = "pass"
	case 308:
		result.Class = "redirect"
	default:
		result.Class = "fail"
		result.Cause, result.Unit = causeOf(page, redirectSources)
	}
	return result
}

// causeOf names the group a failing URL belongs to, and the unit that closes
// it. The rules run in order, and the first match wins.
func causeOf(page string, redirectSources map[string]bool) (string, string) {
	if redirectSources[page] {
		return "redirect gap", "P4-Redirects"
	}
	segments := strings.Split(strings.Trim(page, "/"), "/")
	switch segments[0] {
	case "robots.txt", "sitemap.xml", "feed.xml":
		return "discovery document", "P5-Discovery"
	case "en", "id":
	default:
		return "other", "owner triage"
	}
	second := ""
	if len(segments) > 1 {
		second = segments[1]
	}
	switch {
	case second == "search":
		return "search", "P4-Search"
	case second == "browse" || second == "tools":
		return "missing browse or tools index", "P5-Surfaces"
	case segments[0] == "id":
		return "Indonesian tree", "P4-Tree"
	case len(segments) > 4:
		return "nested lesson", "P4-Tree"
	default:
		return "no tree route", "P4-Tree"
	}
}

// RenderGapReport writes the markdown report: the class counts, one row per URL,
// and one row per cause group. A URL row is `| url | status | class | cause | unit |`.
func RenderGapReport(results []Result) string {
	type causeGroup struct {
		unit  string
		count int
	}
	counts := map[string]int{}
	groups := map[string]causeGroup{}
	for _, result := range results {
		counts[result.Class]++
		if result.Class == "fail" {
			group := groups[result.Cause]
			group.unit = result.Unit
			group.count++
			groups[result.Cause] = group
		}
	}
	var report strings.Builder
	report.WriteString("# Gap report\n\n")
	_, _ = fmt.Fprintf(&report, "pass: %d\nredirect: %d\nfail: %d\n\n", counts["pass"], counts["redirect"], counts["fail"])
	report.WriteString("| url | status | class | cause | unit |\n")
	report.WriteString("| --- | --- | --- | --- | --- |\n")
	for _, result := range results {
		_, _ = fmt.Fprintf(&report, "| %s | %d | %s | %s | %s |\n", result.URL, result.Status, result.Class, result.Cause, result.Unit)
	}
	report.WriteString("\n| cause | count | unit |\n| --- | --- | --- |\n")
	causes := make([]string, 0, len(groups))
	for cause := range groups {
		causes = append(causes, cause)
	}
	slices.Sort(causes)
	for _, cause := range causes {
		_, _ = fmt.Fprintf(&report, "| %s | %d | %s |\n", cause, groups[cause].count, groups[cause].unit)
	}
	return report.String()
}
