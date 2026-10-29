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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/go-basics/hello-world")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/go-basics/draft-note")
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("draft status = %d, want 404", recorder.Code)
	}
}

func TestMissingPageIsLocalizedNotFound(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/go-basics/nope")
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
	if location := recorder.Header().Get("Location"); location != "/en/learn/go-basics/hello-world?from=local" {
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
	feed := request(t, handler, http.MethodGet, "/feed.xml")
	if feed.Code != http.StatusOK || !strings.Contains(feed.Header().Get("Content-Type"), "application/xml") {
		t.Fatalf("feed = %d %q, want 200 application/xml", feed.Code, feed.Header().Get("Content-Type"))
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
	landing := request(t, handler, http.MethodGet, "/en/learn/go-basics")
	if landing.Code != http.StatusOK {
		t.Fatalf("course status = %d, want 200", landing.Code)
	}
	for _, marker := range []string{"Go Basics", "Setup", "Hello World", "/en/learn/go-basics/hello-world"} {
		if !strings.Contains(landing.Body.String(), marker) {
			t.Fatalf("course page misses %q", marker)
		}
	}
	advanced := request(t, handler, http.MethodGet, "/en/learn/go-web")
	for _, marker := range []string{"Go Web", "Go Basics", "/en/learn/go-basics", "data-prerequisites"} {
		if !strings.Contains(advanced.Body.String(), marker) {
			t.Fatalf("advanced course page misses %q", marker)
		}
	}
}

func TestOutlineCourseHonesty(t *testing.T) {
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/outline-only")
	if recorder.Code != http.StatusOK {
		t.Fatalf("outline status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "data-outline-status") {
		t.Fatal("outline course must report outline status")
	}
}

func TestInvalidPathContextFallsBack(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	recorder := request(t, handler, http.MethodGet, "/en/learn/go-basics?path=no-such-path")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/paths/backend-id")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/paths/skills")
	if recorder.Code != http.StatusOK {
		t.Fatalf("category status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "data-empty-state") {
		t.Fatal("empty category must explain itself")
	}
}

func TestBenchmarkPage(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	vector := request(t, handler, http.MethodGet, "/en/tools/ai-benchmark?use-case=chat&price-band=mid")
	if vector.Code != http.StatusOK {
		t.Fatalf("benchmark status = %d, want 200", vector.Code)
	}
	if !strings.Contains(vector.Body.String(), "Model B") {
		t.Fatal("benchmark must show vector figures")
	}
	empty := request(t, handler, http.MethodGet, "/en/tools/ai-benchmark?use-case=chat&price-band=ultra")
	if !strings.Contains(empty.Body.String(), "data-empty-state") {
		t.Fatal("no-match combination must show the empty state")
	}
}

func TestCalculatorPage(t *testing.T) {
	handler := web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler()
	vector := request(t, handler, http.MethodGet, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1")
	if vector.Code != http.StatusOK {
		t.Fatalf("calculator status = %d, want 200", vector.Code)
	}
	if !strings.Contains(vector.Body.String(), "data-tool-estimate") {
		t.Fatal("calculator must show the vector estimate")
	}
	fallback := request(t, handler, http.MethodGet, "/en/tools/cost-of-living-calculator?city=atlantis&workers=abc")
	if !strings.Contains(fallback.Body.String(), "data-fallback-state") {
		t.Fatal("incompatible geography must use the fallback state")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/id/learn/go-basics/hello-world")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/go-basics/setup")
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
	for _, target := range []string{"/xx/learn/go-basics", "/xx/learn/courses", "/xx/paths/backend-id", "/xx/search?q=x", "/xx/tools/ai-benchmark", "/xx/tools/cost-of-living-calculator", "/xx/nope", "/xx/learn/go-basics/hello-world"} {
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
	missing := request(t, handler, http.MethodGet, "/en/learn/nope")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/learn/go-basics/setup?path=backend-id")
	if recorder.Code != http.StatusOK {
		t.Fatalf("path context status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "/en/learn/go-basics/hello-world?path=backend-id") {
		t.Fatal("next control must preserve valid path context")
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
	recorder := request(t, web.NewServer(web.Config{Port: 3102}, fixtureDeps()).Handler(), http.MethodGet, "/en/paths/careers")
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
