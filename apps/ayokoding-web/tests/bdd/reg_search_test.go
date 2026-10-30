package bdd

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerSearchSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.When(`^a reader presses the platform's search shortcut$`, world.StepReaderPressesPlatformSSearchShortcut)
	ctx.Then(`^the search dialog opens$`, world.StepSearchDialogOpens)
	ctx.Step(`^the search input receives focus$`, world.StepSearchInputReceivesFocus)
	ctx.Given(`^matching published content exists in both supported locales$`, world.StepMatchingPublishedContentExistsBothSupportedLocal)
	ctx.When(`^a reader searches for the matching term in one locale$`, world.StepReaderSearchesMatchingTermOneLocale)
	ctx.Then(`^results link only to that locale's published content$`, world.StepResultsLinkOnlyLocaleSPublishedContent)
	ctx.Step(`^each result shows a title, section path, and matching excerpt$`, world.StepEachResultShowsTitleSectionPathMatchingExcerpt)
	ctx.Given(`^the search dialog has results for an earlier query$`, world.StepSearchDialogHasResultsEarlierQuery)
	ctx.When(`^the reader clears the query to whitespace$`, world.StepReaderClearsQueryWhitespace)
	ctx.Then(`^the earlier results disappear$`, world.StepEarlierResultsDisappear)
	ctx.Step(`^the dialog remains usable without an error$`, world.StepDialogRemainsUsableWithoutError)
	ctx.Given(`^a reader has search results for a published page$`, world.StepReaderHasSearchResultsPublishedPage)
	ctx.When(`^the reader chooses that result$`, world.StepReaderChoosesResult)
	ctx.Then(`^the corresponding content route opens$`, world.StepCorrespondingContentRouteOpens)
	ctx.Step(`^the search dialog closes$`, world.StepSearchDialogCloses)
	ctx.When(`^a reader searches for the name of either interactive tool$`, world.StepReaderSearchesNameEitherInteractiveTool)
	ctx.Then(`^the matching tool page appears as a result in the current locale$`, world.StepMatchingToolPageAppearsResultCurrentLocale)
	ctx.Given(`^the search dialog is open$`, world.StepSearchDialogOpen)
	ctx.When(`^the reader presses Escape$`, world.StepReaderPressesEscape)
	ctx.Step(`^focus returns to the control that opened it$`, world.StepFocusReturnsControlOpened)
}
