package web

import (
	"embed"
	"html/template"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/search"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

// templates embeds pages, fragments, and discovery documents. P2 grows this
// set with real content surfaces; the layout primitives stay.
//
//go:embed templates/*.html templates/*.xml templates/*.txt
var templates embed.FS

// staticAssets embeds the vendored htmx runtime and the esbuild-bundled
// progress script. Both files must exist before go build runs; the
// build:assets target generates dist/progress.js from the app-root
// assets/js/progress.ts source. Runtime scripts live beside the server that
// serves them because go:embed paths must stay inside the source directory;
// the plan's app-root assets tree keeps the TypeScript authoring sources.
//
//go:embed assets/vendor/htmx.min.js assets/dist/progress.js
var staticAssets embed.FS

// staticFiles allowlists the servable scripts by request name and embedded path.
var staticFiles = map[string]string{
	"htmx.min.js": "assets/vendor/htmx.min.js",
	"progress.js": "assets/dist/progress.js",
}

// Deps wires the in-memory doubles behind the router. P2 swaps each double
// for its file-backed adapter without changing the route table.
type Deps struct {
	Content    *content.FakeStore
	Paths      *coursepaths.FakeStore
	Index      *search.FakeIndex
	Benchmark  *benchmark.Engine
	Calculator *calculator.Engine
	Redirects  map[string]string
	// CatalogErr signals an unavailable source catalog (owned test fixture
	// only). Content and discovery handlers answer a generic 500 instead of
	// masking the outage as an empty page or a miss.
	CatalogErr error
}

// Server is the bilingual site listener.
type Server struct {
	cfg   Config
	deps  Deps
	mux   *http.ServeMux
	pages *template.Template
}

// NewServer builds the route table.
func NewServer(cfg Config, deps Deps) *Server {
	server := &Server{cfg: cfg, deps: deps, mux: http.NewServeMux()}
	server.pages = template.Must(template.ParseFS(templates,
		"templates/layout.html",
		"templates/home.html",
		"templates/learn.html",
		"templates/lesson.html",
		"templates/catalog.html",
		"templates/course.html",
		"templates/path.html",
		"templates/benchmark.html",
		"templates/calculator.html",
		"templates/notfound.html",
		"templates/search.html",
		"templates/sitemap.xml",
		"templates/feed.xml",
		"templates/robots.txt",
	))
	server.mux.HandleFunc("GET /sitemap.xml", server.handleSitemap)
	server.mux.HandleFunc("GET /feed.xml", server.handleFeed)
	server.mux.HandleFunc("GET /robots.txt", server.handleRobots)
	server.mux.HandleFunc("GET /htmx/search", server.handleSearchFragment)
	server.mux.HandleFunc("GET /assets/js/{file}", server.handleAsset)
	server.mux.HandleFunc("GET /{locale}/search", server.handleSearch)
	server.mux.HandleFunc("GET /{locale}/tools/ai-benchmark", server.handleBenchmark)
	server.mux.HandleFunc("GET /{locale}/tools/cost-of-living-calculator", server.handleCalculator)
	server.mux.HandleFunc("GET /{locale}/learn", server.handleLearnHome)
	server.mux.HandleFunc("GET /{locale}/learn/courses", server.handleCatalog)
	server.mux.HandleFunc("GET /{locale}/learn/courses/{course}", server.handleCourse)
	server.mux.HandleFunc("GET /{locale}/learn/courses/{course}/{kind}/{lesson}", server.handleLesson)
	server.mux.HandleFunc("GET /{locale}/learn/paths", server.handlePathsHub)
	server.mux.HandleFunc("GET /{locale}/learn/paths/{rest...}", server.handlePathOrCategory)
	server.mux.HandleFunc("GET /{locale}/learn/legacy", server.handleLegacy)
	server.mux.HandleFunc("GET /{locale}/learn/legacy/{rest...}", server.handleLegacy)
	server.mux.HandleFunc("GET /{locale}", server.handleHome)
	server.mux.HandleFunc("GET /", server.handleCatchAll)
	return server
}

// Handler exposes the route table for in-process tests; no socket is bound.
// Ordered redirects run before page routing so historical URLs resolve with
// the exact next.config.ts precedence; the inventory and trailing-slash
// normalization follow before the mux serves canonical pages.
func (s *Server) Handler() http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		path := request.URL.Path
		if destination, status, ok := ResolveOrderedRedirect(path); ok {
			redirectWithQuery(writer, request, destination, status)
			return
		}
		if destination, err := CanonicalRedirect(s.deps.Redirects, path); err == nil {
			permanentRedirect(writer, request, destination)
			return
		}
		if len(path) > 1 && strings.HasSuffix(path, "/") {
			permanentRedirect(writer, request, strings.TrimSuffix(path, "/"))
			return
		}
		s.mux.ServeHTTP(writer, request)
	})
}

