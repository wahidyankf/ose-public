/**
 * Unit tests for /app layout. Mocks PGlite runtime, seed, navigation hooks, and
 * the chrome/overlay subcomponents so the layout's path/breakpoint logic can be
 * verified without booting the database.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockPathname = "/app/home";
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockRouterPush, back: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/contexts/journal/application", () => ({
  makeJournalRuntime: () => ({
    runPromise: () => Promise.resolve(),
  }),
  PgliteLive: {},
  JOURNAL_STORE_DATA_DIR: "test",
  seedIfEmpty: () => ({}),
}));

vi.mock("@/contexts/settings/application", () => ({
  saveSettings: () => ({}),
}));

vi.mock("@/contexts/app-shell/presentation/components/tab-bar", () => ({
  TabBar: () => <div data-testid="tab-bar" />,
}));

vi.mock("@/contexts/app-shell/presentation/components/side-nav", () => ({
  SideNav: () => <div data-testid="side-nav" />,
}));

vi.mock("@/contexts/app-shell/presentation/components/overlay-tree", () => ({
  OverlayTree: () => <div data-testid="overlay-tree" />,
}));

// Import AFTER mocks
// eslint-disable-next-line import/first
import AppsLayout from "./layout";

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  mockPathname = "/app/home";
  mockRouterPush.mockReset();
});

beforeEach(() => {
  // Default to mobile width
  Object.defineProperty(window, "innerWidth", { value: 500, writable: true, configurable: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AppsLayout", () => {
  it("renders TabBar (chrome) on a main tab path at mobile width", async () => {
    mockPathname = "/app/home";
    await act(async () => {
      render(
        <AppsLayout>
          <div data-testid="page-content">Home</div>
        </AppsLayout>,
      );
    });
    expect(screen.getByTestId("tab-bar")).toBeDefined();
    expect(screen.queryByTestId("side-nav")).toBeNull();
  });

  it("hides chrome on a non-main path (workout)", async () => {
    mockPathname = "/app/workout";
    await act(async () => {
      render(
        <AppsLayout>
          <div data-testid="page-content">Workout</div>
        </AppsLayout>,
      );
    });
    expect(screen.queryByTestId("tab-bar")).toBeNull();
    expect(screen.queryByTestId("side-nav")).toBeNull();
    expect(screen.getByTestId("page-content")).toBeDefined();
  });

  it("hides chrome on a non-main path (routines/edit)", async () => {
    mockPathname = "/app/routines/edit";
    await act(async () => {
      render(
        <AppsLayout>
          <div data-testid="page-content">Edit Routine</div>
        </AppsLayout>,
      );
    });
    expect(screen.queryByTestId("tab-bar")).toBeNull();
    expect(screen.queryByTestId("side-nav")).toBeNull();
  });

  it("always renders the overlay tree regardless of path", async () => {
    mockPathname = "/app/workout";
    await act(async () => {
      render(
        <AppsLayout>
          <div>x</div>
        </AppsLayout>,
      );
    });
    expect(screen.getByTestId("overlay-tree")).toBeDefined();
  });

  it("renders SideNav at desktop width on a main tab path", async () => {
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true, configurable: true });
    mockPathname = "/app/history";
    await act(async () => {
      render(
        <AppsLayout>
          <div>history</div>
        </AppsLayout>,
      );
    });
    expect(screen.getByTestId("side-nav")).toBeDefined();
    expect(screen.queryByTestId("tab-bar")).toBeNull();
  });
});
