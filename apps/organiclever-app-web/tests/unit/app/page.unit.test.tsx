/**
 * Unit tests for the root page: the root route hands the visitor to the app home.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (target: string) => mockRedirect(target),
}));

// eslint-disable-next-line import/first
import RootPage from "../../../src/app/page";

beforeEach(() => {
  mockRedirect.mockReset();
});

describe("RootPage", () => {
  // @scenario specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature: Visiting / redirects to /app/home
  it("redirects the root route to /app/home", () => {
    RootPage();
    expect(mockRedirect).toHaveBeenCalledWith("/app/home");
  });
});
