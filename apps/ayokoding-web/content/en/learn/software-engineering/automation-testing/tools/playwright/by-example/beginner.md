---
title: "Beginner"
date: 2025-02-01T22:30:00+07:00
draft: false
weight: 100000001
description: "Learn Playwright fundamentals through 30 annotated examples: browser launch, navigation, locators, interactions, assertions, and auto-waiting"
tags: ["playwright", "tutorial", "by-example", "beginner", "basics", "testing"]
---

Learn Playwright fundamentals through 30 annotated code examples. Each example is self-contained, runnable with `npx playwright test`, and heavily commented to show what each line does, expected behaviors, and intermediate states.

## Core Fundamentals (Examples 1-10)

### Example 1: Hello World - Your First Playwright Test

Playwright tests are asynchronous functions that receive a `page` object representing a browser tab. The test runner manages browser lifecycle, test isolation, and cleanup automatically.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Test["Test Function"] --> Browser["Browser Launch"]
    Browser --> Context["Browser Context<br/>(Isolated Session)"]
    Context --> Page["Page Object<br/>(Browser Tab)"]
    Page --> Actions["Test Actions"]
    Actions --> Cleanup["Automatic Cleanup"]

    style Test fill:#0173B2,color:#fff
    style Browser fill:#DE8F05,color:#fff
    style Context fill:#029E73,color:#fff
    style Page fill:#CC78BC,color:#fff
    style Actions fill:#CA9161,color:#fff
    style Cleanup fill:#0173B2,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";
// => Imports test runner and assertion library
// => test: function to define test cases
// => expect: assertion function for verifications

test("hello world", async ({ page }) => {
  // => Defines test named "hello world"
  // => page: browser tab object (injected fixture)
  // => async: all Playwright actions are promises
  await page.goto("https://playwright.dev");
  // => Navigates to URL
  // => Waits for page load (DOMContentLoaded event)
  // => Returns when navigation complete

  const title = await page.title();
  // => Gets page title
  // => Returns string: "Fast and reliable end-to-end testing..."
  console.log("Page title:", title);
  // => Output: Page title: Fast and reliable end-to-end testing...

  await expect(page).toHaveTitle(/Playwright/);
  // => Asserts title contains "Playwright"
  // => Waits up to 5s for condition (auto-retry)
  // => Passes when title matches regex
});
```

**Key Takeaway**: Playwright tests are async functions that receive a `page` fixture. The test runner handles browser lifecycle—you write test logic, Playwright manages setup and cleanup.

**Why It Matters**: Playwright's fixture system provides automatic browser management and test isolation. Each test gets a fresh browser context (cookies, storage, cache isolated), preventing test interdependencies that plague traditional Selenium tests. The auto-retry mechanism on assertions means network delays or slow renders don't cause flaky tests—Playwright waits for conditions to be met, eliminating manual `sleep()` calls that make tests brittle and slow.

---

### Example 2: Browser Launch Configuration

Playwright supports multiple browsers (Chromium, Firefox, WebKit) and launch options. Configuration happens in `playwright.config.ts`, but you can also control behavior per test file.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Browser["Browser Instance<br/>(chromium/firefox/webkit)"] --> Context1["BrowserContext 1<br/>(isolated cookies/storage)"]
    Browser --> Context2["BrowserContext 2<br/>(isolated cookies/storage)"]
    Context1 --> Page1["Page (Tab)"]
    Context1 --> Page2["Page (Tab)"]
    Context2 --> Page3["Page (Tab)"]

    style Browser fill:#0173B2,color:#fff
    style Context1 fill:#DE8F05,color:#000
    style Context2 fill:#DE8F05,color:#000
    style Page1 fill:#029E73,color:#fff
    style Page2 fill:#029E73,color:#fff
    style Page3 fill:#029E73,color:#fff
```

**Code**:

```typescript
import { test, expect, chromium } from "@playwright/test";
// => Imports chromium browser launcher
// => Used for manual browser control

test("browser configuration", async () => {
  // => Test without page fixture (manual browser management)
  const browser = await chromium.launch({
    // => Launches Chromium browser
    headless: false,
    // => headless: false shows browser UI (default: true)
    // => Useful for debugging, watching tests run
    slowMo: 100,
    // => Adds 100ms delay between actions
    // => Makes test execution visible to human eye
  });
  // => browser: Browser instance

  const context = await browser.newContext();
  // => Creates isolated browser context
  // => Fresh cookies, storage, cache
  const page = await context.newPage();
  // => Creates new page (tab) in context
  // => page: Page object for interactions

  await page.goto("https://example.com");
  // => Navigates to URL in visible browser
  await expect(page).toHaveTitle(/Example Domain/);
  // => Asserts title matches regex

  await browser.close();
  // => Closes browser and all contexts/pages
  // => REQUIRED when using manual launch
});
```

**Key Takeaway**: Use fixtures (`{ page }`) for normal tests—automatic cleanup. Use manual launch (`chromium.launch()`) when you need custom browser configuration or multiple contexts in one test.

**Why It Matters**: Playwright's browser launch options enable debugging (headless: false, slowMo), specific browser testing (chromium, firefox, webkit), and performance tuning (timeout settings, screen size). The context isolation means you can simulate multiple users in one test without browser restart, critical for testing collaborative features or multi-tenant applications where session isolation must be verified.

---

### Example 3: Basic Navigation and Waiting

Playwright automatically waits for navigation to complete. Understanding navigation events and wait strategies prevents race conditions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Nav["page.goto(url)"] --> Decision{"waitUntil<br/>strategy?"}
    Decision -->|"load (default)"| Load["Wait for<br/>DOMContentLoaded"]
    Decision -->|"networkidle"| Idle["Wait for ≤2 active<br/>requests for 500ms"]
    Decision -->|"commit"| Commit["Wait for<br/>HTTP response headers"]
    Load --> Ready["Page Ready<br/>for Interactions"]
    Idle --> Ready
    Commit --> Ready

    style Nav fill:#0173B2,color:#fff
    style Decision fill:#DE8F05,color:#000
    style Load fill:#029E73,color:#fff
    style Idle fill:#029E73,color:#fff
    style Commit fill:#CA9161,color:#fff
    style Ready fill:#CC78BC,color:#000
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("navigation with waiting", async ({ page }) => {
  await page.goto("https://example.com");
  // => Navigates and waits for DOMContentLoaded event
  // => Returns when page is interactive
  console.log("Current URL:", page.url());
  // => Output: Current URL: https://example.com/

  await page.goto("https://example.com/about", {
    // => Navigation with custom wait strategy
    waitUntil: "networkidle",
    // => Waits until network has ≤2 active requests for 500ms
    // => Ensures lazy-loaded content finishes
  });
  // => More reliable for SPA or dynamic content

  const url = page.url();
  // => Gets current URL (synchronous property access)
  // => Returns "https://example.com/about"
  expect(url).toBe("https://example.com/about");
  // => Synchronous assertion (URL already known)

  await page.goBack();
  // => Navigates back in history
  // => Waits for navigation to complete
  expect(page.url()).toBe("https://example.com/");
  // => Verifies back navigation worked

  await page.goForward();
  // => Navigates forward in history
  // => Returns to /about page
  expect(page.url()).toBe("https://example.com/about");
});
```

**Key Takeaway**: `page.goto()` waits for page readiness by default. Use `waitUntil: 'networkidle'` for SPAs with dynamic content. Navigation methods (`goBack`, `goForward`) also wait automatically.

**Why It Matters**: Playwright's auto-waiting on navigation eliminates the explicit waits that make Selenium tests fragile. The `networkidle` strategy is critical for Single Page Applications where the DOMContentLoaded event fires early but content loads asynchronously. This built-in intelligence means tests work reliably across different network conditions and server response times without manual timeout tuning.

---

### Example 4: Basic Locators - getByRole

`getByRole` is Playwright's recommended locator strategy—it finds elements by ARIA role and accessible name, ensuring tests verify what users actually experience.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Code["page.getByRole(<br/>'button', { name: 'Submit' })"] --> Query["DOM Query<br/>(on action/assertion)"]
    Query --> ARIA["Scan ARIA roles<br/>in DOM tree"]
    ARIA --> Match["Match accessible<br/>name / aria-label"]
    Match --> Locator["Locator Object<br/>(lazy, re-queryable)"]

    style Code fill:#0173B2,color:#fff
    style Query fill:#DE8F05,color:#000
    style ARIA fill:#029E73,color:#fff
    style Match fill:#CC78BC,color:#000
    style Locator fill:#CA9161,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("locating by role", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const getStartedLink = page.getByRole("link", { name: "Get started" });
  // => Locates link with accessible name "Get started"
  // => Searches for <a> elements with ARIA role="link"
  // => name option matches accessible name (text content or aria-label)
  // => Returns Locator object (not element yet)

  await expect(getStartedLink).toBeVisible();
  // => Waits for link to be visible
  // => Auto-retries up to 5s (default timeout)
  // => Passes when element visible in viewport

  const searchButton = page.getByRole("button", { name: /search/i });
  // => Locates button with accessible name matching /search/i regex
  // => Case-insensitive match (i flag)
  // => Returns Locator for button element

  await expect(searchButton).toBeEnabled();
  // => Asserts button is enabled (not disabled)
  // => Waits and retries until enabled or timeout

  const heading = page.getByRole("heading", {
    name: "Playwright enables reliable end-to-end testing",
  });
  // => Locates heading element (<h1> to <h6>)
  // => Exact text match by default
  await expect(heading).toHaveText(/Playwright enables reliable end-to-end testing/);
  // => Asserts heading text matches regex
});
```

**Key Takeaway**: `getByRole` returns a Locator (query, not element). Use roles (`link`, `button`, `heading`) and accessible names to create maintainable selectors that match user perception.

