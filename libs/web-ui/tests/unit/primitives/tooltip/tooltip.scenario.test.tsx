import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../../../src/primitives/tooltip/tooltip";

describe("Tooltip scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/tooltip/tooltip.feature: A tooltip shows on hover and on keyboard focus
  it("shows on hover and on keyboard focus", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Save</button>
          </TooltipTrigger>
          <TooltipContent>Save draft</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Save" });

    fireEvent.pointerMove(trigger, { pointerType: "mouse" });
    expect((await screen.findAllByText("Save draft")).length).toBeGreaterThan(0);

    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
    fireEvent.focus(trigger);
    expect((await screen.findAllByText("Save draft")).length).toBeGreaterThan(0);
  });
});
