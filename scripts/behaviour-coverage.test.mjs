import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  extractBindings,
  parseCliOptions,
  runCli,
  validateCoverage,
  validateFeatureSource,
  validateProjectTargetContract,
} from "./behaviour-coverage.mjs";

const validFeature = `Feature: Static coverage

  Scenario: A covered behaviour
    Given a configured subject
    When the subject is exercised
    Then independent evidence is observed
`;

async function fixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ose-behaviour-coverage-"));
  await Promise.all(
    Object.entries(files).map(async ([relativePath, contents]) => {
      const target = path.join(root, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, contents, "utf8");
    }),
  );
  return root;
}

function tsBindings(extra = "") {
  return `
const { Given, When, Then } = createBdd();
Given("a configured subject", () => {});
When("the subject is exercised", () => {});
Then("independent evidence is observed", () => {});
${extra}`;
}

function javaBindings({ omitThen = false, extra = "" } = {}) {
  const then = omitThen
    ? ""
    : '  @Then("independent evidence is observed")\n  public void independentEvidenceIsObserved() {}\n';
  return `package example;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class Steps {
  @Given("a configured subject")
  public void aConfiguredSubject() {}

  @When("the subject is exercised")
  public void theSubjectIsExercised() {}

${then}${extra}}
`;
}

function goBindings({ omitThen = false, extra = "" } = {}) {
  const then = omitThen ? "" : "\tctx.Then(`^independent evidence is observed$`, independentEvidenceIsObserved)\n";
  return `package steps

import "github.com/cucumber/godog"

func InitializeScenario(ctx *godog.ScenarioContext) {
\tctx.Given(\`^a configured subject$\`, aConfiguredSubject)
\tctx.When(\`^the subject is exercised$\`, theSubjectIsExercised)
${then}${extra}}
`;
}

function csharpBindings({ omitThen = false, extra = "" } = {}) {
  const then = omitThen
    ? ""
    : '    [Then("independent evidence is observed")]\n    public void IndependentEvidenceIsObserved() { }\n';
  return `namespace Example;

using Reqnroll;

[Binding]
public sealed class Steps
{
    [Given("a configured subject")]
    public void AConfiguredSubject() { }

    [When("the subject is exercised")]
    public void TheSubjectIsExercised() { }

${then}${extra}}
`;
}

test("accepts independently documented Integration and E2E exemptions", () => {
  const source = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(integration): the local boundary cannot inject the private invariant failure; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @integration-exempt\n" +
      "  # Exemption(e2e): no public trigger can inject the private invariant failure; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @e2e-exempt\n" +
      "  Scenario: A covered behaviour",
  );

  assert.deepEqual(validateFeatureSource("example.feature", source).errors, []);
});

test("requires each exemption on its own tag line with its own adjacent comment", () => {
  const sharedTagLine = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(integration): local state is not observable at the public boundary; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @integration-exempt @e2e-exempt\n" +
      "  Scenario: A covered behaviour",
  );
  const sharedComment = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(integration): local state is not observable at the public boundary; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @integration-exempt\n" +
      "  @e2e-exempt\n" +
      "  Scenario: A covered behaviour",
  );

  assert.ok(
    validateFeatureSource("example.feature", sharedTagLine).errors.some((error) => error.includes("separate tag line")),
  );
  assert.ok(
    validateFeatureSource("example.feature", sharedComment).errors.some((error) =>
      error.includes("immediately preceding comment"),
    ),
  );
});

test("rejects difficulty, runtime, flakiness, cost, and unfinished-work reasons", () => {
  for (const reason of [
    "hard to build",
    "slow runtime",
    "flaky in CI",
    "costly to maintain",
    "too expensive",
    "TODO",
    "not-yet-implemented",
    "unfinished",
    "missing implementation",
  ]) {
    const source = validFeature.replace(
      "  Scenario: A covered behaviour",
      `  # Exemption(e2e): ${reason}; alternative-proof: example:test:unit / A covered behaviour\n` +
        "  @e2e-exempt\n" +
        "  Scenario: A covered behaviour",
    );
    assert.ok(
      validateFeatureSource("example.feature", source).errors.some((error) => error.includes("cannot be justified")),
      reason,
    );
  }
});

test("requires boundary language and a canonical alternative proof", () => {
  const weakReason = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(e2e): this is enough; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @e2e-exempt\n" +
      "  Scenario: A covered behaviour",
  );
  const invalidProof = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(e2e): no public boundary exposes this invariant; alternative-proof: unit suite\n" +
      "  @e2e-exempt\n" +
      "  Scenario: A covered behaviour",
  );

  assert.ok(
    validateFeatureSource("example.feature", weakReason).errors.some((error) => error.includes("boundary mismatch")),
  );
  assert.ok(
    validateFeatureSource("example.feature", invalidProof).errors.some((error) => error.includes("alternative-proof")),
  );
});

test("rejects forbidden exemption, WIP, no-layer, and positive selection tags", () => {
  for (const tag of ["@unit-exempt", "@wip", "@no-network", "@unit", "@integration", "@e2e"]) {
    const source = validFeature.replace("  Scenario: A covered behaviour", `  ${tag}\n  Scenario: A covered behaviour`);
    assert.ok(
      validateFeatureSource("example.feature", source).errors.some((error) => error.includes("is forbidden")),
      tag,
    );
  }
});

test("does not interpret doc-string content as tags", () => {
  const source = `Feature: Doc strings

  Scenario: Literal tags are documented
    Given documentation containing:
      """
      @wip
      @unit-exempt
      """
    When the documentation is inspected
    Then the literal tags are preserved
`;

  assert.deepEqual(validateFeatureSource("doc-string.feature", source).errors, []);
});

test("rejects malformed and empty features and scenarios without explicit When and Then", () => {
  assert.ok(
    validateFeatureSource("malformed.feature", "Scenario: orphan").errors.some((error) => error.includes("parse")),
  );
  assert.ok(
    validateFeatureSource("empty.feature", "Feature: Empty").errors.some((error) =>
      error.includes("at least one scenario"),
    ),
  );
  const noAction = validFeature
    .replace("    When the subject is exercised\n", "")
    .replace("    Then independent evidence is observed\n", "");
  const errors = validateFeatureSource("no-action.feature", noAction).errors;
  assert.ok(errors.some((error) => error.includes("explicit When")));
  assert.ok(errors.some((error) => error.includes("explicit Then")));
});

test("expands every Scenario Outline example row", () => {
  const source = `Feature: Outline coverage

  Scenario Outline: A value is covered
    Given value <value>
    When the value is inspected
    Then result <result> is observed

    Examples:
      | value | result |
      | one   | first  |
      | two   | second |
`;

  const result = validateFeatureSource("outline.feature", source);
  assert.deepEqual(result.errors, []);
  assert.equal(result.pickles.length, 2);
  assert.deepEqual(
    result.pickles.map(({ steps }) => steps.map(({ text }) => text)),
    [
      ["value one", "the value is inspected", "result first is observed"],
      ["value two", "the value is inspected", "result second is observed"],
    ],
  );
});

test("extracts TypeScript, TSX, and F# TickSpec bindings", () => {
  const typescript = `
const { Given, When } = createBdd();
Given("a value {string}", () => {});
When(/^the value (\\d+) is inspected$/, () => {});
`;
  const fsharp = `
[<Then>]
let \`\`result "([^"]*)" is observed\`\` (result: string) = result
[<Given>]
member _.\`\`a member-bound subject\`\`() = ()
`;

  const bindings = [...extractBindings("steps.tsx", typescript), ...extractBindings("Steps.fs", fsharp)];
  assert.equal(bindings.length, 4);
  assert.equal(bindings[0].keyword, "Given");
  assert.match(bindings[0].pattern, /a value/u);
  assert.equal(bindings[2].keyword, "Then");
  assert.match(bindings[2].pattern, /result/u);
  assert.equal(bindings[3].keyword, "Given");
  assert.equal(bindings[3].pattern, "a member-bound subject");
});

test("ignores commented-out TypeScript and F# bindings", () => {
  const typescript = `
// Given("a disabled step", () => {});
/* When("another disabled step", () => {}); */
Then("an active step", () => {});
`;
  const fsharp = `
(*
[<Given>]
let \`\`a disabled F sharp step\`\` () = ()
*)
[<Then>]
let \`\`an active F sharp step\`\` () = ()
`;

  assert.deepEqual(
    extractBindings("steps.ts", typescript).map(({ pattern }) => pattern),
    ["an active step"],
  );
  assert.deepEqual(
    extractBindings("Steps.fs", fsharp).map(({ pattern }) => pattern),
    ["an active F sharp step"],
  );
});

