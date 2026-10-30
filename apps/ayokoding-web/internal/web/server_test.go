package web_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func fixtureDeps() web.Deps {
	return web.SeedFixtureDeps("parity")
}

func request(t *testing.T, handler http.Handler, method, target string) *httptest.ResponseRecorder {
	t.Helper()
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(method, target, nil)
	handler.ServeHTTP(recorder, request)
	return recorder
}

func TestRootRedirectsToEnglish(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/")
	if recorder.Code != http.StatusPermanentRedirect {
		t.Fatalf("root status = %d, want 308", recorder.Code)
	}
	if location := recorder.Header().Get("Location"); location != "/en" {
		t.Fatalf("root Location = %q, want /en", location)
	}
}

func TestUppercaseLocaleResolvesLowercase(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for source, destination := range map[string]string{"/EN": "/en", "/ID": "/id", "/EN/learn/courses": "/en/learn/courses"} {
		recorder := request(t, handler, http.MethodGet, source)
		if recorder.Code != http.StatusPermanentRedirect {
			t.Fatalf("%s status = %d, want 308", source, recorder.Code)
		}
		if location := recorder.Header().Get("Location"); location != destination {
			t.Fatalf("%s Location = %q, want %q", source, location, destination)
		}
	}
}

func TestHomeUsesRouteLanguage(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale)
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s status = %d, want 200", locale, recorder.Code)
		}
		if !strings.Contains(recorder.Body.String(), `lang="`+locale+`"`) {
			t.Fatalf("/%s body misses document language %q", locale, locale)
		}
	}
}

func TestLessonRendersTitleAndBody(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics/learning/hello-world")
	if recorder.Code != http.StatusOK {
		t.Fatalf("lesson status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "Hello World") || !strings.Contains(body, "Hello.") {
		t.Fatalf("lesson body misses title or article, got %q", body)
	}
	if strings.Contains(body, "next/dist") || strings.Contains(body, "_next/") {
		t.Fatalf("lesson must not depend on a Next.js build artifact")
	}
}

func TestDraftRouteIsNotFound(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics/learning/draft-note")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("draft status = %d, want 404", recorder.Code)
	}
}

func TestMissingPageIsLocalizedNotFound(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics/learning/nope")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("missing status = %d, want 404", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `lang="en"`) {
		t.Fatal("not-found page must keep the route locale")
	}
}

func TestInventoryRedirectPreservesQuery(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/old-guide?from=local")
	if recorder.Code != http.StatusPermanentRedirect {
		t.Fatalf("inventory status = %d, want 308", recorder.Code)
	}
	if location := recorder.Header().Get("Location"); location != "/en/learn/courses/go-basics/learning/hello-world?from=local" {
		t.Fatalf("inventory Location = %q, want canonical destination with query", location)
	}
}

func TestDiscoveryDocuments(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	sitemap := request(t, handler, http.MethodGet, "/sitemap.xml")
	if sitemap.Code != http.StatusOK || !strings.Contains(sitemap.Header().Get("Content-Type"), "application/xml") {
		t.Fatalf("sitemap = %d %q, want 200 application/xml", sitemap.Code, sitemap.Header().Get("Content-Type"))
	}
	if strings.Contains(sitemap.Body.String(), "draft-note") {
		t.Fatal("sitemap must exclude drafts")
	}
	seen := map[string]int{}
	rest := sitemap.Body.String()
	for {
		start := strings.Index(rest, "<loc>")
		if start < 0 {
			break
		}
		rest = rest[start+len("<loc>"):]
		end := strings.Index(rest, "</loc>")
		if end < 0 {
			t.Fatal("sitemap has an unterminated loc")
		}
		loc := rest[:end]
		rest = rest[end+len("</loc>"):]
		seen[loc]++
		if seen[loc] > 1 {
			t.Fatalf("sitemap lists %s twice", loc)
		}
	}
	feed := request(t, handler, http.MethodGet, "/feed.xml")
	if feed.Code != http.StatusOK || feed.Header().Get("Content-Type") != "application/rss+xml; charset=utf-8" {
		t.Fatalf("feed = %d %q, want 200 application/rss+xml", feed.Code, feed.Header().Get("Content-Type"))
	}
	robots := request(t, handler, http.MethodGet, "/robots.txt")
	if robots.Code != http.StatusOK || !strings.Contains(robots.Header().Get("Content-Type"), "text/plain") {
		t.Fatalf("robots = %d %q, want 200 text/plain", robots.Code, robots.Header().Get("Content-Type"))
	}
	if !strings.Contains(robots.Body.String(), "sitemap") {
		t.Fatal("robots must reference the sitemap")
	}
}

