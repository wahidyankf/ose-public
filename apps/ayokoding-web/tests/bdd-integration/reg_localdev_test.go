package bddintegration

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerLocaldevSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.When(`^the rewrite starts without a port override$`, world.StepRewriteStartsWithoutPortOverride)
	ctx.Then(`^the rewrite serves its bilingual entry pages on port 3102$`, world.StepRewriteServesBilingualEntryPagesPort3102)
	ctx.Given(`^AYOKODING_WEB_PORT is set to an available valid port$`, world.StepAyokodingWebPortSetAvailableValidPort)
	ctx.When(`^the rewrite starts$`, world.StepRewriteStarts)
	ctx.Then(`^the rewrite listens on that port$`, world.StepRewriteListensPort)
	ctx.Step(`^the existing site's configured port remains unchanged$`, world.StepExistingSiteSConfiguredPortRemainsUnchanged)
	ctx.Given(`^AYOKODING_WEB_PORT contains one valid port$`, world.StepAyokodingWebPortContainsOneValidPort)
	ctx.Step(`^the rewrite launcher receives a different valid port through its explicit port flag$`, world.StepRewriteLauncherReceivesDifferentValidPortThrough)
	ctx.Then(`^it listens on the explicit flag's port$`, world.StepListensExplicitFlagSPort)
	ctx.Step(`^it does not listen on the environment value's port$`, world.StepDoesListenEnvironmentValueSPort)
	ctx.Given(`^only the generic PORT variable contains a different valid port$`, world.StepOnlyGenericPortVariableContainsDifferentValidPor)
	ctx.When(`^the rewrite starts without a prefixed override or explicit port flag$`, world.StepRewriteStartsWithoutPrefixedOverrideExplicitPort)
	ctx.Then(`^the rewrite listens on port 3102$`, world.StepRewriteListensPort3102)
	ctx.Given(`^AYOKODING_WEB_PORT is set to an invalid port value$`, world.StepAyokodingWebPortSetInvalidPortValue)
	ctx.Then(`^startup fails with a diagnostic naming AYOKODING_WEB_PORT$`, world.StepStartupFailsDiagnosticNamingAyokodingWebPort)
	ctx.Step(`^no rewrite listener starts on a fallback port$`, world.StepRewriteListenerStartsFallbackPort)
	ctx.Given(`^the shared Markdown and manifests have recorded byte hashes$`, world.StepSharedMarkdownManifestsHaveRecordedByteHashes)
	ctx.When(`^a developer starts the rewrite and browses its course pages$`, world.StepDeveloperStartsRewriteBrowsesCoursePages)
	ctx.Then(`^the Markdown and manifest byte hashes remain unchanged$`, world.StepMarkdownManifestByteHashesRemainUnchanged)
	ctx.Given(`^AYOKODING_WEB_CONTENT_DIR and AYOKODING_WEB_MANIFESTS_DIR name another corpus root$`, world.StepCorpusDirsNameAnotherRoot)
	ctx.Then(`^the rewrite serves its pages and course paths from that corpus$`, world.StepRewriteServesPagesPathsFromCorpus)
	ctx.When(`^a reader requests the search, benchmark, and calculator fragments$`, world.StepReaderRequestsFragments)
	ctx.Then(`^each fragment returns results without the page layout$`, world.StepEachFragmentReturnsResultsWithoutPageLayout)
	ctx.When(`^a reader requests the asset "([^"]*)"$`, world.StepReaderRequestsAsset)
	ctx.Then(`^the asset responds with status "([^"]*)"$`, world.StepAssetRespondsWithStatus)
	ctx.When(`^the rewrite starts with the argument "([^"]*)"$`, world.StepRewriteStartsWithArgument)
	ctx.Then(`^startup fails with a message naming "([^"]*)"$`, world.StepStartupFailsWithMessageNaming)
	ctx.When(`^the rewrite starts with the "([^"]*)" fixture set by "([^"]*)"$`, world.StepRewriteStartsWithFixtureSetBy)
	ctx.Then(`^the course catalog answers with status "([^"]*)"$`, world.StepCourseCatalogAnswersWithStatus)
	ctx.Given(`^no fixture is selected$`, world.StepNoFixtureIsSelected)
	ctx.When(`^the rewrite starts with no fixture flag or fixture variable$`, world.StepRewriteStartsWithNoFixture)
	ctx.Then(`^the lesson "([^"]*)" answers with status "([^"]*)"$`, world.StepLessonAnswersWithStatus)
	ctx.Given(`^the "([^"]*)" fixture is selected$`, world.StepFixtureIsSelected)
	ctx.When(`^a reader requests the lesson "([^"]*)"$`, world.StepReaderRequestsLesson)
	ctx.Then(`^the lesson answers with status "([^"]*)"$`, world.StepLessonAnswersRequestedWithStatus)
	ctx.Given(`^AYOKODING_WEB_CONTENT_DIR names a content directory that cannot be read$`, world.StepContentDirCannotBeRead)
	ctx.When(`^the rewrite is launched and fails to start$`, world.StepRewriteLaunchedFailsToStart)
	ctx.Then(`^startup fails with a diagnostic naming AYOKODING_WEB_CONTENT_DIR$`, world.StepStartupFailsNamingContentDir)
	ctx.Step(`^no rewrite listener starts$`, world.StepNoRewriteListenerStarts)
}
