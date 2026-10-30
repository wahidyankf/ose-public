package bdd

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerLocaldevSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.Given(`^the existing learning site is running on port 3101$`, world.StepExistingLearningSiteRunningPort3101)
	ctx.When(`^the rewrite starts without a port override$`, world.StepRewriteStartsWithoutPortOverride)
	ctx.Then(`^the rewrite serves its bilingual entry pages on port 3102$`, world.StepRewriteServesBilingualEntryPagesPort3102)
	ctx.Step(`^the existing site still answers requests on port 3101$`, world.StepExistingSiteStillAnswersRequestsPort3101)
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
	ctx.Given(`^the existing site and the rewrite development server are running$`, world.StepExistingSiteRewriteDevelopmentServerRunning)
	ctx.When(`^the rewrite browser acceptance suite starts$`, world.StepRewriteBrowserAcceptanceSuiteStarts)
	ctx.Then(`^it starts its own Phoenix server on port 3191$`, world.StepStartsOwnPhoenixServerPort3191)
	ctx.Step(`^it leaves both development servers running after the suite finishes$`, world.StepLeavesBothDevelopmentServersRunningAfterSuiteFin)
	ctx.Given(`^the shared Markdown and manifests have recorded byte hashes$`, world.StepSharedMarkdownManifestsHaveRecordedByteHashes)
	ctx.When(`^a developer starts the rewrite and browses its course pages$`, world.StepDeveloperStartsRewriteBrowsesCoursePages)
	ctx.Then(`^the Markdown and manifest byte hashes remain unchanged$`, world.StepMarkdownManifestByteHashesRemainUnchanged)
	ctx.Step(`^the rewrite does not run a content-index generator implicitly$`, world.StepRewriteDoesRunContentIndexGeneratorImplicitly)
	ctx.Given(`^other learning-content plans are unfinished$`, world.StepOtherLearningContentPlansUnfinished)
	ctx.Step(`^the current shared corpus has a valid committed state$`, world.StepCurrentSharedCorpusHasValidCommittedState)
	ctx.When(`^the rewrite loads that committed corpus$`, world.StepRewriteLoadsCommittedCorpus)
	ctx.Then(`^it serves the available content and manifests from that state$`, world.StepServesAvailableContentManifestsFromState)
	ctx.Step(`^it does not wait for another plan to finish$`, world.StepDoesWaitAnotherPlanFinish)
}