func TestCatalogGroupsCourses(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses")
	if recorder.Code != http.StatusOK {
		t.Fatalf("catalog status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "Go Basics") || !strings.Contains(body, "4 weeks") {
		t.Fatalf("catalog misses course metadata, got %q", body)
	}
}

func TestCourseLandingShowsPrereqsAndLessons(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	landing := request(t, handler, http.MethodGet, "/en/learn/courses/go-basics")
	if landing.Code != http.StatusOK {
		t.Fatalf("course status = %d, want 200", landing.Code)
	}
	for _, marker := range []string{"Go Basics", "Setup", "Hello World", "/en/learn/courses/go-basics/learning/hello-world", `data-count-pattern="{done} of {total} pages done"`} {
		if !strings.Contains(landing.Body.String(), marker) {
			t.Fatalf("course page misses %q", marker)
		}
	}
	advanced := request(t, handler, http.MethodGet, "/en/learn/courses/go-web")
	for _, marker := range []string{"Go Web", "Go Basics", "/en/learn/courses/go-basics", "data-prerequisites"} {
		if !strings.Contains(advanced.Body.String(), marker) {
			t.Fatalf("advanced course page misses %q", marker)
		}
	}
	legacy := request(t, handler, http.MethodGet, "/en/learn/courses/legacy")
	if legacy.Code != http.StatusOK {
		t.Fatalf("legacy course status = %d, want 200", legacy.Code)
	}
	for _, marker := range []string{"Legacy Software Engineering", "software-engineering"} {
		if !strings.Contains(legacy.Body.String(), marker) {
			t.Fatalf("legacy course page misses %q", marker)
		}
	}
}

func TestOutlineCourseHonesty(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/outline-only")
	if recorder.Code != http.StatusOK {
		t.Fatalf("outline status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "data-outline-status") {
		t.Fatal("outline course must report outline status")
	}
}

func TestInvalidPathContextFallsBack(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/courses/go-basics?path=no-such-path")
	if recorder.Code != http.StatusOK {
		t.Fatalf("fallback status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "data-canonical-nav") {
		t.Fatal("invalid path must render canonical navigation")
	}
	if strings.Contains(recorder.Body.String(), "data-path-controls") {
		t.Fatal("invalid path must not claim path controls")
	}
}

func TestPathRoadmapPhaseOrder(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/paths/backend-id")
	if recorder.Code != http.StatusOK {
		t.Fatalf("path status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	for _, marker := range []string{"Phase 1:", "Fundamentals", "Phase 2:", "Practice", `data-position="1"`, `data-position="2"`} {
		if !strings.Contains(body, marker) {
			t.Fatalf("roadmap misses %q", marker)
		}
	}
}

func TestEmptyPathCategory(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/paths/skills")
	if recorder.Code != http.StatusOK {
		t.Fatalf("category status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "data-empty-state") {
		t.Fatal("empty category must explain itself")
	}
}

func TestBenchmarkPage(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	vector := request(t, handler, http.MethodGet, "/en/tools/ai-benchmark?harness=command-code-pro&tier=planning")
	if vector.Code != http.StatusOK {
		t.Fatalf("benchmark status = %d, want 200", vector.Code)
	}
	body := vector.Body.String()
	// Current-codec vector from the shared dataset: filterCounts pins
	// harness=command-code-pro&tier=planning to 3 models in
	// libs/ayokoding-data/test-vectors/benchmark.json, rendered in
	// descending index order with blended prices. The order assertion scopes
	// to the results list because the select-based filter form above it
	// legitimately names the same models in display order.
	results := body[strings.Index(body, "data-tool-results"):]
	first := strings.Index(results, "GPT-6 Sol")
	second := strings.Index(results, "Grok 4.7")
	third := strings.Index(results, "GPT-5.6 Sol")
	if first < 0 || second < 0 || third < 0 || first >= second || second >= third {
		t.Fatal("benchmark must show vector figures in index order")
	}
	for _, marker := range []string{"56.7", "56.3", "54.6", "$4.00", "$3.00", "$8.00", `data-count="3"`} {
		if !strings.Contains(body, marker) {
			t.Fatalf("benchmark misses vector figure %q", marker)
		}
	}
	empty := request(t, handler, http.MethodGet, "/en/tools/ai-benchmark?harness=opencode-go&tier=ultra")
	if empty.Code != http.StatusOK {
		t.Fatalf("empty benchmark status = %d, want 200", empty.Code)
	}
	if !strings.Contains(empty.Body.String(), "data-empty-state") {
		t.Fatal("no-match combination must show the empty state")
	}
}

func TestCalculatorPage(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	vector := request(t, handler, http.MethodGet, "/en/tools/cost-of-living-calculator?city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore")
	if vector.Code != http.StatusOK {
		t.Fatalf("calculator status = %d, want 200", vector.Code)
	}
	body := vector.Body.String()
	if !strings.Contains(body, "data-tool-estimate") {
		t.Fatal("calculator must show the vector estimate")
	}
	// Current-codec vector from the shared datasets: essentialsLocal pins
	// Singapore to 4718 (libs/ayokoding-data/test-vectors/calculator.json,
	// rendered as "SGD 4,718"), savingsRow pins its essential savings near
	// 846 USD, and the role ladder resolves the engaged salary baseline to
	// SWE I.
	for _, marker := range []string{"SGD 4,718", "846 USD", "SWE I"} {
		if !strings.Contains(body, marker) {
			t.Fatalf("calculator misses vector figure %q", marker)
		}
	}
	fallback := request(t, handler, http.MethodGet, "/en/tools/cost-of-living-calculator?tab=min-role&target=1000000&city=singapore")
	if fallback.Code != http.StatusOK {
		t.Fatalf("fallback calculator status = %d, want 200", fallback.Code)
	}
	if !strings.Contains(fallback.Body.String(), "data-fallback-state") {
		t.Fatal("an engaged baseline nothing clears must use the fallback state")
	}
}

func TestHtmxBenchmarkFragment(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	vector := request(t, handler, http.MethodGet, "/htmx/benchmark?harness=command-code-pro&tier=planning")
	if vector.Code != http.StatusOK {
		t.Fatalf("benchmark fragment status = %d, want 200", vector.Code)
	}
	body := vector.Body.String()
	for _, marker := range []string{`data-fragment="benchmark"`, "GPT-6 Sol", "Grok 4.7", `data-count="3"`} {
		if !strings.Contains(body, marker) {
			t.Fatalf("benchmark fragment misses %q", marker)
		}
	}
	if strings.Contains(body, "<title>") {
		t.Fatal("benchmark fragment must not render the full-page layout")
	}
	if contentType := vector.Header().Get("Content-Type"); contentType != "text/html; charset=utf-8" {
		t.Fatalf("benchmark fragment Content-Type = %q", contentType)
	}
	if cache := vector.Header().Get("Cache-Control"); cache != "no-store" {
		t.Fatalf("benchmark fragment Cache-Control = %q", cache)
	}
	localized := httptest.NewRecorder()
	localizedRequest := httptest.NewRequest(http.MethodGet, "/htmx/benchmark?harness=command-code-pro&tier=planning", nil)
	localizedRequest.Header.Set("HX-Current-URL", "http://localhost:3102/id/tools/ai-benchmark")
	handler.ServeHTTP(localized, localizedRequest)
	if !strings.Contains(localized.Body.String(), `lang="id"`) {
		t.Fatal("benchmark fragment must follow the HX-Current-URL locale")
	}
	if !strings.Contains(body, `lang="en"`) {
		t.Fatal("benchmark fragment must default to English without a page route")
	}
	invalid := request(t, handler, http.MethodGet, "/htmx/benchmark?use-case=chat")
	if !strings.Contains(invalid.Body.String(), "data-invalid-filters") {
		t.Fatal("unexpected benchmark field must yield the invalid-filters state")
	}
	empty := request(t, handler, http.MethodGet, "/htmx/benchmark?harness=opencode-go&tier=ultra")
	if !strings.Contains(empty.Body.String(), "data-empty-state") {
		t.Fatal("no-match benchmark fragment must show the empty state")
	}
}

func TestHtmxCalculatorFragment(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	vectorURL := "/htmx/calculator?locale=en&city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore"
	vector := request(t, handler, http.MethodGet, vectorURL)
	if vector.Code != http.StatusOK {
		t.Fatalf("calculator fragment status = %d, want 200", vector.Code)
	}
	body := vector.Body.String()
	for _, marker := range []string{`data-fragment="calculator"`, "data-tool-estimate", "SGD 4,718"} {
		if !strings.Contains(body, marker) {
			t.Fatalf("calculator fragment misses %q", marker)
		}
	}
	if strings.Contains(body, "<title>") {
		t.Fatal("calculator fragment must not render the full-page layout")
	}
	noLocale := request(t, handler, http.MethodGet, "/htmx/calculator?city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore")
	if !strings.Contains(noLocale.Body.String(), `lang="en"`) {
		t.Fatal("calculator fragment must fall back to English without a locale field")
	}
	firstWins := request(t, handler, http.MethodGet, "/htmx/calculator?locale=id&locale=en&city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore")
	if !strings.Contains(firstWins.Body.String(), `lang="id"`) {
		t.Fatal("calculator fragment must resolve a duplicated locale to its first value")
	}
	unsupported := request(t, handler, http.MethodGet, "/htmx/calculator?locale=xx&city=singapore")
	if unsupported.Code != http.StatusNotFound {
		t.Fatalf("unsupported fragment locale status = %d, want 404", unsupported.Code)
	}
	invalid := request(t, handler, http.MethodGet, "/htmx/calculator?locale=en&city=jakarta&workers=abc")
	if !strings.Contains(invalid.Body.String(), "data-invalid-filters") {
		t.Fatal("unexpected calculator field must yield the invalid-filters state")
	}
	fallback := request(t, handler, http.MethodGet, "/htmx/calculator?locale=en&tab=min-role&target=1000000&city=no-such-city")
	if !strings.Contains(fallback.Body.String(), "data-fallback-state") {
		t.Fatal("incompatible calculator geography must use the fallback state")
	}
}

func TestToolFilterFormsUseSelectsWithReset(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	benchmark := request(t, handler, http.MethodGet, "/en/tools/ai-benchmark?tier=ultra")
	if benchmark.Code != http.StatusOK {
		t.Fatalf("benchmark status = %d, want 200", benchmark.Code)
	}
	for _, marker := range []string{
		`<select name="harness"`, `<select name="tier"`, `<select name="sub"`, `<select name="sub-harness"`,
		`<option value="ultra"  selected`, `data-filter-reset`, `href="/en/tools/ai-benchmark"`,
	} {
		if !strings.Contains(benchmark.Body.String(), marker) {
			t.Fatalf("benchmark filter form misses %q", marker)
		}
	}
	fragment := request(t, handler, http.MethodGet, "/htmx/benchmark?harness=cursor")
	if !strings.Contains(fragment.Body.String(), `<select name="harness"`) {
		t.Fatal("benchmark fragment must keep the select-based filter form")
	}
	calculator := request(t, handler, http.MethodGet, "/en/tools/cost-of-living-calculator?city=singapore&gross=5000")
	if calculator.Code != http.StatusOK {
		t.Fatalf("calculator status = %d, want 200", calculator.Code)
	}
	for _, marker := range []string{
		`<select name="tab"`, `<select name="region"`, `<select name="country"`, `<select name="city"`,
		`<select name="adults"`, `<select name="baseline"`, `<option value="singapore"  selected`,
		`data-filter-reset`, `href="/en/tools/cost-of-living-calculator"`,
	} {
		if !strings.Contains(calculator.Body.String(), marker) {
			t.Fatalf("calculator input form misses %q", marker)
		}
	}
}

func TestCalculatorShowsGuidanceWithoutCity(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	page := request(t, handler, http.MethodGet, "/en/tools/cost-of-living-calculator")
	if page.Code != http.StatusOK {
		t.Fatalf("calculator status = %d, want 200", page.Code)
	}
	if !strings.Contains(page.Body.String(), "data-estimate-guidance") {
		t.Fatal("calculator without a city must show selection guidance")
	}
	if strings.Contains(page.Body.String(), "data-tool-estimate") {
		t.Fatal("calculator without a city must hide the empty estimate block")
	}
	fragment := request(t, handler, http.MethodGet, "/htmx/calculator?locale=en")
	if !strings.Contains(fragment.Body.String(), "data-estimate-guidance") {
		t.Fatal("calculator fragment without a city must show selection guidance")
	}
	withCity := request(t, handler, http.MethodGet, "/htmx/calculator?locale=en&city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore")
	if !strings.Contains(withCity.Body.String(), "data-tool-estimate") {
		t.Fatal("calculator fragment with a city must keep the estimate block")
	}
}

func TestHtmxFragmentsPushCanonicalPageURL(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	benchmark := request(t, handler, http.MethodGet, "/htmx/benchmark?tier=ultra")
	if push := benchmark.Header().Get("HX-Push-URL"); push != "/en/tools/ai-benchmark?tier=ultra" {
		t.Fatalf("benchmark HX-Push-URL = %q, want the shareable page URL", push)
	}
	calculator := request(t, handler, http.MethodGet, "/htmx/calculator?locale=en&city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore")
	wantCalculator := "/en/tools/cost-of-living-calculator?region=asean&country=sg&city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore"
	if push := calculator.Header().Get("HX-Push-URL"); push != wantCalculator {
		t.Fatalf("calculator HX-Push-URL = %q, want %q", push, wantCalculator)
	}
	for _, pushed := range []string{"/en/tools/ai-benchmark?tier=ultra", wantCalculator} {
		reload := request(t, handler, http.MethodGet, pushed)
		if reload.Code != http.StatusOK {
			t.Fatalf("reload of pushed URL %q status = %d, want 200", pushed, reload.Code)
		}
		if !strings.Contains(reload.Body.String(), "<main") {
			t.Fatalf("reload of pushed URL %q must render the full page shell", pushed)
		}
		if strings.Contains(reload.Body.String(), "data-invalid-filters") {
			t.Fatalf("reload of pushed URL %q must not render the invalid-filters state", pushed)
		}
	}
}

func TestHtmxFragmentsPushLocaleAwareURL(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	localized := httptest.NewRecorder()
	localizedRequest := httptest.NewRequest(http.MethodGet, "/htmx/benchmark?tier=ultra", nil)
	localizedRequest.Header.Set("HX-Current-URL", "http://localhost:3102/id/tools/ai-benchmark")
	handler.ServeHTTP(localized, localizedRequest)
	if push := localized.Header().Get("HX-Push-URL"); push != "/id/tools/ai-benchmark?tier=ultra" {
		t.Fatalf("localized HX-Push-URL = %q, want the id page URL", push)
	}
	reload := request(t, handler, http.MethodGet, "/id/tools/ai-benchmark?tier=ultra")
	if reload.Code != http.StatusOK || !strings.Contains(reload.Body.String(), `lang="id"`) {
		t.Fatal("localized pushed URL must reload the id page")
	}
}

func TestHtmxInvalidFragmentsSuppressPush(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	benchmark := request(t, handler, http.MethodGet, "/htmx/benchmark?use-case=chat")
	if push := benchmark.Header().Get("HX-Push-URL"); push != "false" {
		t.Fatalf("invalid benchmark HX-Push-URL = %q, want push suppression", push)
	}
	calculator := request(t, handler, http.MethodGet, "/htmx/calculator?locale=en&city=jakarta&workers=abc")
	if push := calculator.Header().Get("HX-Push-URL"); push != "false" {
		t.Fatalf("invalid calculator HX-Push-URL = %q, want push suppression", push)
	}
	defaults := request(t, handler, http.MethodGet, "/htmx/benchmark")
	if push := defaults.Header().Get("HX-Push-URL"); push != "/en/tools/ai-benchmark" {
		t.Fatalf("default benchmark HX-Push-URL = %q, want the bare page URL", push)
	}
}

func TestUnknownLocaleNotFound(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/xx")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("unknown locale status = %d, want 404", recorder.Code)
	}
}

func TestUppercaseRedirectPreservesQuery(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/EN/learn/courses?from=nav")
	if recorder.Code != http.StatusPermanentRedirect {
		t.Fatalf("uppercase status = %d, want 308", recorder.Code)
	}
	if location := recorder.Header().Get("Location"); location != "/en/learn/courses?from=nav" {
		t.Fatalf("uppercase Location = %q", location)
	}
}

func TestIndonesianLessonOutline(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/id/learn/courses/go-basics/learning/hello-world")
	if recorder.Code != http.StatusOK {
		t.Fatalf("id lesson status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `href="#persiapan"`) {
		t.Fatal("id lesson must link its outline anchor")
	}
}

func TestUnavailableCatalogFixture(t *testing.T) {
	deps := web.SeedFixtureDeps("unavailable-catalog")
	if len(deps.Content.Published("en")) != 0 {
		t.Fatal("unavailable-catalog fixture must hide the catalog")
	}
}

func TestSetupLessonHasNextOnly(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics/learning/setup")
	if recorder.Code != http.StatusOK {
		t.Fatalf("setup status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "data-next") {
		t.Fatal("first lesson must offer a next control")
	}
	if strings.Contains(recorder.Body.String(), "data-prev") {
		t.Fatal("first lesson must not offer a previous control")
	}
}

func TestUnknownLocaleRoutes(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{"/xx/learn/courses/go-basics", "/xx/learn/courses", "/xx/learn/paths/backend-id", "/xx/search?q=x", "/xx/tools/ai-benchmark", "/xx/tools/cost-of-living-calculator", "/xx/nope", "/xx/learn/courses/go-basics/learning/hello-world"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusNotFound {
			t.Fatalf("%s status = %d, want 404", target, recorder.Code)
		}
		if !strings.Contains(recorder.Body.String(), `lang="en"`) {
			t.Fatalf("%s must fall back to the English not-found page", target)
		}
	}
}

func TestUnknownCourseAndInvalidLimit(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	missing := request(t, handler, http.MethodGet, "/en/learn/courses/nope")
	if missing.Code != http.StatusNotFound {
		t.Fatalf("unknown course status = %d, want 404", missing.Code)
	}
	limited := request(t, handler, http.MethodGet, "/en/search?q=hello&limit=abc")
	if limited.Code != http.StatusOK {
		t.Fatalf("invalid limit status = %d, want 200 with default", limited.Code)
	}
	if !strings.Contains(limited.Body.String(), "Hello World") {
		t.Fatal("invalid limit must fall back to the default window")
	}
}

func TestValidPathContextPreserved(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics/learning/setup?path=backend-id")
	if recorder.Code != http.StatusOK {
		t.Fatalf("path context status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "/en/learn/courses/go-basics/learning/hello-world?path=backend-id") {
		t.Fatal("next control must preserve valid path context")
	}
}

func TestOrphanWebCourseResolves(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{"/en/learn/courses/web/learning/section-index", "/en/learn/courses/web/learning/leaf"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s status = %d, want 200", target, recorder.Code)
		}
	}
	for _, locale := range []string{"en", "id"} {
		course := request(t, handler, http.MethodGet, "/"+locale+"/learn/courses/web")
		if course.Code != http.StatusOK {
			t.Fatalf("/%s/learn/courses/web status = %d, want the listed course", locale, course.Code)
		}
		catalog := request(t, handler, http.MethodGet, "/"+locale+"/learn/courses")
		if catalog.Code != http.StatusOK {
			t.Fatalf("/%s/learn/courses status = %d, want 200", locale, catalog.Code)
		}
		if !strings.Contains(catalog.Body.String(), "/"+locale+"/learn/courses/web") {
			t.Fatalf("/%s catalog must list the web course", locale)
		}
	}
	english := request(t, handler, http.MethodGet, "/en/learn/courses/web")
	for _, marker := range []string{"Section Index", "Leaf", "data-course-progress", `data-course="web"`} {
		if !strings.Contains(english.Body.String(), marker) {
			t.Fatalf("web course page misses %q", marker)
		}
	}
}

func TestCatalogSkipsDanglingCourse(t *testing.T) {
	deps := fixtureDeps()
	deps.Paths = coursepaths.NewFakeStore(
		[]coursepaths.LearningPath{{ID: "x", Title: "X", Category: "c", Phases: []coursepaths.Phase{{Name: "P", Courses: []string{"ghost"}}}}},
		nil,
		nil,
	)
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, deps).Handler(), http.MethodGet, "/en/learn/courses")
	if recorder.Code != http.StatusOK {
		t.Fatalf("catalog status = %d, want 200", recorder.Code)
	}
	if strings.Contains(recorder.Body.String(), "ghost") {
		t.Fatal("dangling course must stay out of the catalog")
	}
}

func TestSearchPageRendersShellWrappedResults(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	cases := []struct{ locale, query, marker string }{
		{"en", "hello", "Hello World"},
		{"id", "halo", "Halo Dunia"},
	}
	for _, tc := range cases {
		recorder := request(t, handler, http.MethodGet, "/"+tc.locale+"/search?q="+tc.query)
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s/search status = %d, want 200", tc.locale, recorder.Code)
		}
		body := recorder.Body.String()
		for _, marker := range []string{"<!doctype html>", "<main", `lang="` + tc.locale + `"`, "data-search-results", tc.marker} {
			if !strings.Contains(body, marker) {
				t.Fatalf("/%s/search page misses %q", tc.locale, marker)
			}
		}
	}
	empty := request(t, handler, http.MethodGet, "/en/search")
	if empty.Code != http.StatusOK {
		t.Fatalf("empty search status = %d, want 200", empty.Code)
	}
	if !strings.Contains(empty.Body.String(), "data-search-empty") || !strings.Contains(empty.Body.String(), "<main") {
		t.Fatal("empty search must render the shell-wrapped empty state")
	}
}

func TestSearchPageEscapesHostileInput(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E")
	if recorder.Code != http.StatusOK {
		t.Fatalf("hostile search status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "&lt;script&gt;") {
		t.Fatal("hostile search input must stay escaped on the results page")
	}
	if strings.Contains(body, "<script>alert") {
		t.Fatal("hostile search input must not execute as markup")
	}
	if !strings.Contains(body, "<main") {
		t.Fatal("hostile search must still render the shell-wrapped page")
	}
}

func TestSearchLimitWindow(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/search?q=hello&limit=1")
	if recorder.Code != http.StatusOK {
		t.Fatalf("search status = %d, want 200", recorder.Code)
	}
	if count(recorder.Body.String(), "data-result=") != 1 {
		t.Fatal("limit window must cap the fragment")
	}
}

func TestLocalePrefixedMissingPage(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/definitely-missing")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("missing status = %d, want 404", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `lang="en"`) {
		t.Fatal("locale-prefixed miss must keep the route locale")
	}
}

func count(body, fragment string) int {
	total := 0
	for rest := body; ; {
		index := indexOf(rest, fragment)
		if index < 0 {
			return total
		}
		total++
		rest = rest[index+len(fragment):]
	}
}

func indexOf(body, fragment string) int {
	for index := 0; index+len(fragment) <= len(body); index++ {
		if body[index:index+len(fragment)] == fragment {
			return index
		}
	}
	return -1
}

func TestPathCategoryWithPaths(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/paths/careers")
	if recorder.Code != http.StatusOK {
		t.Fatalf("category status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "Backend") {
		t.Fatal("category page must list its paths")
	}
}

func TestSearchFragment(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/search?q=hello")
	if recorder.Code != http.StatusOK {
		t.Fatalf("search status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "Hello World") || !strings.Contains(body, "first program") {
		t.Fatalf("search misses title or excerpt, got %q", body)
	}
	empty := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/search?q=%20%20")
	if strings.Contains(empty.Body.String(), "Hello World") {
		t.Fatal("whitespace query must clear stale results")
	}
}

func TestStaticAssetsServeVendoredScripts(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, file := range []string{"htmx.min.js", "progress.js"} {
		recorder := request(t, handler, http.MethodGet, "/assets/js/"+file)
		if recorder.Code != http.StatusOK {
			t.Fatalf("/assets/js/%s status = %d, want 200", file, recorder.Code)
		}
		if contentType := recorder.Header().Get("Content-Type"); contentType != "application/javascript" {
			t.Fatalf("/assets/js/%s Content-Type = %q, want application/javascript", file, contentType)
		}
		if recorder.Body.Len() == 0 {
			t.Fatalf("/assets/js/%s body must not be empty", file)
		}
	}
}

func TestStaticAssetsRejectUnknownAndTraversal(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, target := range []string{"/assets/js/unknown.js", "/assets/css/unknown.css", "/assets/go.mod"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusNotFound {
			t.Fatalf("%s status = %d, want 404", target, recorder.Code)
		}
		if strings.Contains(recorder.Body.String(), "module github.com") {
			t.Fatalf("%s body must not disclose module sources", target)
		}
	}
	traversal := request(t, handler, http.MethodGet, "/assets/js/../go.mod")
	if traversal.Code != http.StatusMovedPermanently && traversal.Code != http.StatusTemporaryRedirect && traversal.Code != http.StatusPermanentRedirect {
		t.Fatalf("/assets/js/../go.mod status = %d, want a redirect to the cleaned path", traversal.Code)
	}
	cleaned := request(t, handler, http.MethodGet, "/assets/go.mod")
	if cleaned.Code != http.StatusNotFound {
		t.Fatalf("/assets/go.mod status = %d, want 404", cleaned.Code)
	}
}

func TestLearnHomeListsBuckets(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale+"/learn")
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s/learn status = %d, want 200", locale, recorder.Code)
		}
		for _, marker := range []string{"/" + locale + "/learn/paths", "/" + locale + "/learn/courses"} {
			if !strings.Contains(recorder.Body.String(), marker) {
				t.Fatalf("/%s/learn misses %q", locale, marker)
			}
		}
	}
	missing := request(t, handler, http.MethodGet, "/xx/learn")
	if missing.Code != http.StatusNotFound {
		t.Fatalf("unknown learn locale status = %d, want 404", missing.Code)
	}
}

func TestPathsHubGroupsByCategory(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/paths")
	if recorder.Code != http.StatusOK {
		t.Fatalf("hub status = %d, want 200", recorder.Code)
	}
	for _, marker := range []string{`data-category="careers"`, "backend-id", "/en/learn/paths/backend-id"} {
		if !strings.Contains(recorder.Body.String(), marker) {
			t.Fatalf("hub misses %q", marker)
		}
	}
}

func TestLessonRejectsUnknownKind(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics/invalid/hello-world")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("unknown kind status = %d, want 404", recorder.Code)
	}
}

func TestLegacyBucketIsLocalizedNotFound(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/legacy/software-engineering/overview")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("legacy status = %d, want 404", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `lang="en"`) {
		t.Fatal("legacy miss must keep the route locale")
	}
	bare := request(t, handler, http.MethodGet, "/en/learn/legacy")
	if bare.Code != http.StatusNotFound {
		t.Fatalf("legacy bare status = %d, want 404", bare.Code)
	}
}