// handleAsset serves an allowlisted script from the embedded bundle.
// Anything outside the allowlist — unknown names, other extensions, or path
// traversal attempts — resolves to the locale-aware missing-page response, so
// no filesystem location is ever disclosed.
func (s *Server) handleAsset(writer http.ResponseWriter, request *http.Request) {
	embedded, ok := staticFiles[request.PathValue("file")]
	if !ok {
		s.notFound(writer, request, "en")
		return
	}
	body, err := staticAssets.ReadFile(embedded)
	if err != nil {
		s.serverError(writer)
		return
	}
	writer.Header().Set("Content-Type", "application/javascript")
	writer.Header().Set("Cache-Control", "no-store")
	_, _ = writer.Write(body)
}

// permanentRedirect issues a 308 preserving the request query string.
// Discovery and page responses stay uncached locally so authoring reloads
// remain observable.
func permanentRedirect(writer http.ResponseWriter, request *http.Request, destination string) {
	redirectWithQuery(writer, request, destination, http.StatusPermanentRedirect)
}

// redirectWithQuery issues a redirect preserving the request query string.
func redirectWithQuery(writer http.ResponseWriter, request *http.Request, destination string, status int) {
	if raw := request.URL.RawQuery; raw != "" {
		destination += "?" + raw
	}
	writer.Header().Set("Cache-Control", "no-store")
	http.Redirect(writer, request, destination, status)
}

// altLink is one available translation of the current document.
type altLink struct {
	Locale string
	URL    string
}

// shell holds the localized chrome shared by HTML pages.
type shell struct {
	Lang        string
	Title       string
	Description string
	Canonical   string
	Alternates  []altLink
	OtherLocale string
	ThemeHook   bool
}

// baseShell builds chrome for a locale, linking only available translations.
func (s *Server) baseShell(locale, title, description, canonical string) shell {
	other := "id"
	if locale == "id" {
		other = "en"
	}
	var alternates []altLink
	if IsSupportedLocale(other) {
		alternates = []altLink{{Locale: other, URL: "/" + other}}
	}
	return shell{
		Lang: locale, Title: title, Description: description,
		Canonical: canonical, Alternates: alternates,
		OtherLocale: other, ThemeHook: true,
	}
}

// render writes one HTML page with the shared shell.
func (s *Server) render(writer http.ResponseWriter, name string, data any) {
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := s.pages.ExecuteTemplate(writer, name, data); err != nil {
		http.Error(writer, "render", http.StatusInternalServerError)
	}
}

func (s *Server) handleHome(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	s.render(writer, "home", map[string]any{"Shell": s.baseShell(locale, "AyoKoding", "Learn", "/"+locale)})
}

func (s *Server) handleLearnHome(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	s.render(writer, "learn", map[string]any{"Shell": s.baseShell(locale, "Learn", "Learn", "/"+locale+"/learn")})
}

