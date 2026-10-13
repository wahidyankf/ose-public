# Phase 3 UI evidence

GREEN (plain): fill.test, course-path-nav additions, course-catalog core+shell, course-header, course-header-data, course-category-groups (50 tests across 7 files with earlier batches).
GREEN (bindings): course-catalog.steps (unit), course-landing-header.steps (26), sidebar-course-categories.steps, index-generation unit (30), navigation-api unit (19).
Sidebar bottom Features (search, theme, language, source link) live in the app layout, not the tree; the tree renders identically in the drawer (delivery 3.7 satisfied by code reading; drawer confirmed by E2E).
resizable-sidebar TALL_WIDE_SIDEBAR_PAGE stays /en/learn/courses: the Courses section now renders 14 category group buttons plus the surrounding tree, still taller than the 300px test viewport; the vertical-scroll E2E at the Phase 4 gate proves overflow.
