# Technical Documentation: Spec-Coverage Full Enforcement

## The spec-coverage Tool

The tool is `rhino-cli spec-coverage validate` and it is invoked via:

```bash
CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate \
  --shared-steps \
  --exclude-dir test-support \
  <feature-dir> \
  <app-dir>
```

**Flags**:

- `--shared-steps`: Step matching is cross-file within the app. A step defined in any file
  under `<app-dir>` counts as matched, regardless of which feature file uses it.
- `--exclude-dir test-support`: The `test-support/` subdirectory of the feature directory is
  excluded. This directory contains specs for shared E2E test infrastructure, not individual app
  behavior.

**What it checks**: For each `Given`/`When`/`Then`/`And` step text in every `.feature` file, the
tool scans all source files under `<app-dir>` for a regex or string pattern that matches the step.
It reports steps with no match as gaps.

**Match strategy**: The tool looks for the step text (or a regex that matches it) as a string
literal in any source file. The exact matching algorithm is language-agnostic: it searches for
the step text appearing inside quotes or backticks in any source file with the right extension.

## Nx Target Command Patterns

Each project needs a `spec-coverage` target added to its `project.json`. The command structure
and `inputs` glob differ by language. Use the patterns below as templates.

### TypeScript / JavaScript

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-ts-effect",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.{ts,tsx}"]
  }
}
```

For E2E apps using FE gherkin specs:

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/fe/gherkin apps/a-demo-fe-e2e",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/fe/gherkin/**/*.feature", "{projectRoot}/**/*.ts"]
  }
}
```

For organiclever-fe-e2e (uses organiclever fe gherkin):

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps specs/apps/organiclever/fe/gherkin apps/organiclever-fe-e2e",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/organiclever/fe/gherkin/**/*.feature", "{projectRoot}/**/*.ts"]
  }
}
```

### Python

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-python-fastapi",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.py"]
  }
}
```

### Java (Maven projects: java-springboot, java-vertx)

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-java-springboot",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.java"]
  }
}
```

### Kotlin

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-kotlin-ktor",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.kt"]
  }
}
```

### Rust

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-rust-axum",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.rs"]
  }
}
```

### Elixir

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-elixir-phoenix",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.ex"]
  }
}
```

### Clojure

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/be/gherkin apps/a-demo-be-clojure-pedestal",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature", "{projectRoot}/**/*.clj"]
  }
}
```

### Dart / Flutter

```json
{
  "spec-coverage": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go spec-coverage validate --shared-steps --exclude-dir test-support specs/apps/a-demo/fe/gherkin apps/a-demo-fe-dart-flutterweb",
    "cache": true,
    "inputs": ["{workspaceRoot}/specs/apps/a-demo/fe/gherkin/**/*.feature", "{projectRoot}/**/*.dart"]
  }
}
```

## Reference Step Definition Patterns

Each language has its own BDD framework and syntax for registering step definitions. Use the
passing reference implementations to understand the pattern before adding new steps.

### Go / godog (reference: `a-demo-be-golang-gin`)

Steps are registered in `*_steps_test.go` files using `sc.Step(regex, fn)`:

```go
sc.Step(`^an operations engineer sends GET /health$`, func(ctx context.Context) (context.Context, error) {
    resp, err := healthService.GetHealth(ctx)
    // ...
    return ctx, nil
})
```

The regex is the exact step text with `^` and `$` anchors and special characters escaped.

### F# / TickSpec (reference: `a-demo-be-fsharp-giraffe`)

Steps use backtick method names matching the step text exactly:

```fsharp
let [<Given>] ``alice is authenticated`` () =
    // setup

let [<When>] ``alice sends GET /expenses`` () =
    // action

let [<Then>] ``alice should see expense list`` () =
    // assertion
```

The backtick method name must match the step text exactly (case-insensitive).

### C# / Reqnroll (reference: `a-demo-be-csharp-aspnetcore`)

Steps use attribute annotations:

```csharp
[Given("alice is authenticated")]
public void GivenAliceIsAuthenticated()
{
    // setup
}

[When("alice sends GET /expenses")]
public void WhenAliceSendsGetExpenses()
{
    // action
}

[Then("alice should see expense list")]
public void ThenAliceShouldSeeExpenseList()
{
    // assertion
}
```

### TypeScript / Cucumber.js (reference: `a-demo-be-ts-effect`, `a-demo-be-e2e`)

Steps are defined using `Given`, `When`, `Then` from `@cucumber/cucumber`:

```typescript
import { Given, When, Then } from "@cucumber/cucumber";

Given("alice is authenticated", async function () {
  // setup
});

When("alice sends GET /expenses", async function () {
  // action
});

Then("alice should see expense list", function () {
  // assertion
});
```

For steps with dynamic values, use `{string}` or `{int}` placeholders:

```typescript
Then("alice's account status should be {string}", function (status: string) {
  // assertion using status
});
```

### Python / pytest-bdd (reference: `a-demo-be-python-fastapi`)

Steps use decorators from `pytest_bdd`:

```python
from pytest_bdd import given, when, then, parsers

@given("alice is authenticated")
def alice_is_authenticated(context):
    # setup