test("extracts one binding per Java Cucumber annotation", () => {
  const java = javaBindings();

  const bindings = extractBindings("Steps.java", java);

  assert.equal(bindings.length, 3);
  assert.deepEqual(
    bindings.map(({ keyword }) => keyword),
    ["Given", "When", "Then"],
  );
  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    ["a configured subject", "the subject is exercised", "independent evidence is observed"],
  );
  // Cucumber-JVM resolves a step only against its own keyword and treats the annotation
  // argument as a Cucumber expression. The TypeScript extractor sets keywordSensitive:false,
  // so this assertion is what distinguishes a real Java extractor from the fallback happening
  // to match `Given("...")` inside the `@Given("...")` annotation.
  assert.ok(bindings.every(({ keywordSensitive }) => keywordSensitive === true));
  assert.ok(bindings.every(({ expression }) => expression === true));
});

test("reports an undefined Unit binding when a Java step definition is missing", async () => {
  const run = async (java) => {
    const root = await fixture({
      "behaviours/example.feature": validFeature,
      "unit/Steps.java": java,
      "unit/driver.ts": "export const driver = {};",
    });
    return validateCoverage({
      project: "example",
      corpusRoots: [path.join(root, "behaviours")],
      adapter: "unit",
      bindingRoots: [path.join(root, "unit")],
      driver: path.join(root, "unit/driver.ts"),
    });
  };

  // A complete Java step file must leave no scenario undefined. Without .java in BINDING_FILE no
  // binding loads at all, so every step reads as undefined and this half fails — that is what
  // makes the pair discriminating rather than trivially satisfied.
  const complete = await run(javaBindings());
  assert.deepEqual(
    complete.errors.filter((error) => error.includes("undefined Unit binding")),
    [],
  );

  const missingThen = await run(javaBindings({ omitThen: true }));
  assert.ok(missingThen.errors.some((error) => error.includes("undefined Unit binding")));
});

test("reports an unused Unit binding when a Java step definition matches no step", async () => {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/Steps.java": javaBindings({ extra: '  @Given("an unused boundary")\n  public void anUnusedBoundary() {}\n' }),
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.ok(result.errors.some((error) => error.includes("unused Unit binding")));
});

test("extracts one binding per Godog registration", () => {
  const bindings = extractBindings("steps.go", goBindings());

  assert.equal(bindings.length, 3);
  assert.deepEqual(
    bindings.map(({ keyword }) => keyword),
    ["Given", "When", "Then"],
  );
  // Godog registers a Go regexp, not a Cucumber expression, so the anchors survive verbatim.
  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    ["^a configured subject$", "^the subject is exercised$", "^independent evidence is observed$"],
  );
  assert.ok(bindings.every(({ expression }) => expression === false));
  // ctx.Given/When/Then match only their own keyword; "And"/"But" inherit the previous step's.
  assert.ok(bindings.every(({ keywordSensitive }) => keywordSensitive === true));
});

test("treats a Godog ctx.Step registration as keyword-agnostic", () => {
  const source = `package steps

import "github.com/cucumber/godog"

func InitializeScenario(ctx *godog.ScenarioContext) {
\tctx.Step(\`^a configured subject$\`, aConfiguredSubject)
}
`;

  const bindings = extractBindings("steps.go", source);

  assert.equal(bindings.length, 1);
  assert.equal(bindings[0].keyword, "Step");
  // ctx.Step applies to a step of ANY keyword, unlike ctx.Given. Recording it as
  // keywordSensitive:true would report a correctly-bound Then step as undefined.
  assert.equal(bindings[0].keywordSensitive, false);
});

test("accepts an interpreted Go string literal as a Godog pattern", () => {
  const source = `package steps

func InitializeScenario(ctx *godog.ScenarioContext) {
\tctx.When("^the subject is \\"exercised\\"$", theSubjectIsExercised)
}
`;

  const bindings = extractBindings("steps.go", source);

  assert.equal(bindings.length, 1);
  // A double-quoted Go literal processes escapes; a raw backtick literal does not.
  assert.equal(bindings[0].pattern, '^the subject is "exercised"$');
});

test("ignores a Godog registration inside a Go comment", () => {
  const source = `package steps

func InitializeScenario(ctx *godog.ScenarioContext) {
\t// ctx.Given(\`^a commented-out subject$\`, aCommentedOutSubject)
\t/* ctx.When(\`^a block-commented subject$\`, aBlockCommentedSubject) */
\tctx.Given(\`^a configured subject$\`, aConfiguredSubject)
}
`;

  const bindings = extractBindings("steps.go", source);

  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    ["^a configured subject$"],
  );
});

test("does not mask a comment marker that is inside a Go raw-string pattern", () => {
  const source = `package steps

func InitializeScenario(ctx *godog.ScenarioContext) {
\tctx.Given(\`^GET /api/v1//health$\`, getHealth)
\tctx.When(\`^a path ending in a backslash \\\\$\`, trailingBackslash)
\tctx.Then(\`^independent evidence is observed$\`, independentEvidence)
}
`;

  const bindings = extractBindings("steps.go", source);

  // A raw Go string does not process escapes, so `\\` is two literal backslashes and the
  // closing backtick still terminates the literal. Masking it as a JavaScript template
  // literal would swallow the rest of the file and lose the third registration.
  assert.equal(bindings.length, 3);
  assert.equal(bindings[0].pattern, "^GET /api/v1//health$");
  assert.equal(bindings[2].pattern, "^independent evidence is observed$");
});

test("extracts a Godog registration wrapped in regexp.MustCompile", () => {
  const source = `package steps

import (
\t"regexp"

\t"github.com/cucumber/godog"
)

func InitializeScenario(ctx *godog.ScenarioContext) {
\tctx.Step(regexp.MustCompile(\`^a configured subject$\`), aConfiguredSubject)
\tctx.Then(regexp.MustCompile("^independent evidence is observed$"), independentEvidence)
}
`;

  const bindings = extractBindings("steps.go", source);

  // godog's expr argument accepts *regexp.Regexp as well as a string, and the wrapper is the
  // idiomatic way to pre-compile it. Missing this form reads as an unbound step, not an error.
  assert.deepEqual(
    bindings.map(({ keyword, pattern }) => `${keyword} ${pattern}`),
    ["Step ^a configured subject$", "Then ^independent evidence is observed$"],
  );
});

test("ignores Go regex and backtick literals that are not Godog registrations", () => {
  const source = `package steps

import "regexp"

var pathPattern = regexp.MustCompile(\`^/api/v1/health$\`)

const usage = \`Given a subject
When it runs
Then it is observed\`

func Then(value string) string { return value }

func InitializeScenario(ctx *godog.ScenarioContext) {
\tctx.Given(\`^a configured subject$\`, aConfiguredSubject)
}
`;

  const bindings = extractBindings("steps.go", source);

  // A bare MustCompile, a multi-line raw string that merely quotes Gherkin, and a locally
  // declared function named Then must not register. Only the receiver-dot form does.
  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    ["^a configured subject$"],
  );
});

test("reports an undefined Unit binding when a Godog step definition is missing", async () => {
  const run = async (go) => {
    const root = await fixture({
      "behaviours/example.feature": validFeature,
      "unit/steps.go": go,
      "unit/driver.ts": "export const driver = {};",
    });
    return validateCoverage({
      project: "example",
      corpusRoots: [path.join(root, "behaviours")],
      adapter: "unit",
      bindingRoots: [path.join(root, "unit")],
      driver: path.join(root, "unit/driver.ts"),
    });
  };

  // Without .go in BINDING_FILE no binding loads at all, so every step reads as undefined and
  // this half fails — that is what makes the pair discriminating rather than trivially satisfied.
  const complete = await run(goBindings());
  assert.deepEqual(
    complete.errors.filter((error) => error.includes("undefined Unit binding")),
    [],
  );

  const missingThen = await run(goBindings({ omitThen: true }));
  assert.ok(missingThen.errors.some((error) => error.includes("undefined Unit binding")));
});

test("reports an unused Unit binding when a Godog step definition matches no step", async () => {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/steps.go": goBindings({
      extra: "\tctx.Given(`^an unused boundary$`, anUnusedBoundary)\n",
    }),
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.ok(result.errors.some((error) => error.includes("unused Unit binding")));
});

