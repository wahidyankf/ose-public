package web

import (
	"net/http"
	"strings"
)

// Ordered redirect sources mirror apps/ayokoding-www/src/redirects/*.ts and
// next.config.ts redirects() order: localeEntry, contentNamespace,
// learnReorg, courseRehome, learnHome, learnThreeBucket. Permanent rules use
// 308, temporary (permanent:false) rules use 307. Query strings are preserved
// by the redirect helpers in server.go.

// RehomedCourseSlugs is the single source of truth for the 37 re-homed
// course bundles, matching REHOMED_COURSE_SLUGS in course-rehome.ts.
var RehomedCourseSlugs = []string{
	"advanced-algorithms",
	"advanced-networking",
	"advanced-sql-and-query-performance",
	"agentic-coding",
	"backend-essentials",
	"build-your-own-orm-and-query-builder",
	"capstone-first-working-software",
	"capstone-forge-ready",
	"capstone-full-stack-app",
	"capstone-solid-core",
	"computer-architecture",
	"computer-science-foundations",
	"concurrency-and-parallelism",
	"data-access-orms-and-query-builders",
	"data-structures-and-algorithms-essentials",
	"debugging-and-profiling",
	"engineering-management",
	"extending-neovim",
	"frontend-essentials",
	"functional-programming",
	"just-enough-bash",
	"just-enough-lua",
	"just-enough-nvim",
	"just-enough-python",
	"networking-essentials",
	"object-oriented-design-and-patterns",
	"object-oriented-programming-essentials",
	"programming-paradigms",
	"project-management",
	"security-essentials",
	"software-engineering-practices",
	"software-product-engineering",
	"software-testing",
	"sql-essentials",
	"technical-communication",
	"version-control-and-git",
}

// RetiredFundamentallyStrongRoots maps the three deleted browse roots to the
// course library landing, matching RETIRED_FUNDAMENTALLY_STRONG_ROOTS.
var RetiredFundamentallyStrongRoots = []string{
	"/en/learn/fundamentally-strong",
	"/en/learn/fundamentally-strong/software-engineer",
	"/en/learn/fundamentally-strong/software-engineer/overview",
}

// RelocatedDomains lists the six learn-section domains moved under legacy,
// matching RELOCATED_DOMAINS in learn-three-bucket.ts.
var RelocatedDomains = []string{
	"software-engineering",
	"artificial-intelligence",
	"information-security",
	"personal-development",
	"it-governance",
	"business",
}

// redirectRule is one ordered redirect with Next.js :path* semantics.
type redirectRule struct {
	source      string
	destination string
	permanent   bool
}

// matchRule resolves one source pattern against a concrete path. Patterns
// ending in /:path* match the bare root and any deep sub-path in a single
// hop; exact patterns match only the bare path.
func matchRule(source, destination, path string) (string, bool) {
	const wildcard = "/:path*"
	if strings.HasSuffix(source, wildcard) {
		root := strings.TrimSuffix(source, wildcard)
		destRoot := strings.TrimSuffix(destination, wildcard)
		if path == root {
			return destRoot, true
		}
		if strings.HasPrefix(path, root+"/") {
			return destRoot + path[len(root):], true
		}
		return "", false
	}
	if path == source {
		return destination, true
	}
	return "", false
}

// localeEntryRules returns the finite case-variant entry redirects.
func localeEntryRules() []redirectRule {
	exact := []redirectRule{
		{source: "/", destination: "/en", permanent: true},
		{source: "/EN", destination: "/en", permanent: true},
		{source: "/En", destination: "/en", permanent: true},
		{source: "/eN", destination: "/en", permanent: true},
		{source: "/ID", destination: "/id", permanent: true},
		{source: "/Id", destination: "/id", permanent: true},
		{source: "/iD", destination: "/id", permanent: true},
	}
	wildcards := []redirectRule{
		{source: "/EN/:path*", destination: "/en/:path*", permanent: true},
		{source: "/En/:path*", destination: "/en/:path*", permanent: true},
		{source: "/eN/:path*", destination: "/en/:path*", permanent: true},
		{source: "/ID/:path*", destination: "/id/:path*", permanent: true},
		{source: "/Id/:path*", destination: "/id/:path*", permanent: true},
		{source: "/iD/:path*", destination: "/id/:path*", permanent: true},
	}
	return append(exact, wildcards...)
}

// contentNamespaceRules strips the retired /c/ namespace.
func contentNamespaceRules() []redirectRule {
	return []redirectRule{
		{source: "/en/c/learn/:path*", destination: "/en/learn/:path*", permanent: true},
		{source: "/en/c/rants/:path*", destination: "/en/rants/:path*", permanent: true},
		{source: "/id/c/belajar/:path*", destination: "/id/belajar/:path*", permanent: true},
		{source: "/id/c/celoteh/:path*", destination: "/id/celoteh/:path*", permanent: true},
		{source: "/id/c/konten-video/:path*", destination: "/id/konten-video/:path*", permanent: true},
	}
}