@when("alice sends GET /expenses")
def alice_sends_get_expenses(context):
    # action

@then(parsers.parse('alice\'s account status should be "{status}"'))
def alice_account_status_should_be(context, status):
    # assertion
```

### Java / Cucumber JVM (reference: `a-demo-be-java-springboot`, `a-demo-be-java-vertx`)

Steps use annotations from `io.cucumber.java.en`:

```java
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;

@Given("alice is authenticated")
public void aliceIsAuthenticated() {
    // setup
}

@When("alice sends GET /expenses")
public void aliceSendsGetExpenses() {
    // action
}

@Then("alice's account status should be {string}")
public void aliceAccountStatusShouldBe(String status) {
    // assertion
}
```

### Kotlin / Cucumber JVM (reference: `a-demo-be-kotlin-ktor`)

Same as Java Cucumber JVM but with Kotlin syntax:

```kotlin
import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then

@Given("alice is authenticated")
fun aliceIsAuthenticated() {
    // setup
}

@Then("alice's account status should be {string}")
fun aliceAccountStatusShouldBe(status: String) {
    // assertion
}
```

### Rust / cucumber-rs (reference: `a-demo-be-rust-axum`)

Steps are defined with `#[given]`, `#[when]`, `#[then]` proc macros:

```rust
use cucumber::{given, then, when};

#[given("alice is authenticated")]
async fn alice_is_authenticated(world: &mut AppWorld) {
    // setup
}

#[then(expr = "alice's account status should be {string}")]
async fn alice_account_status_should_be(world: &mut AppWorld, status: String) {
    // assertion
}
```

### Elixir / WhiteBread or ExUnit+BDD (reference: `a-demo-be-elixir-phoenix`)

Steps use pattern-matched step functions:

```elixir
defmodule MyApp.StepDefinitions do
  use WhiteBread.Suite

  step "alice is authenticated" do
    # setup
  end

  step "alice's account status should be \"(.*?)\"", [status] do
    # assertion using status
  end
end
```

### Clojure / clj-bdd or kaocha (reference: `a-demo-be-clojure-pedestal`)

Steps are registered with defstep macros:

```clojure
(defstep "alice is authenticated"
  [state]
  ;; setup
  state)

(defstep #"alice's account status should be \"(.*?)\""
  [state [_ status]]
  ;; assertion
  state)
```

### Dart / bdd_widget_test or flutter_test (reference: `a-demo-fe-dart-flutterweb`)

Steps are defined in step files under `test/`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:bdd_widget_test/bdd_widget_test.dart';

Future<void> theViewportIsSetToDesktop(WidgetTester tester) async {
  await tester.binding.setSurfaceSize(const Size(1280, 800));
}
```

## Per-Project Gap Analysis

### Tier 1: Quick Fixes

#### a-demo-be-ts-effect (3 missing steps)

| Step                                                 | Area          | Issue                                                           |
| ---------------------------------------------------- | ------------- | --------------------------------------------------------------- |
| `When an operations engineer sends GET /health`      | Health        | Step text uses `\/health` escaping that may confuse the matcher |
| `When an unauthenticated engineer sends GET /health` | Health        | Same escaping issue                                             |
| `When the client sends GET /.well-known/jwks.json`   | Security/JWKS | Step definition for JWKS endpoint missing                       |

**Fix approach**: Check existing step file for how `/health` is matched. If the escaping is
the issue, normalize the step text or update the regex. For JWKS, add a new step that calls
the `getJwks` service function (analogous to the Go reference).

#### a-demo-be-python-fastapi (8 missing steps)

| Step                                                                | Area                           |
| ------------------------------------------------------------------- | ------------------------------ |
| `alice's account status should be "{status}"` (×3)                  | User account status assertions |
| `alice sends POST .../auth/refresh with her original refresh token` | Token refresh rotation         |
| `alice uploads file ...` (×4)                                       | Attachment upload              |

**Fix approach**: Add `@then` decorator for account status, a `@when` decorator for refresh
rotation, and `@when`/`@then` decorators for attachment upload. Reference the Go/Gin step file
for the exact step texts.

### Tier 2: Medium Effort

#### a-demo-fe-e2e (10 missing steps)

All 10 are viewport/responsive layout steps consumed from `specs/apps/a-demo/fe/gherkin/`.
Example: `Given the viewport is set to "desktop" (1280x800)`.

**Fix approach**: Add a new step definition file `viewport-steps.ts` that calls
`page.setViewportSize({ width: 1280, height: 800 })` etc. Reference the existing passing FE
step definition files in `a-demo-fe-ts-nextjs` for how viewport steps are implemented.

#### organiclever-fe-e2e (15 missing steps)

Steps span auth flows (Google sign-in, profile access, redirects) and accessibility (keyboard
navigation, form labels).

**Fix approach**: Add step definitions in the appropriate step files. Auth flow steps should
mock or stub Google OAuth. Accessibility steps use Playwright's `locator.press()` for keyboard
navigation and `locator.getAttribute('aria-label')` for label checks.

#### a-demo-be-clojure-pedestal (22 missing steps)