func (s *Server) handleLesson(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	course := request.PathValue("course")
	kind := request.PathValue("kind")
	lesson := request.PathValue("lesson")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	if s.unavailable(writer) {
		return
	}
	if !content.SafeSlug(course) || !content.SafeSlug(lesson) {
		s.notFound(writer, request, locale)
		return
	}
	if kind != "learning" && kind != "drilling" {
		s.notFound(writer, request, locale)
		return
	}
	page, ok := s.deps.Content.Find(locale, course, lesson)
	if !ok {
		s.notFound(writer, request, locale)
		return
	}
	pathID := request.URL.Query().Get("path")
	pathActive := pathID != "" && s.deps.Paths.PathContains(pathID, course)
	prevURL, nextURL := s.neighbors(locale, course, kind, lesson, pathID, pathActive)
	data := map[string]any{
		"Shell":      s.baseShell(locale, page.Title, page.Description, "/"+locale+"/learn/courses/"+course+"/"+kind+"/"+lesson),
		"Page":       page,
		"Kind":       kind,
		"BodyHTML":   template.HTML(page.BodyHTML), // canned fixture markup; P2 sanitizes pipeline output
		"PathID":     pathID,
		"PathActive": pathActive,
		"TOC":        lessonTOC(locale, lesson),
		"PrevURL":    prevURL,
		"NextURL":    nextURL,
	}
	s.render(writer, "lesson", data)
}

// tocEntry is one stable body heading anchor for the lesson outline.
type tocEntry struct {
	ID   string
	Text string
}

// lessonTOC returns the canned outline for fixture lessons. P2 derives this
// from parsed headings; the anchor contract stays.
func lessonTOC(locale, lesson string) []tocEntry {
	if lesson != "hello-world" {
		return nil
	}
	if locale == "id" {
		return []tocEntry{{ID: "persiapan", Text: "Persiapan"}}
	}
	return []tocEntry{{ID: "setup", Text: "Setup"}}
}

// neighbors resolves the previous/next lesson controls, preserving valid
// path context in the destination URLs.
func (s *Server) neighbors(locale, course, kind, lesson, pathID string, pathActive bool) (prev, next string) {
	var slugs []string
	for _, page := range s.deps.Content.Published(locale) {
		if page.Course == course {
			slugs = append(slugs, page.Slug)
		}
	}
	suffix := ""
	if pathActive {
		suffix = "?path=" + pathID
	}
	for index, slug := range slugs {
		if slug != lesson {
			continue
		}
		if index > 0 {
			prev = "/" + locale + "/learn/courses/" + course + "/" + kind + "/" + slugs[index-1] + suffix
		}
		if index+1 < len(slugs) {
			next = "/" + locale + "/learn/courses/" + course + "/" + kind + "/" + slugs[index+1] + suffix
		}
	}
	return prev, next
}

func (s *Server) handleCourse(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	courseID := request.PathValue("course")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	if s.unavailable(writer) {
		return
	}
	if !content.SafeSlug(courseID) {
		s.notFound(writer, request, locale)
		return
	}
	course, ok := s.deps.Paths.Course(courseID)
	if !ok {
		s.notFound(writer, request, locale)
		return
	}
	pathID := request.URL.Query().Get("path")
	pathActive := pathID != "" && s.deps.Paths.PathContains(pathID, courseID)
	var lessons []content.Page
	for _, page := range s.deps.Content.Published(locale) {
		if page.Course == courseID {
			lessons = append(lessons, page)
		}
	}
	data := map[string]any{
		"Shell":         s.baseShell(locale, course.Title, course.Description, "/"+locale+"/learn/courses/"+courseID),
		"Course":        course,
		"Kind":          "learning",
		"Prerequisites": s.deps.Paths.Prerequisites(courseID),
		"Lessons":       lessons,
		"PathID":        pathID,
		"PathActive":    pathActive,
	}
	s.render(writer, "course", data)
}

func (s *Server) handleCatalog(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	if s.unavailable(writer) {
		return
	}
	type group struct {
		Category string
		Courses  []coursepaths.Course
	}
	members := map[string][]coursepaths.Course{}
	var order []string
	for _, path := range s.deps.Paths.Paths() {
		for _, phase := range path.Phases {
			for _, id := range phase.Courses {
				course, ok := s.deps.Paths.Course(id)
				if !ok {
					continue
				}
				if _, exists := members[course.Category]; !exists {
					order = append(order, course.Category)
				}
				members[course.Category] = append(members[course.Category], course)
			}
		}
	}
	var groups []group
	for _, category := range order {
		groups = append(groups, group{Category: category, Courses: members[category]})
	}
	data := map[string]any{
		"Shell":  s.baseShell(locale, "Courses", "Catalog", "/"+locale+"/learn/courses"),
		"Groups": groups,
	}
	s.render(writer, "catalog", data)
}

