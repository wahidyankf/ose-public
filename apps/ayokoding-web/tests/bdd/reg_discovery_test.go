package bdd

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerDiscoverySteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.When(`^a reader requests a published content page$`, world.StepReaderRequestsPublishedContentPage)
	ctx.Then(`^its HTML contains the current title, description, and canonical URL$`, world.StepHtmlContainsCurrentTitleDescriptionCanonicalUrl)
	ctx.Step(`^alternate-language links identify only available translations$`, world.StepAlternateLanguageLinksIdentifyOnlyAvailableTrans)
	ctx.Given(`^the corpus contains published pages, draft pages, and a removed page$`, world.StepCorpusContainsPublishedPagesDraftPagesRemovedPag)
	ctx.When(`^a crawler requests the sitemap$`, world.StepCrawlerRequestsSitemap)
	ctx.Then(`^it receives a successful XML sitemap response$`, world.StepReceivesSuccessfulXmlSitemapResponse)
	ctx.Step(`^the sitemap lists canonical published routes$`, world.StepSitemapListsCanonicalPublishedRoutes)
	ctx.Step(`^draft and removed routes are absent$`, world.StepDraftRemovedRoutesAbsent)
	ctx.When(`^a reader requests the RSS feed$`, world.StepReaderRequestsRssFeed)
	ctx.Then(`^it receives a successful XML feed response$`, world.StepReceivesSuccessfulXmlFeedResponse)
	ctx.Step(`^feed entries have the existing ordering, metadata, and canonical destinations$`, world.StepFeedEntriesHaveExistingOrderingMetadataCanonical)
	ctx.Step(`^draft pages are absent$`, world.StepDraftPagesAbsent)
	ctx.When(`^a crawler requests the robots document$`, world.StepCrawlerRequestsRobotsDocument)
	ctx.Then(`^it receives a successful plain-text robots response$`, world.StepReceivesSuccessfulPlainTextRobotsResponse)
	ctx.Step(`^the crawling directives and sitemap reference match the current site contract$`, world.StepCrawlingDirectivesSitemapReferenceMatchCurrentSi)
}
