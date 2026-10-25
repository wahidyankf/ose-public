---
title: "Learning Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Seventy-eight worked examples in three levels take Playwright from a first script to a
CI-ready suite. Each example pairs a short explanation with a runnable TypeScript program and
its exact output: read the idea, run the model, check the transcript. The Beginner level
(Examples 1-25) builds locating, waiting, and fixtures; Intermediate (Examples 26-53) adds
network mocking, page objects, and auth reuse; Advanced (Examples 54-78) adds visual and
accessibility checks, tracing and flakiness diagnosis, and CI sharding. The
[capstone](/en/learn/courses/playwright-end-to-end-testing/learning/capstone/overview) composes
six of these habits into one realistic checkout suite.

## How to read an example

Every example follows the same five-part shape: the number and concept tags, a short
explanation naming the real Playwright call, an optional diagram of the idea, the heavily
commented program, and the key takeaway. Programs are deterministic models of Playwright
1.60.0's documented behavior (verified against the official docs on 2026-10-20): they run on
the pinned Node.js toolchain with no browser and no network, serving their committed fixture
page on loopback. When the text names a real call -- `getByRole`, `route.fulfill`,
`expect().toPass()` -- that call is the production behavior the model stands in for; paste it
into a real spec on a machine with browsers and it does what the transcript shows.

## Concept coverage

