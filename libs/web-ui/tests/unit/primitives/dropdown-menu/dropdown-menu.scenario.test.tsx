import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, it, expect } from "vitest";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../../../src/primitives/dropdown-menu/dropdown-menu";

/** Radix opens a menu on a primary pointer-down on its trigger. */
function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
}

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewOptions() {
  const [showHidden, setShowHidden] = useState(false);
  const [size, setSize] = useState("small");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>View</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
          Show hidden
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={size} onValueChange={setSize}>
          <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/dropdown-menu/dropdown-menu.feature: A dropdown menu opens from its trigger and moves by keyboard
  it("opens from its trigger and moves focus by keyboard", () => {
    render(<AccountMenu />);

    openMenu(screen.getByText("Account"));

    expect(screen.getByRole("menuitem", { name: "Profile" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Billing" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeTruthy();

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Profile" }));
  });

  // @scenario specs/libs/web-ui/behaviours/dropdown-menu/dropdown-menu.feature: Checkbox and radio items show and change their selection
  it("shows and changes checkbox and radio selection", () => {
    render(<ViewOptions />);

    openMenu(screen.getByText("View"));
    expect(screen.getByRole("menuitemcheckbox", { name: "Show hidden" }).getAttribute("aria-checked")).toBe("false");
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Show hidden" }));

    // Selecting an item closes the menu, so reopen it to read the new state.
    openMenu(screen.getByText("View"));
    expect(screen.getByRole("menuitemcheckbox", { name: "Show hidden" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Large" }));

    openMenu(screen.getByText("View"));
    expect(screen.getByRole("menuitemradio", { name: "Large" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("menuitemradio", { name: "Small" }).getAttribute("aria-checked")).toBe("false");
  });
});
