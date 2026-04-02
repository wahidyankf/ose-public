import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

const feature = await loadFeature(path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/card/card.feature"));

function renderCard() {
  return render(
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text</CardDescription>
      </CardHeader>
      <CardContent>Card content here</CardContent>
      <CardFooter>Card footer here</CardFooter>
    </Card>,
  );
}

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders card with header, title, description, content, and footer", ({ Given, Then, And }) => {
    Given(
      'the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"',
      () => {
        // precondition noted
      },
    );

    Then('the card title "Card Title" should have data-slot "card-title"', () => {
      cleanup();
      renderCard();
      expect(screen.getByText("Card Title").getAttribute("data-slot")).toBe("card-title");
    });

    And('the card description "Card description text" should have data-slot "card-description"', () => {
      cleanup();
      renderCard();
      expect(screen.getByText("Card description text").getAttribute("data-slot")).toBe("card-description");
    });

    And('the card content "Card content here" should have data-slot "card-content"', () => {
      cleanup();
      renderCard();
      expect(screen.getByText("Card content here").getAttribute("data-slot")).toBe("card-content");
    });

    And('the card footer "Card footer here" should have data-slot "card-footer"', () => {
      cleanup();
      renderCard();
      expect(screen.getByText("Card footer here").getAttribute("data-slot")).toBe("card-footer");
    });
  });

  Scenario("Has no accessibility violations", ({ Given, Then }) => {
    Given(
      'the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"',
      () => {
        // precondition noted
      },
    );

    Then("the card should have no accessibility violations", async () => {
      cleanup();
      const { container } = renderCard();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