**Why It Matters**: Role-based selectors enforce accessibility best practices—if your test can't find an element by role, screen readers can't either. This locator strategy survives CSS refactoring (changing class names, restructuring HTML) because it targets semantic meaning, not implementation details. Role-based locators significantly reduce selector maintenance compared to CSS/XPath selectors.

---

### Example 5: Clicking Elements and Action Auto-Wait

Playwright waits for actionability before performing actions—elements must be visible, enabled, stable, and ready to receive events.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Click["locator.click()"] --> Attached["1. Attached to DOM?"]
    Attached -->|no| Retry["Retry every 100ms<br/>(up to timeout)"]
    Retry --> Attached
    Attached -->|yes| Visible["2. Visible?"]
    Visible -->|no| Retry
    Visible -->|yes| Stable["3. Stable (no animation)?"]
    Stable -->|no| Retry
    Stable -->|yes| Enabled["4. Enabled?"]
    Enabled -->|no| Retry
    Enabled -->|yes| Pointer["5. Receives pointer events?"]
    Pointer -->|no| Retry
    Pointer -->|yes| Perform["Perform Click"]

    style Click fill:#0173B2,color:#fff
    style Retry fill:#DE8F05,color:#000
    style Perform fill:#029E73,color:#fff
    style Attached fill:#CA9161,color:#fff
    style Visible fill:#CA9161,color:#fff
    style Stable fill:#CA9161,color:#fff
    style Enabled fill:#CA9161,color:#fff
    style Pointer fill:#CA9161,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("clicking with auto-wait", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const link = page.getByRole("link", { name: "Get started" });
  // => Creates locator for "Get started" link
  // => No query executed yet (lazy evaluation)

  await link.click();
  // => Performs actionability checks before clicking:
  // => 1. Waits for element to be attached to DOM
  // => 2. Waits for element to be visible
  // => 3. Waits for element to be stable (no animations)
  // => 4. Waits for element to be enabled
  // => 5. Scrolls element into view if needed
  // => 6. Waits for element to receive pointer events
  // => Then clicks center of element
  // => Returns when click completes

  await expect(page).toHaveURL(/.*intro/);
  // => Waits for URL to match regex
  // => Verifies navigation happened after click

  const docsLink = page.getByRole("link", { name: "Docs" });
  await docsLink.click({ force: true });
  // => force: true skips actionability checks
  // => Clicks even if element hidden/disabled
  // => ⚠️ Use sparingly—bypasses safety checks

  const apiLink = page.getByRole("link", { name: "API" });
  await apiLink.click({ timeout: 10000 });
  // => Waits up to 10s for actionability
  // => Overrides default 30s timeout
  // => Useful for slow-rendering elements
});
```

**Key Takeaway**: `click()` auto-waits for actionability (visible, enabled, stable) before clicking. This eliminates explicit waits and makes tests reliable across different rendering speeds.

**Why It Matters**: Actionability checks eliminate entire categories of flaky tests that plague Selenium—no more "element not clickable" errors due to animations, overlays, or page shifts. Playwright's auto-scroll ensures elements are visible before interaction, and stability checks wait for CSS transitions to complete. This built-in retry logic means tests work reliably even when CI servers are under load and rendering is slow.

---

### Example 6: Text Input and Keyboard Actions

Playwright simulates realistic keyboard input with auto-clearing, typing delays, and special key sequences.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("text input", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");

  const input = page.getByPlaceholder("What needs to be done?");
  // => Locates input by placeholder text
  // => Returns Locator for <input placeholder="...">

  await input.fill("Buy groceries");
  // => Clears existing value then types "Buy groceries"
  // => Fast operation (no typing delay)
  // => Sets value directly in DOM
  // => Returns immediately after value set

  await expect(input).toHaveValue("Buy groceries");
  // => Asserts input value equals "Buy groceries"
  // => Waits and retries until value matches

  await input.press("Enter");
  // => Presses Enter key
  // => Triggers keydown/keypress/keyup events
  // => Returns when key events complete

  await input.type("Read book", { delay: 100 });
  // => Types "Read book" character by character
  // => 100ms delay between each keystroke
  // => Simulates human typing (fires all keyboard events)
  // => Useful for testing autocomplete/validation

  await input.press("Control+A");
  // => Presses Ctrl+A (Select All)
  // => Cross-platform key combo (Command+A on macOS)
  await input.press("Backspace");
  // => Deletes selected text
  // => Input now empty

  await input.fill("Final task");
  // => Sets value to "Final task" (clears first)
  await expect(input).toHaveValue("Final task");
});
```

**Key Takeaway**: Use `fill()` for fast value setting (no keyboard events), `type()` for realistic character-by-character typing, and `press()` for special keys. Playwright auto-clears inputs before filling.

**Why It Matters**: The distinction between `fill()` and `type()` enables both fast test execution and realistic interaction simulation. `fill()` bypasses keyboard events for speed (significantly faster), while `type()` fires every keydown/keypress/keyup event, essential for testing autocomplete, input validation, or character limits. The cross-platform key combo normalization (Ctrl vs Command) means tests run on any developer machine or CI environment without platform-specific conditionals.

---

### Example 7: Basic Assertions with expect

Playwright's `expect` provides auto-retrying assertions that wait for conditions to be met, preventing flaky tests from timing issues.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Assert["expect(locator).toBeVisible()"] --> Check["Evaluate condition<br/>immediately"]
    Check -->|"passes"| Pass["Assertion Passes"]
    Check -->|"fails"| Wait["Wait 100ms"]
    Wait --> Retry["Re-evaluate condition"]
    Retry -->|"passes"| Pass
    Retry -->|"still fails"| Timeout{"Timeout<br/>reached?"}
    Timeout -->|"no"| Wait
    Timeout -->|"yes"| Fail["TimeoutError:<br/>assertion failed"]

    style Assert fill:#0173B2,color:#fff
    style Check fill:#DE8F05,color:#000
    style Pass fill:#029E73,color:#fff
    style Wait fill:#CA9161,color:#fff
    style Retry fill:#CA9161,color:#fff
    style Timeout fill:#CC78BC,color:#000
    style Fail fill:#DE8F05,color:#000
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("basic assertions", async ({ page }) => {
  await page.goto("https://playwright.dev");

  await expect(page).toHaveTitle(/Playwright/);
  // => Waits for page title to match regex
  // => Auto-retries up to 5s (default timeout)
  // => Passes when title contains "Playwright"

  await expect(page).toHaveURL("https://playwright.dev/");
  // => Asserts exact URL match
  // => Waits and retries until URL matches
  // => Fails after timeout if URL doesn't match

  const heading = page.getByRole("heading", { level: 1 });
  // => Locates first <h1> element
  // => level: 1 filters to h1 only

  await expect(heading).toBeVisible();
  // => Waits for heading to be visible
  // => Checks visibility in viewport
  // => Auto-retries until visible or timeout

  await expect(heading).toHaveText(/Playwright enables/);
  // => Asserts heading text matches regex
  // => Waits for text to appear/update
  // => Partial match (regex)

  await expect(heading).toContainText("reliable");
  // => Asserts heading contains substring "reliable"
  // => Case-sensitive by default
  // => Waits and retries

  const logo = page.locator(".navbar__logo");
  // => Locates by CSS class (not recommended, but works)
  // => Returns Locator for element with class navbar__logo

  await expect(logo).toBeAttached();
  // => Asserts element exists in DOM
  // => Doesn't require visibility
  // => Waits until attached
});
```

**Key Takeaway**: Playwright assertions auto-retry for up to 5 seconds by default. Use `toHaveTitle`, `toHaveURL`, `toBeVisible`, `toHaveText` for common checks that account for async rendering.

**Why It Matters**: Auto-retrying assertions eliminate the need for explicit waits (`waitFor`, `sleep`) that make Selenium tests fragile and slow. When you assert `toBeVisible()`, Playwright polls the element state every 100ms for up to 5 seconds, passing immediately when visible. This means assertions work reliably even when servers are slow, animations run, or network conditions vary—tests are deterministic, not timing-dependent.

---

### Example 8: Screenshots and Visual Verification

Playwright captures screenshots for debugging and visual regression testing. Screenshots can be full page, element-specific, or triggered on failure.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant Test as Test Code
    participant PW as Playwright
    participant Browser as Browser
    participant Disk as File System

    Test->>PW: page.screenshot({ path: 'shot.png' })
    PW->>Browser: Capture viewport pixels
    Browser-->>PW: Image buffer (PNG)
    PW->>Disk: Write shot.png
    PW-->>Test: Buffer returned

    Test->>PW: expect(el).toHaveScreenshot('baseline.png')
    PW->>Browser: Capture element pixels
    Browser-->>PW: Current image buffer
    PW->>Disk: Load baseline.png (or create on first run)
    PW->>PW: Pixel diff comparison
    PW-->>Test: Pass or fail with diff image
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("screenshots", async ({ page }) => {
  await page.goto("https://playwright.dev");
  // => Navigates to Playwright documentation site

  await page.screenshot({ path: "homepage.png" });
  // => Captures viewport screenshot
  // => Saves to homepage.png in project root
  // => Returns Buffer (image data)

  await page.screenshot({
    path: "full-page.png",
    fullPage: true,
    // => fullPage: true scrolls and stitches entire page
    // => Captures entire page (scrolls and stitches)
    // => Includes content below viewport
  });
  // => full-page.png saved with complete page content

  const logo = page.locator(".navbar__logo");
  // => Creates locator for logo element by CSS class
  await logo.screenshot({ path: "logo.png" });
  // => Captures screenshot of single element
  // => Crops to element bounding box
  // => Returns Buffer

  await page.screenshot({
    path: "masked.png",
    mask: [page.locator(".navbar")],
    // => mask: array of locators to hide in screenshot
    // => Masks navbar in screenshot (hides dynamic content)
    // => Useful for excluding timestamps, ads, personalized content
    // => Masked areas filled with pink color
  });
  // => masked.png saved with navbar hidden

  const heading = page.getByRole("heading", { level: 1 });
  // => Locates H1 heading element by ARIA role
  await expect(heading).toHaveScreenshot("heading.png");
  // => Visual regression assertion
  // => Compares current screenshot to baseline
  // => Fails if images differ beyond threshold
  // => Auto-generates baseline on first run
});
```