test("scopes duplicate Godog bindings to explicit feature literals", async () => {
  const feature = (name, action) => `Feature: ${name}

  Scenario: ${name} works
    Given shared setup
    When ${action}
    Then ${name.toLowerCase()} is observed
`;
  const root = await fixture({
    "specs/alpha.feature": feature("Alpha", "alpha runs"),
    "specs/beta.feature": feature("Beta", "beta runs"),
    "unit/alpha_steps.go": `package steps

const featurePath = "specs/alpha.feature"

func InitializeAlpha(ctx *godog.ScenarioContext) {
\tctx.Given(\`^shared setup$\`, sharedSetup)
\tctx.When(\`^alpha runs$\`, alphaRuns)
\tctx.Then(\`^alpha is observed$\`, alphaIsObserved)
}
`,
    "unit/beta_steps.go": `package steps

const featurePath = "specs/beta.feature"

func InitializeBeta(ctx *godog.ScenarioContext) {
\tctx.Given(\`^shared setup$\`, sharedSetup)
\tctx.When(\`^beta runs$\`, betaRuns)
\tctx.Then(\`^beta is observed$\`, betaIsObserved)
}
`,
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  // `shared setup` is registered twice. Without the feature-literal scan each registration would
  // match both features and report an ambiguous binding; the scan confines each file to its own.
  assert.deepEqual(result.errors, []);
});

test("extracts one binding per Reqnroll step attribute", () => {
  const bindings = extractBindings("Steps.cs", csharpBindings());

  assert.equal(bindings.length, 3);
  assert.deepEqual(
    bindings.map(({ keyword }) => keyword),
    ["Given", "When", "Then"],
  );
  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    ["a configured subject", "the subject is exercised", "independent evidence is observed"],
  );
  // Reqnroll is the same resolution family as Cucumber-JVM: the attribute argument is a Cucumber
  // expression and a step resolves only against its own keyword. Comparing the whole shape against
  // the Java equivalent is what distinguishes a real C# extractor from the TypeScript fallback
  // happening to match `Given("...")` inside the `[Given("...")]` attribute, because the fallback
  // records keywordSensitive:false.
  const shape = (extracted) =>
    extracted.map(({ keyword, pattern, flags, expression, scenario, featureReferences, keywordSensitive }) => ({
      keyword,
      pattern,
      flags,
      expression,
      scenario,
      featureReferences,
      keywordSensitive,
    }));
  assert.deepEqual(shape(bindings), shape(extractBindings("Steps.java", javaBindings())));
});

test("ignores a Reqnroll step attribute inside a C# comment", () => {
  const source = `namespace Example;

using Reqnroll;

[Binding]
public sealed class Steps
{
    // [Given("a commented-out subject")]
    /* [When("a block-commented subject")]
       public void ABlockCommentedSubject() { } */
    [Then("independent evidence is observed")]
    public void IndependentEvidenceIsObserved() { }
}
`;

  const bindings = extractBindings("Steps.cs", source);

  // C# shares Java's comment syntax, so the shared masker must give the same parity here that the
  // Java extractor already has: a disabled attribute is not a binding. keywordSensitive pins the
  // survivor to the C# extractor, since the TypeScript fallback also masks comments but records
  // keywordSensitive:false.
  assert.deepEqual(
    bindings.map(({ keyword, pattern, keywordSensitive }) => ({ keyword, pattern, keywordSensitive })),
    [{ keyword: "Then", pattern: "independent evidence is observed", keywordSensitive: true }],
  );
});

test("extracts every attribute of a stacked Reqnroll step method", () => {
  const source = `namespace Example;

using Reqnroll;

[Binding]
public sealed class Steps
{
    [Given("a configured subject")]
    [Given("a second configured subject")]
    public void AConfiguredSubject() { }
}
`;

  const bindings = extractBindings("Steps.cs", source);

  // Reqnroll routinely stacks several patterns onto one method. The attribute-to-method link is
  // asserted without consuming the method, so the second attribute still starts its own match.
  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    ["a configured subject", "a second configured subject"],
  );
  assert.ok(bindings.every(({ keywordSensitive }) => keywordSensitive === true));
});

test("scopes duplicate Reqnroll bindings to explicit feature literals", async () => {
  const feature = (name, action, outcome) => `Feature: ${name}

  Scenario: ${name} works
    Given shared setup
    When ${action}
    Then ${outcome}
`;
  const steps = (name, action, outcome, featurePath) => `namespace Example;

using Reqnroll;

[Binding]
public sealed class ${name}Steps
{
    private const string FeaturePath = "${featurePath}";

    [Given("shared setup")]
    public void SharedSetup() { }

    [When("${action}")]
    public void ${name}Runs() { }

    [Then("${outcome}")]
    public void ${name}IsObserved() { }
}
`;
  const root = await fixture({
    "specs/alpha.feature": feature("Alpha", "alpha runs", "alpha is observed"),
    "specs/beta.feature": feature("Beta", "beta runs", "beta is observed"),
    "unit/AlphaSteps.cs": steps("Alpha", "alpha runs", "alpha is observed", "specs/alpha.feature"),
    "unit/BetaSteps.cs": steps("Beta", "beta runs", "beta is observed", "specs\\\\beta.feature"),
    "unit/driver.csproj": "<Project />",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.csproj"),
  });

  // Two proofs in one: .cs files have to load as binding files at all, and the double-quoted
  // specs/*.feature literal has to confine each file to its own feature -- otherwise the duplicate
  // `shared setup` registration reports as ambiguous.
  assert.deepEqual(result.errors, []);
});

test("scopes duplicate F# TickSpec bindings to explicit feature literals", async () => {
  const feature = (name, action, outcome) => `Feature: ${name}

  Scenario: ${name} works
    Given shared setup
    When ${action}
    Then ${outcome}
`;
  const root = await fixture({
    "specs/alpha.feature": feature("Alpha", "alpha runs", "alpha is observed"),
    "specs/beta.feature": feature("Beta", "beta runs", "beta is observed"),
    "unit/AlphaSteps.fs": `
let private featurePath = "specs/alpha.feature"
[<Given>]
let \`\`shared setup\`\` () = ()
[<When>]
let \`\`alpha runs\`\` () = ()
[<Then>]
let \`\`alpha is observed\`\` () = ()
`,
    "unit/BetaSteps.fs": `
let private featurePath = "specs\\\\beta.feature"
[<Given>]
let \`\`shared setup\`\` () = ()
[<When>]
let \`\`beta runs\`\` () = ()
[<Then>]
let \`\`beta is observed\`\` () = ()
`,
    "unit/driver.fsproj": "<Project />",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.fsproj"),
  });

  assert.deepEqual(result.errors, []);
});

test("keeps duplicate F# TickSpec bindings ambiguous without explicit feature ownership", async () => {
  const root = await fixture({
    "specs/alpha.feature": validFeature,
    "unit/AlphaSteps.fs": `
[<Given>]
let \`\`a configured subject\`\` () = ()
[<When>]
let \`\`the subject is exercised\`\` () = ()
[<Then>]
let \`\`independent evidence is observed\`\` () = ()
`,
    "unit/BetaSteps.fs": `
[<Given>]
let \`\`a configured subject\`\` () = ()
`,
    "unit/driver.fsproj": "<Project />",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.fsproj"),
  });

  assert.ok(result.errors.some((error) => error.includes("ambiguous Unit binding")));
});

