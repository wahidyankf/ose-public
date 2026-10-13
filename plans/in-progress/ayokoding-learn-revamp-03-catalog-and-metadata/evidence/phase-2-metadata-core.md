# Phase 2 metadata core evidence

GREEN: course-categories.test.ts, course-metadata.test.ts (6), course-effort.test.ts, course-start.test.ts (19 tests across 4 files, after fixing checkCourseMetadata to name every failing field); course-effort-scan.unit.test.ts, course-corpus-check.unit.test.ts, repository-fs.unit.test.ts (6 tests); schemas.test.ts (7 tests, tolerant parse).
GREEN: navigation-api.steps.ts unit (19 tests) including "Course nodes carry their category".
RED by design: course-metadata.steps.ts "Every course in the library carries valid metadata" fails naming all 181 courses (missing category/description, plus format/estimatedHours for non-outlines) with the expected-hours table — saved in phase-2-corpus-red.txt. All other metadata scenarios pass.
TYPECHECK: exit 0.