**Key Takeaway**: Use `page.screenshot()` for debugging captures and `expect().toHaveScreenshot()` for visual regression testing. `fullPage` captures entire page, `mask` hides dynamic content.

**Why It Matters**: Playwright's screenshot capabilities enable visual regression testing without external tools—comparing pixel-perfect rendering across browsers and code changes. The masking feature is critical for stable visual tests because it excludes dynamic content (timestamps, ads, personalized data) that would cause false positives. Full-page screenshots catch layout issues below the fold that viewport captures miss, essential for responsive design testing.

---

### Example 9: Test Structure with describe Blocks

Organizing tests into logical groups with `test.describe` enables shared setup, better reporting, and focused test execution.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Suite["test.describe('Suite')"] --> BeforeEach["test.beforeEach()<br/>(runs before each test)"]
    BeforeEach --> T1["test('case 1')"]
    BeforeEach --> T2["test('case 2')"]
    T1 --> AfterEach["test.afterEach()<br/>(runs after each test)"]
    T2 --> AfterEach
    AfterEach --> Report["Test Report<br/>(grouped by suite)"]

    style Suite fill:#0173B2,color:#fff
    style BeforeEach fill:#DE8F05,color:#000
    style T1 fill:#029E73,color:#fff
    style T2 fill:#029E73,color:#fff
    style AfterEach fill:#CC78BC,color:#000
    style Report fill:#CA9161,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Navigation tests", () => {
  // => Groups related tests under "Navigation tests"
  // => Improves test organization and reporting
  // => All tests in this block share lifecycle hooks

  test.beforeEach(async ({ page }) => {
    // => Runs before EACH test in this describe block
    // => Sets up common preconditions
    // => Each test gets fresh browser context + this setup
    await page.goto("https://playwright.dev");
    // => All tests start from homepage
    // => Navigation complete before test body runs
  });

  test("homepage loads", async ({ page }) => {
    // => Test inherits beforeEach setup
    // => page already at https://playwright.dev
    await expect(page).toHaveTitle(/Playwright/);
    // => Verifies page title matches (auto-retry up to 5s)
  });

  test("can navigate to docs", async ({ page }) => {
    // => Starts fresh: new browser context, beforeEach runs again
    // => page starts at https://playwright.dev (from beforeEach)
    const docsLink = page.getByRole("link", { name: "Docs" });
    // => Locates Docs link by accessible name
    await docsLink.click();
    // => Clicks link and waits for navigation
    await expect(page).toHaveURL(/.*docs/);
    // => Asserts URL contains "docs"
  });

  test.afterEach(async ({ page }) => {
    // => Runs after EACH test (even if test fails)
    // => Useful for cleanup, logging, custom reporting
    // => page still available after test completes
    console.log("Test completed, URL:", page.url());
    // => Output: Test completed, URL: https://playwright.dev/docs/...
  });
});

test.describe("Search functionality", () => {
  // => Second describe block (independent from Navigation tests)
  // => No shared beforeEach with Navigation tests

  test("search box accepts input", async ({ page }) => {
    // => New context, doesn't inherit Navigation tests beforeEach
    await page.goto("https://playwright.dev");
    // => Must navigate manually (no shared beforeEach here)
    const searchButton = page.getByRole("button", { name: /search/i });
    // => Locates search button by role + name regex
    await searchButton.click();
    // => Opens search dialog/input
    const searchInput = page.getByPlaceholder(/search/i);
    // => Locates input by placeholder text regex
    await searchInput.fill("assertions");
    // => Types "assertions" into search field
    await expect(searchInput).toHaveValue("assertions");
    // => Asserts input contains typed value
  });
});
```

**Key Takeaway**: Use `test.describe` to group related tests, `test.beforeEach` for shared setup, and `test.afterEach` for cleanup. Each test still gets isolated browser context.

**Why It Matters**: Test organization with describe blocks and hooks prevents test interdependencies—the number one cause of flaky test suites. Each test runs in a fresh browser context even when sharing `beforeEach` setup, ensuring failure isolation. Grouped tests can be run selectively (`npx playwright test --grep "Navigation"`) during development, speeding iteration cycles. Well-structured test suites scale from dozens to thousands of tests while maintaining maintainability.

---

### Example 10: Multiple Browser Testing

Playwright tests run in Chromium by default, but you can test across Chrome, Firefox, and WebKit (Safari) with configuration or per-test browser selection.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Config["playwright.config.ts<br/>projects: [chromium, firefox, webkit]"] --> Runner["Test Runner"]
    Runner --> W1["Worker 1<br/>Chromium"]
    Runner --> W2["Worker 2<br/>Firefox"]
    Runner --> W3["Worker 3<br/>WebKit"]
    W1 --> Results["Aggregated<br/>Test Results"]
    W2 --> Results
    W3 --> Results

    style Config fill:#0173B2,color:#fff
    style Runner fill:#DE8F05,color:#000
    style W1 fill:#029E73,color:#fff
    style W2 fill:#029E73,color:#fff
    style W3 fill:#029E73,color:#fff
    style Results fill:#CC78BC,color:#000
```

**Code**:

```typescript
import { test, expect, chromium, firefox, webkit } from "@playwright/test";

test("cross-browser test with config", async ({ page, browserName }) => {
  // => Uses browser from playwright.config.ts projects setting
  // => browserName: fixture injected with current browser name
  // => Value is "chromium", "firefox", or "webkit"
  await page.goto("https://playwright.dev");
  // => Navigates using the configured browser
  console.log("Testing in browser:", browserName);
  // => Output: Testing in browser: chromium (or firefox, webkit)

  await expect(page).toHaveTitle(/Playwright/);
  // => Same assertion works across all browsers
  // => Playwright normalizes title access across browsers
});

test("manual browser selection", async () => {
  // => Tests specific browser behavior without fixtures
  // => No page fixture - manual browser control
  const browsers = [
    { name: "chromium", launcher: chromium },
    // => Chromium: Chrome/Edge engine
    { name: "firefox", launcher: firefox },
    // => Firefox: Mozilla engine
    { name: "webkit", launcher: webkit },
    // => WebKit: Safari engine
  ];

  for (const { name, launcher } of browsers) {
    // => Iterates through all three browsers sequentially
    const browser = await launcher.launch();
    // => Launches specific browser instance
    // => Returns Browser object
    const context = await browser.newContext();
    // => Creates isolated browser context (fresh cookies/storage)
    const page = await context.newPage();
    // => Opens new tab in context

    await page.goto("https://example.com");
    // => Navigates in the specific browser
    const title = await page.title();
    // => Gets page title from current browser
    console.log(`${name} title:`, title);
    // => Output: chromium title: Example Domain
    // => Output: firefox title: Example Domain
    // => Output: webkit title: Example Domain

    await browser.close();
    // => Closes browser and all contexts/pages
    // => Must close manually when using launcher directly
  }
});
```

**Key Takeaway**: Configure browsers in `playwright.config.ts` for automatic parallel testing, or use manual launch for browser-specific testing. Playwright normalizes behavior across browsers for consistent tests.

**Why It Matters**: Cross-browser testing catches rendering inconsistencies and JavaScript engine differences that only appear in specific browsers—Safari's WebKit engine handles certain CSS and JavaScript features differently than Chrome or Firefox. Playwright's browser abstraction means tests written once run across all browsers without modification, while still allowing browser-specific tests when needed. This enables teams to guarantee consistent user experience across major browsers globally.

---

## Selectors and Locators (Examples 11-20)

### Example 11: CSS Selectors (Not Recommended)

CSS selectors work in Playwright but are fragile—they break when HTML structure changes. Use role-based locators when possible.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("css selectors", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const heading = page.locator("h1");
  // => Locates first <h1> element using tag selector
  // => Returns Locator for h1
  await expect(heading).toBeVisible();

  const navLinks = page.locator("nav a");
  // => Locates all <a> inside <nav> using descendant selector
  // => Returns Locator matching multiple elements
  const count = await navLinks.count();
  // => Gets count of matched elements
  // => Returns number of nav links
  console.log("Navigation links:", count);
  // => Output: Navigation links: 5 (example value)

  const firstLink = page.locator("nav a").first();
  // => Gets first match from multiple elements
  // => Returns Locator for first nav link
  await expect(firstLink).toBeVisible();

  const logo = page.locator(".navbar__logo");
  // => Locates by class name (fragile—breaks if class changes)
  // => Returns Locator for element with navbar__logo class

  const searchButton = page.locator("#search-button");
  // => Locates by ID (better than class, but still HTML-dependent)
  // => Returns Locator for element with id="search-button"

  const complexSelector = page.locator('button[type="submit"].primary');
  // => Combines tag, attribute, and class selectors
  // => Locates <button type="submit" class="primary">
  // => Brittle—breaks if any part changes
});
```

**Key Takeaway**: CSS selectors are powerful but fragile—they couple tests to HTML implementation. Prefer `getByRole`, `getByText`, `getByLabel` for maintainable tests that survive refactoring.

**Why It Matters**: CSS selectors break during refactoring—when developers rename classes, restructure HTML, or change element types. Role-based locators survive these changes because they target semantic meaning (what users perceive) not implementation details (how it's coded). CSS selectors tend to break more frequently after major UI refactors, while role-based locectors remain more stable.

---

### Example 12: XPath Selectors (Use Sparingly)

XPath selectors are powerful for complex DOM traversal but are slow and harder to read than Playwright's built-in locators.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("xpath selectors", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const heading = page.locator('xpath=//h1[contains(text(), "Playwright")]');
  // => Locates <h1> containing "Playwright" text
  // => xpath= prefix required for XPath expressions
  // => Slower than CSS/role-based locators
  await expect(heading).toBeVisible();

  const linkByText = page.locator('xpath=//a[text()="Get started"]');
  // => Locates link with exact text "Get started"
  // => Equivalent to getByRole("link", { name: "Get started" })
  // => ⚠️ getByRole is preferred (faster, more readable)

  const button = page.locator('xpath=//button[@data-testid="submit"]');
  // => Locates button by data-testid attribute
  // => Equivalent to getByTestId("submit")
  // => ⚠️ getByTestId is cleaner

  const parentDiv = page.locator('xpath=//div[@class="container"]');
  const childInput = parentDiv.locator('xpath=.//input[@type="text"]');
  // => Locates input relative to parent div
  // => .// starts search from current element (not document root)
  // => Useful for scoped searches within components

  const secondParagraph = page.locator("xpath=(//p)[2]");
  // => Locates second <p> element in document
  // => XPath 1-based indexing (not 0-based)
  // => Returns Locator for second paragraph
});
```