func TestTrailingSlashNormalizesToCanonical(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/paths/careers/")
	if recorder.Code != http.StatusPermanentRedirect {
		t.Fatalf("trailing slash status = %d, want 308", recorder.Code)
	}
	if location := recorder.Header().Get("Location"); location != "/en/learn/paths/careers" {
		t.Fatalf("trailing slash Location = %q", location)
	}
}

func TestPathsHubUnknownLocaleNotFound(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/xx/learn/paths")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("hub unknown locale status = %d, want 404", recorder.Code)
	}
}

func TestLegacyUnknownLocaleFallsBackToEnglish(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/xx/learn/legacy/software-engineering")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("legacy unknown locale status = %d, want 404", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `lang="en"`) {
		t.Fatal("legacy unknown locale must fall back to English")
	}
}

func TestLessonHasCompletionControl(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale+"/learn/courses/go-basics/learning/hello-world")
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s lesson status = %d, want 200", locale, recorder.Code)
		}
		body := recorder.Body.String()
		for _, marker := range []string{`data-progress-region`, `data-progress-control="complete-trigger"`, `data-page="go-basics/hello-world"`, `aria-pressed`, `data-progress-status`, `data-progress-blocked`} {
			if !strings.Contains(body, marker) {
				t.Fatalf("/%s lesson misses completion marker %q", locale, marker)
			}
		}
	}
}

