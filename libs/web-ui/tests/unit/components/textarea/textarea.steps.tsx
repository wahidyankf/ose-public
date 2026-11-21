import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

import { Textarea } from "../../../../src/components/textarea/textarea";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/textarea/textarea.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/textarea/textarea.feature: Renders with placeholder
  Scenario("Renders with placeholder", ({ When, Then, And }) => {
    let textarea: HTMLTextAreaElement;

    When('I render a Textarea with placeholder "Write here…"', () => {
      cleanup();
      render(<Textarea placeholder="Write here…" aria-label="notes" />);
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    });

    Then("I see the textarea element", () => {
      expect(textarea).toBeDefined();
    });

    And('the placeholder text is "Write here…"', () => {
      expect(textarea.getAttribute("placeholder")).toBe("Write here…");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/textarea/textarea.feature: Accepts input
  Scenario("Accepts input", ({ Given, When, Then }) => {
    let textarea: HTMLTextAreaElement;

    Given("I render a controlled Textarea", () => {
      cleanup();
      render(<Textarea aria-label="notes" defaultValue="" />);
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    });

    When('I type "hello"', () => {
      fireEvent.change(textarea, { target: { value: "hello" } });
    });

    Then('the textarea value is "hello"', () => {
      expect(textarea.value).toBe("hello");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/textarea/textarea.feature: Disabled state
  Scenario("Disabled state", ({ When, Then }) => {
    let textarea: HTMLTextAreaElement;

    When("I render a Textarea with disabled prop", () => {
      cleanup();
      render(<Textarea aria-label="notes" disabled />);
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    });

    Then("the textarea is not interactive", () => {
      expect(textarea.hasAttribute("disabled")).toBe(true);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/textarea/textarea.feature: Focus ring visible on keyboard focus
  Scenario("Focus ring visible on keyboard focus", ({ Given, When, Then }) => {
    let textarea: HTMLTextAreaElement;
    let focusedThroughKeyboard = false;

    Given("I render a Textarea", () => {
      cleanup();
      render(<Textarea aria-label="notes" />);
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    });

    When("I focus the textarea via keyboard", async () => {
      const user = userEvent.setup();
      cleanup();
      render(<Textarea aria-label="notes" />);
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.tab();
      focusedThroughKeyboard = document.activeElement === textarea;
    });

    Then("a focus ring is visible", () => {
      expect(focusedThroughKeyboard).toBe(true);
      expect(textarea.className).toContain("focus-visible:");
    });
  });
});