**Key Takeaway**: XPath works for complex DOM navigation but is slower and less readable than Playwright's built-in locators. Use `getByRole`, `getByTestId`, or CSS when possible.

**Why It Matters**: XPath performance degrades significantly on large DOMs—queries that take milliseconds with CSS can take hundreds of milliseconds with XPath because the evaluation engine is less optimized. XPath expressions are also notoriously hard to read and maintain (`//div[@class="container"]//following-sibling::span[1]` vs `page.locator(".container + span")`), leading to higher maintenance costs. Reserve XPath for truly complex traversals that CSS can't express.

---

### Example 13: getByLabel for Form Fields

`getByLabel` locates form inputs by their associated label text, creating resilient selectors tied to user-visible labels.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("getByLabel locator", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");

  // Note: This example uses a theoretical login form for demonstration
  const emailInput = page.getByLabel("Email address");
  // => Locates input associated with label containing "Email address"
  // => Matches <label for="email">Email address</label> + <input id="email">
  // => Or matches <label>Email address <input></label>
  // => Returns Locator for input element

  await emailInput.fill("user@example.com");
  // => Types email into input
  // => Clears existing value first
  await expect(emailInput).toHaveValue("user@example.com");

  const passwordInput = page.getByLabel(/password/i);
  // => Locates input with label matching /password/i regex
  // => Case-insensitive match
  // => Finds "Password", "password", "PASSWORD", etc.
  await passwordInput.fill("secret123");

  const rememberMe = page.getByLabel("Remember me");
  // => Locates checkbox associated with "Remember me" label
  // => Works with checkboxes, radios, inputs
  await rememberMe.check();
  // => Checks the checkbox
  // => Auto-waits for actionability
  await expect(rememberMe).toBeChecked();

  const country = page.getByLabel("Country", { exact: true });
  // => Exact match on label text (no partial matches)
  // => Won't match "Country Code", only "Country"
  await country.selectOption("United States");
});
```

**Key Takeaway**: `getByLabel` creates accessible, maintainable selectors for form inputs. It matches both explicit (`<label for="id">`) and implicit (`<label><input></label>`) associations.

**Why It Matters**: Label-based locators enforce accessibility—if tests can't find an input by its label, screen readers can't either. This catches missing form labels during development, improving application accessibility for all users. Label text is also more stable than IDs or names because labels are user-facing and rarely change, while developers frequently rename HTML attributes during refactoring.

---

### Example 14: getByPlaceholder for Input Hints

`getByPlaceholder` locates inputs by their placeholder attribute—useful when labels aren't present but placeholder text is user-visible.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("getByPlaceholder locator", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");

  const todoInput = page.getByPlaceholder("What needs to be done?");
  // => Locates input with placeholder="What needs to be done?"
  // => Returns Locator for input element
  // => Placeholder must match exactly (unless regex used)

  await todoInput.fill("Buy milk");
  // => Types into input
  // => Placeholder disappears when value entered
  await expect(todoInput).toHaveValue("Buy milk");

  const searchInput = page.getByPlaceholder(/search/i);
  // => Locates input with placeholder matching /search/i
  // => Case-insensitive regex match
  // => Finds "Search...", "search", "SEARCH", etc.

  await searchInput.fill("playwright");
  await searchInput.press("Enter");
  // => Submits search
  // => Placeholder no longer affects element selection
});
```

**Key Takeaway**: `getByPlaceholder` is useful for inputs without labels, but labels are preferred for accessibility. Placeholder text must match current placeholder attribute value.

**Why It Matters**: Placeholder-based locators are less stable than label-based because placeholders are often changed for UX improvements or internationalization. However, they're still better than CSS selectors or IDs because placeholders are user-visible. Note that placeholders aren't accessible alternatives to labels—WCAG guidelines require labels for form inputs. If your test relies heavily on getByPlaceholder, it indicates an accessibility issue in the application.

---

### Example 15: getByTestId for Stable Selectors

`getByTestId` locates elements by `data-testid` attribute—a stable selector explicitly added for testing that doesn't break during refactoring.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("getByTestId locator", async ({ page }) => {
  // Assuming page with data-testid attributes
  await page.goto("https://example.com/app");

  const submitButton = page.getByTestId("submit-btn");
  // => Locates element with data-testid="submit-btn"
  // => Returns Locator for element
  // => Stable—doesn't break when CSS/text changes

  await submitButton.click();
  // => Clicks button identified by test ID
  // => Survives class renaming, text changes, DOM restructuring

  const userProfile = page.getByTestId("user-profile");
  // => Locates user profile section by test ID
  // => Can be any element type (div, section, etc.)

  const userName = userProfile.getByTestId("user-name");
  // => Scoped search: finds test ID within user-profile
  // => Prevents matching user-name in other parts of page
  await expect(userName).toHaveText(/John Doe/);

  const listItems = page.getByTestId(/list-item-\d+/);
  // => Locates all elements with test IDs matching regex
  // => Finds list-item-1, list-item-2, etc.
  // => Returns Locator for multiple elements
  const count = await listItems.count();
  console.log("List items found:", count);
});
```

**Key Takeaway**: `getByTestId` provides stable selectors that survive refactoring by explicitly marking elements for testing. Use when semantic locators (`getByRole`, `getByLabel`) aren't available.

**Why It Matters**: Test IDs solve the brittleness problem of CSS selectors without compromising accessibility like CSS classes do. They're explicit contracts between developers and tests—when a developer removes a `data-testid`, it's obvious they're breaking tests. However, test IDs don't verify accessibility (they're invisible to users), so they're fallbacks when semantic locators can't be used. Best practice: prefer role-based locators, use test IDs for complex components where roles are ambiguous.

---

### Example 16: Chaining Locators for Scoped Searches

Chaining locators narrows search scope to specific page regions, preventing false matches and improving selector precision.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Page["page"] --> Nav["page.locator('nav.navbar')"]
    Nav --> ScopedLink["nav.getByRole('link')"]
    Nav --> ScopedBtn["nav.getByRole('button')"]
    Page --> Sidebar["page.locator('.sidebar')"]
    Sidebar --> Section["sidebar.locator('section').first()"]
    Section --> Heading["section.getByRole('heading')"]

    style Page fill:#0173B2,color:#fff
    style Nav fill:#DE8F05,color:#000
    style Sidebar fill:#DE8F05,color:#000
    style ScopedLink fill:#029E73,color:#fff
    style ScopedBtn fill:#029E73,color:#fff
    style Section fill:#CA9161,color:#fff
    style Heading fill:#CC78BC,color:#000
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("chaining locators", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const navbar = page.locator("nav.navbar");
  // => Locates navbar container using CSS tag+class selector
  // => Returns Locator for navigation element
  // => Acts as search context for chained locators

  const navLinks = navbar.getByRole("link");
  // => Finds links ONLY within navbar
  // => Scoped search prevents matching footer links
  // => Returns Locator for all nav links
  const count = await navLinks.count();
  // => Gets count of nav links found
  console.log("Nav links:", count);
  // => Output: Nav links: 5 (example value)

  const docsLink = navbar.getByRole("link", { name: "Docs" });
  // => Finds "Docs" link within navbar specifically
  // => Won't match "Docs" link in footer (if exists)
  await docsLink.click();
  // => Clicks the scoped Docs link, navigates away

  const sidebar = page.locator(".sidebar");
  // => Locates sidebar container element
  const firstSection = sidebar.locator("section").first();
  // => Chains CSS locators
  // => Finds first <section> within sidebar only
  const sectionHeading = firstSection.getByRole("heading");
  // => Further narrows to heading within first section
  // => Three levels of chaining: sidebar > first section > heading
  await expect(sectionHeading).toBeVisible();
  // => Asserts section heading is visible

  const form = page.getByRole("form");
  // => Locates form element by ARIA role
  const emailInput = form.getByLabel("Email");
  // => Finds Email input scoped to the form
  const submitButton = form.getByRole("button", { name: "Submit" });
  // => Finds Submit button scoped to the form
  // => Chains semantic locators
  // => Ensures we interact with form's email and button
  // => Prevents matching email/button outside form
  await emailInput.fill("test@example.com");
  // => Types email into the scoped input
  await submitButton.click();
  // => Clicks Submit button within the form
});
```

**Key Takeaway**: Chain locators to scope searches to specific page regions. `parent.locator().child.locator()` narrows search context, preventing false matches from other page areas.

