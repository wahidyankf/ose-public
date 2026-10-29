package glue

import (
	"net/http"
)

func (w *World) StepReaderRequestsPublishedContentPage() error {
	return w.get("/en/learn/go-basics/hello-world")
}

func (w *World) StepHtmlContainsCurrentTitleDescriptionCanonicalUrl() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{"Hello World", "First program", `rel="canonical"`, "/en/learn/go-basics/hello-world"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepAlternateLanguageLinksIdentifyOnlyAvailableTrans() error {
	if err := w.mustContain(`hreflang="id"`); err != nil {
		return err
	}
	if err := w.mustContain("/id"); err != nil {
		return err
	}
	return w.mustNotContain(`hreflang="xx"`)
}

func (w *World) StepCorpusContainsPublishedPagesDraftPagesRemovedPag() error {
	return nil
}

func (w *World) StepCrawlerRequestsSitemap() error {
	return w.get("/sitemap.xml")
}

func (w *World) StepReceivesSuccessfulXmlSitemapResponse() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if contentType := w.header.Get("Content-Type"); contentType != "application/xml; charset=utf-8" {
		return fail("sitemap content type = %q", contentType)
	}
	return w.mustContain("<urlset")
}

func (w *World) StepSitemapListsCanonicalPublishedRoutes() error {
	return w.mustContain("/en/learn/go-basics/hello-world")
}

func (w *World) StepDraftRemovedRoutesAbsent() error {
	for _, marker := range []string{"draft-note", "removed-page"} {
		if err := w.mustNotContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepReaderRequestsRssFeed() error {
	return w.get("/feed.xml")
}

func (w *World) StepReceivesSuccessfulXmlFeedResponse() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	return w.mustContain("<rss")
}

func (w *World) StepFeedEntriesHaveExistingOrderingMetadataCanonical() error {
	for _, marker := range []string{"<item>", "Hello World", "https://ayokoding.example/en/learn/"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return w.mustNotContain("Draft")
}

func (w *World) StepDraftPagesAbsent() error {
	return w.mustNotContain("draft-note")
}

func (w *World) StepCrawlerRequestsRobotsDocument() error {
	return w.get("/robots.txt")
}

func (w *World) StepReceivesSuccessfulPlainTextRobotsResponse() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if contentType := w.header.Get("Content-Type"); contentType != "text/plain; charset=utf-8" {
		return fail("robots content type = %q", contentType)
	}
	return nil
}

func (w *World) StepCrawlingDirectivesSitemapReferenceMatchCurrentSi() error {
	for _, marker := range []string{"User-agent: *", "Allow: /", "Sitemap: /sitemap.xml"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}
