// Package glue shares the web-contract step definitions across the BDD
// suites. The unit suite in tests/bdd binds the whole corpus. The integration
// suite in tests/bdd-integration runs every feature except browser-progress,
// which the Playwright home binds by name; no scenario is exempt.
package glue
