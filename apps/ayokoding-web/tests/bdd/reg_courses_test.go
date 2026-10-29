package bdd

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerCoursesSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.When(`^a learner opens the course catalog$`, world.StepLearnerOpensCourseCatalog)
	ctx.Then(`^courses are grouped by their authored categories$`, world.StepCoursesGroupedTheirAuthoredCategories)
	ctx.Step(`^each course shows its title, description, format, and applicable effort estimate$`, world.StepEachCourseShowsTitleDescriptionFormatApplicableE)
	ctx.Step(`^no catalog count depends on a frozen copy of the shared corpus$`, world.StepCatalogCountDependsFrozenCopySharedCorpus)
	ctx.Given(`^a course is currently marked as outline-only$`, world.StepCourseCurrentlyMarkedOutlineOnly)
	ctx.When(`^a learner opens its landing page$`, world.StepLearnerOpensLandingPage)
	ctx.Then(`^the course shows its outline status and available material honestly$`, world.StepCourseShowsOutlineStatusAvailableMaterialHonestl)
	ctx.Step(`^it is not presented as fully completed by having no learning pages$`, world.StepPresentedFullyCompletedHavingLearningPages)
	ctx.Given(`^a valid path manifest contains ordered phases and course membership$`, world.StepValidPathManifestContainsOrderedPhasesCourseMemb)
	ctx.When(`^a learner opens that path$`, world.StepLearnerOpensPath)
	ctx.Then(`^its roadmap and course controls follow the manifest's phase order$`, world.StepRoadmapCourseControlsFollowManifestSPhaseOrder)
	ctx.Step(`^phase labels and course position numbers agree across the page$`, world.StepPhaseLabelsCoursePositionNumbersAgreeAcrossPage)
	ctx.Given(`^a published course declares prerequisites$`, world.StepPublishedCourseDeclaresPrerequisites)
	ctx.When(`^a learner opens its course landing page$`, world.StepLearnerOpensCourseLandingPage)
	ctx.Then(`^each prerequisite is shown with its current title and canonical route$`, world.StepEachPrerequisiteShownCurrentTitleCanonicalRoute)
	ctx.Step(`^the path does not place a required core prerequisite after its dependent course$`, world.StepPathDoesPlaceRequiredCorePrerequisiteAfterDepend)
	ctx.Given(`^a course URL contains a path identifier that is missing or does not contain that course$`, world.StepCourseUrlContainsPathIdentifierMissingDoesContai)
	ctx.When(`^a learner opens that URL$`, world.StepLearnerOpensUrl)
	ctx.Then(`^the course still renders with canonical navigation$`, world.StepCourseStillRendersCanonicalNavigation)
	ctx.Step(`^no path-specific control claims the invalid path is active$`, world.StepPathSpecificControlClaimsInvalidPathActive)
	ctx.Given(`^the manifest collection contains one malformed file and one valid path$`, world.StepManifestCollectionContainsOneMalformedFileOneVal)
	ctx.When(`^the path collection is loaded$`, world.StepPathCollectionLoaded)
	ctx.Then(`^the valid path remains available$`, world.StepValidPathRemainsAvailable)
	ctx.Step(`^the malformed file is excluded with a developer diagnostic$`, world.StepMalformedFileExcludedDeveloperDiagnostic)
	ctx.Given(`^a path category currently contains no published paths$`, world.StepPathCategoryCurrentlyContainsPublishedPaths)
	ctx.When(`^a learner opens that category$`, world.StepLearnerOpensCategory)
	ctx.Then(`^the page explains that no paths are available in that category$`, world.StepPageExplainsPathsAvailableCategory)
	ctx.Step(`^the rest of the learning navigation remains usable$`, world.StepRestLearningNavigationRemainsUsable)
}