test("matches standard and custom Cucumber expression parameters", async () => {
  const feature = `Feature: Parameter bindings

  Scenario: Values are covered
    Given a value "alpha"
    When 42 items are inspected
    Then result accepted is observed
`;
  const root = await fixture({
    "behaviours/parameters.feature": feature,
    "unit/parameters.steps.ts": `
Given("a value {string}", () => {});
When("{int} items are inspected", () => {});
Then("result {any} is observed", () => {});
`,
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("matches vitest-cucumber Scenario Outline placeholders after pickle expansion", async () => {
  const feature = `Feature: Outline adapter

  Scenario Outline: A route redirects
    Given route <source>
    When the route is resolved
    Then destination <destination> is returned

    Examples:
      | source | destination |
      | old    | new         |
`;
  const root = await fixture({
    "behaviours/routes.feature": feature,
    "unit/routes.steps.ts": `
Given("route <source>", () => {});
When("the route is resolved", () => {});
Then("destination <destination> is returned", () => {});
`,
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("matches escaped literal Cucumber metacharacters in Playwright-BDD strings", async () => {
  const feature = `Feature: Escaped literals

  Scenario: Literal punctuation
    Given a touch (no-hover) viewport
    When prev/next is inspected
    Then active/selected is observed
`;
  const root = await fixture({
    "behaviours/literals.feature": feature,
    "e2e/literals.steps.ts": String.raw`
Given("a touch \\(no-hover\\) viewport", () => {});
When("prev\\/next is inspected", () => {});
Then("active\\/selected is observed", () => {});
`,
    "e2e/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "e2e",
    bindingRoots: [path.join(root, "e2e")],
    driver: path.join(root, "e2e/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("treats TypeScript Cucumber registration keywords as matching synonyms", async () => {
  const feature = `Feature: Keyword synonyms

  Scenario: Playwright registration
    Given setup exists
    When the public page opens
    Then the result is visible
`;
  const root = await fixture({
    "behaviours/synonyms.feature": feature,
    "e2e/synonyms.steps.ts": `
Given("setup exists", () => {});
Given("the public page opens", () => {});
Given("the result is visible", () => {});
`,
    "e2e/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "e2e",
    bindingRoots: [path.join(root, "e2e")],
    driver: path.join(root, "e2e/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("requires Unit coverage even when both higher layers are exempt", async () => {
  const feature = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(integration): the local boundary cannot inject the private invariant failure; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @integration-exempt\n" +
      "  # Exemption(e2e): no public boundary exposes the private invariant failure; alternative-proof: example:test:unit / A covered behaviour\n" +
      "  @e2e-exempt\n" +
      "  Scenario: A covered behaviour",
  );
  const root = await fixture({
    "behaviours/example.feature": feature,
    "unit/empty.steps.ts": "export {};",
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.ok(result.errors.some((error) => error.includes("undefined Unit binding")));
});

test("exempts only the named adapter", async () => {
  const feature = validFeature.replace(
    "  Scenario: A covered behaviour",
    "  # Exemption(integration): a browser public boundary is required to observe layout; alternative-proof: example-e2e:test:e2e / A covered behaviour\n" +
      "  @integration-exempt\n" +
      "  Scenario: A covered behaviour",
  );
  const root = await fixture({
    "behaviours/example.feature": feature,
    "adapter/empty.steps.ts": "export {};",
    "adapter/driver.ts": "export const driver = {};",
  });
  const input = {
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    bindingRoots: [path.join(root, "adapter")],
    driver: path.join(root, "adapter/driver.ts"),
  };

  const integration = await validateCoverage({ ...input, adapter: "integration" });
  const e2e = await validateCoverage({ ...input, adapter: "e2e" });

  assert.equal(integration.errors.filter((error) => error.includes("undefined")).length, 0);
  assert.ok(e2e.errors.some((error) => error.includes("undefined E2E binding")));
});

test("reports ambiguous and unused bindings", async () => {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/one.steps.ts": tsBindings('Given("an unused boundary", () => {});'),
    "unit/two.steps.ts": 'When("the subject is exercised", () => {});',
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.ok(result.errors.some((error) => error.includes("ambiguous Unit binding")));
  assert.ok(result.errors.some((error) => error.includes("unused Unit binding")));
});

test("validates scoped vitest-cucumber scenarios without cross-scenario ambiguity", async () => {
  const feature = `Feature: Scoped bindings

  Scenario: First case
    Given shared setup
    When first action
    Then success is observed

  Scenario: Second case
    Given shared setup
    When second action
    Then success is observed
`;
  const bindings = `
describeFeature(feature, ({ Scenario }) => {
  Scenario("First case", ({ Given, When, Then }) => {
    Given("shared setup", () => {});
    When("first action", () => {});
    Then("success is observed", () => {});
  });
  Scenario("Second case", ({ Given, When, Then }) => {
    Given("shared setup", () => {});
    When("second action", () => {});
    Then("success is observed", () => {});
  });
});
`;
  const root = await fixture({
    "behaviours/scoped.feature": feature,
    "unit/scoped.steps.tsx": bindings,
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("scopes duplicate TypeScript Background bindings to their loaded feature", async () => {
  const feature = (name, action, outcome) => `Feature: ${name}

  Background:
    Given the API is running

  Scenario: ${name} works
    When ${action}
    Then ${outcome}
`;
  const root = await fixture({
    "specs/alpha.feature": feature("Alpha", "alpha runs", "alpha is observed"),
    "specs/beta.feature": feature("Beta", "beta runs", "beta is observed"),
    "unit/alpha.steps.ts": `
const feature = loadFeature(path.resolve(process.cwd(), "specs/alpha.feature"));
Given("the API is running", () => {});
When("alpha runs", () => {});
Then("alpha is observed", () => {});
`,
    "unit/beta.steps.ts": `
const feature = loadFeature(path.resolve(process.cwd(), "specs/beta.feature"));
Given("the API is running", () => {});
When("beta runs", () => {});
Then("beta is observed", () => {});
`,
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("does not report feature-scoped bindings outside a manifest corpus as unused", async () => {
  const root = await fixture({
    "specs/in-scope.feature": validFeature,
    "unit/in-scope.steps.ts": `
const feature = loadFeature(path.resolve(process.cwd(), "specs/in-scope.feature"));
${tsBindings()}
`,
    "unit/out-of-scope.steps.ts": `
const feature = loadFeature(path.resolve(process.cwd(), "specs/out-of-scope.feature"));
Given("an unrelated setup", () => {});
`,
    "unit/driver.ts": "export const driver = {};",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs/in-scope.feature")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/driver.ts"),
  });

  assert.deepEqual(result.errors, []);
});

test("requires a non-empty recursive corpus and an existing driver", async () => {
  const root = await fixture({ "nested/README.md": "nothing here" });
  const result = await validateCoverage({
    project: "example",
    corpusRoots: [root],
    adapter: "unit",
    bindingRoots: [root],
    driver: path.join(root, "missing-driver.ts"),
  });

  assert.ok(result.errors.some((error) => error.includes("no .feature files")));
  assert.ok(result.errors.some((error) => error.includes("driver does not exist")));
});

test("aggregate behaviour mode checks every configured adapter without executing tests", async () => {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/steps.ts": tsBindings(),
    "unit/driver.ts": "throw new Error('the static validator executed the driver');",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "behaviour",
    adapters: {
      unit: {
        bindingRoots: [path.join(root, "unit")],
        driver: path.join(root, "unit/driver.ts"),
      },
    },
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.stats.adapters, ["unit"]);
});

test("loads a project-local aggregate config with paths relative to that config", async () => {
  const root = await fixture({
    "config/behaviour-coverage.json": JSON.stringify({
      project: "example",
      corpus: ["../behaviours"],
      adapters: {
        unit: { bindings: ["../unit"], driver: "../unit/driver.ts" },
      },
    }),
    "behaviours/example.feature": validFeature,
    "unit/example.steps.ts": tsBindings(),
    "unit/driver.ts": "export const driver = {};",
  });

  const options = await parseCliOptions(["--config", "config/behaviour-coverage.json", "--adapter", "behaviour"], root);

  assert.equal(options.project, "example");
  assert.deepEqual(options.corpusRoots, [path.join(root, "behaviours")]);
  assert.deepEqual(options.adapters.unit.bindingRoots, [path.join(root, "unit")]);
});

test("CLI is deterministic and never invokes a configured runtime", async () => {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/example.steps.ts": tsBindings(),
    "unit/driver.ts": "throw new Error('runtime execution is forbidden');",
  });
  const output = { logs: [], errors: [] };
  const io = {
    log: (message) => output.logs.push(message),
    error: (message) => output.errors.push(message),
  };
  const argv = [
    "--adapter",
    "unit",
    "--project",
    "example",
    "--corpus",
    path.join(root, "behaviours"),
    "--bindings",
    path.join(root, "unit"),
    "--driver",
    path.join(root, "unit/driver.ts"),
  ];

  assert.equal(await runCli(argv, io), 0);
  assert.equal(await runCli(argv, io), 0);
  assert.deepEqual(output.errors, []);
  assert.equal(output.logs[0], output.logs[1]);
});

test("accepts the closed project target contract", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": { options: { command: "npx vitest run --coverage --coverage.thresholds.lines=99" } },
        "test:integration": { options: { command: "node integration-runner.mjs" } },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:integration": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter integration" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: [
              "npx nx run example:test:coverage:unit",
              "npx nx run example:test:coverage:integration",
              "npx nx run example:test:coverage:behaviour",
            ],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  assert.deepEqual(
    await validateProjectTargetContract(path.join(root, "project.json"), "example", {
      unit: {},
      integration: {},
    }),
    [],
  );
});

test("rejects runtime coverage, incomplete quick composition, and missing adapter pairs", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": { options: { command: "npx vitest run" } },
        "test:coverage:unit": { options: { command: "npx vitest run --coverage" } },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: { command: "npx nx run example:test:unit" },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:lint", "npx nx run example:test:unit"],
            parallel: true,
          },
        },
      },
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", {
    unit: {},
    integration: {},
  });
  assert.ok(errors.some((error) => error.includes("requires test:integration")));
  assert.ok(errors.some((error) => error.includes("at least 99% line coverage")));
  assert.ok(errors.some((error) => error.includes("requires test:coverage:integration")));
  assert.ok(errors.some((error) => error.includes("must be static")));
  assert.ok(errors.some((error) => error.includes("must include aggregate test:coverage")));
  assert.ok(errors.some((error) => error.includes("parallel to false")));
});

test("rejects a Unit line coverage threshold below the 99% hard minimum", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": { options: { command: "npx vitest run --coverage --coverage.thresholds.lines=98" } },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("98% is below the 99% minimum")));
});

test("accepts a 99% Coverlet Unit line coverage hard gate", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": {
          options: {
            command: "dotnet test tests/unit.fsproj /p:CollectCoverage=true /p:Threshold=99 /p:ThresholdType=line",
          },
        },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  assert.deepEqual(await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} }), []);
});

test("accepts a 99% XPlat collector Unit line coverage hard gate", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": {
          options: {
            command:
              "node scripts/dotnet-unit-coverage.mjs --project tests/unit.fsproj --results coverage --line-threshold 99",
          },
        },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  assert.deepEqual(await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} }), []);
});

test("rejects a bare line-threshold argument without the XPlat hard-gate helper", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": { options: { command: "dotnet test tests/unit.fsproj --line-threshold 99" } },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must enforce at least 99% line coverage")));
});

