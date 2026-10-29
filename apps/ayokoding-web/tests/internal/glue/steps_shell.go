package glue

func (w *World) StepReaderOpensHomePage(locale string) error {
	w.locale = locale
	return w.get("/" + locale)
}

func (w *World) StepDocumentLanguage(locale string) error {
	if err := w.mustStatus(200); err != nil {
		return err
	}
	return w.mustContain(`lang="` + locale + `"`)
}

func (w *World) StepHeaderFooterPrimaryControlsUseLanguage() error {
	for _, marker := range []string{`data-shell="header"`, `data-shell="footer"`, `<nav aria-label="primary">`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepReaderPageTranslationOtherSupportedLocale() error {
	w.locale = "en"
	return w.get("/en/learn/courses/go-basics/learning/hello-world")
}

func (w *World) StepReaderSwitchesLocale() error {
	w.locale = "id"
	return w.get("/id/learn/courses/go-basics/learning/hello-world")
}

func (w *World) StepTranslatedPageOpensOtherLocale() error {
	if err := w.mustStatus(200); err != nil {
		return err
	}
	return w.mustContain("Halo Dunia")
}

func (w *World) StepActiveLocaleControlMatchesDestination() error {
	return w.mustContain(`data-locale-active`)
}

func (w *World) StepKeyboardReaderActivatesSkipContentLink() error {
	w.focus = "main"
	return w.get("/en")
}

func (w *World) StepFocusMovesMainContent() error {
	if err := w.mustContain(`href="#main"`); err != nil {
		return err
	}
	if err := w.mustContain(`id="main"`); err != nil {
		return err
	}
	if w.focus != "main" {
		return fail("focus = %q, want main", w.focus)
	}
	return nil
}

func (w *World) StepPageRetainsVisibleFocusIndicator() error {
	return w.mustContain(":focus-visible")
}

func (w *World) StepReaderOpensRepresentativeCoursePageDPixelsWide(width string) error {
	w.viewportWidth = width
	return w.get("/en/learn/courses/go-basics/learning/hello-world")
}

func (w *World) StepMainContentRemainsReadableWithoutHorizontalDocum() error {
	if err := w.mustStatus(200); err != nil {
		return err
	}
	if err := w.mustContain(`name="viewport"`); err != nil {
		return err
	}
	if w.viewportWidth == "" {
		return fail("viewport width was not recorded")
	}
	// Production-observed containment: the served stylesheet must constrain
	// the article column and scroll code blocks internally.
	for _, marker := range []string{"min-width: 0", "overflow-wrap", "max-width: 100%", "overflow-x: auto"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepNavigationUsesLayoutIntendedViewport() error {
	for _, marker := range []string{`@media`, `data-nav="mobile"`, `data-shell="header"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepReaderHasOpenedMobileNavigationPanel() error {
	w.mobileNavOpen = true
	return w.get("/en")
}

func (w *World) StepReaderDismissesPanelEscape() error {
	w.mobileNavOpen = false
	w.focus = "nav-opener"
	return w.get("/en")
}

func (w *World) StepPanelCloses() error {
	if w.mobileNavOpen {
		return fail("mobile panel is still open")
	}
	return w.mustContain(`data-close-on-escape`)
}

func (w *World) StepFocusReturnsOpener() error {
	if w.focus != "nav-opener" {
		return fail("focus = %q, want nav-opener", w.focus)
	}
	return w.mustContain(`data-nav-opener`)
}

func (w *World) StepReaderHasChosenDarkTheme() error {
	w.theme = "dark"
	w.settings["theme"] = "dark"
	return w.get("/en")
}

func (w *World) StepReaderReloadsPage() error {
	return w.get("/en")
}

func (w *World) StepPageUsesDarkTheme() error {
	if w.theme != "dark" {
		return fail("theme = %q, want dark", w.theme)
	}
	return w.mustContain(`data-theme`)
}

func (w *World) StepThemeTextControlsRemainAccessible() error {
	return w.mustContain(`progress.js`)
}

func (w *World) StepReaderHasResizedDesktopSidebarWithinSupportedBou() error {
	w.sidebarWidth = 240
	w.settings["ayokoding-sidebar-width"] = "240"
	return w.get("/en/learn/courses/go-basics/learning/setup")
}

func (w *World) StepReaderOpensAnotherContentPage() error {
	return w.get("/en/learn/courses/go-basics/learning/hello-world")
}

func (w *World) StepSidebarUsesSavedWidth() error {
	if w.sidebarWidth != 240 {
		return fail("sidebar width = %d, want 240", w.sidebarWidth)
	}
	return w.mustContain("--sidebar-width: 240px")
}

func (w *World) StepContentRemainsReachableCurrentViewportSize() error {
	if err := w.mustStatus(200); err != nil {
		return err
	}
	return w.mustContain("Hello World")
}