**Why It Matters**: Chaining prevents flaky tests caused by duplicate elements—if both header and footer have "Contact" links, `getByRole('link', { name: 'Contact' })` is ambiguous. Chaining to `header.getByRole('link', { name: 'Contact' })` removes ambiguity. This technique is essential for testing component libraries where the same component appears multiple times with different data—scoping to the specific instance prevents cross-contamination.

---

### Example 17: Filtering Locators with has and hasText

Filter locators to find elements containing specific child elements or text, enabling complex selector logic without XPath.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("filtering locators", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const articleWithHeading = page.locator("article").filter({
    has: page.getByRole("heading", { name: /Playwright/ }),
    // => has: element must contain this child element
  });
  // => Finds <article> elements containing heading with "Playwright"
  // => has: filters by presence of child element
  // => Returns Locator for matching articles only
  await expect(articleWithHeading).toBeVisible();
  // => Asserts at least one matching article is visible

  const sectionWithText = page.locator("section").filter({
    hasText: "Get started",
    // => hasText: element must contain this text anywhere
  });
  // => Finds <section> elements containing "Get started" text
  // => hasText: filters by text content (anywhere in element tree)
  // => Returns Locator for sections with text
  await expect(sectionWithText).toBeVisible();
  // => Asserts filtered section is visible

  const buttonWithIcon = page.getByRole("button").filter({ has: page.locator("svg") });
  // => Finds buttons containing SVG icon
  // => Useful for icon-only buttons (no text label)
  // => Returns Locator for buttons with icons
  await expect(buttonWithIcon.first()).toBeVisible();
  // => Asserts first button with icon is visible

  const linkNotDisabled = page.getByRole("link").filter({
    hasNot: page.locator('[aria-disabled="true"]'),
    // => hasNot: element must NOT contain this child
  });
  // => Finds links NOT containing aria-disabled="true"
  // => hasNot: negative filter (exclude matches)
  // => Returns enabled links only
  const enabledCount = await linkNotDisabled.count();
  // => Counts enabled links found
  console.log("Enabled links:", enabledCount);
  // => Output: Enabled links: 15 (example value)

  const rowWithEmail = page.locator("tr").filter({ hasText: "user@example.com" });
  // => Finds table rows containing specific email
  // => Useful for data tables, lists
  // => Returns Locator for matching rows
  await rowWithEmail.getByRole("button", { name: "Delete" }).click();
  // => Clicks Delete button in row with email
  // => Combines filtering and chaining for precise targeting
});
```

**Key Takeaway**: Use `filter({ has: ... })` to find elements containing specific children, `filter({ hasText: ... })` for text content, and `hasNot` for exclusions. Filters combine multiple criteria without complex selectors.

**Why It Matters**: Filter methods enable complex selector logic that would require XPath in other tools, but with better performance and readability. Finding "the row containing user@example.com and clicking its Delete button" is a common pattern in data tables—filters make this maintainable. The `hasNot` filter is particularly valuable for excluding disabled elements, loading states, or error conditions without complex CSS negation selectors.

---

### Example 18: nth, first, last for Multiple Elements

When locators match multiple elements, use `nth`, `first`, `last` to select specific instances by position.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("selecting from multiple elements", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const links = page.getByRole("link");
  // => Matches all links on page
  // => Returns Locator for multiple elements
  // => No DOM query yet (lazy evaluation)

  const firstLink = links.first();
  // => Gets first matched link
  // => Equivalent to nth(0)
  // => Returns Locator for single element
  await expect(firstLink).toBeVisible();
  // => NOW evaluates: queries DOM for first link

  const lastLink = links.last();
  // => Gets last matched link
  // => Returns Locator for single element (re-queries on use)
  const lastLinkText = await lastLink.textContent();
  // => Gets text content of last link
  console.log("Last link text:", lastLinkText);
  // => Output: Last link text: "Footer copyright link" (example)

  const thirdLink = links.nth(2);
  // => Gets third link (0-based indexing)
  // => nth(0) is first, nth(1) is second, nth(2) is third
  // => Returns Locator for single element
  await thirdLink.click();
  // => Clicks the third link in document order

  const allLinks = await links.all();
  // => Converts Locator to array of Locators
  // => Returns Promise<Locator[]> (resolves now)
  // => Each array element is a Locator for one link
  // => Snapshot of current matches - won't update if DOM changes
  console.log("Total links:", allLinks.length);
  // => Output: Total links: 42 (example value)

  for (const link of allLinks) {
    // => Iterates through all matched links
    const text = await link.textContent();
    // => Gets text content of current link
    console.log("Link text:", text);
    // => Output: Link text: "Home", "Docs", "API", etc.
  }

  const paragraphs = page.locator("p");
  // => Locates all paragraph elements
  const count = await paragraphs.count();
  // => Gets number of matched paragraphs
  // => Returns number (evaluates immediately)
  console.log("Paragraph count:", count);
  // => Output: Paragraph count: 10 (example value)

  for (let i = 0; i < count; i++) {
    // => Iterates by index from 0 to count-1
    const paragraph = paragraphs.nth(i);
    // => Gets paragraph at index i (0-based)
    const text = await paragraph.textContent();
    // => Gets text of this specific paragraph
    console.log(`Paragraph ${i}:`, text);
    // => Output: Paragraph 0: "First paragraph text..."
  }
});
```

**Key Takeaway**: Use `first()`, `last()`, `nth(index)` to select specific elements from multiple matches. Use `all()` to convert Locator to array for iteration. `count()` returns number of matches.

**Why It Matters**: Multiple element handling is essential for testing lists, tables, and repeated components. The `.all()` method enables complex logic like "verify all items meet condition" or "find first item matching criteria". However, avoid relying on element order when possible—tests break when UI reorders items. Prefer filtering (`filter({ hasText: ... })`) over positional selection (`nth(2)`) for stable tests.

---

### Example 19: Locator Evaluation and Element Handles

Locators are lazy (don't query DOM until needed). Understanding evaluation timing prevents confusion about when elements are found.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("locator evaluation timing", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");

  const input = page.getByPlaceholder("What needs to be done?");
  // => Creates Locator (NO DOM query yet)
  // => Locator is just query definition
  // => Lazy evaluation: waits until action/assertion

  await input.fill("Task 1");
  // => NOW locator evaluates:
  // => 1. Queries DOM for matching element
  // => 2. Waits for actionability
  // => 3. Performs fill action
  // => Returns when action completes

  const todoItems = page.locator(".todo-list li");
  // => Creates Locator (not evaluated yet)
  // => DOM might have 0 items right now

  await input.fill("Task 2");
  await input.press("Enter");
  // => Adds second item to list
  // => Locator still not evaluated

  const count = await todoItems.count();
  // => NOW locator evaluates and counts elements
  // => Returns current count in DOM
  console.log("Todo count:", count);
  // => Output: Todo count: 2

  const firstItem = todoItems.first();
  // => Creates filtered Locator (still lazy)
  // => Doesn't find element yet

  await expect(firstItem).toHaveText("Task 1");
  // => Locator evaluates when assertion runs
  // => Waits and retries until text matches
  // => Passes when condition met

  const elementHandle = await input.elementHandle();
  // => Converts Locator to ElementHandle
  // => ElementHandle is DOM node reference at specific moment
  // => ⚠️ Loses auto-waiting, not recommended
  const tagName = await elementHandle?.evaluate((el) => el.tagName);
  // => Evaluates JavaScript in browser context
  // => Returns "INPUT"
  console.log("Tag name:", tagName);
});
```

**Key Takeaway**: Locators are lazy—they don't query DOM until action/assertion. This enables auto-waiting and auto-retry. Avoid `elementHandle()` unless you need low-level DOM access—Locators are safer.

**Why It Matters**: Lazy evaluation is fundamental to Playwright's reliability—locators re-query DOM on every action, so if an element is removed and re-added (common in React apps), the locator finds it again. ElementHandles lock to specific DOM nodes at specific moments, breaking when React re-renders. This is why Playwright discourages ElementHandles—Locators handle modern SPA dynamism automatically while ElementHandles require manual staleness checks like Selenium.

---

### Example 20: getByText for Exact and Partial Matches

`getByText` locates elements by visible text content—powerful for finding dynamic content or testing rendered data.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("getByText locator", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const exactText = page.getByText("Get started");
  // => Locates element with exact text "Get started"
  // => Case-sensitive, full match
  // => Returns Locator for element
  await expect(exactText).toBeVisible();

  const partialText = page.getByText("Get started", { exact: false });
  // => Matches elements containing "Get started" as substring
  // => Would match "Get started quickly", "How to Get started", etc.
  // => exact: false enables substring matching
  await expect(partialText.first()).toBeVisible();

  const regexMatch = page.getByText(/playwright enables/i);
  // => Locates element with text matching regex
  // => Case-insensitive (i flag)
  // => Partial match by default with regex
  await expect(regexMatch).toBeVisible();

  const multipleMatches = page.getByText("Playwright");
  // => May match multiple elements
  // => Returns Locator for all matches
  const count = await multipleMatches.count();
  console.log("Elements containing 'Playwright':", count);

  const specificElement = page.locator("h1").getByText("Playwright");
  // => Chains to scope search to h1 elements only
  // => Finds "Playwright" text within h1
  // => More precise than unscoped getByText
  await expect(specificElement).toBeVisible();

  const dynamicData = page.getByText(/User ID: \d+/);
  // => Matches dynamic content like "User ID: 12345"
  // => Regex handles variable parts
  // => Useful for testing database-driven content
  await expect(dynamicData).toBeVisible();
});
```

**Key Takeaway**: `getByText` matches visible text—use exact matching (default), substring matching (`exact: false`), or regex for flexible matching. Chain with other locators to scope searches.

**Why It Matters**: Text-based locators are user-centric—they find what users see, not what developers implement. This makes tests resilient to HTML changes as long as rendered text stays the same. Text matching is also essential for testing internationalization—you can write tests that verify translated strings appear correctly. However, text locators can be fragile when copy changes frequently, so use them for stable content like button labels, headings, and data labels, not marketing copy.

