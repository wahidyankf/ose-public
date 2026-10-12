import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LandingSectionDescriptor } from "@/features/content/core/landing-sections";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { manifestFixture } from "../../course-paths/manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { Landing } from "../../../../../src/features/app-shell/shell/landing";

afterEach(cleanup);

function descriptor(slug: string, title: string, blurb: string): LandingSectionDescriptor {
  return { slug, title, blurb, icon: undefined };
}

function manifest(pathId: string, arc: string, title: string): PathManifest {
  return manifestFixture({ pathId, arc, title, description: `${title} description`, courses: ["just-enough-python"] });
}

const enSections: LandingSectionDescriptor[] = [
  descriptor("learn", "Learn", "Languages, architecture, system design — by example."),
  descriptor("rants", "Rants", "Opinionated takes — a first-class section."),
];

const heroManifests: PathManifest[] = [
  manifest("careers/interview-ready/backend-track", "interview-ready", "Backend Track"),
  manifest("careers/immediately-effective/frontend-track", "immediately-effective", "Frontend Track"),
  manifest("skills/example-subject", "example-track", "Example Subject"),
];

describe("Landing", () => {
  it("renders the hero heading as the single H1 and the intro copy", () => {
    render(<Landing locale="en" sections={enSections} manifests={heroManifests} />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toBe("Learn to build software, the clear way.");
    expect(
      screen.getByText(
        "AyoKoding is an open, bilingual learning hub for software engineering — practical guides, worked examples, and free tools that grow with you.",
      ),
    ).toBeTruthy();
  });

  it("renders a 'Choose your path' eyebrow with a PathCard per careers manifest, capped at four, plus the escape-hatch row", () => {
    render(<Landing locale="en" sections={enSections} manifests={heroManifests} />);

    expect(screen.getByText("Choose your path")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Start the Backend Track path/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Start the Frontend Track path/ })).toBeTruthy();
    // The skills fixture is excluded from the hero grid (careers paths only, R1/prd.md Screen 0).
    expect(screen.queryByRole("link", { name: /Start the Example Subject path/ })).toBeNull();

    expect(screen.getByRole("link", { name: "Compare all paths →" }).getAttribute("href")).toBe("/en/learn/paths");
    expect(screen.getByRole("link", { name: "Explore skills paths →" }).getAttribute("href")).toBe(
      "/en/learn/paths/skills",
    );
    expect(screen.getByRole("link", { name: "Browse the full course library →" }).getAttribute("href")).toBe(
      "/en/browse",
    );
  });

  it("gives all three hero escape-hatch links an always-visible underline affordance, while keeping prd.md's own documented per-link hue distinction (UWT-007 fix, reconciled with DWT-001's mockup-fidelity ground truth)", () => {
    // An earlier pass of this same UWT-007 fix (before this plan's DWT-001 design-tester retest
    // cross-checked prd.md) mistakenly unified all three links to one flat colour, having missed
    // that prd.md's own Screen 0 hi-fi spec documents three DIFFERENT treatments on purpose (the
    // first two tied to real hue tokens, the third deliberately subordinate). The genuine defect
    // UWT-007 found — none had an always-visible underline, so the third read as plain text — is
    // fixed here without erasing the documented hue distinction.
    render(<Landing locale="en" sections={enSections} manifests={heroManifests} />);

    const compare = screen.getByRole("link", { name: "Compare all paths →" });
    const skills = screen.getByRole("link", { name: "Explore skills paths →" });
    const browse = screen.getByRole("link", { name: "Browse the full course library →" });

    expect(compare.className).toContain("underline");
    expect(skills.className).toContain("underline");
    expect(browse.className).toContain("underline");
    expect(compare.className).toContain("--hue-honey-ink");
    expect(skills.className).toContain("--hue-sky-ink");
    expect(browse.className).toContain("text-muted-foreground");
  });

  it("no longer renders the old standalone Learn/Tools hero CTA buttons (moved into the global nav)", () => {
    render(<Landing locale="en" sections={enSections} manifests={heroManifests} />);
    expect(screen.queryByRole("link", { name: "Start learning" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Explore tools" })).toBeNull();
  });

  it("renders a section card per descriptor, linking through contentUrl (bare join, DD-48)", () => {
    render(<Landing locale="en" sections={enSections} />);
    expect(screen.getByRole("link", { name: /Learn/ }).getAttribute("href")).toBe("/en/learn");
    const rants = screen.getByRole("link", { name: /Rants/ });
    expect(rants.getAttribute("href")).toBe("/en/rants");
    expect(rants.textContent).toContain("Opinionated takes");
  });

  it("renders the Tools teaser linking to the cost-of-living calculator", () => {
    render(<Landing locale="en" sections={enSections} />);
    expect(screen.getByText("Cost of Living Calculator")).toBeTruthy();
    const cta = screen.getByRole("link", { name: "Open the calculator" });
    expect(cta.getAttribute("href")).toBe("/en/tools/cost-of-living-calculator");
  });

  it("renders the section band H2 as 'Explore' (not 'Learn') — DWT-003 fix", () => {
    render(<Landing locale="en" sections={enSections} />);
    const h2 = screen.getByRole("heading", { level: 2, name: "Explore" });
    expect(h2).toBeTruthy();
  });

  it("renders the section band H2 as 'Jelajahi' for id locale — DWT-003 fix", () => {
    const idSections = [descriptor("belajar", "Belajar", "blurb")];
    render(<Landing locale="id" sections={idSections} />);
    const h2 = screen.getByRole("heading", { level: 2, name: "Jelajahi" });
    expect(h2).toBeTruthy();
  });

  it("localizes the hero's 'Choose your path' eyebrow and escape-hatch links on the id locale (this plan's own DWT-003 fix, phase-5 rule-15 design-tester retest — course-paths feature chrome, distinct from the url-restructure plan's identically-numbered section-band finding above)", () => {
    render(<Landing locale="id" sections={enSections} manifests={heroManifests} />);

    expect(screen.getByText("Pilih jalur Anda")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bandingkan semua jalur/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Jelajahi jalur keterampilan/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Jelajahi seluruh pustaka kursus/ })).toBeTruthy();
  });

  it("renders id-locale chrome and an id section card (Celoteh)", () => {
    const idSections: LandingSectionDescriptor[] = [
      descriptor("belajar", "Belajar", "Bahasa, arsitektur, dan desain sistem — lewat contoh."),
      descriptor("celoteh", "Celoteh", "Opini lugas — bagian kelas satu."),
    ];
    render(<Landing locale="id" sections={idSections} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Belajar membangun perangkat lunak, dengan cara yang jelas.",
    );
    const celoteh = screen.getByRole("link", { name: /Celoteh/ });
    expect(celoteh.getAttribute("href")).toBe("/id/celoteh");
    expect(screen.getByRole("link", { name: "Buka kalkulator" }).getAttribute("href")).toBe(
      "/id/tools/cost-of-living-calculator",
    );
  });
});
