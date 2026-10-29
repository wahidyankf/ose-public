package glue

import (
	"net/http"
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

func (w *World) StepOldContentUrlHasRedirectCurrentCommittedRedirect() error {
	w.pathID = "/en/old-guide"
	return nil
}

func (w *World) StepVisitorRequestsUrlQueryString() error {
	return w.get(w.pathID + "?from=local")
}

func (w *World) StepResponse308RedirectInventorySCanonicalDestinatio() error {
	if err := w.mustStatus(http.StatusPermanentRedirect); err != nil {
		return err
	}
	if location := w.location(); location != "/en/learn/courses/go-basics/learning/hello-world?from=local" {
		return fail("Location = %q, want canonical destination", location)
	}
	return nil
}

func (w *World) StepQueryStringPreserved() error {
	if location := w.location(); location != "/en/learn/courses/go-basics/learning/hello-world?from=local" {
		return fail("Location = %q, want preserved query", location)
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

func (w *World) StepVisitorRequestsLegacyDeepCourseURL() error {
	return w.get("/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/intro")
}
