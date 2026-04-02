import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Button } from "./button";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/button/button.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders with default variant and size", ({ Given, Then, And }) => {
    Given('the Button is rendered with label "Click me"', () => {
      // precondition noted; render happens in assertion steps
    });

    Then("the button element should be present in the document", () => {
      cleanup();
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
    });

    And('the button should have data-variant "default"', () => {
      cleanup();
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" }).getAttribute("data-variant")).toBe("default");
    });

    And('the button should have data-size "default"', () => {
      cleanup();
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" }).getAttribute("data-size")).toBe("default");
    });
  });

  Scenario("Renders variant default", ({ Given, Then }) => {
    Given('the Button is rendered with variant "default" and label "default"', () => {
      // precondition noted
    });

    Then('the button element with label "default" should be present', () => {
      cleanup();
      render(<Button variant="default">default</Button>);
      expect(screen.getByRole("button", { name: "default" })).toBeDefined();
    });
  });

  Scenario("Renders variant destructive", ({ Given, Then }) => {
    Given('the Button is rendered with variant "destructive" and label "destructive"', () => {
      // precondition noted
    });

    Then('the button element with label "destructive" should be present', () => {
      cleanup();
      render(<Button variant="destructive">destructive</Button>);
      expect(screen.getByRole("button", { name: "destructive" })).toBeDefined();
    });
  });

  Scenario("Renders variant outline", ({ Given, Then }) => {
    Given('the Button is rendered with variant "outline" and label "outline"', () => {
      // precondition noted
    });

    Then('the button element with label "outline" should be present', () => {
      cleanup();
      render(<Button variant="outline">outline</Button>);
      expect(screen.getByRole("button", { name: "outline" })).toBeDefined();
    });
  });

  Scenario("Renders variant secondary", ({ Given, Then }) => {
    Given('the Button is rendered with variant "secondary" and label "secondary"', () => {
      // precondition noted
    });

    Then('the button element with label "secondary" should be present', () => {
      cleanup();
      render(<Button variant="secondary">secondary</Button>);
      expect(screen.getByRole("button", { name: "secondary" })).toBeDefined();
    });
  });

  Scenario("Renders variant ghost", ({ Given, Then }) => {
    Given('the Button is rendered with variant "ghost" and label "ghost"', () => {
      // precondition noted
    });

    Then('the button element with label "ghost" should be present', () => {
      cleanup();
      render(<Button variant="ghost">ghost</Button>);
      expect(screen.getByRole("button", { name: "ghost" })).toBeDefined();
    });
  });

  Scenario("Renders variant link", ({ Given, Then }) => {
    Given('the Button is rendered with variant "link" and label "link"', () => {
      // precondition noted
    });

    Then('the button element with label "link" should be present', () => {
      cleanup();
      render(<Button variant="link">link</Button>);
      expect(screen.getByRole("button", { name: "link" })).toBeDefined();
    });
  });

  Scenario("Renders size default", ({ Given, Then }) => {
    Given('the Button is rendered with size "default" and aria-label "button-default"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-default" should be present', () => {
      cleanup();
      render(
        <Button size="default" aria-label="button-default">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-default" })).toBeDefined();
    });
  });

  Scenario("Renders size xs", ({ Given, Then }) => {
    Given('the Button is rendered with size "xs" and aria-label "button-xs"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-xs" should be present', () => {
      cleanup();
      render(
        <Button size="xs" aria-label="button-xs">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-xs" })).toBeDefined();
    });
  });

  Scenario("Renders size sm", ({ Given, Then }) => {
    Given('the Button is rendered with size "sm" and aria-label "button-sm"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-sm" should be present', () => {
      cleanup();
      render(
        <Button size="sm" aria-label="button-sm">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-sm" })).toBeDefined();
    });
  });

  Scenario("Renders size lg", ({ Given, Then }) => {
    Given('the Button is rendered with size "lg" and aria-label "button-lg"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-lg" should be present', () => {
      cleanup();
      render(
        <Button size="lg" aria-label="button-lg">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-lg" })).toBeDefined();
    });
  });

  Scenario("Renders size icon", ({ Given, Then }) => {
    Given('the Button is rendered with size "icon" and aria-label "button-icon"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-icon" should be present', () => {
      cleanup();
      render(
        <Button size="icon" aria-label="button-icon">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-icon" })).toBeDefined();
    });
  });

  Scenario("Renders size icon-xs", ({ Given, Then }) => {
    Given('the Button is rendered with size "icon-xs" and aria-label "button-icon-xs"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-icon-xs" should be present', () => {
      cleanup();
      render(
        <Button size="icon-xs" aria-label="button-icon-xs">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-icon-xs" })).toBeDefined();
    });
  });

  Scenario("Renders size icon-sm", ({ Given, Then }) => {
    Given('the Button is rendered with size "icon-sm" and aria-label "button-icon-sm"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-icon-sm" should be present', () => {
      cleanup();
      render(
        <Button size="icon-sm" aria-label="button-icon-sm">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-icon-sm" })).toBeDefined();
    });
  });

  Scenario("Renders size icon-lg", ({ Given, Then }) => {
    Given('the Button is rendered with size "icon-lg" and aria-label "button-icon-lg"', () => {
      // precondition noted
    });

    Then('the button element with aria-label "button-icon-lg" should be present', () => {
      cleanup();
      render(
        <Button size="icon-lg" aria-label="button-icon-lg">
          X
        </Button>,
      );
      expect(screen.getByRole("button", { name: "button-icon-lg" })).toBeDefined();
    });
  });

  Scenario("Supports disabled state", ({ Given, Then }) => {
    Given('the Button is rendered as disabled with label "Disabled"', () => {
      // precondition noted
    });

    Then("the button element should have the disabled attribute", () => {
      cleanup();
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button", { name: "Disabled" }).hasAttribute("disabled")).toBe(true);
    });
  });

  Scenario("Renders as child element when asChild is true", ({ Given, Then, And }) => {
    Given('the Button is rendered with asChild wrapping an anchor to "/test" with label "Link Button"', () => {
      // precondition noted
    });

    Then('a link element with label "Link Button" should be present', () => {
      cleanup();
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );
      expect(screen.getByRole("link", { name: "Link Button" })).toBeDefined();
    });

    And('the link should have href "/test"', () => {
      cleanup();
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );
      expect(screen.getByRole("link", { name: "Link Button" }).getAttribute("href")).toBe("/test");
    });
  });

  Scenario("Has no accessibility violations", ({ Given, Then }) => {
    Given('the Button is rendered with label "Accessible Button"', () => {
      // precondition noted
    });

    Then("the button should have no accessibility violations", async () => {
      cleanup();
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
