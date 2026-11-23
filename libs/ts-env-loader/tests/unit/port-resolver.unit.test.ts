/**
 * Step definitions for ts-env-loader's runtime port resolution feature.
 *
 * Covers: specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature
 *
 * Every scenario drives `resolvePort()` with an isolated `env` record (a plain object, never the
 * real `process.env`) so the suite cannot be perturbed by, or perturb, this process's environment.
 *
 * These scenarios are deliberately mirrored one-for-one by
 * `libs/fsharp-env-loader/tests/unit/Tests/PortResolverTests.fs`. The two implementations are only
 * "the same mechanism" if they agree case by case, so the pairing is load-bearing — a scenario
 * added here without its F# twin means the repo has two port contracts, not one.
 */
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { resolvePort, type EnvRecord } from "../../src/index";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature"),
);
const numericFeature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/libs/ts-env-loader/behaviours/port-resolver/numeric-flag.feature"),
);

// The numeric flag scenario lives in its own feature because it is exempt at e2e: the e2e binding
// loads only port-resolver.feature, and a scenario with no Scenario() call there would fail the run.
describeFeature(numericFeature, ({ Scenario }) => {
  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/numeric-flag.feature: A numeric flag value such as 5000 is accepted like the string "5000"
  Scenario('A numeric flag value such as 5000 is accepted like the string "5000"', ({ Given, And, When, Then }) => {
    let env: EnvRecord = {};
    let envVar = "";
    let fallback = 0;
    let resolved = 0;

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
      envVar = "OSE_WWW_PORT";
      fallback = 3100;
    });

    And('the environment does not set "OSE_WWW_PORT"', () => {
      env = {};
    });

    When('the port resolves with a numeric "--port" flag of 5000', () => {
      resolved = resolvePort({ flag: 5000, envVar, fallback, env });
    });

    Then("the resolved port is 5000", () => {
      expect(resolved).toBe(5000);
    });
  });
});

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A port resolves from the highest source that supplies one
  ScenarioOutline(
    "A port resolves from the highest source that supplies one",
    ({ Given, And, When, Then }, examples) => {
      const flagValue = String(examples["flagValue"] ?? "");
      const envValue = String(examples["envValue"] ?? "");
      const expected = Number(examples["expected"]);

      let env: EnvRecord = {};
      let envVar = "";
      let fallback = 0;
      let resolved = 0;

      Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
        envVar = "OSE_WWW_PORT";
        fallback = 3100;
      });

      // Vitest-Cucumber matches against the outline's un-substituted step text, so the expressions
      // must match the raw placeholders as well as their substituted values.
      And('the environment sets "OSE_WWW_PORT" to {string}', () => {
        env = { OSE_WWW_PORT: envValue };
      });

      When('the port resolves with a "--port" flag of {string}', () => {
        resolved = resolvePort({ flag: flagValue, envVar, fallback, env });
      });

      Then("the resolved port is {any}", () => {
        expect(resolved).toBe(expected);
      });
    },
  );

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A bare PORT variable never moves the listener
  Scenario("A bare PORT variable never moves the listener", ({ Given, And, When, Then }) => {
    let env: EnvRecord = {};
    let envVar = "";
    let fallback = 0;
    let resolved = 0;

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
      envVar = "OSE_WWW_PORT";
      fallback = 3100;
    });

    And('the environment sets "PORT" to "4000"', () => {
      env = { PORT: "4000" };
    });

    And('the environment does not set "OSE_WWW_PORT"', () => {
      expect(env["OSE_WWW_PORT"]).toBeUndefined();
    });

    When('the port resolves with no "--port" flag', () => {
      resolved = resolvePort({ envVar, fallback, env });
    });

    // A bare PORT is Next.js's own knob; this repo deliberately does NOT honour it as a port
    // source, so that one exported PORT cannot silently retarget every app at once.
    Then("the resolved port is 3100", () => {
      expect(resolved).toBe(3100);
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A blank value at a tier falls through to the next tier
  ScenarioOutline("A blank value at a tier falls through to the next tier", ({ Given, And, When, Then }, examples) => {
    const flagValue = String(examples["flagValue"] ?? "");
    const envValue = String(examples["envValue"] ?? "");
    const expected = Number(examples["expected"]);

    let env: EnvRecord = {};
    let envVar = "";
    let fallback = 0;
    let resolved = 0;

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
      envVar = "OSE_WWW_PORT";
      fallback = 3100;
    });

    // Vitest-Cucumber matches against the outline's un-substituted step text, so the expressions
    // must match the raw placeholders as well as their substituted values.
    And('the environment sets "OSE_WWW_PORT" to {string}', () => {
      env = { OSE_WWW_PORT: envValue };
    });

    When('the port resolves with a "--port" flag of {string}', () => {
      resolved = resolvePort({ flag: flagValue, envVar, fallback, env });
    });

    Then("the resolved port is {any}", () => {
      expect(resolved).toBe(expected);
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A malformed port is rejected with an error naming its source and the valid range
  ScenarioOutline(
    "A malformed port is rejected with an error naming its source and the valid range",
    ({ Given, And, When, Then }, examples) => {
      const source = String(examples["source"] ?? "");
      const flagValue = String(examples["flagValue"] ?? "");
      const envValue = String(examples["envValue"] ?? "");

      let env: EnvRecord = {};
      let envVar = "";
      let fallback = 0;
      let thrown: unknown;

      Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
        envVar = "OSE_WWW_PORT";
        fallback = 3100;
      });

      And('the environment sets "OSE_WWW_PORT" to {string}', () => {
        env = { OSE_WWW_PORT: envValue };
      });

      When('the port resolves with a "--port" flag of {string}', () => {
        thrown = undefined;
        try {
          resolvePort({ flag: flagValue, envVar, fallback, env });
        } catch (error) {
          thrown = error;
        }
      });

      Then("resolution throws, naming {string} and the valid range", () => {
        expect(thrown).toBeInstanceOf(Error);
        expect((thrown as Error).message).toContain(source);
        expect((thrown as Error).message).toContain("65535");
      });
    },
  );

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: An out-of-range compiled-in fallback is caught at startup
  Scenario("An out-of-range compiled-in fallback is caught at startup", ({ Given, And, When, Then }) => {
    let env: EnvRecord = {};
    let envVar = "";
    let fallback = 0;
    let thrown: unknown;

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 70000', () => {
      envVar = "OSE_WWW_PORT";
      fallback = 70000;
    });

    And('the environment does not set "OSE_WWW_PORT"', () => {
      env = {};
    });

    When('the port resolves with no "--port" flag', () => {
      thrown = undefined;
      try {
        resolvePort({ envVar, fallback, env });
      } catch (error) {
        thrown = error;
      }
    });

    Then('resolution throws, naming "OSE_WWW_PORT" and the valid range', () => {
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain("OSE_WWW_PORT");
      expect((thrown as Error).message).toContain("65535");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A whitespace-only flag or variable is blank and falls through to the next tier
  Scenario(
    "A whitespace-only flag or variable is blank and falls through to the next tier",
    ({ Given, And, When, Then }) => {
      let env: EnvRecord = {};
      let envVar = "";
      let fallback = 0;
      let resolved = 0;

      Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
        envVar = "OSE_WWW_PORT";
        fallback = 3100;
      });

      And('the environment sets "OSE_WWW_PORT" to "   "', () => {
        env = { OSE_WWW_PORT: "   " };
      });

      When('the port resolves with a "--port" flag of "   "', () => {
        resolved = resolvePort({ flag: "   ", envVar, fallback, env });
      });

      Then("the resolved port is 3100", () => {
        expect(resolved).toBe(3100);
      });
    },
  );
});