func TestCourseShowsProgressState(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/courses/go-basics")
	if recorder.Code != http.StatusOK {
		t.Fatalf("course status = %d, want 200", recorder.Code)
	}
	body := recorder.Body.String()
	for _, marker := range []string{`data-course-progress`, `data-course="go-basics"`, `data-lesson-marker`} {
		if !strings.Contains(body, marker) {
			t.Fatalf("course page misses progress marker %q", marker)
		}
	}
}

func TestLearnHomeShowsBlockedNotice(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn")
	if recorder.Code != http.StatusOK {
		t.Fatalf("learn status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `data-progress-blocked`) {
		t.Fatal("learn home must carry the blocked-storage notice hook")
	}
}

func TestShellHasThemeToggle(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	pages := []string{"/en", "/id", "/en/learn", "/en/learn/courses/go-basics/learning/hello-world"}
	for _, target := range pages {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s status = %d, want 200", target, recorder.Code)
		}
		if !strings.Contains(recorder.Body.String(), `data-theme-toggle`) {
			t.Fatalf("%s shell misses the persisted theme toggle", target)
		}
	}
}

func TestLessonHasSidebarResize(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale+"/learn/courses/go-basics/learning/hello-world")
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s lesson status = %d, want 200", locale, recorder.Code)
		}
		body := recorder.Body.String()
		for _, marker := range []string{`data-sidebar-resize`, `role="separator"`, "--sidebar-width"} {
			if !strings.Contains(body, marker) {
				t.Fatalf("/%s lesson misses sidebar resize marker %q", locale, marker)
			}
		}
	}
}

