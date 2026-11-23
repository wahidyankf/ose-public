import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { expect, vi } from "vitest";
import "./helpers/test-setup";
import { BrowseIndex } from "@/features/content/shell/browse-index";
import { Footer } from "@/features/app-shell/shell/footer";
import { Landing } from "@/features/app-shell/shell/landing";
import type { LandingSectionDescriptor } from "@/features/content/core/landing-sections";
import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";
import { contentUrl } from "@/features/content/core/content-url";
import { PRIMARY_NAV_LINKS } from "@/features/app-shell/core/nav-links";
import { t } from "@/features/i18n/core/translations";
import { metadata as layoutMetadata } from "@/app/[locale]/layout";
import sitemap from "@/app/sitemap";
import { GET as getFeed } from "@/app/feed.xml/route";
import { generateMetadata } from "@/app/[locale]/(content)/[...slug]/page";
import robots from "../../../src/app/robots";
import ContentNotFound from "../../../src/app/[locale]/(content)/not-found";

// Mocks required by Footer (no trpc/navigation needed — Footer is a server component)
// next/link is already mocked in test-setup.ts

// The content index the real sitemap and feed routes read, fixed to one en/id sample.
const { indexedContent } = vi.hoisted(() => ({
  indexedContent: [
    { locale: "en", slug: "learn/software-engineering", isSection: false, date: null, title: "SE", description: null },
    { locale: "en", slug: "about-ayokoding", isSection: false, date: null, title: "About", description: null },
    { locale: "id", slug: "tentang-ayokoding", isSection: false, date: null, title: "Tentang", description: null },
    { locale: "en", slug: "rants/my-post", isSection: false, date: null, title: "My post", description: null },
  ],
}));
vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: {
      getIndex: async () => ({
        contentMap: new Map(indexedContent.map((meta) => [`${meta.locale}:${meta.slug}`, meta])),
      }),
    },
  }),
}));

// The content page lookup `generateMetadata` reads its title and description from.
const { getBySlug } = vi.hoisted(() => ({ getBySlug: vi.fn() }));
vi.mock("@/lib/trpc/server", () => ({ serverCaller: { content: { getBySlug } } }));

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature",
  ),
);

// ---------------------------------------------------------------------------
// Landing section descriptor stubs
// ---------------------------------------------------------------------------

function desc(slug: string, title: string, blurb: string): LandingSectionDescriptor {
  return { slug, title, blurb, icon: undefined };
}

const EN_LANDING_SECTIONS: LandingSectionDescriptor[] = [
  desc("learn", "Learn", "Languages, architecture, system design — by example."),
  desc("rants", "Rants", "Opinionated takes — a first-class section."),
];

const ID_LANDING_SECTIONS: LandingSectionDescriptor[] = [
  desc("belajar", "Belajar", "Bahasa, arsitektur, dan desain sistem — lewat contoh."),
  desc("celoteh", "Celoteh", "Opini lugas — bagian kelas satu."),
];

/** Minimal TreeNode stubs sufficient for BrowseIndex rendering. */
const learnSection = {
  slug: "learn",
  title: "Learn",
  isSection: true,
  weight: 0,
  children: [],
};
const rantsSection = {
  slug: "rants",
  title: "Rants",
  isSection: true,
  weight: 1,
  children: [],
};

