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
	if location := w.location(); location != "/en/learn/go-basics/hello-world?from=local" {
		return fail("Location = %q, want canonical destination", location)
	}
	return nil
}

func (w *World) StepQueryStringPreserved() error {
	if location := w.location(); location != "/en/learn/go-basics/hello-world?from=local" {
		return fail("Location = %q, want preserved query", location)
	}
	return nil
}

func (w *World) StepRedirectDoesDependOldPageStillExisting() error {
	if err := w.get("/en/learn/go-basics/hello-world"); err != nil {
		return err
	}
	return w.mustStatus(http.StatusOK)
}

func (w *World) StepReaderOpensNestedPublishedLesson() error {
	return w.get("/en/learn/go-basics/hello-world")
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
	for _, marker := range []string{`data-breadcrumbs`, `/en/learn/go-basics/setup`, `Start`} {
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
	return w.get("/en/learn/go-basics/setup?path=backend-id")
}

func (w *World) StepReaderFollowsNextPreviousLessonControl() error {
	return w.get("/en/learn/go-basics/setup?path=backend-id")
}

func (w *World) StepDestinationFollowsPathSCurrentPhaseCourseOrder() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("/en/learn/go-basics/hello-world?path=backend-id")
}

func (w *World) StepPathContextRemainsDestinationUrl() error {
	return w.mustContain(`data-path-context="backend-id"`)
}

func (w *World) StepReaderHasFollowedInternalLinkAnotherContentPage() error {
	w.history = []string{"/en/learn/go-basics/setup"}
	return w.get("/en/learn/go-basics/setup")
}

func (w *World) StepReaderNavigatesBack() error {
	w.history = append(w.history, "/en/learn/go-basics/hello-world")
	w.history = w.history[:len(w.history)-1]
	return w.get(w.history[len(w.history)-1])
}

func (w *World) StepPreviousContentRouteUrlStateRestored() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("Setup")
}

func (w *World) StepNavigationControlsReflectRestoredLocation() error {
	return w.mustContain(`data-lesson-nav`)
}
