package bddintegration

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerRoutesSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.When(`^a visitor requests the root URL$`, world.StepVisitorRequestsRootUrl)
	ctx.Then(`^the visitor is redirected to "/en"$`, world.StepVisitorRedirectedEn)
	ctx.Step(`^the redirect does not loop$`, world.StepRedirectDoesLoop)
	ctx.When(`^a visitor requests "([^"]*)"$`, world.StepVisitorRequests)
	ctx.Then(`^the response permanently redirects with status 308 to "([^"]*)"$`, world.StepResponsePermanentlyRedirectsStatus308)
	ctx.Step(`^the query string is preserved$`, world.StepQueryStringPreserved)
	ctx.Step(`^the redirect does not depend on the old page still existing$`, world.StepRedirectDoesDependOldPageStillExisting)
	ctx.When(`^a reader opens a nested published lesson$`, world.StepReaderOpensNestedPublishedLesson)
	ctx.Then(`^the sidebar expands its ancestors and identifies the active page$`, world.StepSidebarExpandsAncestorsIdentifiesActivePage)
	ctx.Step(`^the breadcrumbs link to its current section and course ancestors$`, world.StepBreadcrumbsLinkCurrentSectionCourseAncestors)
	ctx.Step(`^every link stays within the selected locale$`, world.StepEveryLinkStaysWithinSelectedLocale)
	ctx.Given(`^a reader opened a lesson through a valid learning path$`, world.StepReaderOpenedLessonThroughValidLearningPath)
	ctx.When(`^the reader follows the next or previous lesson control$`, world.StepReaderFollowsNextPreviousLessonControl)
	ctx.Then(`^the destination follows the path's current phase and course order$`, world.StepDestinationFollowsPathSCurrentPhaseCourseOrder)
	ctx.Step(`^the path context remains in the destination URL$`, world.StepPathContextRemainsDestinationUrl)
	ctx.Given(`^a reader has followed an internal link to another content page$`, world.StepReaderHasFollowedInternalLinkAnotherContentPage)
	ctx.When(`^the reader navigates back$`, world.StepReaderNavigatesBack)
	ctx.Then(`^the previous content route and its URL state are restored$`, world.StepPreviousContentRouteUrlStateRestored)
	ctx.Step(`^navigation controls reflect the restored location$`, world.StepNavigationControlsReflectRestoredLocation)
	ctx.When(`^a reader opens a legacy archived page$`, world.StepReaderOpensLegacyArchivedPage)
	ctx.Then(`^the archived page shows its title and canonical body$`, world.StepLegacyPageServesCanonicalContent)
	ctx.When(`^a reader opens the "([^"]*)" page in the "([^"]*)" locale$`, world.StepReaderOpensPageInLocale)
	ctx.Then(`^the page lists its entries in the "([^"]*)" locale$`, world.StepPageListsEntriesInLocale)
}
