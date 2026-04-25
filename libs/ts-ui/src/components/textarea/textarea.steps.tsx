import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { expect } from "vitest";

import { Textarea } from "./textarea";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/textarea/textarea.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders with placeholder", ({ Given, Then, And }) => {
    Given('I render a Textarea with placeholder "Write here…"', () => {});

    Then("I see the textarea element", () => {
      cleanup();
      render(<Textarea placeholder="Write here…" aria-label="notes" />);
      expect(screen.getByRole("textbox")).toBeDefined();
    });

    And('the placeholder text is "Write here…"', () => {
      cleanup();
      render(<Textarea placeholder="Write here…" aria-label="notes" />);
      expect(screen.getByRole("textbox").getAttribute("placeholder")).toBe("Write here…");
    });
  });

  Scenario("Accepts input", ({ Given, When, Then }) => {
    Given("I render a controlled Textarea", () => {});
    When('I type "hello"', () => {});

    Then('the textarea value is "hello"', () => {
      cleanup();
      render(<Textarea aria-label="notes" defaultValue="" />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("hello");
    });
  });

  Scenario("Disabled state", ({ Given, Then }) => {
    Given("I render a Textarea with disabled prop", () => {});

    Then("the textarea is not interactive", () => {
      cleanup();
      render(<Textarea aria-label="notes" disabled />);
      expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(true);
    });
  });

  Scenario("Focus ring visible on keyboard focus", ({ Given, When, Then }) => {
    Given("I render a Textarea", () => {});
    When("I focus the textarea via keyboard", () => {});

    Then("a focus ring is visible", () => {
      cleanup();
      render(<Textarea aria-label="notes" />);
      fireEvent.focus(screen.getByRole("textbox"));
      expect(screen.getByRole("textbox").className).toContain("focus-visible:");
    });
  });
});
