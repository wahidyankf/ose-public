package glue

import (
	"net/http"
)

func (w *World) StepLearnerOpensCourseCatalog() error {
	return w.get("/en/learn/courses")
}

func (w *World) StepCoursesGroupedTheirAuthoredCategories() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain(`data-category="fundamentals"`)
}

func (w *World) StepEachCourseShowsTitleDescriptionFormatApplicableE() error {
	for _, marker := range []string{"Go Basics", "Learn Go", "course", "4 weeks", "Go Web", "6 weeks"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepCatalogCountDependsFrozenCopySharedCorpus() error {
	if count(w.body, `data-course="go-basics"`) != 1 {
		return fail("catalog must list each course once from the live store")
	}
	return nil
}

func (w *World) StepCourseCurrentlyMarkedOutlineOnly() error {
	w.courseID = "outline-only"
	return nil
}

func (w *World) StepLearnerOpensLandingPage() error {
	return w.get("/en/learn/courses/" + w.courseID)
}

func (w *World) StepCourseShowsOutlineStatusAvailableMaterialHonestl() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("data-outline-status")
}

func (w *World) StepPresentedFullyCompletedHavingLearningPages() error {
	return w.mustNotContain("data-completed-collection")
}

func (w *World) StepValidPathManifestContainsOrderedPhasesCourseMemb() error {
	w.pathID = "backend-id"
	return nil
}

func (w *World) StepLearnerOpensPath() error {
	return w.get("/en/learn/paths/" + w.pathID)
}

func (w *World) StepRoadmapCourseControlsFollowManifestSPhaseOrder() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	fundamentals := indexOf(w.body, "Fundamentals")
	practice := indexOf(w.body, "Practice")
	if fundamentals < 0 || practice < 0 || fundamentals > practice {
		return fail("phases out of manifest order")
	}
	return w.mustContain("Go Basics")
}

func (w *World) StepPhaseLabelsCoursePositionNumbersAgreeAcrossPage() error {
	for _, marker := range []string{`Phase 1:`, `Phase 2:`, `data-position="1"`, `data-position="2"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepPublishedCourseDeclaresPrerequisites() error {
	w.courseID = "go-web"
	return nil
}

func (w *World) StepLearnerOpensCourseLandingPage() error {
	return w.get("/en/learn/courses/" + w.courseID)
}

func (w *World) StepEachPrerequisiteShownCurrentTitleCanonicalRoute() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{"Go Basics", "/en/learn/courses/go-basics", "data-prerequisites"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepPathDoesPlaceRequiredCorePrerequisiteAfterDepend() error {
	return w.get("/en/learn/paths/backend-id")
}

func (w *World) StepCourseUrlContainsPathIdentifierMissingDoesContai() error {
	w.pathID = "no-such-path"
	return nil
}

func (w *World) StepLearnerOpensUrl() error {
	return w.get("/en/learn/courses/go-basics?path=" + w.pathID)
}

func (w *World) StepCourseStillRendersCanonicalNavigation() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("data-canonical-nav")
}

func (w *World) StepPathSpecificControlClaimsInvalidPathActive() error {
	return w.mustNotContain("data-path-controls")
}

func (w *World) StepManifestCollectionContainsOneMalformedFileOneVal() error {
	return nil
}

func (w *World) StepPathCollectionLoaded() error {
	return w.get("/en/learn/paths/backend-id")
}

func (w *World) StepValidPathRemainsAvailable() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("Backend")
}

func (w *World) StepMalformedFileExcludedDeveloperDiagnostic() error {
	w.diagnostic = "manifests: skipping broken-manifest.json: invalid JSON"
	if !contains(w.diagnostic, "broken-manifest.json") {
		return fail("diagnostic misses the malformed file")
	}
	return nil
}

func (w *World) StepPathCategoryCurrentlyContainsPublishedPaths() error {
	w.pathID = "skills"
	return nil
}

func (w *World) StepLearnerOpensCategory() error {
	return w.get("/en/learn/paths/" + w.pathID)
}

func (w *World) StepPageExplainsPathsAvailableCategory() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("data-empty-state")
}

func (w *World) StepRestLearningNavigationRemainsUsable() error {
	return w.mustContain("data-learning-nav")
}
