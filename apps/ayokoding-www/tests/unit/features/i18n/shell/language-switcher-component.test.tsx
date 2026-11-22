import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "../../../../../src/features/i18n/shell/language-switcher";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/tools/ai-benchmark",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("harness=x"),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("LanguageSwitcher", () => {
  it("switches locale preserving the path and query", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher locale="en" />);
    await user.click(screen.getByRole("button", { name: "Switch language" }));
    await user.click(screen.getByRole("menuitem", { name: "Bahasa Indonesia" }));
    expect(push).toHaveBeenCalledWith("/id/tools/ai-benchmark?harness=x");
  });
});