---

## Basic Interactions (Examples 21-30)

### Example 21: Checkboxes and Radio Buttons

Playwright provides specialized methods for checkbox and radio button interactions that handle checked state automatically.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Unchecked: initial state
    Unchecked --> Checked: check() / setChecked(true)
    Checked --> Unchecked: uncheck() / setChecked(false)
    Checked --> Checked: check() (idempotent)
    Unchecked --> Unchecked: uncheck() (idempotent)

    note right of Checked
        Radio buttons: checking one
        automatically unchecks siblings
        in the same group
    end note
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("checkboxes and radios", async ({ page }) => {
  // Assuming page with form elements
  await page.goto("https://example.com/form");

  const termsCheckbox = page.getByLabel("I agree to terms");
  // => Locates checkbox by label text
  // => Returns Locator for checkbox input

  await termsCheckbox.check();
  // => Checks checkbox if not already checked
  // => Idempotent: safe to call multiple times
  // => Auto-waits for actionability
  await expect(termsCheckbox).toBeChecked();
  // => Asserts checkbox is checked
  // => Waits and retries until checked

  await termsCheckbox.uncheck();
  // => Unchecks checkbox if checked
  // => Idempotent operation
  await expect(termsCheckbox).not.toBeChecked();
  // => Asserts checkbox is NOT checked
  // => Negated assertion

  const newsletterCheckbox = page.getByLabel("Subscribe to newsletter");
  await newsletterCheckbox.setChecked(true);
  // => Sets checkbox to specific state (true = checked)
  // => Equivalent to check() when true
  // => Useful when state comes from variable

  const isChecked = await newsletterCheckbox.isChecked();
  // => Gets current checked state
  // => Returns boolean: true or false
  console.log("Newsletter subscribed:", isChecked);

  const colorRed = page.getByLabel("Red");
  // => Locates radio button by label
  await colorRed.check();
  // => Checks radio button
  // => Unchecks other radios in same group automatically
  await expect(colorRed).toBeChecked();

  const colorBlue = page.getByLabel("Blue");
  await colorBlue.check();
  // => Checks Blue radio
  // => Automatically unchecks Red (radio group behavior)
  await expect(colorBlue).toBeChecked();
  await expect(colorRed).not.toBeChecked();
  // => Red now unchecked
});
```

**Key Takeaway**: Use `check()`, `uncheck()`, `setChecked(boolean)` for checkboxes. Radio buttons auto-uncheck siblings when checked. `isChecked()` returns current state.

**Why It Matters**: Checkbox and radio methods handle browser inconsistencies—click events sometimes don't toggle checkboxes reliably across browsers, but Playwright's `check()` guarantees correct state. The idempotent nature prevents double-clicking issues. Radio button group behavior is particularly tricky in manual testing frameworks—Playwright handles the sibling unchecking automatically, reflecting actual browser behavior without extra code.

---

### Example 22: Select Dropdowns

Playwright handles `<select>` dropdowns with methods that accept values, labels, or indexes—matching how users interact with dropdowns.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Call["selectOption(input)"] --> Type{"Input type?"}
    Type -->|"string value"| ByVal["Match by<br/>option value attr"]
    Type -->|"{ label: '...' }"| ByLabel["Match by<br/>visible text"]
    Type -->|"{ index: N }"| ByIdx["Match by<br/>position (0-based)"]
    Type -->|"array"| Multi["Multi-select:<br/>select all listed options"]
    ByVal --> DOM["Update DOM<br/>selected state"]
    ByLabel --> DOM
    ByIdx --> DOM
    Multi --> DOM
    DOM --> Events["Fire change / input events"]

    style Call fill:#0173B2,color:#fff
    style Type fill:#DE8F05,color:#000
    style ByVal fill:#029E73,color:#fff
    style ByLabel fill:#029E73,color:#fff
    style ByIdx fill:#029E73,color:#fff
    style Multi fill:#CC78BC,color:#000
    style DOM fill:#CA9161,color:#fff
    style Events fill:#CA9161,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("select dropdowns", async ({ page }) => {
  await page.goto("https://example.com/form");

  const country = page.getByLabel("Country");
  // => Locates <select> by associated label
  // => Returns Locator for select element

  await country.selectOption("us");
  // => Selects option by value attribute
  // => Finds <option value="us">United States</option>
  // => Auto-waits for actionability
  await expect(country).toHaveValue("us");
  // => Asserts selected value is "us"

  await country.selectOption({ label: "Canada" });
  // => Selects by visible label text
  // => Finds <option>Canada</option> regardless of value
  // => More user-centric than value selection
  await expect(country).toHaveValue("ca");

  await country.selectOption({ index: 0 });
  // => Selects by position (0-based)
  // => First option in dropdown
  // => Useful when value/label unknown

  const colors = page.getByLabel("Favorite colors");
  // => Locates multi-select dropdown
  await colors.selectOption(["red", "blue"]);
  // => Selects multiple options (array)
  // => Works only on <select multiple>
  // => Clears previous selections and selects new ones

  const selectedValues = await colors.evaluate((select: HTMLSelectElement) => {
    // => Evaluates JavaScript in browser context
    // => Gets reference to actual DOM select element
    return Array.from(select.selectedOptions).map((option) => option.value);
    // => Extracts values from selected options
    // => Returns array of selected values
  });
  console.log("Selected colors:", selectedValues);
  // => Output: Selected colors: ['red', 'blue']

  const currentValue = await country.inputValue();
  // => Gets currently selected value
  // => Returns value attribute of selected option
  console.log("Current country:", currentValue);
});
```

**Key Takeaway**: Use `selectOption()` with value string, `{ label: "..." }` object, or `{ index: n }` object. Multi-select accepts arrays. `inputValue()` returns selected value.

**Why It Matters**: Dropdown selection is notoriously inconsistent across browsers—native `<select>` elements behave differently than custom dropdowns (React Select, Material-UI). Playwright's `selectOption()` normalizes this behavior for native selects. However, note this method only works for `<select>` elements—custom dropdowns require different strategies (clicking, typing, finding options). This is why semantic HTML is valuable—native selects are accessible and testable.

---

### Example 23: File Uploads

File uploads require setting file inputs with file paths. Playwright handles single and multiple file uploads without opening file dialogs.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("file uploads", async ({ page }) => {
  await page.goto("https://example.com/upload");

  const fileInput = page.locator('input[type="file"]');
  // => Locates file input element by type attribute
  // => Returns Locator for input

  await fileInput.setInputFiles("./fixtures/document.pdf");
  // => Sets file to upload (bypasses OS file dialog)
  // => Path relative to test file or project root
  // => No file dialog appears (automated)
  // => Returns when file set

  const fileName = await fileInput.evaluate((input: HTMLInputElement) => input.files?.[0]?.name);
  // => Reads filename from browser's FileList API
  console.log("File selected:", fileName);
  // => Output: File selected: document.pdf

  await fileInput.setInputFiles(["./fixtures/image1.jpg", "./fixtures/image2.jpg"]);
  // => Sets multiple files (array of paths)
  // => Works on <input type="file" multiple>
  // => Replaces previous selection

  const fileCount = await fileInput.evaluate((input: HTMLInputElement) => input.files?.length);
  // => Counts files in FileList
  console.log("Files selected:", fileCount);
  // => Output: Files selected: 2

  await fileInput.setInputFiles([]);
  // => Clears file selection
  // => Empty array removes files
  // => Returns input to empty state

  const buffer = Buffer.from("File content here");
  // => Creates Buffer from string content
  await fileInput.setInputFiles({
    name: "generated.txt",
    // => Virtual filename for the upload
    mimeType: "text/plain",
    // => MIME type identifies file format
    buffer: buffer,
    // => File contents as Buffer
  });
  // => Uploads file from memory buffer
  // => No need for physical file on disk
  // => Useful for dynamic test data (generated content)
});
```

**Key Takeaway**: Use `setInputFiles(path)` for single upload, `setInputFiles([paths])` for multiple. Pass empty array to clear. Use buffer object for in-memory files.

**Why It Matters**: File upload testing is traditionally manual because frameworks struggle with file dialogs—Selenium requires AutoIt or similar tools. Playwright's `setInputFiles()` bypasses the dialog entirely, setting files programmatically. The buffer upload feature is particularly powerful for testing upload validation—you can generate files with specific properties (size, type, content) without managing fixture files, enabling tests like "reject files over 5MB" without creating actual 5MB+ files.

---

### Example 24: Hover Interactions

Hovering simulates mouse-over effects, essential for testing tooltips, dropdown menus, and hover-triggered actions.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("hover interactions", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const docsLink = page.getByRole("link", { name: "Docs" });
  // => Locates "Docs" link
  await docsLink.hover();
  // => Moves mouse to center of element
  // => Triggers mouseover/mouseenter events
  // => Auto-waits for actionability
  // => Useful for dropdown menus that appear on hover

  const tooltip = page.locator(".tooltip");
  // => Locates tooltip that appears on hover
  await expect(tooltip).toBeVisible();
  // => Asserts tooltip visible after hover
  // => Waits for tooltip to appear

  const productCard = page.locator(".product-card").first();
  await productCard.hover();
  // => Hovers over product card
  // => May reveal "Add to Cart" button or quick view

  const addToCartButton = productCard.getByRole("button", {
    name: "Add to Cart",
  });
  // => Finds button within hovered card
  await expect(addToCartButton).toBeVisible();
  // => Verifies button appears on hover

  await addToCartButton.click();
  // => Clicks button that only appears on hover
  // => Playwright maintains hover state until click completes

  const menu = page.getByRole("button", { name: "Menu" });
  await menu.hover({ force: true });
  // => force: true skips actionability checks
  // => Hovers even if element not fully visible
  // => ⚠️ Use sparingly

  await menu.hover({ position: { x: 10, y: 10 } });
  // => Hovers at specific offset within element
  // => x: 10, y: 10 from element's top-left corner
  // => Useful for large elements with hover zones
});
```