// phaseView is one rendered roadmap phase with stable position numbers.
type phaseView struct {
	Number  int
	Name    string
	Courses []positionedCourse
}

// positionedCourse is one roadmap entry with titles resolved.
type positionedCourse struct {
	Position int
	ID       string
	Title    string
}

// handlePathsHub serves the paths hub grouped by category.
func (s *Server) handlePathsHub(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	type hubPath struct {
		ID    string
		Title string
	}
	type hubGroup struct {
		Category string
		Paths    []hubPath
	}
	members := map[string][]hubPath{}
	var order []string
	for _, path := range s.deps.Paths.Paths() {
		if _, exists := members[path.Category]; !exists {
			order = append(order, path.Category)
		}
		members[path.Category] = append(members[path.Category], hubPath{ID: path.ID, Title: path.Title})
	}
	var groups []hubGroup
	for _, category := range order {
		groups = append(groups, hubGroup{Category: category, Paths: members[category]})
	}
	data := map[string]any{
		"Shell":  s.baseShell(locale, "Paths", "Paths", "/"+locale+"/learn/paths"),
		"Groups": groups,
	}
	s.render(writer, "path", data)
}

// handlePathOrCategory serves one variable-depth path landing, or the
// intentional empty state when a path category holds no published paths.
func (s *Server) handlePathOrCategory(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	id := request.PathValue("rest")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	if s.unavailable(writer) {
		return
	}
	if !content.SafePath(id) {
		s.notFound(writer, request, locale)
		return
	}
	if path, ok := s.deps.Paths.Path(id); ok {
		var phases []phaseView
		position := 0
		for index, phase := range path.Phases {
			view := phaseView{Number: index + 1, Name: phase.Name}
			for _, courseID := range phase.Courses {
				position++
				title := courseID
				if course, found := s.deps.Paths.Course(courseID); found {
					title = course.Title
				}
				view.Courses = append(view.Courses, positionedCourse{Position: position, ID: courseID, Title: title})
			}
			phases = append(phases, view)
		}
		data := map[string]any{
			"Shell":  s.baseShell(locale, path.Title, path.Title, "/"+locale+"/learn/paths/"+id),
			"Path":   path,
			"Phases": phases,
		}
		s.render(writer, "path", data)
		return
	}
	var names []string
	for _, path := range s.deps.Paths.Paths() {
		if path.Category == id {
			names = append(names, path.Title)
		}
	}
	if len(names) == 0 {
		for _, path := range s.deps.Paths.Paths() {
			if strings.HasPrefix(path.ID, id+"/") {
				names = append(names, path.Title)
			}
		}
	}
	data := map[string]any{
		"Shell":    s.baseShell(locale, "Paths", "Paths", "/"+locale+"/learn/paths/"+id),
		"Category": id,
		"Names":    names,
	}
	s.render(writer, "path", data)
}

// handleLegacy serves the legacy content bucket: learn/legacy/** pages load
// through the same file-backed catalog as lessons, addressed by their path
// below learn/legacy. Unknown routes keep the localized not-found experience.
func (s *Server) handleLegacy(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	rest := request.PathValue("rest")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	if !content.SafePath(rest) {
		s.notFound(writer, request, locale)
		return
	}
	page, ok := s.deps.Content.Find(locale, "legacy", rest)
	if !ok {
		s.notFound(writer, request, locale)
		return
	}
	data := map[string]any{
		"Shell":      s.baseShell(locale, page.Title, page.Description, "/"+locale+"/learn/legacy/"+rest),
		"Page":       page,
		"Kind":       "legacy",
		"BodyHTML":   template.HTML(page.BodyHTML),
		"PathID":     "",
		"PathActive": false,
		"TOC":        lessonTOC(locale, rest),
		"PrevURL":    "",
		"NextURL":    "",
	}
	s.render(writer, "lesson", data)
}

func (s *Server) handleSearch(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	if s.unavailable(writer) {
		return
	}
	// Query().Get keeps the first value for repeated fields, matching the
	// old codecs; an unparsable limit falls back to the default window.
	query := request.URL.Query()
	limit := 20
	if raw := query.Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}
	results := s.deps.Index.Search(query.Get("q"), locale, limit)
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = s.pages.ExecuteTemplate(writer, "search", map[string]any{"Results": results, "Query": query.Get("q")})
}

