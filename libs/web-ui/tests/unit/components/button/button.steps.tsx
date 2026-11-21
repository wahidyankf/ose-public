import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Button } from "../../../../src/components/button/button";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/button/button.feature"),
);

type ButtonVariant = NonNullable<Parameters<typeof Button>[0]["variant"]>;
type ButtonSize = NonNullable<Parameters<typeof Button>[0]["size"]>;

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/button/button.feature: Renders with default variant and size
  Scenario("Renders with default variant and size", ({ When, Then, And }) => {
    let button: HTMLElement;

    When('the Button is rendered with label "Click me"', () => {
      cleanup();
      render(<Button>Click me</Button>);
      button = screen.getByRole("button", { name: "Click me" });
    });

    Then("the button element should be present in the document", () => {
      expect(button.textContent).toBe("Click me");
    });

    And('the button should have data-variant "default"', () => {
      expect(button.getAttribute("data-variant")).toBe("default");
    });

    And('the button should have data-size "default"', () => {
      expect(button.getAttribute("data-size")).toBe("default");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/button/button.feature: Each button variant is marked with its name
  ScenarioOutline("Each button variant is marked with its name", ({ When, Then }, examples) => {
    const variant = String(examples["variant"] ?? "") as ButtonVariant;
    let button: HTMLElement;

    When('I render a Button with variant "<variant>"', () => {
      cleanup();
      render(<Button variant={variant}>{variant}</Button>);
      button = screen.getByRole("button", { name: variant });
    });

    Then('the button should have data-variant "<variant>"', () => {
      expect(button.getAttribute("data-variant")).toBe(variant);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/button/button.feature: Each button size is marked with its name
  ScenarioOutline("Each button size is marked with its name", ({ When, Then }, examples) => {
    const size = String(examples["size"] ?? "") as ButtonSize;
    let button: HTMLElement;

    When('I render a Button with size "<size>"', () => {
      cleanup();
      render(
        <Button size={size} aria-label={`button-${size}`}>
          X
        </Button>,
      );
      button = screen.getByRole("button", { name: `button-${size}` });
    });

    Then('the button should have data-size "<size>"', () => {
      expect(button.getAttribute("data-size")).toBe(size);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/button/button.feature: Supports disabled state
  Scenario("Supports disabled state", ({ When, Then }) => {
    let button: HTMLElement;

    When('the Button is rendered as disabled with label "Disabled"', () => {
      cleanup();
      render(<Button disabled>Disabled</Button>);
      button = screen.getByRole("button", { name: "Disabled" });
    });

    Then("the button element should have the disabled attribute", () => {
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/button/button.feature: Renders as child element when asChild is true
  Scenario("Renders as child element when asChild is true", ({ When, Then, And }) => {
    let link: HTMLElement;

    When('the Button is rendered with asChild wrapping an anchor to "/test" with label "Link Button"', () => {
      cleanup();
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );
      link = screen.getByRole("link", { name: "Link Button" });
    });

    Then('a link element with label "Link Button" should be present', () => {
      expect(link.textContent).toBe("Link Button");
    });

    And('the link should have href "/test"', () => {
      expect(link.getAttribute("href")).toBe("/test");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/button/button.feature: Has no accessibility violations
  Scenario("Has no accessibility violations", ({ When, Then }) => {
    let container: HTMLElement;

    When('the Button is rendered with label "Accessible Button"', () => {
      cleanup();
      container = render(<Button>Accessible Button</Button>).container;
    });

    Then("the button should have no accessibility violations", async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