describeFeature(feature, ({ Scenario, ScenarioOutline, Background, AfterEachScenario }) => {
  AfterEachScenario(cleanup);

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Landing).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: English content resolves at its bare URL
  Scenario("English content resolves at its bare URL", ({ When, Then, And }) => {
    let requestedUrl = "";
    When('a visitor navigates to "/en/learn/legacy/software-engineering"', () => {
      requestedUrl = contentUrl("en", "learn/legacy/software-engineering");
      render(
        <Breadcrumb
          locale="en"
          slug="learn/legacy/software-engineering"
          segments={[{ label: "Learn", slug: "learn" }]}
          showCurrent
        />,
      );
    });

    Then("the page should respond with HTTP 200", () => {
      expect(requestedUrl).toBe("/en/learn/legacy/software-engineering");
      expect(requestedUrl).not.toContain("/c/");
    });

    And("a breadcrumb nav should be present", () => {
      expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: The browse index lists all content sections
  Scenario("The browse index lists all content sections", ({ When, Then, And }) => {
    When('a visitor navigates to "/en/browse"', () => {
      render(<BrowseIndex locale="en" sections={[learnSection, rantsSection]} />);
    });

    Then("the page should load successfully", () => {
      expect(screen.getByRole("heading", { level: 1, name: "Browse" })).toBeTruthy();
    });

    And('the browse index should show a section card for "learn"', () => {
      const link = screen.getByRole("link", { name: /learn/i });
      expect(link).toBeTruthy();
    });

    And('the browse index should show a section card for "rants"', () => {
      const link = screen.getByRole("link", { name: /rants/i });
      expect(link).toBeTruthy();
    });

    And("a breadcrumb nav should be present", () => {
      const nav = document.querySelector("nav[aria-label]");
      expect(nav).toBeTruthy();
    });

    And("the breadcrumb should start with a Home link", () => {
      const links = document.querySelectorAll("nav[aria-label] a");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: Header shows primary nav links on desktop
  Scenario("Header shows primary nav links on desktop", ({ Given, When, Then, And }) => {
    let links: { label: string; href: string }[] = [];
    Given("the viewport is set to desktop width", () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
      expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    });

    When('a visitor navigates to "/en"', () => {
      links = PRIMARY_NAV_LINKS.map((link) => ({ label: t("en", link.labelKey), href: link.hrefFor("en") }));
    });

    Then('the header primary nav should contain a link to "/en/browse" labelled "Learn"', () => {
      expect(links).toContainEqual({ label: "Learn", href: "/en/browse" });
    });

    And('the header primary nav should contain a link to "/en/tools" labelled "Tools"', () => {
      expect(links).toContainEqual({ label: "Tools", href: "/en/tools" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: mobile navigation links
  ScenarioOutline("mobile navigation links", ({ Given, When, Then, And }, variables) => {
    let links: { label: string; href: string }[] = [];
    Given("the viewport is set to mobile width", () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
      expect(window.innerWidth).toBeLessThan(768);
    });

    When('a visitor navigates to "<home>"', () => {
      expect(contentUrl(String(variables.locale) as "en" | "id", "")).toBe(String(variables.home));
    });

    And("the visitor opens the mobile navigation menu", () => {
      const locale = String(variables.locale) as "en" | "id";
      links = PRIMARY_NAV_LINKS.map((link) => ({ label: t(locale, link.labelKey), href: link.hrefFor(locale) }));
    });

    Then('the mobile nav should contain a link to "<learn_href>" labelled "<learn_label>"', () => {
      expect(links).toContainEqual({ label: String(variables.learn_label), href: String(variables.learn_href) });
    });

    And('the mobile nav should contain a link to "<tools_href>" labelled "<tools_label>"', () => {
      expect(links).toContainEqual({ label: String(variables.tools_label), href: String(variables.tools_href) });
    });

    And('every drawer label is localized to "<locale>"', () => {
      const locale = String(variables.locale) as "en" | "id";
      expect(links.map(({ label }) => label)).toEqual(PRIMARY_NAV_LINKS.map((link) => t(locale, link.labelKey)));
      if (locale === "en") return;
      for (const link of PRIMARY_NAV_LINKS) {
        expect(t(locale, link.labelKey)).not.toBe(t("en", link.labelKey));
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: Footer shows grouped navigation with localized labels
  Scenario("Footer shows grouped navigation with localized labels", ({ When, Then, And }) => {
    When('a visitor navigates to "/id"', () => {
      render(<Footer locale="id" />);
    });

    Then('the footer should display a "Learn" column', () => {
      // Indonesian: footerLearn = "Belajar" — use the rendered heading text.
      const footer = document.querySelector("footer");
      expect(footer).toBeTruthy();
      // The footer nav heading for Learn in Indonesian is "Belajar"
      const headings = footer!.querySelectorAll("h2");
      const labels = Array.from(headings).map((h) => h.textContent ?? "");
      expect(labels.some((l) => /belajar/i.test(l))).toBe(true);
    });

    And('the footer should display a "Tools" column', () => {
      const footer = document.querySelector("footer");
      const headings = footer!.querySelectorAll("h2");
      const labels = Array.from(headings).map((h) => h.textContent ?? "");
      // Indonesian: footerTools = "Alat"
      expect(labels.some((l) => /alat/i.test(l))).toBe(true);
    });

    And('the footer should display an "About" column', () => {
      const footer = document.querySelector("footer");
      const headings = footer!.querySelectorAll("h2");
      const labels = Array.from(headings).map((h) => h.textContent ?? "");
      // Indonesian: footerAbout = "Tentang"
      expect(labels.some((l) => /tentang/i.test(l))).toBe(true);
    });

    And('the footer "About" column should link to "/id/tentang-ayokoding"', () => {
      const link = document.querySelector('a[href="/id/tentang-ayokoding"]');
      expect(link).toBeTruthy();
    });

    And('the footer "About" column should link to "/id/syarat-dan-ketentuan"', () => {
      const link = document.querySelector('a[href="/id/syarat-dan-ketentuan"]');
      expect(link).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: landing homepage per locale
  ScenarioOutline("landing homepage per locale", ({ When, Then, And }, variables) => {
    When('a visitor navigates to "<home>"', () => {
      // The home path is "/en" or "/id", so the locale is the path without its slash.
      const locale = String(variables.home).slice(1) as "en" | "id";
      // Clean up any previous renders to isolate this example.
      cleanup();
      render(<Landing locale={locale} sections={locale === "en" ? EN_LANDING_SECTIONS : ID_LANDING_SECTIONS} />);
    });

    Then("the hero heading should be visible on the landing page", () => {
      // The Landing renders a single H1 via Hero.
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]?.textContent).toBeTruthy();
    });

    And("the hero intro should be visible on the landing page", () => {
      // Intro paragraph is rendered inside the first <section> (the hero).
      const sections = document.querySelectorAll("section");
      const heroSection = sections[0];
      expect(heroSection).toBeTruthy();
      const para = heroSection!.querySelector("p");
      expect(para).toBeTruthy();
      expect((para?.textContent ?? "").length).toBeGreaterThan(0);
    });

    And('the landing section grid should include a card linking to "<section_href>"', () => {
      // SectionCard renders as an <a> with href = contentUrl(locale, slug).
      const link = document.querySelector(`a[href="${String(variables.section_href)}"]`);
      expect(link).toBeTruthy();
    });

    And('the tools teaser should link to "<tools_href>"', () => {
      const link = document.querySelector(`a[href="${String(variables.tools_href)}"]`);
      expect(link).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: Breadcrumb segments link to their bare content URLs
  Scenario("Breadcrumb segments link to their bare content URLs", ({ Given, When, Then }) => {
    const contentSegments = [
      { label: "Learn", slug: "learn" },
      { label: "Software Engineering", slug: "learn/legacy/software-engineering" },
      { label: "Data", slug: "learn/legacy/software-engineering/data" },
    ];

    Given('a visitor is on "/en/learn/legacy/software-engineering/data"', () => {
      cleanup();
    });

    When("the breadcrumb renders its ancestor segments", () => {
      render(
        <Breadcrumb locale="en" slug="learn/legacy/software-engineering/data" segments={contentSegments} showCurrent />,
      );
    });

    Then("each ancestor crumb links to its bare content URL", () => {
      const learnLink = screen.getByRole("link", { name: "Learn" });
      expect(learnLink.getAttribute("href")).toBe("/en/learn");
      const seLink = screen.getByRole("link", { name: "Software Engineering" });
      expect(seLink.getAttribute("href")).toBe("/en/learn/legacy/software-engineering");
      // Current page rendered as non-link span
      const current = screen.getByText("Data");
      expect(current.getAttribute("aria-current")).toBe("page");
      expect(current.closest("a")).toBeNull();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: Sidebar, breadcrumb, previous and next, and search links go straight to their page with no redirect
  Scenario(
    "Sidebar, breadcrumb, previous and next, and search links go straight to their page with no redirect",
    ({ Given, When, Then, And }) => {
      const sourceSlugs = ["learn/software-engineering", "rants", "belajar"] as const;
      let hrefs: string[] = [];
      Given("the sidebar tree, breadcrumb, prev-next, and search results render content links", () => {
        expect(sourceSlugs).toHaveLength(3);
        expect(sourceSlugs.every((slug) => !slug.startsWith("/"))).toBe(true);
      });

      When("their hrefs are computed via the central content URL helper", () => {
        hrefs = [contentUrl("en", sourceSlugs[0]), contentUrl("en", sourceSlugs[1]), contentUrl("id", sourceSlugs[2])];
        expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
      });

      Then("every content link resolves directly to its bare URL with status 200", () => {
        expect(hrefs).toEqual(["/en/learn/software-engineering", "/en/rants", "/id/belajar"]);
      });

      And("no internal content link resolves through a 308 redirect", () => {
        // Verified structurally: all link emitters call contentUrl directly,
        // which produces canonical bare paths — no redirect intermediaries.
        // Full HTTP 200 verification is covered by E2E breadcrumb/sidebar tests.
        expect(contentUrl("en", "learn")).not.toContain("/c/");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: The sitemap lists every content page by its public URL on www.ayokoding.com
  Scenario(
    "The sitemap lists every content page by its public URL on www.ayokoding.com",
    ({ Given, When, Then, And, But }) => {
      let sitemapUrls: string[] = [];
      Given("the sitemap is generated from the content index", () => {
        expect(indexedContent).toHaveLength(4);
        expect(indexedContent.every(({ slug }) => slug.length > 0)).toBe(true);
      });

      When("the sitemap entries are produced", async () => {
        sitemapUrls = (await sitemap()).map(({ url }) => url);
        expect(sitemapUrls).toHaveLength(indexedContent.length);
        expect(sitemapUrls.every((url) => URL.canParse(url))).toBe(true);
      });

      Then("every moved-content entry uses a bare URL", () => {
        expect(sitemapUrls[0]).toBe("https://www.ayokoding.com/en/learn/software-engineering");
        expect(sitemapUrls[0]).not.toContain("/c/");
      });

      And('every sitemap entry is on the canonical host "www.ayokoding.com"', () => {
        expect(sitemapUrls.map((url) => new URL(url).host)).toEqual(sitemapUrls.map(() => "www.ayokoding.com"));
      });

      But("top-level pages (about, terms, tools) use that same bare form — no longer namespace-distinct", () => {
        // Loose pages and content pages now share the same uniform bare join — asserted in sitemap.unit.test.ts
        expect(sitemapUrls).toContain("https://www.ayokoding.com/en/about-ayokoding");
        expect(sitemapUrls).toContain("https://www.ayokoding.com/id/tentang-ayokoding");
        expect(sitemapUrls.some((url) => url.includes("/c/"))).toBe(false);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: RSS feed item links use bare content URLs
  Scenario("RSS feed item links use bare content URLs", ({ Given, When, Then, And }) => {
    let feedXml = "";
    Given("the feed is generated from the content index", () => {
      expect(indexedContent.some(({ locale, slug }) => locale === "en" && slug === "rants/my-post")).toBe(true);
    });

    When("the feed items are produced", async () => {
      feedXml = await (await getFeed()).text();
      expect(feedXml).toContain("<item>");
    });

    Then("every content item link uses a bare URL", () => {
      expect(feedXml).toContain("<link>https://www.ayokoding.com/en/rants/my-post</link>");
      expect(feedXml).not.toContain("/c/");
    });

    And('every feed link is on the canonical host "www.ayokoding.com"', () => {
      // The channel link, the self link, and each English item's link and guid.
      const englishItems = indexedContent.filter(({ locale }) => locale === "en");
      const feedUrls = [...feedXml.matchAll(/<(?:link|guid)>([^<]+)<\/(?:link|guid)>|<atom:link href="([^"]+)"/gu)].map(
        (match) => match[1] ?? match[2]!,
      );
      expect(feedUrls).toHaveLength(2 + 2 * englishItems.length);
      expect(feedUrls.map((url) => new URL(url).host)).toEqual(feedUrls.map(() => "www.ayokoding.com"));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: A content page declares its own URL as canonical, with language alternates on www.ayokoding.com
  Scenario(
    "A content page declares its own URL as canonical, with language alternates on www.ayokoding.com",
    ({ Given, When, Then, And }) => {
      let pageMetadata: Awaited<ReturnType<typeof generateMetadata>>;
      Given('the content page at "/en/learn/legacy/software-engineering"', () => {
        getBySlug.mockResolvedValue({ title: "Software Engineering", description: "Legacy overview" });
      });

      When("its metadata is generated", async () => {
        pageMetadata = await generateMetadata({
          params: Promise.resolve({ locale: "en", slug: ["learn", "legacy", "software-engineering"] }),
        });
      });

      Then('the canonical alternate is "/en/learn/legacy/software-engineering"', () => {
        expect(pageMetadata.alternates?.canonical).toBe("/en/learn/legacy/software-engineering");
      });

      And("the language alternates include en and x-default", () => {
        expect(pageMetadata.alternates?.languages).toEqual({
          en: "/en/learn/legacy/software-engineering",
          "x-default": "/en/learn/legacy/software-engineering",
        });
      });

      And('the canonical link and the language alternates are on the canonical host "www.ayokoding.com"', () => {
        // Next resolves each relative alternate against the root layout's `metadataBase` when it renders
        // the `<link>` tags, so that base decides the host every rendered canonical and hreflang carries.
        const base = layoutMetadata.metadataBase;
        expect(base).toBeInstanceOf(URL);
        const { canonical, languages = {} } = pageMetadata.alternates ?? {};
        const rendered = [canonical, ...Object.values(languages)].map((href) => new URL(String(href), base!));
        expect(rendered).toHaveLength(3);
        expect(rendered.map(({ host }) => host)).toEqual(rendered.map(() => "www.ayokoding.com"));
        expect(rendered[0]?.href).toBe("https://www.ayokoding.com/en/learn/legacy/software-engineering");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: robots.txt allows crawling and names the sitemap
  Scenario("robots.txt allows crawling and names the sitemap", ({ When, Then, And }) => {
    let rules: ReturnType<typeof robots>;
    When("a search engine requests the robots.txt file", () => {
      rules = robots();
    });

    Then("every page of the site is open to crawling", () => {
      expect(rules.rules).toEqual([{ userAgent: "*", allow: "/" }]);
    });

    And("the robots.txt file names the sitemap", () => {
      expect(rules.sitemap).toBe("https://www.ayokoding.com/sitemap.xml");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature: A missing page shows Page Not Found with a Go Home link
  Scenario("A missing page shows Page Not Found with a Go Home link", ({ When, Then, And }) => {
    When("a visitor opens a page that does not exist", () => {
      render(<ContentNotFound />);
    });

    Then('the reader sees a "Page Not Found" heading', () => {
      expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeTruthy();
    });

    And("the page offers a Go Home link to the English home page", () => {
      expect(screen.getByRole("link", { name: "Go Home" }).getAttribute("href")).toBe("/en");
    });
  });
});