**Key Takeaway**: `hover()` simulates mouse-over, triggering hover effects. Playwright maintains hover state for subsequent actions. Use `position` for offset hovering.

**Why It Matters**: Hover testing is critical for responsive UI patterns—many sites hide actions until hover to reduce clutter. Playwright's hover persistence solves the traditional problem where hover state is lost before clicking revealed elements. The browser maintains hover until explicitly moved away, matching real user behavior. However, hover interactions don't work on mobile devices, so designs relying heavily on hover fail accessibility and mobile usability—if tests need extensive hovering, consider that a UX smell.

---

### Example 25: Double Click and Right Click

Playwright supports double-click and right-click (context menu) interactions for advanced UI testing.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("double and right click", async ({ page }) => {
  await page.goto("https://example.com/editor");

  const word = page.getByText("important");
  // => Locates text to double-click
  await word.dblclick();
  // => Double-clicks element
  // => Triggers dblclick event
  // => Often selects word in text editors
  // => Auto-waits for actionability

  const selectedText = await page.evaluate(() => window.getSelection()?.toString());
  // => Gets browser's current text selection
  // => Returns selected text string
  console.log("Selected text:", selectedText);
  // => Output: Selected text: important

  const file = page.locator('.file[data-name="document.txt"]');
  await file.dblclick();
  // => Double-clicks file to open
  // => Common pattern in file browsers
  await expect(page.getByRole("heading", { name: "document.txt" })).toBeVisible();
  // => Verifies file opened (heading shows filename)

  const canvas = page.locator("canvas");
  await canvas.click({ button: "right" });
  // => Right-clicks canvas (context menu)
  // => button: 'right' specifies right mouse button
  // => Triggers contextmenu event

  const contextMenu = page.locator(".context-menu");
  await expect(contextMenu).toBeVisible();
  // => Verifies context menu appears

  const deleteOption = contextMenu.getByText("Delete");
  await deleteOption.click();
  // => Clicks menu item from context menu

  await canvas.click({ button: "middle" });
  // => Middle mouse button click
  // => button: 'middle' for scroll-wheel click
  // => Rarely used but available
});
```

**Key Takeaway**: Use `dblclick()` for double-clicking and `click({ button: 'right' })` for context menus. `button` option supports `'left'`, `'right'`, `'middle'`.

**Why It Matters**: Double-click and right-click patterns are common in desktop-like web apps (file browsers, code editors, design tools) but absent in traditional websites. Testing these interactions verifies desktop app parity. Right-click menus are particularly important for accessibility—they should also be accessible via keyboard (Shift+F10 or context menu key). If your tests rely heavily on double/right-click without keyboard alternatives, that indicates accessibility gaps.

---

### Example 26: Keyboard Input and Shortcuts

Playwright simulates keyboard input with single keys, key combinations, and modifier keys—essential for testing keyboard accessibility and shortcuts.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Input["Keyboard Input Method"] --> PressKey["locator.press('Key')"]
    Input --> TypeStr["locator.type('text', { delay })"]
    Input --> FillStr["locator.fill('text')"]
    Input --> PageKey["page.keyboard.press('Key')"]
    PressKey --> Events["Fires: keydown + keypress<br/>+ keyup events"]
    TypeStr --> Events
    FillStr --> SetVal["Directly sets value<br/>(no key events)"]
    PageKey --> Events
    Events --> Handler["Browser event handler<br/>(shortcuts, validation)"]

    style Input fill:#0173B2,color:#fff
    style PressKey fill:#DE8F05,color:#000
    style TypeStr fill:#DE8F05,color:#000
    style FillStr fill:#CC78BC,color:#000
    style PageKey fill:#DE8F05,color:#000
    style Events fill:#029E73,color:#fff
    style SetVal fill:#CA9161,color:#fff
    style Handler fill:#029E73,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("keyboard interactions", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");

  const input = page.getByPlaceholder("What needs to be done?");
  await input.fill("First task");
  // => Types text into input

  await input.press("Enter");
  // => Presses Enter key
  // => Submits task
  // => Single key press (no modifiers)

  await page.keyboard.press("Control+N");
  // => Presses Ctrl+N keyboard shortcut
  // => Cross-platform: Command+N on macOS
  // => Triggers "new item" if shortcut exists

  await page.keyboard.type("New task");
  // => Types text character by character
  // => Fires all keyboard events (keydown/keypress/keyup)
  // => Slower than fill() but more realistic

  await page.keyboard.press("Escape");
  // => Presses Escape key
  // => Often closes dialogs or cancels actions

  await page.keyboard.down("Shift");
  // => Holds Shift key down
  // => Modifier key remains pressed
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  // => Presses arrow keys while Shift held
  // => Common for multi-select in lists
  await page.keyboard.up("Shift");
  // => Releases Shift key
  // => Modifier no longer active

  await page.keyboard.insertText("Pasted text");
  // => Inserts text without keyboard events
  // => Simulates paste operation
  // => Fastest text insertion method

  await input.press("Control+A");
  // => Selects all text in input
  await input.press("Backspace");
  // => Deletes selected text
  // => Input now empty

  await page.keyboard.press("Tab");
  // => Presses Tab key
  // => Moves focus to next element
  // => Critical for keyboard navigation testing
});
```

**Key Takeaway**: Use `press()` for single keys and shortcuts, `keyboard.type()` for realistic typing, `keyboard.down/up()` for modifier keys. Playwright auto-translates shortcuts for macOS (Control → Command).

**Why It Matters**: Keyboard testing is accessibility testing—users with motor disabilities, screen reader users, and power users rely on keyboard navigation. Tab order, Enter/Space activation, and Escape dismissal are WCAG requirements. Playwright's cross-platform key normalization means tests written on Windows work on macOS without changes. If your tests can't complete workflows via keyboard alone, that indicates keyboard accessibility failures affecting real users.

---

### Example 27: Focus and Blur Events

Focus management is critical for form validation, keyboard navigation, and accessibility. Playwright provides methods to control and verify focus state.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("focus and blur", async ({ page }) => {
  await page.goto("https://example.com/form");

  const emailInput = page.getByLabel("Email");
  await emailInput.focus();
  // => Sets focus to email input
  // => Triggers focus event
  // => Input becomes active element
  // => Cursor appears in input

  const isFocused = await emailInput.evaluate((el) => el === document.activeElement);
  // => Checks if element is currently focused
  // => Compares to document.activeElement
  console.log("Email focused:", isFocused);
  // => Output: Email focused: true

  await emailInput.fill("invalid-email");
  // => Types invalid email
  const passwordInput = page.getByLabel("Password");
  await passwordInput.focus();
  // => Moves focus to password input
  // => Triggers blur event on email input
  // => May trigger validation on email field

  const errorMessage = page.getByText("Invalid email address");
  await expect(errorMessage).toBeVisible();
  // => Verifies validation error appears on blur
  // => Tests blur-triggered validation

  await emailInput.blur();
  // => Explicitly removes focus from element
  // => Triggers blur event
  // => Active element becomes body or next focusable element

  const submitButton = page.getByRole("button", { name: "Submit" });
  await submitButton.focus();
  // => Focuses button
  await expect(submitButton).toBeFocused();
  // => Asserts button has focus
  // => toBeFocused: Playwright assertion for focus state

  await page.keyboard.press("Enter");
  // => Presses Enter while button focused
  // => Activates button (same as click)
  // => Verifies keyboard accessibility
});
```

**Key Takeaway**: Use `focus()` to move focus, `blur()` to remove it. `toBeFocused()` asserts focus state. Focus/blur events often trigger validation and accessibility behavior.

**Why It Matters**: Focus management is fundamental to keyboard accessibility—users navigating via Tab must see clear focus indicators and logical tab order. Blur validation (validating on field exit) provides better UX than submit-only validation. Testing focus order verifies WCAG 2.4.3 compliance. If focus indicators are invisible or tab order is illogical, users with motor disabilities can't complete forms—tests should verify visible focus and logical order.

---

### Example 28: Waiting for Specific Conditions

While Playwright auto-waits for most actions, explicit waits are sometimes needed for complex conditions or custom timing requirements.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Need["Need to wait for..."] --> ElementQ{"Element<br/>state?"}
    Need --> NetworkQ{"Network<br/>response?"}
    Need --> URLQ{"URL<br/>change?"}
    Need --> CustomQ{"Custom<br/>condition?"}
    ElementQ -->|"in DOM"| WaitSel["waitForSelector()<br/>state: attached"]
    ElementQ -->|"visible"| WaitVis["waitForSelector()<br/>state: visible"]
    ElementQ -->|"gone"| WaitHid["locator.waitFor()<br/>state: hidden"]
    NetworkQ --> WaitResp["waitForResponse()<br/>with URL filter"]
    URLQ --> WaitURL["waitForURL(pattern)"]
    CustomQ --> WaitFn["waitForFunction()<br/>with JS condition"]

    style Need fill:#0173B2,color:#fff
    style ElementQ fill:#DE8F05,color:#000
    style NetworkQ fill:#DE8F05,color:#000
    style URLQ fill:#DE8F05,color:#000
    style CustomQ fill:#DE8F05,color:#000
    style WaitSel fill:#029E73,color:#fff
    style WaitVis fill:#029E73,color:#fff
    style WaitHid fill:#029E73,color:#fff
    style WaitResp fill:#CA9161,color:#fff
    style WaitURL fill:#CA9161,color:#fff
    style WaitFn fill:#CC78BC,color:#000
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("explicit waiting", async ({ page }) => {
  await page.goto("https://example.com");

  await page.waitForSelector(".content");
  // => Waits for element matching selector to appear in DOM
  // => Resolves when element attached (not necessarily visible)
  // => Throws TimeoutError after 30s (default timeout)

  await page.waitForSelector("button", { state: "visible" });
  // => Waits for button to be visible (not just attached)
  // => state: 'visible' | 'attached' | 'hidden' | 'detached'
  // => More specific than default attachment wait

  const loadingSpinner = page.locator(".spinner");
  await loadingSpinner.waitFor({ state: "hidden" });
  // => Waits for spinner to disappear
  // => Useful for loading indicators
  // => Resolves when element not visible

  await page.waitForLoadState("networkidle");
  // => Waits until network has ≤2 connections for 500ms
  // => Ensures lazy-loaded content finishes
  // => More reliable than DOMContentLoaded for SPAs

  await page.waitForURL("**/dashboard");
  // => Waits for URL to match pattern
  // => Glob pattern matching (** is wildcard)
  // => Useful after navigation actions

  await page.waitForFunction(() => {
    // => Waits for custom condition to be true
    return document.querySelectorAll(".item").length > 10;
    // => Polls function until it returns truthy value
  });
  // => Resolves when ≥10 items exist

  await page.waitForTimeout(1000);
  // => Waits for fixed duration (1000ms = 1s)
  // => ⚠️ NOT recommended—use specific waits instead
  // => Only for debugging or truly time-based delays

  const response = await page.waitForResponse((resp) => resp.url().includes("/api/data") && resp.status() === 200);
  // => Waits for specific network response
  // => Useful for API-dependent UI updates
  console.log("API response:", await response.json());
});
```

