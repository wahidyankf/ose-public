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

// Deps wires the in-memory doubles behind the router. P2 swaps each double
// for its file-backed adapter without changing the route table.
type Deps struct {
	Content    *content.FakeStore
	Paths      *coursepaths.FakeStore
	Index      *search.FakeIndex
	Benchmark  *benchmark.Engine
	Calculator *calculator.Engine
	Redirects  map[string]string
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
	server.mux.HandleFunc("GET /{$}", server.handleRoot)
	server.mux.HandleFunc("GET /sitemap.xml", server.handleSitemap)
	server.mux.HandleFunc("GET /feed.xml", server.handleFeed)
	server.mux.HandleFunc("GET /robots.txt", server.handleRobots)
	server.mux.HandleFunc("GET /{locale}/search", server.handleSearch)
	server.mux.HandleFunc("GET /{locale}/tools/ai-benchmark", server.handleBenchmark)
	server.mux.HandleFunc("GET /{locale}/tools/cost-of-living-calculator", server.handleCalculator)
	server.mux.HandleFunc("GET /{locale}/learn/courses", server.handleCatalog)
	server.mux.HandleFunc("GET /{locale}/paths/{id}", server.handlePath)
	server.mux.HandleFunc("GET /{locale}/learn/{course}", server.handleCourse)
	server.mux.HandleFunc("GET /{locale}/learn/{course}/{lesson}", server.handleLesson)
	server.mux.HandleFunc("GET /{locale}", server.handleHome)
	server.mux.HandleFunc("GET /", server.handleCatchAll)
	return server
}

// Handler exposes the route table for in-process tests; no socket is bound.
// Uppercase locale prefixes resolve to lowercase before routing so the
// locale wildcard never serves them directly.
func (s *Server) Handler() http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		segments := strings.Split(strings.TrimPrefix(request.URL.Path, "/"), "/")
		if len(segments) > 0 && segments[0] != "" {
			lower := strings.ToLower(segments[0])
			if segments[0] != lower && IsSupportedLocale(lower) {
				segments[0] = lower
				permanentRedirect(writer, request, "/"+strings.Join(segments, "/"))
				return
			}
		}
		s.mux.ServeHTTP(writer, request)
	})
}

// permanentRedirect issues a 308 preserving the request query string.
func permanentRedirect(writer http.ResponseWriter, request *http.Request, destination string) {
	if raw := request.URL.RawQuery; raw != "" {
		destination += "?" + raw
	}
	http.Redirect(writer, request, destination, http.StatusPermanentRedirect)
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
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := s.pages.ExecuteTemplate(writer, name, data); err != nil {
		http.Error(writer, "render", http.StatusInternalServerError)
	}
}

func (s *Server) handleRoot(writer http.ResponseWriter, request *http.Request) {
	permanentRedirect(writer, request, "/en")
}

func (s *Server) handleHome(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	s.render(writer, "home", map[string]any{"Shell": s.baseShell(locale, "AyoKoding", "Learn", "/"+locale)})
}

func (s *Server) handleLesson(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	course := request.PathValue("course")
	lesson := request.PathValue("lesson")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	page, ok := s.deps.Content.Find(locale, course, lesson)
	if !ok {
		s.notFound(writer, request, locale)
		return
	}
	pathID := request.URL.Query().Get("path")
	pathActive := pathID != "" && s.deps.Paths.PathContains(pathID, course)
	prevURL, nextURL := s.neighbors(locale, course, lesson, pathID, pathActive)
	data := map[string]any{
		"Shell":      s.baseShell(locale, page.Title, page.Description, "/"+locale+"/learn/"+course+"/"+lesson),
		"Page":       page,
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
func (s *Server) neighbors(locale, course, lesson, pathID string, pathActive bool) (prev, next string) {
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
			prev = "/" + locale + "/learn/" + course + "/" + slugs[index-1] + suffix
		}
		if index+1 < len(slugs) {
			next = "/" + locale + "/learn/" + course + "/" + slugs[index+1] + suffix
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
		"Shell":         s.baseShell(locale, course.Title, course.Description, "/"+locale+"/learn/"+courseID),
		"Course":        course,
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

// handlePath serves one roadmap, or the intentional empty state when a path
// category currently holds no published paths.
func (s *Server) handlePath(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	id := request.PathValue("id")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
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
			"Shell":  s.baseShell(locale, path.Title, path.Title, "/"+locale+"/paths/"+id),
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
	data := map[string]any{
		"Shell":    s.baseShell(locale, "Paths", "Paths", "/"+locale+"/paths/"+id),
		"Category": id,
		"Names":    names,
	}
	s.render(writer, "path", data)
}

func (s *Server) handleSearch(writer http.ResponseWriter, request *http.Request) {
	locale := request.PathValue("locale")
	if !IsSupportedLocale(locale) {
		s.notFound(writer, request, "en")
		return
	}
	query := request.URL.Query()
	limit := 20
	if raw := query.Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}
	results := s.deps.Index.Search(query.Get("q"), locale, limit)
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = s.pages.ExecuteTemplate(writer, "search", map[string]any{"Results": results})
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

// handleCatchAll resolves the redirect inventory and the localized
// not-found experience.
func (s *Server) handleCatchAll(writer http.ResponseWriter, request *http.Request) {
	path := request.URL.Path
	segments := strings.Split(strings.TrimPrefix(path, "/"), "/")
	if destination, err := CanonicalRedirect(s.deps.Redirects, path); err == nil {
		permanentRedirect(writer, request, destination)
		return
	}
	locale := "en"
	if len(segments) > 0 && IsSupportedLocale(segments[0]) {
		locale = segments[0]
	}
	s.notFound(writer, request, locale)
}

func (s *Server) notFound(writer http.ResponseWriter, request *http.Request, locale string) {
	_ = request
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
			lessons = append(lessons, "https://ayokoding.example/"+locale+"/learn/"+page.Course+"/"+page.Slug)
		}
	}
	sort.Strings(lessons)
	return append(urls, lessons...)
}

func (s *Server) handleSitemap(writer http.ResponseWriter, request *http.Request) {
	_ = request
	writer.Header().Set("Content-Type", "application/xml; charset=utf-8")
	_ = s.pages.ExecuteTemplate(writer, "sitemap", map[string]any{"URLs": s.discoveryURLs()})
}

func (s *Server) handleFeed(writer http.ResponseWriter, request *http.Request) {
	_ = request
	writer.Header().Set("Content-Type", "application/xml; charset=utf-8")
	entries := s.deps.Content.Published("en")
	_ = s.pages.ExecuteTemplate(writer, "feed", map[string]any{"Entries": entries})
}

// robotsContract is the current crawling contract served as plain text.
const robotsContract = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n"

func (s *Server) handleRobots(writer http.ResponseWriter, request *http.Request) {
	_ = request
	writer.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_ = s.pages.ExecuteTemplate(writer, "robots", robotsContract)
}