func TestShellLinksStylesheet(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	pages := []string{
		"/en", "/en/learn", "/en/learn/courses", "/en/learn/courses/go-basics",
		"/en/learn/courses/go-basics/learning/hello-world", "/en/learn/paths/backend-id",
		"/en/tools/ai-benchmark", "/en/tools/cost-of-living-calculator", "/en/search?q=hello",
	}
	for _, target := range pages {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s status = %d, want 200", target, recorder.Code)
		}
		if !strings.Contains(recorder.Body.String(), `<link rel="stylesheet" href="/assets/css/site.css"`) {
			t.Fatalf("%s shell must link the token-grounded stylesheet", target)
		}
	}
}

func TestStylesheetServesTokenGrounding(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/assets/css/site.css")
	if recorder.Code != http.StatusOK {
		t.Fatalf("stylesheet status = %d, want 200", recorder.Code)
	}
	if contentType := recorder.Header().Get("Content-Type"); contentType != "text/css; charset=utf-8" {
		t.Fatalf("stylesheet Content-Type = %q, want text/css", contentType)
	}
	for _, marker := range []string{"--ayk-bg", "--ayk-primary", `[data-theme="dark"]`} {
		if !strings.Contains(recorder.Body.String(), marker) {
			t.Fatalf("stylesheet misses token grounding %q", marker)
		}
	}
	missing := request(t, handler, http.MethodGet, "/assets/css/unknown.css")
	if missing.Code != http.StatusNotFound {
		t.Fatalf("unknown stylesheet status = %d, want 404", missing.Code)
	}
}

