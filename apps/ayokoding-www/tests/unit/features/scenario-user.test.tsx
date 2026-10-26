import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createScenarioUser } from "../fe-steps/helpers/scenario-user";

afterEach(cleanup);

describe("scenario input-driver lifecycle", () => {
  it("allocates the driver only when its scenario interacts", async () => {
    const disposers: Array<() => void> = [];
    const user = createScenarioUser((dispose) => disposers.push(dispose));
    expect(disposers).toHaveLength(0);

    render(<button>Act</button>);
    await user.click(screen.getByRole("button", { name: "Act" }));
    expect(disposers).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Act" }));
    expect(disposers).toHaveLength(1);
    for (const dispose of disposers) dispose();
  });

  it("releases the old scenario's input state before another mount", async () => {
    const disposers: Array<() => void> = [];
    const user = createScenarioUser((dispose) => disposers.push(dispose));
    render(<input aria-label="First input" />);
    await user.type(screen.getByRole("textbox", { name: "First input" }), "{Shift>}", { skipAutoClose: true });
    cleanup();
    for (const dispose of disposers) dispose();
    disposers.length = 0;

    const shiftStates: boolean[] = [];
    render(<input aria-label="Next input" onKeyDown={(event) => shiftStates.push(event.shiftKey)} />);
    const input = screen.getByRole("textbox", { name: "Next input" });
    await user.type(input, "a");
    expect(input).toHaveValue("a");
    expect(shiftStates).toEqual([false]);
    expect(disposers).toHaveLength(1);
    for (const dispose of disposers) dispose();
  });

  it("keeps separate scenario drivers independent", async () => {
    const disposers: Array<() => void> = [];
    const first = createScenarioUser((dispose) => disposers.push(dispose));
    const second = createScenarioUser((dispose) => disposers.push(dispose));
    render(
      <>
        <input aria-label="First input" />
        <input aria-label="Second input" />
      </>,
    );
    await first.type(screen.getByRole("textbox", { name: "First input" }), "{Shift>}", { skipAutoClose: true });
    const secondInput = screen.getByRole("textbox", { name: "Second input" });
    await second.type(secondInput, "a");
    expect(secondInput).toHaveValue("a");
    expect(disposers).toHaveLength(2);
    for (const dispose of disposers) dispose();
  });
});