test("dedicated E2E projects do not need to own the Unit runtime", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example-e2e",
      targets: {
        "test:e2e": { options: { command: "npx playwright test" } },
        "test:coverage:e2e": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter e2e" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example-e2e:test:coverage:e2e", "npx nx run example-e2e:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: { command: "npx nx run example-e2e:test:coverage" },
        },
      },
    }),
  });

  assert.deepEqual(
    await validateProjectTargetContract(path.join(root, "project.json"), "example-e2e", {
      unit: {},
      e2e: {},
    }),
    [],
  );
});

test("accepts a 99% JaCoCo Unit line coverage hard gate", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": {
          options: {
            command:
              "cd apps/example && ./gradlew --console=plain -Pcoverage.line.minimum=99 test jacocoTestCoverageVerification",
          },
        },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  assert.deepEqual(await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} }), []);
});

test("rejects a JaCoCo verification task that declares no line minimum", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": {
          options: { command: "cd apps/example && ./gradlew --console=plain test jacocoTestCoverageVerification" },
        },
        "test:coverage:unit": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must enforce at least 99% line coverage")));
});

test("rejects a coverage target that executes the Gradle test task", async () => {
  const root = await fixture({
    "project.json": JSON.stringify({
      name: "example",
      targets: {
        "test:unit": {
          options: {
            command:
              "cd apps/example && ./gradlew --console=plain -Pcoverage.line.minimum=99 test jacocoTestCoverageVerification",
          },
        },
        "test:coverage:unit": {
          options: {
            commands: [
              "cd apps/example && ./gradlew --console=plain test",
              "node scripts/behaviour-coverage.mjs --adapter unit",
            ],
            parallel: false,
          },
        },
        "test:coverage:behaviour": {
          options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
        },
        "test:coverage": {
          options: {
            commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
            parallel: false,
          },
        },
        "test:quick": {
          options: {
            commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
            parallel: false,
          },
        },
      },
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(
    errors.some((error) =>
      error.includes("test:coverage:unit must be static and must not execute a runtime test target or runner"),
    ),
  );
});

// Go has no build-tool-integrated coverage gate the way Gradle has JaCoCo, so
// roots-be enforces its floor through a repo script. The threshold must still
// be visible on the command surface: a floor hidden inside a script body is a
// floor no reviewer or validator can check.
const goCoverageProject = (unitCommand) =>
  JSON.stringify({
    name: "example",
    targets: {
      "test:unit": { options: { command: unitCommand } },
      "test:coverage:unit": {
        options: { command: "node scripts/behaviour-coverage.mjs --adapter unit" },
      },
      "test:coverage:behaviour": {
        options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
      },
      "test:coverage": {
        options: {
          commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
          parallel: false,
        },
      },
      "test:quick": {
        options: {
          commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
          parallel: false,
        },
      },
    },
  });

test("accepts a 99% Go Unit line coverage hard gate", async () => {
  const root = await fixture({
    "project.json": goCoverageProject("COVERAGE_MINIMUM=99 apps/example/scripts/coverage-gate.sh"),
  });

  assert.deepEqual(await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} }), []);
});

test("rejects a Go coverage gate that declares no line minimum", async () => {
  const root = await fixture({
    "project.json": goCoverageProject("apps/example/scripts/coverage-gate.sh"),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must enforce at least 99% line coverage")));
});

test("rejects a Go coverage gate whose declared minimum is below 99", async () => {
  const root = await fixture({
    "project.json": goCoverageProject("COVERAGE_MINIMUM=80 apps/example/scripts/coverage-gate.sh"),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("line coverage")));
});

function pythonBindings({ omitThen = false, extra = "" } = {}) {
  const then = omitThen
    ? ""
    : '\n\n@then("independent evidence is observed")\ndef independent_evidence_is_observed():\n    pass\n';
  return `from pytest_bdd import given, then, when


@given("a configured subject")
def a_configured_subject():
    pass


@when("the subject is exercised")
def the_subject_is_exercised():
    pass
${then}${extra}`;
}

async function validatePython(files) {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/conftest.py": "",
    ...files,
  });
  return validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "behaviours")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/conftest.py"),
  });
}

test("extracts one binding per pytest-bdd step definition", () => {
  const source = `from pytest_bdd import given, parsers, then, when


@given("a configured subject")
def a_configured_subject():
    pass


@when(parsers.parse('the subject is exercised {count} times'), target_fixture="outcome")
def the_subject_is_exercised(count):
    return count


@then(parsers.re(r"independent evidence is (?P<state>observed|recorded)"))
def independent_evidence(state):
    pass
`;

  const bindings = extractBindings("test_steps.py", source);

  assert.deepEqual(
    bindings.map(({ keyword }) => keyword),
    ["Given", "When", "Then"],
  );
  // pytest-bdd resolves a step only against its own decorator keyword, like Cucumber-JVM.
  assert.ok(bindings.every(({ keywordSensitive }) => keywordSensitive === true));
  assert.ok(bindings.every(({ expression }) => expression === false));
  // A plain string is an exact match, a parse placeholder is unconstrained, and a Python named
  // group is rewritten to the JavaScript spelling so the same pattern can be evaluated here.
  assert.deepEqual(
    bindings.map(({ pattern }) => pattern),
    [
      "a configured subject",
      "the subject is exercised .+? times",
      "independent evidence is (?<state>observed|recorded)",
    ],
  );
});

test("treats a pytest-bdd cfparse registration like a parse registration", () => {
  const source = `from pytest_bdd import given, parsers


@given(parsers.cfparse("a subject named {name} exists"))
def named_subject(name):
    pass
`;

  const [binding] = extractBindings("test_steps.py", source);

  assert.equal(binding.pattern, "a subject named .+? exists");
});

test("escapes regex metacharacters in a plain pytest-bdd step string and a parse template", () => {
  const source = `from pytest_bdd import given, parsers


@given("the output (stdout) is empty")
def stdout_is_empty():
    pass


@given(parsers.parse("the mapping {{key}} holds {value}"))
def mapping_holds(value):
    pass
`;

  // A plain string is an exact match, so its parentheses are literal; a parse template doubles a
  // brace to write a literal one.
  assert.deepEqual(
    extractBindings("test_steps.py", source).map(({ pattern }) => pattern),
    ["the output \\(stdout\\) is empty", "the mapping \\{key\\} holds .+?"],
  );
});

test("treats a pytest-bdd step registration as keyword-agnostic", () => {
  const source = `from pytest_bdd import step


@step("a configured subject")
def a_configured_subject():
    pass
`;

  const [binding] = extractBindings("test_steps.py", source);

  assert.equal(binding.keyword, "Step");
  // A generic @step applies to a step of ANY keyword; recording it keyword-sensitive would report
  // a correctly-bound Then step as undefined.
  assert.equal(binding.keywordSensitive, false);
});

test("ignores a pytest-bdd registration inside a Python comment or docstring", () => {
  const source = `"""Module docstring that quotes a registration.

@given("a documented subject")
def documented():
    pass
"""
from pytest_bdd import given

# @given("a commented subject")
# def commented():
#     pass


@given("issue #1 is open")
def issue_is_open():
    """@given("an inner docstring subject")
    def inner():
        pass
    """
`;

  // A hash inside a string literal is not a comment, so the pattern keeps its own hash.
  assert.deepEqual(
    extractBindings("test_steps.py", source).map(({ pattern }) => pattern),
    ["issue #1 is open"],
  );
});

test("reads feature references from Python string literals", () => {
  const source = `from pytest_bdd import given, scenarios

scenarios("../../../specs/apps/example/cli/behaviours/alpha.feature")


@given("a configured subject")
def a_configured_subject():
    pass
`;

  const [binding] = extractBindings("test_steps.py", source);

  assert.deepEqual(binding.featureReferences, ["specs/apps/example/cli/behaviours/alpha.feature"]);
});

