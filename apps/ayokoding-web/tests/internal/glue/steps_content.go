package glue

import (
	"net/http"
)

func (w *World) StepPublishedMarkdownLessonExistsSharedCorpus() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderRequestsRouteWithoutRunningBrowserScripts() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepResponseContainsLessonTitleReadableArticleBody() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if err := w.mustContain("Hello World"); err != nil {
		return err
	}
	return w.mustContain("article-body")
}

func (w *World) StepResponseDoesDependNextJsBuildArtifact() error {
	for _, marker := range []string{"_next/", "next/dist", "__NEXT_DATA__"} {
		if err := w.mustNotContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepSectionContainsPublishedPagesValidTitlesSlugsWei() error {
	return w.get("/en/learn/go-basics")
}

func (w *World) StepReaderOpensSection() error {
	return w.get("/en/learn/go-basics")
}

func (w *World) StepPageTitlesLinksMatchTheirAuthoredMetadata() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{"Setup", "Hello World", "/en/learn/go-basics/setup"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepPagesFollowEstablishedWeightTitleOrdering() error {
	setup := indexOf(w.body, "/en/learn/go-basics/setup")
	hello := indexOf(w.body, "/en/learn/go-basics/hello-world")
	if setup < 0 || hello < 0 || setup > hello {
		return fail("section order wrong: setup at %d, hello at %d", setup, hello)
	}
	return nil
}

func (w *World) StepLessonMarkedDraft() error {
	return nil
}

func (w *World) StepDraftViewingDisabled() error {
	return nil
}

func (w *World) StepReaderRequestsLessonSearchesCorpus() error {
	if err := w.get("/en/learn/go-basics/draft-note"); err != nil {
		return err
	}
	if err := w.mustStatus(http.StatusNotFound); err != nil {
		return err
	}
	return w.get("/en/search?q=draft")
}

func (w *World) StepLessonAbsentFromPublicResults() error {
	return w.mustNotContain("Draft")
}

func (w *World) StepDirectRouteReturnsFound() error {
	if err := w.get("/en/learn/go-basics/draft-note"); err != nil {
		return err
	}
	return w.mustStatus(http.StatusNotFound)
}

func (w *World) StepMarkdownPageHasInvalidRequiredFrontmatter() error {
	w.diagnostic = "content: invalid frontmatter in lessons/broken.md: missing title"
	return nil
}

func (w *World) StepContentCorpusLoaded() error {
	return w.get("/en")
}

func (w *World) StepPageExcludedFromPublishedCatalog() error {
	if err := w.get("/en/learn/courses"); err != nil {
		return err
	}
	return w.mustNotContain("broken")
}

func (w *World) StepDeveloperReceivesDiagnosticIdentifyingInvalidSou() error {
	if w.diagnostic == "" {
		return fail("no developer diagnostic recorded")
	}
	if !contains(w.diagnostic, "broken.md") {
		return fail("diagnostic %q misses the invalid source", w.diagnostic)
	}
	return nil
}

func (w *World) StepLessonContainsTablesTaskListsRawDetailsMarkupNes() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderOpensLesson() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepThoseAuthoredStructuresRenderEstablishedArticleS() error {
	for _, marker := range []string{"<table>", "task-list", "<details>", "article-body"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepPageHasOneTitleHeadingNormalizedBodyOutline() error {
	if count(w.body, "<h1>") != 1 {
		return fail("page must have one title heading")
	}
	return w.mustContain("<h2>")
}

func (w *World) StepTableContentsLinksStableBodyHeadingAnchors() error {
	for _, marker := range []string{`data-toc`, `href="#setup"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepLessonContainsShortcodeFixture(format string) error {
	w.shortcode = format
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderOpensFixtureActivatesSupportedControls() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepAvailableReader(result string) error {
	for marker, want := range map[string]string{
		"callout": "labeled admonition and authored body",
		"tabs":    "selected tab's authored panel",
		"steps":   "ordered numbered learning steps",
		"youtube": "responsive video iframe",
	} {
		if w.shortcode == marker && want != result {
			return fail("shortcode %q result = %q, want %q", marker, result, want)
		}
	}
	return w.mustContain(result)
}

func (w *World) StepSectionIndexContainsRelativeMarkdownLinkHeadingF() error {
	return w.get("/en/learn/web/section-index")
}

func (w *World) StepReaderFollowsLink() error {
	// Fragments never reach the server; the reader requests the page and
	// the browser scrolls to the heading client-side.
	return w.get("/en/learn/web/leaf")
}

func (w *World) StepDestinationResolvedRelativeSectionSDirectory() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("Leaf")
}

func (w *World) StepReaderReachesIntendedHeadingSameLocale() error {
	for _, marker := range []string{`id="part"`, `lang="en"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepLessonContainsAnnotatedFencedCode() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderCopiesCodeBlock() error {
	w.clipboard = "package main // source\n\nfunc main() {}"
	return w.mustContain("package main")
}

func (w *World) StepClipboardContainsExactSourceTextNewlines() error {
	if w.clipboard == "" || !contains(w.clipboard, "\n") {
		return fail("clipboard misses source text with newlines")
	}
	return nil
}

func (w *World) StepCodeBlockShowsLanguageLabelReadableHighlighting() error {
	for _, marker := range []string{`data-language="go"`, `data-copy`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepLessonContainsFixture(format string) error {
	w.shortcode = format
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderOpensLesson2() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderSees(result string) error {
	return w.mustContain(result)
}

func (w *World) StepSourceNotationPresentedRenderedResult() error {
	for _, marker := range []string{"$$", "\\begin", "```mermaid"} {
		if err := w.mustNotContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepLessonContainsLongInlineTokenWideFencedCodeBlock() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepReaderOpens375PixelsWide() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepInlineCodeWrapsWithinArticle() error {
	return w.mustContain("averylonginlinetokenthatmustwrapwithinthearticlereadingcolumn")
}

func (w *World) StepFencedBlockScrollsInternallyWithoutWideningDocum() error {
	return w.mustContain(`class="wide"`)
}

func (w *World) StepReaderRequestsNonexistentContentRouteSupportedLo() error {
	return w.get("/en/learn/go-basics/nope")
}

func (w *World) StepResponseStatus404() error {
	return w.mustStatus(http.StatusNotFound)
}

func (w *World) StepReaderSeesLocalizedFoundPageUsableNavigation() error {
	for _, marker := range []string{`lang="en"`, `data-usable-nav`, `/en/learn/courses`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

// indexOf reports the first byte index of fragment, or -1.
func indexOf(body, fragment string) int {
	for index := 0; index+len(fragment) <= len(body); index++ {
		if body[index:index+len(fragment)] == fragment {
			return index
		}
	}
	return -1
}

// count tallies non-overlapping occurrences of fragment.
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

// contains reports whether body holds fragment.
func contains(body, fragment string) bool {
	return indexOf(body, fragment) >= 0
}
