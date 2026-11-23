import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

// The route renders HomeContent; the unit double records the call and renders nothing.
const { homeContent } = vi.hoisted(() => ({ homeContent: vi.fn<() => null>(() => null) }));
vi.mock("@/features/home", () => ({ HomeContent: homeContent }));

import RootPage from "@/app/page";

describe("RootPage", () => {
  afterEach(() => {
    cleanup();
    homeContent.mockClear();
  });

  it("renders the home content as the root route", () => {
    render(<RootPage />);

    expect(homeContent).toHaveBeenCalledTimes(1);
  });
});
