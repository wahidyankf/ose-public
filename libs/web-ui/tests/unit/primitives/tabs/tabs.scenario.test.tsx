import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../src/primitives/tabs/tabs";

describe("Tabs scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/tabs/tabs.feature: Activating a tab shows its panel and hides the others
  it("shows the activated tab's panel and hides the others", () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="details">Details panel</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Overview panel")).toBeTruthy();

    // Radix activates a tab on a primary mouse-down, not on click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Details" }), { button: 0, ctrlKey: false });

    expect(screen.getByText("Details panel")).toBeTruthy();
    expect(screen.queryByText("Overview panel")).toBeNull();
  });
});
