import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../../../src/components/card/card";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/card/card.feature"),
);

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
  // @scenario specs/libs/web-ui/behaviours/card/card.feature: A card shows its title, description, content, and footer
  Scenario("A card shows its title, description, content, and footer", ({ When, Then }) => {
    let title: HTMLElement;
    let description: HTMLElement;
    let content: HTMLElement;
    let footer: HTMLElement;

    When(
      'the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"',
      () => {
        cleanup();
        renderCard();
        title = screen.getByText("Card Title");
        description = screen.getByText("Card description text");
        content = screen.getByText("Card content here");
        footer = screen.getByText("Card footer here");
      },
    );

    Then("the card shows its title, description, content, and footer in that order", () => {
      const following = Node.DOCUMENT_POSITION_FOLLOWING;
      expect(title.textContent).toBe("Card Title");
      expect(description.textContent).toBe("Card description text");
      expect(content.textContent).toBe("Card content here");
      expect(footer.textContent).toBe("Card footer here");
      expect(title.compareDocumentPosition(description) & following).toBeTruthy();
      expect(description.compareDocumentPosition(content) & following).toBeTruthy();
      expect(content.compareDocumentPosition(footer) & following).toBeTruthy();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/card/card.feature: Has no accessibility violations
  Scenario("Has no accessibility violations", ({ When, Then }) => {
    let container: HTMLElement;

    When(
      'the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"',
      () => {
        cleanup();
        container = renderCard().container;
      },
    );

    Then("the card should have no accessibility violations", async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
