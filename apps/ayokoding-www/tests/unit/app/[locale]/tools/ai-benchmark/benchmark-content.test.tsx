// BenchmarkContent — URL navigation and page structure. `useSearchParams` is fixed for the whole
// test and never updated by `mockPush`, simulating the window where Next.js has not yet committed a
// navigation: two quick changes must still compose into the final pushed URL.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BenchmarkContent } from "../../../../../../src/app/[locale]/tools/ai-benchmark/benchmark-content";

const mockPush = vi.fn();
const nav = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/tools/ai-benchmark",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

vi.mock("@/features/i18n/shell/use-locale", () => ({
  useLocale: () => "en",
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  nav.search = "";
});

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function pushed(call: number): URLSearchParams {
  const url = mockPush.mock.calls[call]?.[0] as string;
  return new URLSearchParams(url.split("?")[1] ?? "");
}

describe("BenchmarkContent — rapid successive changes", () => {
  it("composes a harness change followed immediately by a tier change", () => {
    render(<BenchmarkContent />);
    change("Harness", "cursor");
    change("Tier", "planning");
    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(pushed(1).get("harness")).toBe("cursor");
    expect(pushed(1).get("tier")).toBe("planning");
  });

  it("composes a finder choice followed immediately by a harness change", () => {
    render(<BenchmarkContent />);
    change("Frontier model", "gpt-5.6-terra");
    change("Harness", "opencode-go");
    expect(pushed(1).get("sub")).toBe("gpt-5.6-terra");
    expect(pushed(1).get("harness")).toBe("opencode-go");
  });

  it("keeps the reader's scroll position on every navigation", () => {
    render(<BenchmarkContent />);
    change("Tier", "fast");
    expect(mockPush.mock.calls[0]?.[1]).toEqual({ scroll: false });
  });
});

describe("BenchmarkContent — clearing state", () => {
  it("pushes the bare path when the last parameter is cleared", () => {
    nav.search = "tier=fast";
    render(<BenchmarkContent />);
    fireEvent.click(screen.getByTestId("ai-bench-filter-reset"));
    expect(mockPush).toHaveBeenCalledWith("/en/tools/ai-benchmark", { scroll: false });
  });

  it("clears the finder target when the empty option is chosen", () => {
    nav.search = "sub=gpt-5.6-terra&harness=cursor";
    render(<BenchmarkContent />);
    change("Frontier model", "");
    expect(pushed(0).has("sub")).toBe(false);
    expect(pushed(0).get("harness")).toBe("cursor");
  });

  it("ignores a finder target that is not a frontier model", () => {
    nav.search = "sub=glm-5.3";
    render(<BenchmarkContent />);
    expect((screen.getByLabelText("Frontier model") as HTMLSelectElement).value).toBe("");
    expect(screen.queryByTestId("ai-bench-sub-item")).toBeNull();
  });
});

describe("BenchmarkContent — structure", () => {
  it("orders header → finder → filters → tier map → insufficient → table → methodology → sources", () => {
    render(<BenchmarkContent />);
    const order = [
      "ai-bench-last-updated",
      "ai-bench-finder",
      "ai-bench-filters",
      "ai-bench-tier-map",
      "ai-bench-insufficient",
      "ai-bench-table",
      "ai-bench-methodology",
      "ai-bench-sources",
    ].map((id) => screen.getByTestId(id));
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("opens the methodology when the jump link is followed", () => {
    render(<BenchmarkContent />);
    const details = screen.getByTestId("ai-bench-methodology") as HTMLDetailsElement;
    fireEvent.click(screen.getByRole("link", { name: "How the score works" }));
    expect(details.open).toBe(true);
  });

  it("hides the tier map but keeps the insufficient list when filtering to insufficient", () => {
    nav.search = "tier=insufficient";
    render(<BenchmarkContent />);
    expect(screen.queryByTestId("ai-bench-tier-map")).toBeNull();
    expect(screen.getByTestId("ai-bench-insufficient")).toBeTruthy();
  });
});

describe("BenchmarkContent — usability regressions", () => {
  it("shows the purpose sentence at every width", () => {
    render(<BenchmarkContent />);
    expect(screen.getByTestId("ai-bench-subtitle").className).not.toMatch(/\bhidden\b/);
  });

  it("moves focus to the harness filter after Reset, since the Reset button disables itself", () => {
    nav.search = "harness=cursor";
    render(<BenchmarkContent />);
    const reset = screen.getByTestId("ai-bench-filter-reset");
    reset.focus();
    fireEvent.click(reset);
    expect(document.activeElement).toBe(screen.getByLabelText("Harness"));
  });
});
