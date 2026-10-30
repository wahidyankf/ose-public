package web

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// Search fragment window from 004: default 20, range 1-50. The full-page
// route stays tolerant (default/clamp); the fragment answers malformed input
// with the inline invalid-search state instead.
const (
	defaultSearchLimit = 20
	maxSearchLimit     = 50
)

// errUnavailableCatalog marks the owned test fixture whose adapter cannot
// build the content catalog. It carries no filesystem location.
var errUnavailableCatalog = errors.New("ayokoding-web: content catalog unavailable")

// parseFragmentQuery decodes the htmx search fragment input with first-value
// semantics: repeated fields honor their first occurrence, exactly as the
// old codecs implement it. Only q and limit are accepted; a missing query,
// an out-of-range limit, an unexpected field, or a malformed encoding fails.
func parseFragmentQuery(raw string) (query string, limit int, ok bool) {
	values, err := url.ParseQuery(raw)
	if err != nil {
		return "", 0, false
	}
	for key := range values {
		if key != "q" && key != "limit" {
			return "", 0, false
		}
	}
	queries, present := values["q"]
	if !present || len(queries) == 0 {
		return "", 0, false
	}
	limit = defaultSearchLimit
	if raws, present := values["limit"]; present && len(raws) > 0 {
		parsed, err := strconv.Atoi(strings.TrimSpace(raws[0]))
		if err != nil || parsed < 1 || parsed > maxSearchLimit {
			return "", 0, false
		}
		limit = parsed
	}
	return queries[0], limit, true
}

// fragmentLocale derives the fragment locale from the mounted page route:
// the htmx current-URL header first, then the referrer, defaulting to
// English. A client-supplied locale field is never trusted (the query parser
// rejects it); only the page route decides.
func fragmentLocale(request *http.Request) string {
	for _, header := range []string{"HX-Current-URL", "Referer"} {
		raw := request.Header.Get(header)
		if raw == "" {
			continue
		}
		parsed, err := url.Parse(raw)
		if err != nil {
			continue
		}
		segments := strings.Split(strings.Trim(parsed.Path, "/"), "/")
		if len(segments) > 0 && IsSupportedLocale(segments[0]) {
			return segments[0]
		}
	}
	return "en"
}

// handleSearchFragment serves the htmx search dialog fragment. A
// whitespace-only input clears results without an error; malformed input
// answers the stable inline invalid-search state with an empty result list.
// The echoed query lets newer dialog input retire a late earlier result.
func (s *Server) handleSearchFragment(writer http.ResponseWriter, request *http.Request) {
	if s.deps.CatalogErr != nil {
		s.serverError(writer)
		return
	}
	query, limit, ok := parseFragmentQuery(request.URL.RawQuery)
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	if !ok {
		_ = s.pages.ExecuteTemplate(writer, "search-invalid", map[string]any{"Query": ""})
		return
	}
	if strings.TrimSpace(query) == "" {
		_ = s.pages.ExecuteTemplate(writer, "search", map[string]any{"Results": nil, "Query": query})
		return
	}
	results := s.deps.Index.Search(query, fragmentLocale(request), limit)
	_ = s.pages.ExecuteTemplate(writer, "search", map[string]any{"Results": results, "Query": query})
}
