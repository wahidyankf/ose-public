package bddintegration

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerShellSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.When(`^a reader opens the "([^"]*)" home page$`, world.StepReaderOpensHomePage)
	ctx.Then(`^the document language is "([^"]*)"$`, world.StepDocumentLanguage)
	ctx.Step(`^the header, footer, and primary controls use that language$`, world.StepHeaderFooterPrimaryControlsUseLanguage)
	ctx.Given(`^a reader is on a page with a translation in the other supported locale$`, world.StepReaderPageTranslationOtherSupportedLocale)
	ctx.When(`^the reader switches locale$`, world.StepReaderSwitchesLocale)
	ctx.Then(`^the translated page opens in the other locale$`, world.StepTranslatedPageOpensOtherLocale)
	ctx.Step(`^the active locale control matches the destination$`, world.StepActiveLocaleControlMatchesDestination)
	ctx.When(`^a keyboard reader activates the skip-to-content link$`, world.StepKeyboardReaderActivatesSkipContentLink)
	ctx.Then(`^focus moves to the main content$`, world.StepFocusMovesMainContent)
	ctx.Step(`^the page retains a visible focus indicator$`, world.StepPageRetainsVisibleFocusIndicator)
	ctx.When(`^a reader opens a representative course page at "(\d+)" pixels wide$`, world.StepReaderOpensRepresentativeCoursePageDPixelsWide)
	ctx.Then(`^the main content remains readable without horizontal document scrolling$`, world.StepMainContentRemainsReadableWithoutHorizontalDocum)
	ctx.Step(`^the navigation uses the layout intended for that viewport$`, world.StepNavigationUsesLayoutIntendedViewport)
	ctx.Given(`^a reader has opened the mobile navigation panel$`, world.StepReaderHasOpenedMobileNavigationPanel)
	ctx.When(`^the reader dismisses the panel with Escape$`, world.StepReaderDismissesPanelEscape)
	ctx.Then(`^the panel closes$`, world.StepPanelCloses)
	ctx.Step(`^focus returns to its opener$`, world.StepFocusReturnsOpener)
	ctx.Given(`^a reader has chosen the dark theme$`, world.StepReaderHasChosenDarkTheme)
	ctx.When(`^the reader reloads the page$`, world.StepReaderReloadsPage)
	ctx.Then(`^the page uses the dark theme$`, world.StepPageUsesDarkTheme)
	ctx.Step(`^theme text and controls remain accessible$`, world.StepThemeTextControlsRemainAccessible)
	ctx.Given(`^a reader has resized the desktop sidebar within the supported bounds$`, world.StepReaderHasResizedDesktopSidebarWithinSupportedBou)
	ctx.When(`^the reader opens another content page$`, world.StepReaderOpensAnotherContentPage)
	ctx.Then(`^the sidebar uses the saved width$`, world.StepSidebarUsesSavedWidth)
	ctx.Step(`^the content remains reachable at the current viewport size$`, world.StepContentRemainsReachableCurrentViewportSize)
}