test("reports an undefined Unit binding when a pytest-bdd step definition is missing", async () => {
  // Without .py in BINDING_FILE no binding loads at all, so every step reads as undefined and
  // the complete half fails; that is what makes the pair discriminating rather than trivial.
  const complete = await validatePython({ "unit/test_steps.py": pythonBindings() });
  assert.deepEqual(
    complete.errors.filter((error) => error.includes("undefined Unit binding")),
    [],
  );

  const missingThen = await validatePython({ "unit/test_steps.py": pythonBindings({ omitThen: true }) });
  assert.ok(missingThen.errors.some((error) => error.includes("undefined Unit binding")));
});

test("reports an unused Unit binding when a pytest-bdd step definition matches no step", async () => {
  const result = await validatePython({
    "unit/test_steps.py": pythonBindings({
      extra: '\n\n@given("an unused boundary")\ndef an_unused_boundary():\n    pass\n',
    }),
  });

  assert.ok(result.errors.some((error) => error.includes("unused Unit binding")));
});

test("reports an ambiguous Unit binding when two pytest-bdd definitions match one step", async () => {
  const result = await validatePython({
    "unit/test_steps.py": pythonBindings(),
    "unit/test_more_steps.py": '@given("a configured subject")\ndef duplicate():\n    pass\n',
  });

  assert.ok(result.errors.some((error) => error.includes("ambiguous Unit binding")));
});

test("matches a pytest-bdd parse placeholder and a regex group against the step text", async () => {
  const result = await validatePython({
    "unit/test_steps.py": `from pytest_bdd import given, parsers, then, when


@given(parsers.parse("a {kind} subject"))
def a_subject(kind):
    pass


@when(parsers.re(r"the (?P<what>subject) is exercised"))
def exercised(what):
    pass


@then("independent evidence is observed")
def observed():
    pass
`,
  });

  assert.deepEqual(result.errors, []);
});

test("scopes duplicate pytest-bdd bindings to explicit feature literals", async () => {
  const feature = (name, action) => `Feature: ${name}

  Scenario: ${name} works
    Given shared setup
    When ${action}
    Then ${name.toLowerCase()} is observed
`;
  const root = await fixture({
    "specs/alpha.feature": feature("Alpha", "alpha runs"),
    "specs/beta.feature": feature("Beta", "beta runs"),
    "unit/test_alpha_steps.py": `from pytest_bdd import given, scenarios, then, when

scenarios("../specs/alpha.feature")


@given("shared setup")
def shared():
    pass


@when("alpha runs")
def alpha_runs():
    pass


@then("alpha is observed")
def alpha_observed():
    pass
`,
    "unit/test_beta_steps.py": `from pytest_bdd import given, scenarios, then, when

scenarios("../specs/beta.feature")


@given("shared setup")
def shared():
    pass


@when("beta runs")
def beta_runs():
    pass


@then("beta is observed")
def beta_observed():
    pass
`,
    "unit/conftest.py": "",
  });

  const result = await validateCoverage({
    project: "example",
    corpusRoots: [path.join(root, "specs")],
    adapter: "unit",
    bindingRoots: [path.join(root, "unit")],
    driver: path.join(root, "unit/conftest.py"),
  });

  assert.deepEqual(result.errors, []);
});

// A conforming Python CLI owner: every mandatory non-test target is present and does real work, so a
// test passes `edit` to remove or corrupt exactly one thing and the rejection can only be that thing.
const pythonOwnerProject = (
  unitCommand,
  {
    tags = ["type:app", "platform:cli", "lang:python", "domain:ferret"],
    coverageCommand = "node scripts/behaviour-coverage.mjs --adapter unit",
    edit = () => {},
  } = {},
) => {
  const targets = {
    install: { options: { command: "uv sync --locked" } },
    build: { options: { command: "uv run python -m zipapp src -o dist/example.pyz" } },
    run: { options: { command: "python dist/example.pyz --help" } },
    lint: { options: { command: "uv run ruff check ." } },
    typecheck: { options: { command: "uv run pyright" } },
    "test:unit": { options: { command: unitCommand } },
    "test:coverage:unit": { options: { command: coverageCommand } },
    "test:coverage:behaviour": {
      options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
    },
    "test:coverage": {
      options: {
        commands: ["npx nx run example:test:coverage:unit", "npx nx run example:test:coverage:behaviour"],
        parallel: false,
      },
    },
    "test:quick": {
      options: {
        commands: ["npx nx run example:test:unit", "npx nx run example:test:coverage"],
        parallel: false,
      },
    },
  };
  edit(targets);
  return JSON.stringify({ name: "example", tags, targets });
};

test("accepts a 99% pytest-cov Unit line coverage hard gate", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject(
      "uv run pytest tests/unit --cov=ferret --cov-report=term-missing --cov-fail-under=99",
    ),
  });

  assert.deepEqual(await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} }), []);
});

test("rejects a pytest-cov threshold below the 99% hard minimum", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject("uv run pytest tests/unit --cov=ferret --cov-fail-under=98"),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("98% is below the 99% minimum")));
});

test("rejects a pytest-cov threshold that names no coverage source", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject("uv run pytest tests/unit --cov-fail-under=99"),
  });

  // pytest-cov collects nothing without a --cov source, so a bare threshold enforces nothing.
  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must enforce at least 99% line coverage")));
});

test("rejects a pytest-cov source selection that declares no threshold", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject("uv run pytest tests/unit --cov=ferret --cov-report=term-missing"),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must enforce at least 99% line coverage")));
});

test("rejects a pytest-driven project that omits the lang:python tag", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject("uv run pytest tests/unit --cov=ferret --cov-fail-under=99", {
      tags: ["type:app", "platform:cli", "domain:ferret"],
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must declare the lang:python tag")));
});

test("rejects a static coverage target that runs pytest", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject("uv run pytest --cov=ferret --cov-fail-under=99", {
      coverageCommand: "uv run pytest --collect-only tests/unit",
    }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("test:coverage:unit must be static")));
});

const pythonE2eProject = ({
  coverageCommand = "node scripts/behaviour-coverage.mjs --adapter e2e",
  tags,
  edit = () => {},
} = {}) => {
  const targets = {
    install: { options: { command: "uv sync --locked" } },
    lint: { options: { command: "uv run ruff check ." } },
    typecheck: { options: { command: "uv run pyright" } },
    "test:e2e": { options: { command: "uv run pytest tests" } },
    "test:coverage:e2e": { options: { command: coverageCommand } },
    "test:coverage:behaviour": {
      options: { command: "node scripts/behaviour-coverage.mjs --adapter behaviour" },
    },
    "test:coverage": {
      options: {
        commands: ["npx nx run example-e2e:test:coverage:e2e", "npx nx run example-e2e:test:coverage:behaviour"],
        parallel: false,
      },
    },
    "test:quick": {
      options: {
        commands: [
          "npx nx run example-e2e:lint",
          "npx nx run example-e2e:typecheck",
          "npx nx run example-e2e:test:coverage",
        ],
        parallel: false,
      },
    },
  };
  edit(targets);
  return JSON.stringify({
    name: "example-e2e",
    tags: tags ?? ["type:e2e", "platform:cli", "lang:python", "domain:ferret"],
    targets,
  });
};

test("accepts a dedicated Python E2E project with static coverage and a pytest E2E runner", async () => {
  const root = await fixture({ "project.json": pythonE2eProject() });

  assert.deepEqual(
    await validateProjectTargetContract(path.join(root, "project.json"), "example-e2e", { unit: {}, e2e: {} }),
    [],
  );
});

test("rejects a dedicated Python E2E coverage target that runs pytest", async () => {
  const root = await fixture({
    "project.json": pythonE2eProject({ coverageCommand: "uv run pytest --collect-only tests" }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example-e2e", {
    unit: {},
    e2e: {},
  });
  assert.ok(errors.some((error) => error.includes("test:coverage:e2e must be static")));
});

test("rejects a dedicated Python E2E project that omits the lang:python tag", async () => {
  const root = await fixture({
    "project.json": pythonE2eProject({ tags: ["type:e2e", "platform:cli", "domain:ferret"] }),
  });

  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example-e2e", {
    unit: {},
    e2e: {},
  });
  assert.ok(errors.some((error) => error.includes("must declare the lang:python tag")));
});

test("recognises a module-qualified decorator and an explicit string parser", () => {
  const source = `import pytest_bdd
from pytest_bdd import parsers


@pytest_bdd.given(parsers.string("a qualified subject"))
def qualified_subject():
    pass
`;

  const bindings = extractBindings("test_steps.py", source);

  assert.deepEqual(
    bindings.map(({ keyword, pattern }) => [keyword, pattern]),
    [["Given", "a qualified subject"]],
  );
});

