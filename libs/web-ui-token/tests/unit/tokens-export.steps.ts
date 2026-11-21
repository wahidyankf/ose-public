// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: The package exports every structural token module
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: Importing tokens.css defines the structural radius, neutral, muted, and destructive tokens
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: The dark class or data-theme dark switches the neutral palette
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: Importing organiclever.css activates the warm palette
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: Each colorTokens name is a custom property defined by tokens.css
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: The radius, spacing, and typography values match the documented scales
import { readFileSync } from "node:fs";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as webUiToken from "../../src/index";
import { colorTokens } from "../../src/colors";
import { radius } from "../../src/radius";
import { spacing } from "../../src/spacing";
import { typography } from "../../src/typography";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature"),
);

const tokensCss = readFileSync(path.resolve(__dirname, "../../src/tokens.css"), "utf8");
const organicleverCss = readFileSync(path.resolve(__dirname, "../../src/organiclever.css"), "utf8");

const HUES = ["terracotta", "honey", "sage", "teal", "sky", "plum"];
const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const DARK_VARIANT = '@custom-variant dark (&:is([data-theme="dark"] *), &:is(.dark *));';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when the stylesheet text declares the custom property at the start of a line. */
function declares(css: string, name: string): boolean {
  return new RegExp(`^\\s*${escapeRegExp(name)}:`, "m").test(css);
}

/** The value of the first declaration of `name` at or after `from`, or undefined. */
function declaredValue(css: string, name: string, from = 0): string | undefined {
  const match = new RegExp(`^\\s*${escapeRegExp(name)}:\\s*([^;]+);`, "m").exec(css.slice(from));
  return match?.[1].trim();
}

describeFeature(feature, ({ Scenario }) => {
  Scenario("The package exports every structural token module", ({ Given, When, Then, And }) => {
    let importedPackage: typeof webUiToken | undefined;

    Given("the web-ui-token package", () => {
      expect(webUiToken).toBeTypeOf("object");
    });

    When('I import from "@open-sharia-enterprise/web-ui-token"', () => {
      importedPackage = webUiToken;
    });

    Then('"colorTokens" should be exported', () => {
      expect(importedPackage?.colorTokens).toBeDefined();
    });

    And('"radius" should be exported', () => {
      expect(importedPackage?.radius).toBeDefined();
    });

    And('"spacing" should be exported', () => {
      expect(importedPackage?.spacing).toBeDefined();
    });

    And('"typography" should be exported', () => {
      expect(importedPackage?.typography).toBeDefined();
    });
  });

  Scenario(
    "Importing tokens.css defines the structural radius, neutral, muted, and destructive tokens",
    ({ Given, When, Then, And }) => {
      Given("the web-ui-token package", () => {
        expect(webUiToken).toBeTypeOf("object");
      });

      When("I import tokens.css", () => undefined);

      Then('tokens.css should define "--radius"', () => {
        expect(declares(tokensCss, "--radius")).toBe(true);
      });

      And('tokens.css should define "--color-background"', () => {
        expect(declares(tokensCss, "--color-background")).toBe(true);
      });

      And('tokens.css should define "--color-muted"', () => {
        expect(declares(tokensCss, "--color-muted")).toBe(true);
      });

      And('tokens.css should define "--color-destructive"', () => {
        expect(declares(tokensCss, "--color-destructive")).toBe(true);
      });
    },
  );

  Scenario("The dark class or data-theme dark switches the neutral palette", ({ Given, When, Then, And }) => {
    Given("the web-ui-token package", () => {
      expect(webUiToken).toBeTypeOf("object");
    });

    When("I import tokens.css", () => undefined);

    Then("tokens.css should declare a dark variant for the dark class and data-theme dark", () => {
      expect(tokensCss).toContain(DARK_VARIANT);
    });

    And('the dark palette should redefine "--color-background" with a different value', () => {
      const darkStart = tokensCss.indexOf(".dark {");
      expect(darkStart).toBeGreaterThanOrEqual(0);
      const lightValue = declaredValue(tokensCss, "--color-background");
      const darkValue = declaredValue(tokensCss, "--color-background", darkStart);
      expect(darkValue).toBeDefined();
      expect(darkValue).not.toBe(lightValue);
    });
  });

  Scenario("Importing organiclever.css activates the warm palette", ({ Given, When, Then, And }) => {
    Given("the web-ui-token package", () => {
      expect(webUiToken).toBeTypeOf("object");
    });

    When("I import organiclever.css", () => undefined);

    Then("organiclever.css should define six hues in three tints", () => {
      for (const hue of HUES) {
        expect(declares(organicleverCss, `--hue-${hue}`)).toBe(true);
        expect(declares(organicleverCss, `--hue-${hue}-ink`)).toBe(true);
        expect(declares(organicleverCss, `--hue-${hue}-wash`)).toBe(true);
      }
    });

    And("organiclever.css should define a warm neutral scale", () => {
      for (const step of ["--warm-0", "--warm-100", "--warm-200"]) {
        expect(declares(organicleverCss, step)).toBe(true);
      }
    });

    And("organiclever.css should set the primary colour to the sage hue", () => {
      expect(declaredValue(organicleverCss, "--color-primary")).toBe("var(--hue-sage)");
    });
  });

  Scenario("Each colorTokens name is a custom property defined by tokens.css", ({ Given, When, Then }) => {
    Given("the web-ui-token package", () => {
      expect(webUiToken).toBeTypeOf("object");
    });

    When("I compare colorTokens with tokens.css", () => undefined);

    Then("every colorTokens name should be defined as a custom property in tokens.css", () => {
      for (const name of Object.values(colorTokens)) {
        expect(declares(tokensCss, name)).toBe(true);
      }
    });
  });

  Scenario("The radius, spacing, and typography values match the documented scales", ({ Given, When, Then }) => {
    Given("the web-ui-token package", () => {
      expect(webUiToken).toBeTypeOf("object");
    });

    When("I compare the radius, spacing, and typography values with the documented scales", () => undefined);

    Then("every value should match its documented scale", () => {
      expect(radius.DEFAULT).toBe("0.5rem");
      expect(declaredValue(tokensCss, "--radius")).toBe("0.5rem");
      for (const step of SPACING_STEPS) {
        expect(spacing[step as keyof typeof spacing]).toBe(`${step / 4}rem`);
      }
      expect(typography).toEqual({
        xs: { fontSize: "0.75rem", lineHeight: "1rem" },
        sm: { fontSize: "0.875rem", lineHeight: "1.25rem" },
        base: { fontSize: "1rem", lineHeight: "1.5rem" },
        lg: { fontSize: "1.125rem", lineHeight: "1.75rem" },
        xl: { fontSize: "1.25rem", lineHeight: "1.75rem" },
        "2xl": { fontSize: "1.5rem", lineHeight: "2rem" },
        "3xl": { fontSize: "1.875rem", lineHeight: "2.25rem" },
        "4xl": { fontSize: "2.25rem", lineHeight: "2.5rem" },
      });
    });
  });
});