| Area                                              | Missing Steps |
| ------------------------------------------------- | ------------- |
| Admin: disable/enable/unlock/force-password-reset | 4             |
| Expenses: GET by ID, PUT, DELETE                  | 4 (approx)    |
| Attachments: upload, list, delete + authorization | 10            |
| Currency: USD and IDR display assertions          | 2             |
| Unit handling                                     | ~2            |

**Fix approach**: Add step definitions to the existing step namespace files. Reference the Go
step definitions for behavioral semantics. Clojure steps call service functions directly with
mocked repositories.

### Tier 3: Large Effort

#### a-demo-be-java-springboot (49 missing steps)

Categories: auth login/register validation, expenses CRUD, P&L reporting, attachments
upload/delete/list+auth, admin operations, user profile/password/display-name,
currency/unit handling.

**Fix approach**: Add step definition classes in `src/test/java/` following the existing
Cucumber JVM step class organization. Each new step method calls the appropriate service class
with a mock repository injected via Spring's test context or Mockito.

#### a-demo-be-rust-axum (58 missing steps)

Same feature set as Java but Rust has more granular `Given`/`And` steps for data setup
(e.g., separate steps for seeding expense records vs. calling the endpoint).

**Fix approach**: Add step functions in the `tests/unit/` directory using `#[given]`/`#[when]`/
`#[then]` macros from `cucumber-rs`. Each step operates on the `World` struct which holds the
mocked service state.

#### a-demo-be-elixir-phoenix (76 missing steps)

Broadest gap: missing health, JWKS, token lifecycle, logout, admin, expenses, reporting,
attachments, user accounts, currency, units.

**Fix approach**: Add step modules in `test/unit/` using the existing BDD framework in the
project. Reference the F# steps for behavioral semantics since F# is also functional-first.

#### a-demo-be-java-vertx (79 missing steps)

Similar breadth to Elixir. Vertx uses reactive programming patterns internally but the step
definitions at the unit level still call service functions synchronously (blocking on futures).

**Fix approach**: Follow the same pattern as `a-demo-be-java-springboot` but adapted to Vertx's
service layer API. The step definition classes live in `src/test/java/`.

#### a-demo-be-kotlin-ktor (96 missing steps)

Broadest BE gap. Missing health, JWKS, token lifecycle, logout, admin, expenses, reporting,
attachments, user accounts, currency, units, list/pagination.

**Fix approach**: Add step functions using Kotlin Cucumber JVM in `src/test/kotlin/`. Kotlin's
concise syntax means each step is typically 3-5 lines.

### Tier 4: Largest Effort

#### a-demo-fe-dart-flutterweb (220 missing steps)

Nearly all FE step definitions are missing. Covers every feature area: auth flows, admin panel,
expense management, attachments, reporting, responsive layout, accessibility.

**Fix approach**: The `swe-dart-developer` agent must audit all `.feature` files in
`specs/apps/a-demo/fe/gherkin/` and implement matching step functions. Steps should use
`flutter_test` and the existing BDD widget test framework already in the project. Each step
interacts with the widget tree via `WidgetTester` (finders, taps, text input).

## Feature File Locations

| Project(s)                                                                                 | Feature spec directory                |
| ------------------------------------------------------------------------------------------ | ------------------------------------- |
| All `a-demo-be-*` apps                                                                     | `specs/apps/a-demo/be/gherkin/`       |
| `a-demo-fe-e2e`, `a-demo-fe-dart-flutterweb`, `a-demo-fe-ts-nextjs`, `a-demo-fs-ts-nextjs` | `specs/apps/a-demo/fe/gherkin/`       |
| `organiclever-fe-e2e`                                                                      | `specs/apps/organiclever/fe/gherkin/` |

## Validation Commands

After implementing steps for a project, run in order:

```bash
# 1. Verify tests pass and coverage threshold is met
npx nx run <project>:test:quick

# 2. Verify spec-coverage reports 0 gaps
npx nx run <project>:spec-coverage
```

For E2E-only projects (no coverage threshold), step 1 reduces to:

```bash
npx nx run <project>:typecheck
npx nx run <project>:lint
```

## Coverage Thresholds Reference

| Project                      | Threshold              |
| ---------------------------- | ---------------------- |
| `a-demo-be-ts-effect`        | ≥90% (LCOV)            |
| `a-demo-be-python-fastapi`   | ≥90% (LCOV)            |
| `a-demo-be-clojure-pedestal` | ≥90% (LCOV)            |
| `a-demo-be-java-springboot`  | ≥90% (JaCoCo)          |
| `a-demo-be-rust-axum`        | ≥90% (LCOV)            |
| `a-demo-be-elixir-phoenix`   | ≥90% (AltCover LCOV)   |
| `a-demo-be-java-vertx`       | ≥90% (JaCoCo)          |
| `a-demo-be-kotlin-ktor`      | ≥90% (Kover JaCoCo)    |
| `a-demo-fe-dart-flutterweb`  | ≥70% (LCOV)            |
| `a-demo-fe-e2e`              | No coverage (E2E only) |
| `organiclever-fe-e2e`        | No coverage (E2E only) |