func (s *Server) handleBenchmark(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	filters := benchmark.DecodeFilters(request.URL.Query())
	result := s.deps.Benchmark.Score(filters)
	data := map[string]any{
		"Shell":   s.baseShell(locale, "AI Benchmark", "Compare models", "/"+locale+"/tools/ai-benchmark"),
		"Filters": filters,
		"Result":  result,
	}
	s.render(writer, "benchmark", data)
}

func (s *Server) handleCalculator(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	inputs := calculator.DecodeInputs(request.URL.Query())
	estimate := s.deps.Calculator.Compute(inputs)
	data := map[string]any{
		"Shell":   s.baseShell(locale, "Cost Calculator", "Living costs", "/"+locale+"/tools/cost-of-living-calculator"),
		"Inputs":  inputs,
		"Result":  estimate,
		"Known":   calculator.KnownCity(inputs.City),
		"Encoded": calculator.EncodeInputs(inputs),
	}
	s.render(writer, "calculator", data)
}

// handleCatchAll renders the localized not-found experience. Ordered
// redirects and the inventory run in Handler middleware before the mux.
func (s *Server) handleCatchAll(writer http.ResponseWriter, request *http.Request) {
	segments := strings.Split(strings.TrimPrefix(request.URL.Path, "/"), "/")
	locale := "en"
	if len(segments) > 0 && IsSupportedLocale(segments[0]) {
		locale = segments[0]
	}
	s.notFound(writer, request, locale)
}

func (s *Server) notFound(writer http.ResponseWriter, request *http.Request, locale string) {
	_ = request
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusNotFound)
	_ = s.pages.ExecuteTemplate(writer, "notfound", map[string]any{
		"Shell": s.baseShell(locale, "Not found", "Missing page", "/"+locale),
	})
}

// discoveryURLs lists canonical published routes for sitemap and feed.
func (s *Server) discoveryURLs() []string {
	urls := []string{"https://ayokoding.example/en", "https://ayokoding.example/id"}
	var lessons []string
	for _, locale := range []string{"en", "id"} {
		for _, page := range s.deps.Content.Published(locale) {
			lessons = append(lessons, "https://ayokoding.example/"+locale+"/learn/courses/"+page.Course+"/learning/"+page.Slug)
		}
	}
	sort.Strings(lessons)
	return append(urls, lessons...)
}

func (s *Server) handleSitemap(writer http.ResponseWriter, request *http.Request) {
	_ = request
	if s.unavailable(writer) {
		return
	}
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "application/xml; charset=utf-8")
	_ = s.pages.ExecuteTemplate(writer, "sitemap", map[string]any{"URLs": s.discoveryURLs()})
}

func (s *Server) handleFeed(writer http.ResponseWriter, request *http.Request) {
	_ = request
	if s.unavailable(writer) {
		return
	}
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
	entries := s.deps.Content.Published("en")
	_ = s.pages.ExecuteTemplate(writer, "feed", map[string]any{"Entries": entries})
}

// serverUnavailableHTML is the generic catalog-failure page. It names no
// source path, listener, environment value, or browser state.
const serverUnavailableHTML = `<!doctype html>` +
	`<html lang="en"><head><title>Unavailable</title></head>` +
	`<body><h1>Unavailable</h1><p>Try again later.</p></body></html>`

// unavailable answers the generic 500 when the source catalog is down and
// reports whether it did, so handlers share one failure branch.
func (s *Server) unavailable(writer http.ResponseWriter) bool {
	if s.deps.CatalogErr == nil {
		return false
	}
	s.serverError(writer)
	return true
}

// serverError answers a generic 500 for an unavailable catalog instead of
// masking the outage as an empty page or a miss.
func (s *Server) serverError(writer http.ResponseWriter) {
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusInternalServerError)
	_, _ = writer.Write([]byte(serverUnavailableHTML))
}

// robotsContract is the current crawling contract served as plain text.
const robotsContract = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n"

func (s *Server) handleRobots(writer http.ResponseWriter, request *http.Request) {
	_ = request
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_ = s.pages.ExecuteTemplate(writer, "robots", robotsContract)
}
