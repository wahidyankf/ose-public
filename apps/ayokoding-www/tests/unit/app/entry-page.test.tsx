import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOCALE_HREF } from "@/features/i18n/core/config";
import EntryLayout from "@/app/(entry)/layout";
import RootPage from "@/app/(entry)/page";

const redirectTarget = vi.hoisted(() => ({ url: "" as string }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectTarget.url = url;
    throw new Error(`REDIRECT:${url}`);
  },
}));

describe("entry routes", () => {
  it("redirects the root to the default locale", () => {
    expect(() => RootPage()).toThrow(`REDIRECT:${DEFAULT_LOCALE_HREF}`);
    expect(redirectTarget.url).toBe(DEFAULT_LOCALE_HREF);
  });

  it("renders entry chrome around its children", () => {
    const { container } = render(
      <EntryLayout>
        <span>entry child</span>
      </EntryLayout>,
    );
    expect(screen.getByText("entry child")).not.toBeNull();
    expect(container.textContent).toContain("entry child");
  });
});