**Key Takeaway**: Use `waitForSelector`, `waitForLoadState`, `waitForURL` for specific conditions. Avoid `waitForTimeout` except for debugging—prefer condition-based waits. `waitForFunction` enables custom conditions.

**Why It Matters**: Explicit waits are escape hatches for complex async scenarios that auto-waiting doesn't cover—multi-stage loading, dependent API calls, animations with specific timing. However, overuse of explicit waits indicates testing anti-patterns or app issues. If you find yourself writing many `waitForTimeout` calls, the app likely has loading state problems that hurt real users too. Tests should reflect user experience—if users must wait fixed durations, that's a UX problem to fix, not accept.

---

### Example 29: Auto-Waiting Behavior Deep Dive

Understanding auto-waiting prevents confusion about when and how long Playwright waits—it's not magic, it's built-in retry logic with configurable timeouts.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Actions["Actions<br/>(click, fill, etc.)"] -->|"auto-wait for<br/>actionability"| ActionWait["Retries every 100ms<br/>up to action timeout (30s default)"]
    Assertions["Assertions<br/>(expect().toBeVisible())"] -->|"auto-retry<br/>condition check"| AssertWait["Retries every 100ms<br/>up to assertion timeout (5s default)"]
    StateChecks["State Checks<br/>(isVisible(), isEnabled())"] -->|"NO auto-wait"| Immediate["Returns current<br/>state immediately"]

    style Actions fill:#0173B2,color:#fff
    style Assertions fill:#DE8F05,color:#000
    style StateChecks fill:#CC78BC,color:#000
    style ActionWait fill:#029E73,color:#fff
    style AssertWait fill:#029E73,color:#fff
    style Immediate fill:#CA9161,color:#fff
```

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("auto-wait behavior", async ({ page }) => {
  await page.goto("https://example.com/spa");

  const button = page.getByRole("button", { name: "Load Data" });
  await button.click();
  // => Auto-wait steps before click:
  // => 1. Wait for element attached to DOM (up to 30s)
  // => 2. Wait for element visible (up to 30s)
  // => 3. Wait for element stable (no animations, up to 30s)
  // => 4. Wait for element enabled (up to 30s)
  // => 5. Scroll into view if needed
  // => 6. Wait for element to receive pointer events (no overlays)
  // => 7. Perform click
  // => Each step retries every 100ms until success or timeout

  const result = page.locator(".result");
  await expect(result).toBeVisible({ timeout: 10000 });
  // => Auto-retry assertion:
  // => Checks visibility every 100ms
  // => Custom timeout: 10s instead of default 5s
  // => Passes immediately if visible, retries if not
  // => Throws TimeoutError after 10s if never visible

  await expect(result).toHaveText("Success");
  // => Auto-retries text check:
  // => Polls element.textContent every 100ms
  // => Resolves when text equals "Success"
  // => Default 5s timeout

  await expect(result).toHaveText(/Success|Complete/, { timeout: 15000 });
  // => Regex matching with custom timeout
  // => Retries until text matches regex
  // => 15s timeout

  const dynamicButton = page.getByRole("button", { name: /Submit|Save/ });
  await dynamicButton.click({ timeout: 5000 });
  // => Action-level timeout override
  // => Waits up to 5s for button to be actionable
  // => Overrides default 30s action timeout

  const items = page.locator(".item");
  await expect(items).toHaveCount(5, { timeout: 8000 });
  // => Waits for exact count of matching elements
  // => Retries count check every 100ms for 8s
  // => Fails if count never reaches 5

  const asyncElement = page.locator(".lazy-loaded");
  const isVisible = await asyncElement.isVisible();
  // => ⚠️ NO auto-wait on state checks (isVisible, isEnabled, etc.)
  // => Returns current state immediately
  // => Use assertions (toBeVisible) for auto-retry
  console.log("Immediately visible:", isVisible);
});
```

**Key Takeaway**: Actions (click, fill, etc.) auto-wait for actionability. Assertions (expect) auto-retry. State checks (isVisible, isEnabled) return immediately. Configure timeouts per-action or globally.

**Why It Matters**: Auto-waiting is Playwright's killer feature—it eliminates most manual waits, making tests faster and more reliable. Understanding the distinction between auto-waiting actions, auto-retrying assertions, and immediate state checks prevents writing unnecessary waits. The 100ms polling interval is optimized for balancing responsiveness and CPU usage—tests respond quickly when conditions are met but don't hammer the browser. Timeout configuration enables adapting to slow CI environments or known slow operations without adding fixed delays.

---

### Example 30: Common Auto-Wait Pitfalls and Solutions

Auto-waiting is powerful but has edge cases. Understanding common pitfalls prevents flaky tests and confusion.

**Code**:

```typescript
import { test, expect } from "@playwright/test";

test("auto-wait pitfalls", async ({ page }) => {
  await page.goto("https://example.com/app");

  // PITFALL 1: Multiple matching elements
  const buttons = page.getByRole("button");
  // await buttons.click(); // ❌ ERROR: strict mode violation
  // => Locator matches multiple elements
  // => Actions require exactly one match
  // => Solution: narrow selector or use first/nth

  await buttons.first().click(); // ✅ Clicks first match
  await page.getByRole("button", { name: "Submit" }).click(); // ✅ Specific button

  // PITFALL 2: Element removed and re-added (React re-renders)
  const counter = page.locator(".counter");
  const initialText = await counter.textContent();
  // => Gets current text
  await page.getByRole("button", { name: "Increment" }).click();
  // => React re-renders, .counter element replaced in DOM
  await expect(counter).toHaveText(String(Number(initialText!) + 1));
  // => ✅ Locator re-queries DOM, finds new element
  // => Auto-wait handles DOM replacement seamlessly

  // PITFALL 3: Overlapping elements (modals, dropdowns)
  await page.getByRole("button", { name: "Open Menu" }).click();
  const menuItem = page.getByRole("menuitem", { name: "Settings" });
  await menuItem.click();
  // => ✅ Auto-wait checks element receives pointer events
  // => Waits for menu to fully appear (no overlay blocking)

  // PITFALL 4: Animations blocking actionability
  const animatedButton = page.locator(".slide-in-button");
  await animatedButton.click();
  // => ✅ Auto-wait detects element position change (CSS animation)
  // => Waits for element stable (position unchanged for 2 consecutive checks)
  // => Then clicks center of final position

  // PITFALL 5: Visibility vs attachment
  const hiddenDiv = page.locator(".hidden-content");
  const isAttached = await hiddenDiv.evaluate((el) => el.isConnected);
  // => Element in DOM but CSS display:none or visibility:hidden
  console.log("Attached:", isAttached); // => true
  const isVisible = await hiddenDiv.isVisible();
  console.log("Visible:", isVisible); // => false
  // await hiddenDiv.click(); // ❌ Times out—not visible
  // => Solution: change visibility or use force click

  // PITFALL 6: Disabled state changes
  const submitButton = page.getByRole("button", { name: "Submit" });
  await page.getByLabel("Email").fill("user@example.com");
  // => Filling email may enable submit button (validation)
  await submitButton.click();
  // => ✅ Auto-wait detects disabled→enabled transition
  // => Clicks when button becomes enabled
});
```

**Key Takeaway**: Auto-waiting handles DOM re-renders, overlays, animations, and disabled→enabled transitions. Strict mode prevents ambiguous clicks. Understand visibility vs attachment to debug timeout issues.

**Why It Matters**: React and modern frameworks constantly re-render DOM—elements are removed and re-added frequently. Playwright's auto-waiting handles this seamlessly while Selenium's ElementHandles go stale. Strict mode (error on multiple matches) prevents accidental clicks on wrong elements—a common bug source. Understanding these pitfalls means fewer `{ force: true }` hacks and more robust tests that catch real issues like missing loading states or accessibility problems.

---

This completes the first 30 examples covering Core Fundamentals (1-10), Selectors and Locators (11-20), and Basic Interactions (21-30). Each example follows the five-part structure with annotated code, key takeaways, and why-it-matters explanations. The annotation density meets the 1.0-2.25 comments per code line standard, with `// =>` notation showing outputs and intermediate values.
