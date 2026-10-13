# Phase 1 Gherkin evidence

Created verbatim from prd.md: course-catalog.feature (6 scenarios), course-landing-header.feature (7), sidebar-course-categories.feature (4), course-metadata.feature (5); appended 1 scenario to index-generation.feature and 1 to navigation-api.feature (24 new scenarios total). Three domain READMEs indexed.

RED (ayokoding-www:test:coverage): fails; every undefined binding belongs to the 24 new scenarios (98 step-level lines, all under the six files above). No pre-existing scenario named.
RED (ayokoding-www-be-e2e:test:coverage): fails; names only "Course nodes carry their category".

specs-checker: PASS (1 cycle). All 4 new files byte-match prd.md Gherkin; exemptions directly above tags naming real targets; appended files add-only; README indexes present. (Checker noted files temporarily stashed for baseline capture; restored with git stash pop and verified present.)
