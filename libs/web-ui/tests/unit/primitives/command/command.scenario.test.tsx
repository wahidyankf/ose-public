import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "../../../../src/primitives/command/command";

function Palette({ onChoose = () => {} }: { onChoose?: (item: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No matching commands</CommandEmpty>
        {["Home", "Settings", "Sign out"].map((item) => (
          <CommandItem key={item} value={item} onSelect={() => onChoose(item)}>
            {item}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}

describe("Command palette scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/command/command.feature: A command palette filters items as the user types and runs the chosen item
  it("filters items as the user types and runs the chosen item", () => {
    const chosen: string[] = [];
    render(<Palette onChoose={(item) => chosen.push(item)} />);

    fireEvent.change(screen.getByPlaceholderText("Type a command..."), { target: { value: "set" } });

    expect(screen.queryByRole("option", { name: "Home" })).toBeNull();
    expect(screen.getByRole("option", { name: "Settings" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Sign out" })).toBeNull();

    fireEvent.click(screen.getByRole("option", { name: "Settings" }));
    expect(chosen).toEqual(["Settings"]);
  });

  // @scenario specs/libs/web-ui/behaviours/command/command.feature: A command palette shows its empty message when nothing matches
  it("shows its empty message when nothing matches", () => {
    render(<Palette />);

    fireEvent.change(screen.getByPlaceholderText("Type a command..."), { target: { value: "zzz" } });

    expect(screen.getByText("No matching commands")).toBeTruthy();
  });
});
