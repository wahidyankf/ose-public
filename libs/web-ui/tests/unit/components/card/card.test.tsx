import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, it, expect } from "vitest";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../../../src/components/card/card";

describe("Card", () => {
  it("renders with data-slot", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.getAttribute("data-slot")).toBe("card");
  });

  it("renders all subcomponents with data-slots", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Title").getAttribute("data-slot")).toBe("card-title");
    expect(screen.getByText("Description").getAttribute("data-slot")).toBe("card-description");
    expect(screen.getByText("Content").getAttribute("data-slot")).toBe("card-content");
    expect(screen.getByText("Footer").getAttribute("data-slot")).toBe("card-footer");
  });

  it("forwards className", () => {
    render(
      <Card data-testid="card" className="custom">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Card content here</CardContent>
      </Card>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("CardTitle children", () => {
  it("renders its children as the heading text", () => {
    render(<CardTitle>Plan</CardTitle>);
    expect(screen.getByRole("heading", { name: "Plan" })).toBeTruthy();
  });
});
