import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { manifestFixture } from "../../course-paths/manifest-fixture";

const getTreeMock = vi.fn().mockResolvedValue([
  {
    slug: "",
    title: "English Content",
    href: "/en",
    children: [
      { slug: "by-example", title: "By Example", href: "/en/by-example", children: [] },
      { slug: "in-the-field", title: "In the Field", href: "/en/in-the-field", children: [] },
    ],
  },
]);

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: getTreeMock },
    },
  },
}));

let mockPathname = "/en";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  mockPathname = "/en";
  mockSearchParams = new URLSearchParams();
});

// Phase 9 Cluster O — mobile nav drawer shows site nav without raw root node
describe("Phase 9O — mobile nav drawer", () => {
  it("Phase9O: does NOT show raw root node title ('English Content') in the nav", async () => {
    render(
      await (async () => {
        const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
        return <MobileNav locale="en" open={true} onOpenChange={() => {}} />;
      })(),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const nav = document.querySelector("nav");
    expect(nav?.textContent).not.toMatch(/English Content/i);
  });

  it("Phase9O: shows child nav links (By Example, In the Field) in the drawer", async () => {
    render(
      await (async () => {
        const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
        return <MobileNav locale="en" open={true} onOpenChange={() => {}} />;
      })(),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByText("By Example")).toBeTruthy();
    expect(screen.getByText("In the Field")).toBeTruthy();
  });
});

// Phase 3 — mobile nav drawer shows primary Learn/Tools links (chrome-375 open drawer)
describe("Phase 3 — mobile nav primary links", () => {
  it("shows Learn link to /en/browse and Tools link to /en/tools", async () => {
    render(
      await (async () => {
        const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
        return <MobileNav locale="en" open={true} onOpenChange={() => {}} />;
      })(),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("href")).toBe("/en/browse");
    expect(screen.getByRole("link", { name: "Tools" }).getAttribute("href")).toBe("/en/tools");
  });

  it("shows localized Indonesian primary links for locale=id", async () => {
    render(
      await (async () => {
        const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
        return <MobileNav locale="id" open={true} onOpenChange={() => {}} />;
      })(),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByRole("link", { name: "Belajar" }).getAttribute("href")).toBe("/id/browse");
    expect(screen.getByRole("link", { name: "Alat" }).getAttribute("href")).toBe("/id/tools");
  });
});

// Cycle 2.9 (course-paths plan) — the rail collapses into this shipped drawer on a phone.
describe("Cycle 2.9 — MobileNav swaps SidebarTree for PathRail when a path context is active", () => {
  const manifest = manifestFixture({
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courses: ["just-enough-python"],
  });

  it("renders the generic SidebarTree, unchanged, with no manifests/no active path (Cycle 2.10 direction 1)", async () => {
    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    render(<MobileNav locale="en" open={true} onOpenChange={() => {}} manifests={[manifest]} courseTitles={{}} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByText("By Example")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /course list/i })).toBeNull();
  });

  it("renders PathRail instead of SidebarTree, and sets SheetTitle to the path name, when the URL has an active path context", async () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: manifest.pathId });

    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    render(
      <MobileNav
        locale="en"
        open={true}
        onOpenChange={() => {}}
        manifests={[manifest]}
        courseTitles={{ "just-enough-python": "Just Enough Python" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Python Fundamentals" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    expect(screen.queryByText("By Example")).toBeNull();
  });

  it("the drawer's content element carries the id PathBanner's aria-controls references (single sheet, not a second overlay)", async () => {
    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    render(<MobileNav locale="en" open={true} onOpenChange={() => {}} manifests={[manifest]} courseTitles={{}} />);

    // Radix Dialog content renders into a Portal appended to document.body, outside RTL's
    // returned `container` — query the document, matching Radix's own portal behaviour.
    expect(document.body.querySelector("#mobile-nav-drawer")).not.toBeNull();
  });
});