test("matches a parse template case-insensitively but a plain string exactly", async () => {
  const stepModule = (givenRegistration) => `from pytest_bdd import given, parsers, then, when


${givenRegistration}
def a_configured_subject():
    pass


@when("the subject is exercised")
def the_subject_is_exercised():
    pass


@then("independent evidence is observed")
def independent_evidence_is_observed():
    pass
`;

  // The parse library ignores case unless told otherwise; a plain string is compared exactly.
  const parsed = await validatePython({
    "unit/test_steps.py": stepModule('@given(parsers.parse("A Configured Subject"))'),
  });
  assert.deepEqual(parsed.errors, []);

  const plain = await validatePython({ "unit/test_steps.py": stepModule('@given("A Configured Subject")') });
  assert.ok(plain.errors.some((error) => error.includes("undefined Unit binding")));
});

test("rejects pytest-cov flags on a command that does not run pytest", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject("uv run python -m unittest --cov=ferret --cov-fail-under=99"),
  });

  // The flags only mean something to pytest-cov, so they enforce nothing on another runner.
  const errors = await validateProjectTargetContract(path.join(root, "project.json"), "example", { unit: {} });
  assert.ok(errors.some((error) => error.includes("must enforce at least 99% line coverage")));
});

const PYTHON_UNIT_GATE = "uv run pytest tests/unit --cov=ferret --cov-fail-under=99";

async function pythonTargetErrors(projectJson, project = "example") {
  const root = await fixture({ "project.json": projectJson });
  return validateProjectTargetContract(path.join(root, "project.json"), project, { unit: {} });
}

test("rejects a Python CLI owner that omits a mandatory non-test target", async () => {
  for (const name of ["install", "build", "run", "lint", "typecheck"]) {
    const errors = await pythonTargetErrors(
      pythonOwnerProject(PYTHON_UNIT_GATE, {
        edit: (targets) => {
          delete targets[name];
        },
      }),
    );

    assert.ok(
      errors.some((error) => error.includes(`Python project requires ${name}.`)),
      name,
    );
  }
});

test("asks a Python project that is not a CLI for install, lint, and typecheck only", async () => {
  const errors = await pythonTargetErrors(
    pythonOwnerProject(PYTHON_UNIT_GATE, {
      tags: ["type:lib", "lang:python", "domain:ferret"],
      edit: (targets) => {
        delete targets.build;
        delete targets.run;
      },
    }),
  );

  assert.deepEqual(errors, []);
});

test("rejects a Python target whose every command is a placeholder", async () => {
  for (const command of ['echo "typecheck ok"', "true", "exit 0", ": nothing to do"]) {
    const errors = await pythonTargetErrors(
      pythonOwnerProject(PYTHON_UNIT_GATE, {
        edit: (targets) => {
          targets.typecheck.options.command = command;
        },
      }),
    );

    assert.ok(
      errors.some((error) => error.includes("typecheck must run real work, not a placeholder command.")),
      command,
    );
  }

  const composed = await pythonTargetErrors(
    pythonOwnerProject(PYTHON_UNIT_GATE, {
      edit: (targets) => {
        targets.lint = { options: { commands: ["true", "echo done"], parallel: false } };
      },
    }),
  );
  assert.ok(composed.some((error) => error.includes("lint must run real work, not a placeholder command.")));
});

test("accepts a Python target that reports after doing real work", async () => {
  const errors = await pythonTargetErrors(
    pythonOwnerProject(PYTHON_UNIT_GATE, {
      edit: (targets) => {
        targets.lint = { options: { commands: ["uv run ruff check .", "echo linted"], parallel: false } };
      },
    }),
  );

  assert.deepEqual(errors, []);
});

test("rejects a Python install target that does not sync a locked resolution", async () => {
  for (const command of ["uv sync", "uv pip install ."]) {
    const errors = await pythonTargetErrors(
      pythonOwnerProject(PYTHON_UNIT_GATE, {
        edit: (targets) => {
          targets.install.options.command = command;
        },
      }),
    );

    assert.ok(
      errors.some((error) => error.includes("install must run uv sync --locked.")),
      command,
    );
  }
});

test("rejects a dedicated Python E2E project that omits a mandatory non-test target", async () => {
  for (const name of ["install", "lint", "typecheck"]) {
    const errors = await pythonTargetErrors(
      pythonE2eProject({
        edit: (targets) => {
          delete targets[name];
        },
      }),
      "example-e2e",
    );

    assert.ok(
      errors.some((error) => error.includes(`Python project requires ${name}.`)),
      name,
    );
  }
});

test("rejects a dedicated Python E2E project that owns a Unit or Integration target", async () => {
  for (const name of ["test:unit", "test:integration"]) {
    const errors = await pythonTargetErrors(
      pythonE2eProject({
        edit: (targets) => {
          targets[name] = { options: { command: "uv run pytest tests/other" } };
        },
      }),
      "example-e2e",
    );

    assert.ok(
      errors.some((error) => error.includes(`a dedicated E2E project must not own ${name}.`)),
      name,
    );
  }
});

test("reads an object-shaped Nx command when judging a Python target", async () => {
  const errors = await pythonTargetErrors(
    pythonOwnerProject(PYTHON_UNIT_GATE, {
      edit: (targets) => {
        targets.lint = { options: { commands: [{ command: "true" }], parallel: false } };
      },
    }),
  );

  assert.ok(errors.some((error) => error.includes("lint must run real work, not a placeholder command.")));
});

test("rejects a Python project that omits a tag dimension its type requires", async () => {
  const cases = [
    ["type:", ["platform:cli", "lang:python", "domain:ferret"]],
    ["domain:", ["type:app", "platform:cli", "lang:python"]],
    ["platform:", ["type:app", "lang:python", "domain:ferret"]],
  ];
  for (const [dimension, tags] of cases) {
    const errors = await pythonTargetErrors(pythonOwnerProject(PYTHON_UNIT_GATE, { tags }));

    assert.ok(
      errors.some((error) => error.includes(`Python project requires a ${dimension} tag.`)),
      dimension,
    );
  }

  const e2e = await pythonTargetErrors(
    pythonE2eProject({ tags: ["type:e2e", "lang:python", "domain:ferret"] }),
    "example-e2e",
  );
  assert.ok(e2e.some((error) => error.includes("Python project requires a platform: tag.")));
});

// A corpus that has not received its first feature yet is declared `pending` in the project's
// behaviour-coverage.json. It is a state, not an escape hatch: it holds only while the corpus has no
// feature and no step registration, and it is rejected the moment either exists.
const pendingOptions = (root, overrides = {}) => ({
  project: "example",
  pending: true,
  corpusRoots: [path.join(root, "behaviours")],
  adapter: "behaviour",
  adapters: {
    unit: { bindingRoots: [path.join(root, "unit")], driver: path.join(root, "unit/driver.py") },
  },
  ...overrides,
});

test("accepts a pending corpus that holds no feature and registers no binding", async () => {
  const root = await fixture({ "unit/driver.py": "# driver\n" });

  const result = await validateCoverage(pendingOptions(root));

  assert.deepEqual(result.errors, []);
  assert.equal(result.stats.features, 0);
  assert.equal(result.stats.scenarios, 0);
  assert.equal(result.stats.pending, true);
});

test("rejects a pending corpus that now holds a feature", async () => {
  const root = await fixture({
    "behaviours/example.feature": validFeature,
    "unit/driver.py": "# driver\n",
    "unit/steps.py": pythonBindings(),
  });

  const result = await validateCoverage(pendingOptions(root));

  assert.deepEqual(result.errors, ["example: the corpus holds a feature, so remove pending from the configuration."]);
});

test("rejects a step registered while the corpus is pending", async () => {
  const root = await fixture({ "unit/driver.py": "# driver\n", "unit/steps.py": pythonBindings() });

  const result = await validateCoverage(pendingOptions(root));

  assert.ok(result.errors.some((error) => error.includes("unused Unit binding")));
});

test("still requires an existing driver while the corpus is pending", async () => {
  const root = await fixture({ "unit/README.md": "no driver here" });

  const result = await validateCoverage(pendingOptions(root));

  assert.ok(result.errors.some((error) => error.includes("driver does not exist")));
});

test("keeps an empty corpus an error when it is not marked pending", async () => {
  const root = await fixture({ "unit/driver.py": "# driver\n" });

  const result = await validateCoverage(pendingOptions(root, { pending: false }));

  assert.ok(result.errors.some((error) => error.includes("no .feature files")));
  assert.equal(result.stats.pending, false);
});