func TestFaviconServesIcon(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/favicon.ico")
	if recorder.Code != http.StatusOK {
		t.Fatalf("favicon status = %d, want 200", recorder.Code)
	}
	if contentType := recorder.Header().Get("Content-Type"); contentType != "image/svg+xml" {
		t.Fatalf("favicon Content-Type = %q, want image/svg+xml", contentType)
	}
	if recorder.Body.Len() == 0 {
		t.Fatal("favicon body must not be empty")
	}
}

func TestLessonEmbedsPrivacyHardenedVideo(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale+"/learn/courses/go-basics/learning/hello-world")
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s lesson status = %d, want 200", locale, recorder.Code)
		}
		body := recorder.Body.String()
		if !strings.Contains(body, "https://www.youtube-nocookie.com/embed/") {
			t.Fatalf("/%s lesson must use the click-to-play nocookie embed", locale)
		}
		if strings.Contains(body, "https://www.youtube.com/embed/") || strings.Contains(body, "pagead") {
			t.Fatalf("/%s lesson must not load the tracking embed", locale)
		}
	}
}

func TestLessonLoadsContentRenderers(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	for _, locale := range []string{"en", "id"} {
		recorder := request(t, handler, http.MethodGet, "/"+locale+"/learn/courses/go-basics/learning/hello-world")
		if recorder.Code != http.StatusOK {
			t.Fatalf("/%s lesson status = %d, want 200", locale, recorder.Code)
		}
		body := recorder.Body.String()
		for _, marker := range []string{
			"/assets/vendor/mermaid/mermaid.min.js",
			"/assets/vendor/katex/katex.min.js",
			`data-chart="graph TD; A-->B"`,
			`class="math-inline"`,
			`class="math-display"`,
		} {
			if !strings.Contains(body, marker) {
				t.Fatalf("/%s lesson misses renderer marker %q", locale, marker)
			}
		}
	}
}