// UWT-005 fix (phase-5 rule-15 usability retest) — regression: the width-preset control used to
// carry no stated reason to widen the drawer at all; it must render a concrete-benefit hint, in
// both locales, so a future refactor that drops the hint fails a test instead of shipping silently.
describe("UWT-005 — mobile drawer states a concrete reason to widen it", () => {
  it("renders the English width hint text", async () => {
    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    render(<MobileNav locale="en" open={true} onOpenChange={() => {}} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByText("Widen the drawer to read long path or course titles in full")).toBeTruthy();
  });

  it("renders the Indonesian width hint text for locale=id", async () => {
    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    render(<MobileNav locale="id" open={true} onOpenChange={() => {}} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(
      screen.getByText("Perlebar drawer untuk membaca judul jalur atau kursus yang panjang secara utuh"),
    ).toBeTruthy();
  });
});

// Phase 3, Cycle 3.4 — regression: Radix's `Dialog` restores focus on close to its own
// `Dialog.Trigger` ref by default, but this drawer is opened from more than one plain,
// context-driven control (the header's menu button, `PathBanner`'s "View path" button) — neither
// wraps a `Dialog.Trigger` — so Radix's built-in restoration never fires and focus silently falls
// through to `<body>` when the drawer is dismissed (found via the course-paths e2e
// `path-order-nav.feature` phone-drawer scenario).
describe("Cycle 3.4 — focus returns to the control that opened the drawer when it is dismissed", () => {
  it("restores focus to PathBanner's trigger button after Escape closes the drawer", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    const { MobileNavOpenProvider } =
      await import("../../../../../src/features/app-shell/shell/mobile-nav-open-provider");
    const { useMobileNavOpen } = await import("../../../../../src/features/app-shell/shell/use-mobile-nav-open");
    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    const { PathBanner } = await import("@/features/course-paths/shell/path-banner");

    function Harness() {
      const { open, setOpen } = useMobileNavOpen();
      return (
        <>
          <PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />
          <MobileNav locale="en" open={open} onOpenChange={setOpen} />
        </>
      );
    }

    render(
      <MobileNavOpenProvider>
        <Harness />
      </MobileNavOpenProvider>,
    );

    const trigger = screen.getByRole("button", { name: /Open path course list/i });
    await user.click(trigger);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(document.body.querySelector("#mobile-nav-drawer")).not.toBeNull();

    await user.keyboard("{Escape}");

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(document.activeElement).toBe(trigger);
  });

  /**
   * Regression: the e2e `path-order-nav.feature` phone-drawer scenario still failed in the
   * `webkit` Playwright project after the fix above. WebKit (Safari) does not focus a `<button>`
   * on mouse click by default — unlike Chromium/Firefox — so `document.activeElement` at the
   * moment `setOpen(true)` runs is NOT the clicked trigger there, and the earlier fix's reliance on
   * ambient `document.activeElement` silently fails for that click. `fireEvent.click` (unlike
   * `userEvent.click`, used above) does not simulate focus-on-click either, reproducing the same
   * gap in jsdom.
   */
  it("still restores focus to the trigger when the click that opened the drawer did not itself focus it (WebKit)", async () => {
    const { MobileNavOpenProvider } =
      await import("../../../../../src/features/app-shell/shell/mobile-nav-open-provider");
    const { useMobileNavOpen } = await import("../../../../../src/features/app-shell/shell/use-mobile-nav-open");
    const { MobileNav } = await import("../../../../../src/features/app-shell/shell/mobile-nav");
    const { PathBanner } = await import("@/features/course-paths/shell/path-banner");

    function Harness() {
      const { open, setOpen } = useMobileNavOpen();
      return (
        <>
          <PathBanner locale="en" pathTitle="Python Fundamentals" courseIndex={2} totalCourses={5} />
          <MobileNav locale="en" open={open} onOpenChange={setOpen} />
        </>
      );
    }

    render(
      <MobileNavOpenProvider>
        <Harness />
      </MobileNavOpenProvider>,
    );

    const trigger = screen.getByRole("button", { name: /Open path course list/i });
    fireEvent.click(trigger);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(document.body.querySelector("#mobile-nav-drawer")).not.toBeNull();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(document.activeElement).toBe(trigger);
  });
});