test("reads pending from a project-local config and rejects a non-boolean marker", async () => {
  const config = (pending) =>
    JSON.stringify({
      project: "example",
      corpus: ["behaviours"],
      pending,
      adapters: { unit: { bindings: ["unit"], driver: "unit/driver.py" } },
    });
  const root = await fixture({
    "good/behaviour-coverage.json": config(true),
    "bad/behaviour-coverage.json": config("yes"),
    "plain/behaviour-coverage.json": JSON.stringify({
      project: "example",
      corpus: ["behaviours"],
      adapters: { unit: { bindings: ["unit"], driver: "unit/driver.py" } },
    }),
  });

  const good = await parseCliOptions(["--config", "good/behaviour-coverage.json"], root);
  const plain = await parseCliOptions(["--config", "plain/behaviour-coverage.json"], root);

  assert.equal(good.pending, true);
  assert.equal(plain.pending, false);
  await assert.rejects(
    parseCliOptions(["--config", "bad/behaviour-coverage.json"], root),
    /config\.pending must be a boolean/u,
  );
});

test("reports a pending corpus in the CLI summary", async () => {
  const root = await fixture({
    "project.json": pythonOwnerProject(
      "uv run pytest tests/unit --cov=ferret --cov-report=term-missing --cov-fail-under=99",
    ),
    "behaviour-coverage.json": JSON.stringify({
      project: "example",
      corpus: ["behaviours"],
      pending: true,
      adapters: { unit: { bindings: ["tests/unit"], driver: "pyproject.toml" } },
    }),
    "pyproject.toml": "[project]\nname = 'example'\n",
    "tests/unit/conftest.py": "",
  });
  const output = { logs: [], errors: [] };
  const io = {
    log: (message) => output.logs.push(message),
    error: (message) => output.errors.push(message),
  };

  const code = await runCli(["--config", path.join(root, "behaviour-coverage.json")], io);

  assert.deepEqual(output.errors, []);
  assert.equal(code, 0);
  assert.equal(output.logs[0], "example: 0 features, 0 expanded scenarios, adapters: unit (corpus pending).");
});

// The FERRET projects are validated as they exist in the repository, not through a fixture, so the
// closed mandatory-target matrix cannot drift from the files that Nx and CI actually read.
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function realFerretProject(name) {
  const projectFile = path.join(repositoryRoot, "apps", name, "project.json");
  const configuration = JSON.parse(await readFile(path.join(repositoryRoot, "apps", name, "behaviour-coverage.json")));
  return {
    projectFile,
    project: JSON.parse(await readFile(projectFile, "utf8")),
    adapters: configuration.adapters,
  };
}

const commandsOf = (target) =>
  [target.options.command, ...(target.options.commands ?? [])]
    .filter((entry) => entry !== undefined)
    .map((entry) => (typeof entry === "string" ? entry : entry.command));

// The Nx targets a composed target runs, in order: `npm exec -- nx run ferret-cli:lint` -> `lint`.
const composedTargets = (target, projectName) =>
  commandsOf(target).map((command) => command.replace(`npm exec -- nx run ${projectName}:`, ""));

test("the FERRET owner project satisfies the closed target contract with its real adapters", async () => {
  const { projectFile, adapters } = await realFerretProject("ferret-cli");

  assert.deepEqual(Object.keys(adapters), ["unit", "integration"]);
  assert.deepEqual(await validateProjectTargetContract(projectFile, "ferret-cli", adapters), []);
});

test("the FERRET E2E project satisfies the closed target contract with its real adapters", async () => {
  const { projectFile, adapters } = await realFerretProject("ferret-cli-e2e");

  assert.deepEqual(Object.keys(adapters), ["unit", "e2e"]);
  assert.deepEqual(await validateProjectTargetContract(projectFile, "ferret-cli-e2e", adapters), []);
});

test("the FERRET owner declares exactly the mandatory target matrix and its tags", async () => {
  const { project } = await realFerretProject("ferret-cli");

  assert.deepEqual(Object.keys(project.targets).toSorted(), [
    "build",
    "install",
    "lint",
    "run",
    "test:coverage",
    "test:coverage:behaviour",
    "test:coverage:integration",
    "test:coverage:unit",
    "test:integration",
    "test:quick",
    "test:unit",
    "typecheck",
  ]);
  assert.deepEqual(project.tags, ["type:app", "platform:cli", "lang:python", "domain:ferret"]);
});

test("the FERRET E2E project declares exactly the mandatory target matrix and owns no Unit or Integration target", async () => {
  const { project } = await realFerretProject("ferret-cli-e2e");

  assert.deepEqual(Object.keys(project.targets).toSorted(), [
    "install",
    "lint",
    "test:coverage",
    "test:coverage:behaviour",
    "test:coverage:e2e",
    "test:e2e",
    "test:quick",
    "typecheck",
  ]);
  assert.deepEqual(project.tags, ["type:e2e", "platform:cli", "lang:python", "domain:ferret"]);
  assert.deepEqual(project.implicitDependencies, ["ferret-cli"]);
});

test("the FERRET dependency targets only synchronize the lockfile and are never cached", async () => {
  for (const name of ["ferret-cli", "ferret-cli-e2e"]) {
    const { project } = await realFerretProject(name);
    const install = project.targets.install;

    assert.deepEqual(commandsOf(install), ["uv sync --locked"]);
    assert.equal(install.options.cwd, `apps/${name}`);
    assert.equal(install.cache, false);
  }
});

test("the FERRET owner runs the built artifact and enforces 99% Unit line coverage with pytest-cov", async () => {
  const { project } = await realFerretProject("ferret-cli");

  assert.deepEqual(project.targets.build.outputs, ["{projectRoot}/dist"]);
  assert.deepEqual(project.targets.run.dependsOn, ["build"]);
  assert.deepEqual(commandsOf(project.targets.run), ["uv run --no-sync python dist/ferret.pyz"]);
  assert.deepEqual(commandsOf(project.targets["test:unit"]), [
    "uv run --no-sync pytest tests/unit --cov=ferret --cov-report=term-missing --cov-fail-under=99",
  ]);
  assert.deepEqual(commandsOf(project.targets["test:integration"]), ["uv run --no-sync pytest tests/integration"]);
});

test("the FERRET E2E runtime target runs pytest against the built owner artifact", async () => {
  const { project } = await realFerretProject("ferret-cli-e2e");

  assert.deepEqual(commandsOf(project.targets["test:e2e"]), ["uv run --no-sync pytest tests"]);
  assert.deepEqual(project.targets["test:e2e"].dependsOn, ["ferret-cli:build"]);
  assert.equal(project.targets["test:e2e"].cache, false);
});

test("the FERRET quick and coverage aggregates compose exactly the applicable targets in order", async () => {
  const owner = (await realFerretProject("ferret-cli")).project;
  const e2e = (await realFerretProject("ferret-cli-e2e")).project;

  assert.deepEqual(composedTargets(owner.targets["test:quick"], "ferret-cli"), [
    "lint",
    "typecheck",
    "test:unit",
    "test:coverage",
  ]);
  assert.deepEqual(composedTargets(owner.targets["test:coverage"], "ferret-cli"), [
    "test:coverage:unit",
    "test:coverage:integration",
    "test:coverage:behaviour",
  ]);
  assert.deepEqual(composedTargets(e2e.targets["test:quick"], "ferret-cli-e2e"), [
    "lint",
    "typecheck",
    "test:coverage",
  ]);
  assert.deepEqual(composedTargets(e2e.targets["test:coverage"], "ferret-cli-e2e"), [
    "test:coverage:e2e",
    "test:coverage:behaviour",
  ]);
  for (const project of [owner, e2e]) {
    assert.equal(project.targets["test:quick"].options.parallel, false);
    assert.equal(project.targets["test:coverage"].options.parallel, false);
  }
});

test("every FERRET static coverage target runs only the project-local validator and no test runner", async () => {
  for (const name of ["ferret-cli", "ferret-cli-e2e"]) {
    const { project } = await realFerretProject(name);
    const statics = Object.entries(project.targets).filter(
      ([target]) => target.startsWith("test:coverage:") && target !== "test:coverage",
    );

    assert.notEqual(statics.length, 0);
    for (const [target, definition] of statics) {
      const [command, ...rest] = commandsOf(definition);
      assert.equal(rest.length, 0, `${name}:${target} must run exactly one command`);
      assert.match(
        command,
        new RegExp(`^node scripts/behaviour-coverage\\.mjs --config apps/${name}/behaviour-coverage\\.json --adapter `),
      );
      assert.doesNotMatch(command, /pytest|uv run/u, `${name}:${target} must stay static`);
    }
  }
});