// learnReorgRules preserves the historical within-/en/learn/ renames in file
// order; the three by-example parent pages are temporary (307).
func learnReorgRules() []redirectRule {
	return []redirectRule{
		{source: "/en/learn/software-engineering/software-architecture/by-example", destination: "/en/learn/software-engineering/software-architecture/by-example/overview", permanent: false},
		{source: "/en/learn/software-engineering/system-design/by-example", destination: "/en/learn/software-engineering/system-design/by-example/overview", permanent: false},
		{source: "/en/learn/software-engineering/software-architecture/cases/:path*", destination: "/en/learn/software-engineering/software-architecture/by-example/cases/:path*", permanent: true},
		{source: "/en/learn/software-engineering/system-design/cases/:path*", destination: "/en/learn/software-engineering/system-design/by-example/cases/:path*", permanent: true},
		{source: "/en/learn/software-engineering/infrastructure/concepts/how-to/:path*", destination: "/en/learn/software-engineering/infrastructure/by-example/:path*", permanent: true},
		{source: "/en/learn/software-engineering/infrastructure/concepts/:path*", destination: "/en/learn/software-engineering/infrastructure/by-concept/:path*", permanent: true},
		{source: "/en/learn/information-security/by-example", destination: "/en/learn/information-security/by-example/foundations", permanent: false},
		{source: "/en/learn/information-security/concepts/explanation/:path*", destination: "/en/learn/information-security/by-concept/:path*", permanent: true},
		{source: "/en/learn/information-security/foundations/by-example/:path*", destination: "/en/learn/information-security/by-example/foundations/:path*", permanent: true},
		{source: "/en/learn/information-security/foundations/:path*", destination: "/en/learn/information-security/by-concept/:path*", permanent: true},
		{source: "/en/learn/information-security/concepts/:path*", destination: "/en/learn/information-security/by-concept/:path*", permanent: true},
		{source: "/en/learn/human/:path*", destination: "/en/learn/personal-development/:path*", permanent: true},
		{source: "/en/learn/software-engineering/algorithm-and-data-structures/:path*", destination: "/en/learn/software-engineering/algorithms-and-data-structures/:path*", permanent: true},
		{source: "/en/learn/software-engineering/platform-linux/:path*", destination: "/en/learn/software-engineering/platforms/linux/:path*", permanent: true},
		{source: "/en/learn/software-engineering/platform-web/:path*", destination: "/en/learn/software-engineering/platforms/web/:path*", permanent: true},
		{source: "/en/learn/software-engineering/platform-mobile/:path*", destination: "/en/learn/software-engineering/platforms/mobile/:path*", permanent: true},
	}
}

// courseRehomeRules moves the 37 re-homed courses and the three retired
// browse roots to the course library.
func courseRehomeRules() []redirectRule {
	var rules []redirectRule
	for _, slug := range RehomedCourseSlugs {
		rules = append(rules, redirectRule{
			source:      "/en/learn/fundamentally-strong/software-engineer/" + slug + "/:path*",
			destination: "/en/learn/courses/" + slug + "/:path*",
			permanent:   true,
		})
	}
	for _, root := range RetiredFundamentallyStrongRoots {
		rules = append(rules, redirectRule{source: root, destination: "/en/learn/courses", permanent: true})
	}
	return rules
}

// learnHomeRules moves the retired Learn overview to the Learn home.
func learnHomeRules() []redirectRule {
	return []redirectRule{
		{source: "/en/learn/overview", destination: "/en/learn", permanent: true},
	}
}

// learnThreeBucketRules moves the six relocated domains under legacy with an
// exact bare rule followed by its wildcard to keep single-hop behavior.
func learnThreeBucketRules() []redirectRule {
	var rules []redirectRule
	for _, domain := range RelocatedDomains {
		rules = append(rules,
			redirectRule{source: "/en/learn/" + domain, destination: "/en/learn/legacy/" + domain, permanent: true},
			redirectRule{source: "/en/learn/" + domain + "/:path*", destination: "/en/learn/legacy/" + domain + "/:path*", permanent: true},
		)
	}
	return rules
}

// orderedRules returns every redirect in next.config.ts evaluation order.
func orderedRules() []redirectRule {
	var rules []redirectRule
	rules = append(rules, localeEntryRules()...)
	rules = append(rules, contentNamespaceRules()...)
	rules = append(rules, learnReorgRules()...)
	rules = append(rules, courseRehomeRules()...)
	rules = append(rules, learnHomeRules()...)
	rules = append(rules, learnThreeBucketRules()...)
	return rules
}

// ResolveOrderedRedirect applies the Next.js redirect order to a request path
// without its query string. It returns the destination path and HTTP status
// (308 permanent, 307 temporary) when a rule matches.
func ResolveOrderedRedirect(path string) (string, int, bool) {
	lookup := path
	if len(lookup) > 1 && strings.HasSuffix(lookup, "/") {
		lookup = strings.TrimSuffix(lookup, "/")
	}
	for _, rule := range orderedRules() {
		destination, ok := matchRule(rule.source, rule.destination, lookup)
		if !ok {
			continue
		}
		status := http.StatusPermanentRedirect
		if !rule.permanent {
			status = http.StatusTemporaryRedirect
		}
		return destination, status, true
	}
	return "", 0, false
}
