package glue

import (
	"net/http"
	"strings"
)

func (w *World) StepVisitorRequestsRootUrl() error {
	return w.get("/")
}

func (w *World) StepVisitorRedirectedEn() error {
	if err := w.mustStatus(http.StatusPermanentRedirect); err != nil {
		return err
	}
	if location := w.location(); location != "/en" {
		return fail("root Location = %q, want /en", location)
	}
	return nil
}

func (w *World) StepRedirectDoesLoop() error {
	if err := w.get("/en"); err != nil {
		return err
	}
	return w.mustStatus(http.StatusOK)
}

func (w *World) StepVisitorRequests(source string) error {
	w.pathID = source
	return w.get(source)
}

func (w *World) StepResponsePermanentlyRedirectsStatus308(destination string) error {
	if err := w.mustStatus(http.StatusPermanentRedirect); err != nil {
		return err
	}
	if location := w.location(); location != destination {
		return fail("Location = %q, want %q", location, destination)
	}
	return nil
}

// StepQueryStringPreserved checks that the redirect keeps the request's query.
// A request without a query has nothing to preserve, so the check passes.
func (w *World) StepQueryStringPreserved() error {
	index := strings.Index(w.pathID, "?")
	if index < 0 {
		return nil
	}
	if query := w.pathID[index:]; !strings.HasSuffix(w.location(), query) {
		return fail("Location = %q, want preserved query %q", w.location(), query)
	}
	return nil
}

func (w *World) StepRedirectDoesDependOldPageStillExisting() error {
	if err := w.get("/en/learn/courses/go-basics/learning/hello-world"); err != nil {
		return err
	}
	return w.mustStatus(http.StatusOK)
}

func (w *World) StepReaderOpensNestedPublishedLesson() error {
	return w.get("/en/learn/courses/go-basics/learning/hello-world")
}

func (w *World) StepSidebarExpandsAncestorsIdentifiesActivePage() error {
	for _, marker := range []string{`data-sidebar-nav`, `data-active-page="hello-world"`, `aria-current="page"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepBreadcrumbsLinkCurrentSectionCourseAncestors() error {
	for _, marker := range []string{`data-breadcrumbs`, `/en/learn/courses/go-basics/learning/setup`, `Start`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepEveryLinkStaysWithinSelectedLocale() error {
	// Content and navigation links stay in-locale; only the locale
	// switch intentionally targets the other locale home.
	for _, marker := range []string{`href="/id/learn`, `href="//`} {
		if err := w.mustNotContain(marker); err != nil {
			return err
		}
	}
	return w.mustContain(`data-locale-switch`)
}

func (w *World) StepReaderOpenedLessonThroughValidLearningPath() error {
	w.pathID = "backend-id"
	return w.get("/en/learn/courses/go-basics/learning/setup?path=backend-id")
}

func (w *World) StepReaderFollowsNextPreviousLessonControl() error {
	return w.get("/en/learn/courses/go-basics/learning/setup?path=backend-id")
}

func (w *World) StepDestinationFollowsPathSCurrentPhaseCourseOrder() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("/en/learn/courses/go-basics/learning/hello-world?path=backend-id")
}

func (w *World) StepPathContextRemainsDestinationUrl() error {
	return w.mustContain(`data-path-context="backend-id"`)
}

func (w *World) StepReaderHasFollowedInternalLinkAnotherContentPage() error {
	w.history = []string{"/en/learn/courses/go-basics/learning/setup"}
	if err := w.get("/en/learn/courses/go-basics/learning/setup"); err != nil {
		return err
	}
	// Record the first GET body so the back-navigation Then can prove the
	// re-GET returns byte-identical content.
	w.r6FirstBody = w.body
	// Follow an internal link forward so back has somewhere to return from.
	w.history = append(w.history, "/en/learn/courses/go-basics/learning/hello-world")
	return w.get("/en/learn/courses/go-basics/learning/hello-world")
}

func (w *World) StepReaderNavigatesBack() error {
	if len(w.history) == 0 {
		return fail("no history to navigate back through")
	}
	w.history = w.history[:len(w.history)-1]
	return w.get(w.history[len(w.history)-1])
}

func (w *World) StepPreviousContentRouteUrlStateRestored() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if err := w.mustContain("Setup"); err != nil {
		return err
	}
	// Byte-identical re-GET proof: the restored body must equal the first GET.
	if w.r6FirstBody == "" {
		return fail("no first GET body recorded for back-navigation comparison")
	}
	if w.body != w.r6FirstBody {
		return fail("back-navigation body differs from first GET (%d vs %d bytes)", len(w.body), len(w.r6FirstBody))
	}
	return nil
}

func (w *World) StepNavigationControlsReflectRestoredLocation() error {
	return w.mustContain(`data-lesson-nav`)
}

func (w *World) StepReaderOpensLegacyArchivedPage() error {
	return w.get("/en/learn/legacy/software-engineering")
}

func (w *World) StepLegacyPageServesCanonicalContent() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{"Legacy Software Engineering", "Archived canonical content", `lang="en"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

// learnPages maps the learn-entry page names to the route and to one entry
// link the page lists. The learn home lists its sections as links (paths,
// courses, legacy); the paths hub lists the canned learning path.
var learnPages = map[string]struct{ route, entry string }{
	"learn home": {route: "/learn", entry: "/learn/courses"},
	"paths hub":  {route: "/learn/paths", entry: "/learn/paths/backend-id"},
}

// StepReaderOpensPageInLocale requests a learn-entry page in the given locale.
func (w *World) StepReaderOpensPageInLocale(page, locale string) error {
	known, ok := learnPages[page]
	if !ok {
		return fail("unknown learn-entry page %q", page)
	}
	w.learnPage = page
	return w.get("/" + locale + known.route)
}

// StepPageListsEntriesInLocale checks the page lists its entry under the
// locale and links to no other locale.
func (w *World) StepPageListsEntriesInLocale(locale string) error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	known, ok := learnPages[w.learnPage]
	if !ok {
		return fail("no learn-entry page was opened")
	}
	if err := w.mustContain("/" + locale + known.entry); err != nil {
		return err
	}
	return w.mustNotContain(`href="//`)
}
