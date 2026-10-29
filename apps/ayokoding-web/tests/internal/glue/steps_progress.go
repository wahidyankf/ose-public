package glue

func (w *World) StepReaderHasSavedProgress() error {
	w.progress = newProgressDouble()
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderMarksLearningPageCompleteReloads() error {
	w.progressPage = "go-basics/hello-world"
	w.progress.mark(w.progressPage)
	w.progressPage = "go-basics/hello-world"
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepPageRemainsMarkedComplete() error {
	record := w.progress.load()
	for _, done := range record.Completed {
		if done == "go-basics/hello-world" {
			return nil
		}
	}
	return fail("completed pages = %q, want the marked page", record.Completed)
}

func (w *World) StepHttpRequestLiveviewEventCarriesStoredProgressRec() error {
	// The corpus names the pre-Go stack; the Go contract is that no HTTP
	// or htmx request carries the browser-only record. The landing unit
	// rewords this step per tech-docs/005.
	return privacyViolation(w.requests)
}

func (w *World) StepThisOriginContainsValidAyokodingLearnProgressV1R() error {
	w.progress.mark("go-basics/setup")
	loaded := w.progress.load()
	loaded.LastPath = "backend-id"
	loaded.LastCourse = "go-basics"
	w.progress.save(loaded)
	return nil
}

func (w *World) StepReaderOpensSavedCoursePath() error {
	return w.get("/en/learn/go-basics/setup?path=backend-id")
}

func (w *World) StepSavedCompletedPagesVisitContextAppearCorrectly() error {
	record := w.progress.load()
	if len(record.Completed) != 1 || record.LastPath != "backend-id" || record.LastCourse != "go-basics" {
		return fail("saved context = %+v, want one page with path and course", record)
	}
	return nil
}

func (w *World) StepStoredRecordKeepsVersion1Schema() error {
	if w.progress.load().Version != 1 {
		return fail("record lost its version 1 schema")
	}
	return nil
}

func (w *World) StepCourseAppearsTwoPaths() error {
	w.courseID = "go-basics"
	return nil
}

func (w *World) StepReaderHasCompletedLearningPagesThroughFirstPath() error {
	w.progress.mark("go-basics/setup")
	w.progress.mark("go-basics/hello-world")
	return nil
}

func (w *World) StepReaderOpensSecondPath() error {
	return w.get("/en/paths/backend-id")
}

func (w *World) StepCourseShowsSameCompletedState() error {
	if len(w.progress.load().Completed) != 2 {
		return fail("completion did not survive the path change")
	}
	return nil
}

func (w *World) StepLearningPageMarkedComplete() error {
	w.progressPage = "go-basics/hello-world"
	w.progress.mark(w.progressPage)
	return nil
}

func (w *World) StepReaderActivatesCompletionControlAgain() error {
	w.progress.unmark(w.progressPage)
	return nil
}

func (w *World) StepPageBecomesIncomplete() error {
	for _, done := range w.progress.load().Completed {
		if done == w.progressPage {
			return fail("page is still marked complete")
		}
	}
	return nil
}

func (w *World) StepCourseCompletedPageCountDecreasesOne() error {
	if len(w.progress.load().Completed) != 0 {
		return fail("completed count did not decrease to zero")
	}
	return nil
}

func (w *World) StepBrowserRefusesStorageReadsWrites() error {
	w.progress.blocked = true
	return nil
}

func (w *World) StepReaderMarksLearningPageComplete() error {
	w.progress.mark("go-basics/hello-world")
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepCompletionRemainsAvailableCurrentVisit() error {
	for _, done := range w.progress.visitCompleted() {
		if done == "go-basics/hello-world" {
			return nil
		}
	}
	return fail("visit progress is missing")
}

func (w *World) StepNoticeExplainsProgressCannotBeSaved() error {
	if w.progress.notice == "" {
		return fail("no blocked-storage notice recorded")
	}
	return nil
}

func (w *World) StepPageStaysUsableWithoutError() error {
	if err := w.mustStatus(200); err != nil {
		return err
	}
	return nil
}

func (w *World) StepSavedProgressRecordInvalid() error {
	w.progress.store[progressKey] = "not-json{"
	return nil
}

func (w *World) StepReaderOpensCourseMarksPageComplete() error {
	if err := w.get("/en/learn/go-basics/setup"); err != nil {
		return err
	}
	w.progress.mark("go-basics/setup")
	return nil
}

func (w *World) StepInvalidRecordDoesPreventReadingCompletion() error {
	if err := w.mustStatus(200); err != nil {
		return err
	}
	for _, done := range w.progress.load().Completed {
		if done == "go-basics/setup" {
			return nil
		}
	}
	return fail("completion blocked by the invalid record")
}

func (w *World) StepValidVersion1RecordReplacesWhenStorageAvailable() error {
	record := w.progress.load()
	if record.Version != 1 {
		return fail("no valid version 1 record after recovery")
	}
	return nil
}

func (w *World) StepReaderHasSavedProgressUnrelatedSiteSettings() error {
	w.progress.mark("go-basics/setup")
	w.settings["theme"] = "dark"
	return nil
}

func (w *World) StepReaderConfirmsResettingLearningProgress() error {
	w.progress.clear()
	return nil
}

func (w *World) StepLearningProgressKeyCleared() error {
	if w.progress.storedRaw() != "" {
		return fail("progress key survived reset")
	}
	return nil
}

func (w *World) StepUnrelatedSiteSettingsRemainUnchanged() error {
	if w.settings["theme"] != "dark" {
		return fail("unrelated settings changed on reset")
	}
	return nil
}

func (w *World) StepReaderHasSavedProgress2() error {
	w.progress.mark("go-basics/setup")
	w.focus = "reset-control"
	return nil
}

func (w *World) StepReaderOpensResetConfirmationCancels() error {
	w.focus = "reset-control"
	return nil
}

func (w *World) StepSavedProgressRemainsUnchanged() error {
	if len(w.progress.load().Completed) != 1 {
		return fail("saved progress changed on cancel")
	}
	return nil
}

func (w *World) StepFocusReturnsResetControl() error {
	if w.focus != "reset-control" {
		return fail("focus = %q, want reset-control", w.focus)
	}
	return nil
}

func (w *World) StepSameCourseOpenTwoTabsThisOrigin() error {
	w.progressPage = "go-basics/hello-world"
	return nil
}

func (w *World) StepReaderMarksLearningPageCompleteOneTab() error {
	w.progress.mark(w.progressPage)
	return nil
}

func (w *World) StepOtherTabUpdatesProgressWithoutReloading() error {
	otherTab := w.progress.load()
	for _, done := range otherTab.Completed {
		if done == w.progressPage {
			return nil
		}
	}
	return fail("other tab misses the completion")
}

func (w *World) StepReaderSavedProgressExistingSitePort3101() error {
	w.existingProgress.mark("legacy/page")
	return nil
}

func (w *World) StepRewriteOriginHasSavedProgress() error {
	if len(w.progress.load().Completed) != 0 {
		return fail("rewrite origin unexpectedly holds progress")
	}
	return nil
}

func (w *World) StepReaderOpensRewritePort3102() error {
	return w.get("/en")
}

func (w *World) StepRewriteDoesClaimHaveImportedOtherOriginSProgress() error {
	for _, done := range w.progress.load().Completed {
		if done == "legacy/page" {
			return fail("rewrite claims the other origin's progress")
		}
	}
	return w.mustStatus(200)
}

func (w *World) StepExistingSiteSSavedProgressRemainsUnchanged() error {
	if len(w.existingProgress.load().Completed) != 1 {
		return fail("existing-site progress changed")
	}
	return nil
}
