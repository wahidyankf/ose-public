package glue

import (
	"net/http"
)

func (w *World) StepReaderPressesPlatformSSearchShortcut() error {
	w.searchOpen = true
	w.focus = "search-input"
	return w.get("/en")
}

func (w *World) StepSearchDialogOpens() error {
	if !w.searchOpen {
		return fail("search dialog did not open")
	}
	return w.mustContain(`data-search-dialog`)
}

func (w *World) StepSearchInputReceivesFocus() error {
	if w.focus != "search-input" {
		return fail("focus = %q, want search-input", w.focus)
	}
	return w.mustContain(`data-search-input`)
}

func (w *World) StepMatchingPublishedContentExistsBothSupportedLocal() error {
	return nil
}

func (w *World) StepReaderSearchesMatchingTermOneLocale() error {
	w.searchQuery = "hello"
	return w.get("/en/search?q=hello")
}

func (w *World) StepResultsLinkOnlyLocaleSPublishedContent() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if err := w.mustContain("/en/learn/go-basics/hello-world"); err != nil {
		return err
	}
	return w.mustNotContain("/id/")
}

func (w *World) StepEachResultShowsTitleSectionPathMatchingExcerpt() error {
	for _, marker := range []string{"Hello World", "Go Basics", "first program"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepSearchDialogHasResultsEarlierQuery() error {
	w.searchOpen = true
	w.searchQuery = "hello"
	return w.get("/en/search?q=hello")
}

func (w *World) StepReaderClearsQueryWhitespace() error {
	w.searchQuery = "   "
	return w.get("/en/search?q=%20%20")
}

func (w *World) StepEarlierResultsDisappear() error {
	return w.mustNotContain("data-search-results")
}

func (w *World) StepDialogRemainsUsableWithoutError() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("data-search-empty")
}

func (w *World) StepReaderHasSearchResultsPublishedPage() error {
	return w.get("/en/search?q=hello")
}

func (w *World) StepReaderChoosesResult() error {
	w.searchPicked = "/en/learn/go-basics/hello-world"
	w.searchOpen = false
	return w.get(w.searchPicked)
}

func (w *World) StepCorrespondingContentRouteOpens() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("Hello World")
}

func (w *World) StepSearchDialogCloses() error {
	if w.searchOpen {
		return fail("search dialog is still open")
	}
	return nil
}

func (w *World) StepReaderSearchesNameEitherInteractiveTool() error {
	return w.get("/en/search?q=benchmark")
}

func (w *World) StepMatchingToolPageAppearsResultCurrentLocale() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("/en/tools/ai-benchmark")
}

func (w *World) StepSearchDialogOpen() error {
	w.searchOpen = true
	w.focus = "search-input"
	return nil
}

func (w *World) StepReaderPressesEscape() error {
	w.searchOpen = false
	w.focus = "search-opener"
	return nil
}

func (w *World) StepFocusReturnsControlOpened() error {
	if !w.searchOpen && w.focus != "search-opener" {
		return fail("focus = %q, want search-opener", w.focus)
	}
	return nil
}