func TestVendorServesRendererLibraries(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	cases := []struct{ target, contentType string }{
		{"/assets/vendor/mermaid/mermaid.min.js", "application/javascript"},
		{"/assets/vendor/katex/katex.min.js", "application/javascript"},
		{"/assets/vendor/katex/katex.min.css", "text/css; charset=utf-8"},
	}
	for _, tc := range cases {
		recorder := request(t, handler, http.MethodGet, tc.target)
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s status = %d, want 200", tc.target, recorder.Code)
		}
		if contentType := recorder.Header().Get("Content-Type"); contentType != tc.contentType {
			t.Fatalf("%s Content-Type = %q, want %q", tc.target, contentType, tc.contentType)
		}
		if recorder.Body.Len() == 0 {
			t.Fatalf("%s body must not be empty", tc.target)
		}
	}
	font := request(t, handler, http.MethodGet, "/assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2")
	if font.Code != http.StatusOK {
		t.Fatalf("katex font status = %d, want 200", font.Code)
	}
	if contentType := font.Header().Get("Content-Type"); contentType != "font/woff2" {
		t.Fatalf("katex font Content-Type = %q, want font/woff2", contentType)
	}
	for _, target := range []string{"/assets/vendor/katex/katex.mjs", "/assets/vendor/unknown.js"} {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusNotFound {
			t.Fatalf("%s status = %d, want 404", target, recorder.Code)
		}
	}
	traversal := request(t, handler, http.MethodGet, "/assets/vendor/../../go.mod")
	if traversal.Code != http.StatusMovedPermanently && traversal.Code != http.StatusTemporaryRedirect && traversal.Code != http.StatusPermanentRedirect {
		t.Fatalf("/assets/vendor/../../go.mod status = %d, want a redirect to the cleaned path", traversal.Code)
	}
	cleaned := request(t, handler, http.MethodGet, "/go.mod")
	if cleaned.Code != http.StatusNotFound {
		t.Fatalf("/go.mod status = %d, want 404", cleaned.Code)
	}
}

func TestMainReceivesKeyboardFocus(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	pages := []string{
		"/en", "/en/learn", "/en/learn/courses", "/en/learn/courses/go-basics",
		"/en/learn/courses/go-basics/learning/hello-world", "/en/learn/paths/backend-id",
		"/en/tools/ai-benchmark", "/en/tools/cost-of-living-calculator", "/en/search?q=hello",
	}
	for _, target := range pages {
		recorder := request(t, handler, http.MethodGet, target)
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s status = %d, want 200", target, recorder.Code)
		}
		body := recorder.Body.String()
		if !strings.Contains(body, `<main id="main" tabindex="-1"`) {
			t.Fatalf("%s main content must carry tabindex -1 for skip-link focus", target)
		}
		if !strings.Contains(body, `href="#main"`) {
			t.Fatalf("%s must link its skip control at the main content", target)
		}
	}
}

func TestBareWildcardReorgRedirectsSingleHop(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/human")
	if recorder.Code != http.StatusPermanentRedirect {
		t.Fatalf("bare wildcard status = %d, want 308", recorder.Code)
	}
	if location := recorder.Header().Get("Location"); location != "/en/learn/personal-development" {
		t.Fatalf("bare wildcard Location = %q", location)
	}
}