Sixteen concepts run through the 78 examples, each exercised by at least two examples so no
idea appears only once: co-01 locator (Examples 1-8, 36); co-02 auto-waiting (Examples 9-16,
31); co-03 fixture (Examples 18-25, 49); co-04 page-object (Examples 35-44); co-05
network-interception (Examples 26-32); co-06 trace-viewer (Examples 62-65, 70, 78); co-07
visual-comparison (Examples 54-57, 77); co-08 accessibility-scan (Examples 58, 59, 61); co-09
test-isolation (Examples 17, 47, 68); co-10 retry-policy (Examples 42, 64, 66, 67, 75); co-11
parallel-sharding (Examples 44, 71-74); co-12 authentication-state (Examples 22, 45-53); co-13
component-testing (Examples 60, 61); co-14 api-testing (Examples 33, 34, 43); co-15
flakiness-diagnosis (Examples 16, 67-70); co-16 ci-integration (Examples 74-78). The concept
list, primary source mapping (Playwright documentation), and supporting source mapping
(MDN Web Docs for DOM, ARIA, and HTTP semantics) live in the course syllabus.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: First Script](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-1-first-script) -- open a page and check its title.
- [Example 2: Get By Role](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-2-get-by-role) -- find elements by ARIA role and name.
- [Example 3: Get By Text and Label](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-3-get-by-text-and-label) -- match content and labeled controls.
- [Example 4: Test IDs Beat CSS](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-4-test-ids-beat-css) -- survive redesigns with test ids.
- [Example 5: Chained and Filtered Locators](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-5-chained-and-filtered-locators) -- narrow broad matches to one row.
- [Example 6: Fill and Type](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-6-fill-and-type) -- replace values or type key by key.
- [Example 7: Click Check and Select](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-7-click-check-and-select) -- set widget end states.
- [Example 8: Keyboard and Hover](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-8-keyboard-and-hover) -- drive focus-dependent interactions.
- [Example 9: Auto-Wait Clicks](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-9-auto-wait-clicks) -- let actions wait for preconditions.
- [Example 10: Replace Fixed Sleep](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-10-replace-fixed-sleep) -- poll conditions instead of clocks.
- [Example 11: Soft Versus Hard Assertions](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-11-soft-versus-hard-assertions) -- collect failures or stop fast.
- [Example 12: Web-First Assertion Retries](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-12-web-first-assertion-retries) -- retry the whole assertion.
- [Example 13: Waiting for Navigation](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-13-waiting-for-navigation) -- pin assertions to the new page.
- [Example 14: Waiting for Response](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-14-waiting-for-response) -- assert against settled data.
- [Example 15: Custom Poll Timeout](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-15-custom-poll-timeout) -- budget patience per assertion.
- [Example 16: Diagnosing a Timeout](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-16-diagnosing-a-timeout) -- name the failing condition.
- [Example 17: Test Isolation](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-17-test-isolation) -- fresh contexts by default.
- [Example 18: First Custom Fixture](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-18-first-custom-fixture) -- build shared starting state.
- [Example 19: Fixture Setup and Teardown Order](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-19-fixture-setup-and-teardown-order) -- teardown runs even on failure.
- [Example 20: beforeEach Hooks Seed State](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-20-beforeeach-hooks-seed-state) -- reseed before every test.
- [Example 21: Worker-Scoped Fixture](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-21-worker-scoped-fixture) -- build expensive setup once.
- [Example 22: Sharing One Login](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-22-sharing-one-login) -- one login serves all tests.
- [Example 23: Overriding a Fixture Per Test](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-23-overriding-a-fixture-per-test) -- special-case without forking.
- [Example 24: Fixture That Cleans Up](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-24-fixture-that-cleans-up) -- remove what setup created.
- [Example 25: Grouping With Describe Blocks](/en/learn/courses/playwright-end-to-end-testing/learning/beginner#example-25-grouping-with-describe-blocks) -- structure the suite.

### Intermediate (Examples 26–53)

- [Example 26: First Route Interception](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-26-first-route-interception) -- fulfill with canned bytes.
- [Example 27: Abort Images and Fonts](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-27-abort-images-and-fonts) -- drop decoration requests.
- [Example 28: Assert on the Request](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-28-assert-on-the-request) -- verify the outgoing payload.
- [Example 29: Mock an Error Response](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-29-mock-an-error-response) -- cover the error path.
- [Example 30: Record and Replay With HAR](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-30-record-and-replay-with-har) -- replay recorded traffic.
- [Example 31: Wait for the API Then Assert UI](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-31-wait-for-the-api-then-assert-ui) -- assert the round trip.
- [Example 32: Modify a Live Response](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-32-modify-a-live-response) -- patch one field, keep the rest.
- [Example 33: API Testing With Request Context](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-33-api-testing-with-request-context) -- cover APIs without a browser.
- [Example 34: Contract Check on API Shapes](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-34-contract-check-on-api-shapes) -- fail loudly on renames.
- [Example 35: First Page Object](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-35-first-page-object) -- wrap a page in intents.
- [Example 36: Locators Live in the Object](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-36-locators-live-in-the-object) -- define selectors once.
- [Example 37: Actions Return Next Page](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-37-actions-return-next-page) -- chain the journey.
- [Example 38: Component Objects for Reused Widgets](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-38-component-objects-for-reused-widgets) -- share one widget class.
- [Example 39: Shared Steps Without Inheritance](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-39-shared-steps-without-inheritance) -- compose helpers, not hierarchies.
- [Example 40: Data-Driven Tests](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-40-data-driven-tests) -- drive cases with tables.
- [Example 41: Tagging and Focusing Tests](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-41-tagging-and-focusing-tests) -- select lanes with grep.
- [Example 42: Retrying Only the Flaky Step](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-42-retrying-only-the-flaky-step) -- bound the retry to the step.
- [Example 43: API Setup Then UI Verify](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-43-api-setup-then-ui-verify) -- fast setup, honest proof.
- [Example 44: Parallel-Safe Test Data](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-44-parallel-safe-test-data) -- name data per worker.
- [Example 45: Save Auth Once Reuse Everywhere](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-45-save-auth-once-reuse-everywhere) -- one setup feeds all projects.
- [Example 46: Setup Project Writes Storage State](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-46-setup-project-writes-storage-state) -- fail fast on bad credentials.
- [Example 47: Isolated Contexts Share Nothing](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-47-isolated-contexts-share-nothing) -- assert both sides of the wall.
- [Example 48: Expired Session Re-Login](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-48-expired-session-re-login) -- renew stale sessions in setup.
- [Example 49: Role-Based Fixtures](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-49-role-based-fixtures) -- a fixture per role.
- [Example 50: Multi-User Chat in Two Contexts](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-50-multi-user-chat-in-two-contexts) -- prove collaboration across isolation.
- [Example 51: Cookies Versus Local Storage](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-51-cookies-versus-local-storage) -- match the store to the job.
- [Example 52: OAuth Token in the Header](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-52-oauth-token-in-the-header) -- skip the login dance.
- [Example 53: Logout Clears the Session](/en/learn/courses/playwright-end-to-end-testing/learning/intermediate#example-53-logout-clears-the-session) -- prove the session is gone.

### Advanced (Examples 54–78)

- [Example 54: First Screenshot](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-54-first-screenshot) -- compare against a baseline.
- [Example 55: Element Screenshot](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-55-element-screenshot) -- scope snapshots to one component.
- [Example 56: Mask Dynamic Regions](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-56-mask-dynamic-regions) -- cover clocks, compare the rest.
- [Example 57: Baseline Update Workflow](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-57-baseline-update-workflow) -- review, then bless.
- [Example 58: Axe Scan Finds Missing Names](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-58-axe-scan-finds-missing-names) -- fail the build on violations.
- [Example 59: Form Labels and Focus Order](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-59-form-labels-and-focus-order) -- check names and tab stops.
- [Example 60: Component Test in Isolation](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-60-component-test-in-isolation) -- mount widgets alone.
- [Example 61: Keyboard-Only Path Check](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-61-keyboard-only-path-check) -- prove the focus trap.
- [Example 62: Turn On Tracing](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-62-turn-on-tracing) -- record a replayable trail.
- [Example 63: Trace Viewer Finds the Misclick](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-63-trace-viewer-finds-the-misclick) -- convict the overlay.
- [Example 64: Video on First Retry Only](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-64-video-on-first-retry-only) -- record what is worth watching.
- [Example 65: Read the Failure Snapshot](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-65-read-the-failure-snapshot) -- read before re-running.
- [Example 66: Retry Twice Then Call It New](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-66-retry-twice-then-call-it-new) -- budget patience, convict bugs.
- [Example 67: Quarantine Is Not a Fix](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-67-quarantine-is-not-a-fix) -- diagnose before hiding.
- [Example 68: Random Order Exposes Coupling](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-68-random-order-exposes-coupling) -- vary order, find coupling.
- [Example 69: Race in the App Versus Flaky Test](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-69-race-in-the-app-versus-flaky-test) -- overlap analysis blames the backend.
- [Example 70: Slow-Motion Debug Run](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-70-slow-motion-debug-run) -- watch the failure once.
- [Example 71: Shard the Suite Across Workers](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-71-shard-the-suite-across-workers) -- split work, keep coverage.
- [Example 72: Fully Parallel Within a File](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-72-fully-parallel-within-a-file) -- earn parallel mode.
- [Example 73: Serial File for Shared State](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-73-serial-file-for-shared-state) -- order is the feature.
- [Example 74: Blob Report Merges Shards](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-74-blob-report-merges-shards) -- reunite the verdict.
- [Example 75: Retries in CI, Not Locally](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-75-retries-in-ci-not-locally) -- one config, two behaviors.
- [Example 76: JUnit Report for the Pipeline](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-76-junit-report-for-the-pipeline) -- XML for machines.
- [Example 77: Headed Versus Headless in CI](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-77-headed-versus-headless-in-ci) -- baselines match CI mode.
- [Example 78: Trace and Video Artifacts in CI](/en/learn/courses/playwright-end-to-end-testing/learning/advanced#example-78-trace-and-video-artifacts-in-ci) -- red builds explain themselves.

## References

- Playwright documentation: Installation -- [Installation](https://playwright.dev/docs/intro) (accessed 2026-10-20)
- Playwright documentation: Writing tests -- [Writing tests](https://playwright.dev/docs/writing-tests) (accessed 2026-10-20)
- Playwright documentation: Locators -- [Locators](https://playwright.dev/docs/locators) (accessed 2026-10-20)
- Playwright documentation: Actionability -- [Actionability](https://playwright.dev/docs/actionability) (accessed 2026-10-20)
- Playwright documentation: Assertions -- [Assertions](https://playwright.dev/docs/test-assertions) (accessed 2026-10-20)
- Playwright documentation: Fixtures -- [Fixtures](https://playwright.dev/docs/test-fixtures) (accessed 2026-10-20)
- Playwright documentation: Network -- [Network](https://playwright.dev/docs/network) (accessed 2026-10-20)
- Playwright documentation: Mock APIs -- [Mock APIs](https://playwright.dev/docs/mock) (accessed 2026-10-20)
- Playwright documentation: API testing -- [API testing](https://playwright.dev/docs/api-testing) (accessed 2026-10-20)
- Playwright documentation: Page object models -- [Page object models](https://playwright.dev/docs/pom) (accessed 2026-10-20)
- Playwright documentation: Authentication -- [Authentication](https://playwright.dev/docs/auth) (accessed 2026-10-20)
- Playwright documentation: Visual comparisons -- [Visual comparisons](https://playwright.dev/docs/test-snapshots) (accessed 2026-10-20)
- Playwright documentation: Accessibility testing -- [Accessibility testing](https://playwright.dev/docs/accessibility-testing) (accessed 2026-10-20)
- Playwright documentation: Trace viewer -- [Trace viewer](https://playwright.dev/docs/trace-viewer) (accessed 2026-10-20)
- Playwright documentation: Test retries -- [Test retries](https://playwright.dev/docs/test-retries) (accessed 2026-10-20)
- Playwright documentation: Parallelism -- [Parallelism](https://playwright.dev/docs/test-parallel) (accessed 2026-10-20)
- Playwright documentation: Reporters -- [Reporters](https://playwright.dev/docs/test-reporters) (accessed 2026-10-20)
- Playwright documentation: Continuous integration -- [Continuous integration](https://playwright.dev/docs/ci) (accessed 2026-10-20)
- MDN Web Docs: ARIA roles -- [WAI-ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles) (accessed 2026-10-20)
- MDN Web Docs: HTTP -- [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) (accessed 2026-10-20)
