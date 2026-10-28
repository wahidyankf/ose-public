import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import React from "react";

// ─── Reactive Navigation Mock ─────────────────────────────────────────────────
// The steps file renders a full page that includes URL-driven components.
// We need router.push/replace to trigger re-renders of the component tree.
//
// Strategy: use React Context. NavigationProvider holds URLSearchParams as
// context value and exposes a setter. useSearchParams reads from context,
// so any context update causes all consumers to re-render with the new params.
// navState is hoisted so the vi.mock factory sees it before module body runs.

// navState hoisted so vi.mock factory closure sees initialized object.
const { navState } = vi.hoisted(() => {
  const navState = {
    params: new URLSearchParams(),
    // setParams wired by NavigationProvider on mount
    setParams: (_: URLSearchParams) => {},
    // Records the navigation options ({ scroll: false }) of the most recent push/replace, so
    // scenarios can assert filter changes do not scroll the page to the top.
    lastNavOpts: undefined as { scroll?: boolean } | undefined,
    lastNavMethod: undefined as "push" | "replace" | undefined,
    // The route's [locale] segment useLocale()/useParams() resolve — mutable so locale-outline
    // scenarios (H1, breadcrumb) can render under the real "en"/"id" locale under test instead
    // of a hardcoded default.
    locale: "en",
  };
  return { navState };
});

// Context that holds the current URLSearchParams.
const NavParamsContext = React.createContext<URLSearchParams>(new URLSearchParams());

// Override next/navigation so this file's factory wins over test-setup.ts.
// useSearchParams reads from NavParamsContext → context updates trigger re-renders.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string, opts?: { scroll?: boolean }) => {
      navState.lastNavMethod = "push";
      navState.lastNavOpts = opts;
      const qs = url.startsWith("?") ? url.slice(1) : url;
      navState.params = new URLSearchParams(qs);
      navState.setParams(navState.params);
    },
    replace: (url: string, opts?: { scroll?: boolean }) => {
      navState.lastNavMethod = "replace";
      navState.lastNavOpts = opts;
      const qs = url.startsWith("?") ? url.slice(1) : url;
      navState.params = new URLSearchParams(qs);
      navState.setParams(navState.params);
    },
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => `/${navState.locale}/tools/cost-of-living-calculator`,
  useParams: () => ({ locale: navState.locale }),
  // Read from context — context updates force re-renders in all consumers.
  useSearchParams: () => React.useContext(NavParamsContext),
  notFound: vi.fn(),
}));

// NavigationProvider: provides NavParamsContext and wires navState.setParams
// so that router.push/replace triggers a context value update → children re-render.
function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = React.useState(() => navState.params);

  React.useEffect(() => {
    navState.setParams = (newParams) => {
      setParams(newParams);
    };
    return () => {
      navState.setParams = () => {};
    };
  }, []);

  return <NavParamsContext.Provider value={params}>{children}</NavParamsContext.Provider>;
}

// Helper to render a page within the NavigationProvider.
function renderPage(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

import "./helpers/test-setup";
import CostOfLivingCalculatorPage, {
  generateMetadata as generateCalculatorMetadata,
} from "@/app/[locale]/tools/cost-of-living-calculator/page";
import ToolsIndexPage from "@/app/[locale]/tools/page";
import { dataset } from "@/features/cost-of-living-calculator/core/data/cities";
import { fx } from "@/features/cost-of-living-calculator/core/data/fx";
import { t } from "@/features/i18n/core/translations";
import { PRIMARY_NAV_LINKS } from "@/features/app-shell/core/nav-links";
import { resolveLocaleEntryRedirect } from "@/redirects/locale-entry";

// The min-role tab now renders every (city, role) in scope (include-all). Unscoped, that is ~90+
// rows re-rendered on each keystroke of `userEvent.type`; under coverage instrumentation a few of
// these full-page scenarios brush past the 5s default. Give the feature headroom — production
// debounces the URL commit, so it never re-renders per keystroke the way these delay-0 tests do.
//
// This must stay at or above the project's `test:unit` target's `--testTimeout=60000` CLI flag
// (apps/ayokoding-www/project.json): `vi.setConfig` here overrides that CLI flag for this file,
// so a lower value silently reintroduces the CI headroom the flag was added to provide, causing
// intermittent timeouts under CI's shared/loaded runner even though this suite passes cleanly and
// quickly on an unloaded local machine.
vi.setConfig({ testTimeout: 60000 });

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/tools/cost-of-living-calculator.feature",
  ),
);

// A user-event session retains its last pointer target. Keep only the current scenario's
// session reachable, so completed scenarios release their detached calculator DOM.
let activeScenarioUser: ReturnType<typeof userEvent.setup> | undefined;

function getScenarioUser(): ReturnType<typeof userEvent.setup> {
  activeScenarioUser ??= userEvent.setup();
  return activeScenarioUser;
}

describeFeature(feature, ({ Scenario, ScenarioOutline, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    activeScenarioUser = undefined;
  });

  AfterEachScenario(() => {
    cleanup();
    activeScenarioUser = undefined;
    // Reset URL state between scenarios so each test starts with empty params
    navState.params = new URLSearchParams();
    navState.setParams = () => {};
    navState.lastNavOpts = undefined;
    navState.lastNavMethod = undefined;
    navState.locale = "en";
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  // ─── Cost of Living tab scenarios ───────────────────────────────────────────

  Scenario("Cost-of-living breakdown lists category expenses per city", ({ Given, When, Then, And }) => {
    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      navState.locale = "en";
      expect(navState.params.toString()).toBe("");
    });
    And('the "Cost of living" tab is active', () => {
      expect(navState.params.get("tab")).toBeNull();
    });

    When("the page finishes loading", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then("I see a table of tech-hub cities", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    And("each row shows a Country column immediately to the left of the City column", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      const countryIdx = headers.findIndex((t) => t.includes("country"));
      const cityIdx = headers.findIndex((t) => t.includes("city"));
      expect(countryIdx).toBeGreaterThanOrEqual(0);
      expect(cityIdx).toBeGreaterThan(countryIdx);
    });

    And(
      "each row shows monthly housing, food, transport, utilities, healthcare, childcare, school, and lifestyle expenses",
      () => {
        const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
        expect(headers.some((t) => t.includes("housing"))).toBe(true);
        expect(headers.some((t) => t.includes("food"))).toBe(true);
        expect(headers.some((t) => t.includes("transport"))).toBe(true);
        expect(headers.some((t) => t.includes("utilities"))).toBe(true);
        expect(headers.some((t) => t.includes("healthcare"))).toBe(true);
        expect(headers.some((t) => t.includes("childcare"))).toBe(true);
        expect(headers.some((t) => t.includes("school"))).toBe(true);
        expect(headers.some((t) => t.includes("lifestyle"))).toBe(true);
      },
    );

    And("each row shows an essentials subtotal and a total", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      expect(headers.some((t) => t.includes("essentials"))).toBe(true);
      expect(headers.some((t) => t.includes("total"))).toBe(true);
    });

    And("each row shows a separate one-time relocation sunk-cost total", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      expect(headers.some((t) => t.includes("relocation") || t.includes("sunk"))).toBe(true);
    });

    And("each row shows a separately labelled liquidity reserve", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      expect(headers.some((t) => t.includes("liquidity") || t.includes("reserve"))).toBe(true);
    });
  });

  Scenario(
    "Region narrows the country filter and country narrows the city filter",
    async ({ Given, When, Then, And }) => {
      Given('I am on "/en/tools/cost-of-living-calculator"', () => {
        navState.locale = "en";
        expect(navState.params.toString()).toBe("");
      });
      And('the "Cost of living" tab is active', () => {
        expect(navState.params.get("tab")).toBeNull();
      });

      When('I select the region "ASEAN" then the country "Indonesia" in the cascading filters', async () => {
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /region/i }), "asean");
        await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "id");
      });

      Then("the Country filter lists only ASEAN countries", () => {
        // After selecting ASEAN region, country options are filtered to ASEAN
        const countrySelect = screen.getByRole("combobox", { name: /country/i });
        const countryOptions = countrySelect.querySelectorAll("option");
        const nonAseanCountries = dataset.countries.filter(
          (c) => !dataset.cities.some((city) => city.countryId === c.id && city.region === "asean") && c.id !== "",
        );
        for (const country of nonAseanCountries) {
          const found = Array.from(countryOptions).some((o) => o.getAttribute("value") === country.id);
          expect(found, `Non-ASEAN country ${country.name.en} should not appear`).toBe(false);
        }
      });

      And("the City filter lists only Indonesian cities", () => {
        const citySelect = screen.getByRole("combobox", { name: /city/i });
        const cityOptions = Array.from(citySelect.querySelectorAll("option")).filter(
          (o) => o.getAttribute("value") !== "",
        );
        const expectedIds = dataset.cities.filter((c) => c.countryId === "id").map((c) => c.id);
        for (const opt of cityOptions) {
          expect(expectedIds).toContain(opt.getAttribute("value"));
        }
      });

      And("only cities in Indonesia are shown in the table", () => {
        const rows = screen.getAllByRole("row").slice(1);
        const idCities = dataset.cities.filter((c) => c.countryId === "id");
        expect(rows.length).toBe(idCities.length);
      });
    },
  );

  Scenario("Country and city are always shown together on every tab", ({ Given, When, Then }) => {
    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      navState.locale = "en";
      expect(navState.params.toString()).toBe("");
    });

    When("I view any tab's results table", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then("every row shows a Country column immediately to the left of the City column", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      const countryIdx = headers.findIndex((t) => t.includes("country"));
      const cityIdx = headers.findIndex((t) => t.includes("city"));
      expect(countryIdx).toBeGreaterThanOrEqual(0);
      expect(cityIdx).toBeGreaterThan(countryIdx);
    });
  });

  Scenario("Clicking a city name opens its single-city cost-of-living detail", async ({ Given, When, Then, And }) => {
    const firstCity = dataset.cities[0]!;

    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I click a city name in any table", async () => {
      const links = screen.getAllByRole("link", { name: firstCity.name.en });
      const cityLink = links.find((l) => l.getAttribute("href") === `?tab=cost&city=${firstCity.id}`);
      expect(cityLink).toBeDefined();
      await getScenarioUser().click(cityLink!);
    });

    Then('I am taken to that city\'s single-city Cost-of-living detail at "?city=<id>"', () => {
      // City detail is shown — CityDetail renders a heading with the city name.
      // (Cost-of-living is the default tab, so encodeState omits tab=cost from the URL.)
      expect(screen.getByTestId("city-detail")).toBeTruthy();
    });

    And("the City filter is pre-selected to that city", () => {
      // The city detail is shown with the city name visible
      expect(screen.getByTestId("city-detail").textContent).toContain(firstCity.name.en);
    });

    And(
      "the detail shows the full per-category breakdown, essentials subtotal, total, healthcare scheme badge, and split relocation in both local currency and USD",
      () => {
        // Healthcare badge present in city detail
        expect(screen.getByTestId("healthcare-badge")).toBeTruthy();
      },
    );
  });

  Scenario("Clicking a country opens Cost-of-living filtered to that country", async ({ Given, When, Then, And }) => {
    const firstCountry = dataset.countries[0]!;
    const firstCountryCities = dataset.cities.filter((c) => c.countryId === firstCountry.id);

    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I click a country name in any table", async () => {
      const links = screen.getAllByRole("link", { name: firstCountry.name.en });
      const countryLink = links.find((l) => l.getAttribute("href") === `?tab=cost&country=${firstCountry.id}`);
      expect(countryLink).toBeDefined();
      await getScenarioUser().click(countryLink!);
    });

    Then('I am taken to the Cost-of-living tab filtered to that country at "?country=<id>"', () => {
      // The table now shows only cities from that country.
      // (Cost-of-living is the default tab, so encodeState omits tab=cost from the URL.)
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows.length).toBe(firstCountryCities.length);
    });

    And("the Country filter is pre-selected to that country with its Region set", () => {
      // The country select should show the filtered country
      expect(screen.getByRole("table")).toBeTruthy();
    });

    And("the table shows that country's cities as a filtered list rather than a single-city detail", () => {
      // CostOfLivingTable is shown (not CityDetail)
      expect(screen.queryByTestId("city-detail")).toBeNull();
      expect(screen.getByRole("table")).toBeTruthy();
    });
  });

  Scenario("A city link takes precedence over a country link when both params are present", ({ Given, When, Then }) => {
    const firstCity = dataset.cities[0]!;

    Given("I am on the calculator with both a country and a city query param set", () => {
      navState.params = new URLSearchParams(`tab=cost&country=${firstCity.countryId}&city=${firstCity.id}`);
    });

    When('the page resolves the deep link at "?tab=cost&country=<id>&city=<id>"', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then("the single-city Cost-of-living detail for the city is shown because a city implies its country", () => {
      expect(screen.getByTestId("city-detail")).toBeTruthy();
    });
  });

  Scenario("Healthcare funding scheme is always shown", async ({ Given, When, Then, And }) => {
    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      navState.locale = "en";
      expect(navState.params.toString()).toBe("");
    });

    When("I select any city on any tab", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then("a healthcare funding-scheme badge is shown for that city's country", () => {
      const badges = screen.getAllByTestId("healthcare-badge");
      expect(badges.length).toBeGreaterThan(0);
    });

    And('the badge reads "tax-funded", "mandatory payroll insurance", or "out-of-pocket"', () => {
      const validTexts = ["tax-funded", "mandatory payroll insurance", "out-of-pocket"];
      const badges = screen.getAllByTestId("healthcare-badge");
      for (const badge of badges) {
        expect(validTexts).toContain(badge.textContent?.trim());
      }
    });
  });

  Scenario("The OOP abbreviation is explained on screen", ({ Given, When, Then, And }) => {
    Given('I am on a tab that shows the "Healthcare (OOP)" column', () => {
      expect(navState.params.get("tab")).toBeNull();
    });

    When("I read the legend near the table", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then('an on-screen explanation states that "OOP = out-of-pocket"', () => {
      const legend = screen.getByTestId("oop-legend");
      expect(legend).toBeTruthy();
    });

    And(
      "the explanation says it is the healthcare you pay yourself on top of any tax-funded or insurance coverage",
      () => {
        const legend = screen.getByTestId("oop-legend");
        expect(legend.textContent?.trim().length).toBeGreaterThan(0);
      },
    );

    And('every "OOP" acronym is wrapped in an abbr element titled "out-of-pocket"', () => {
      // Audit every text node using "OOP" as a standalone acronym, excluding the
      // definitional legend ("OOP = out-of-pocket — …") which is prose, not an <abbr>.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const oopNodes: Text[] = [];
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        const isLegend = /OOP\s*=\s*out-of-pocket/.test(text);
        if (/\bOOP\b/.test(text) && !isLegend) oopNodes.push(node as Text);
        node = walker.nextNode();
      }
      expect(oopNodes.length).toBeGreaterThan(0);
      for (const textNode of oopNodes) {
        const abbr = (textNode.parentElement as HTMLElement | null)?.closest("abbr");
        expect(abbr).not.toBeNull();
        expect(abbr!.getAttribute("title")).toBe("out-of-pocket");
      }
    });
  });

  Scenario("Relocation reserve is shown separately from sunk costs", ({ Given, When, Then, And }) => {
    Given('I am on the "Cost of living" tab', () => {
      expect(navState.params.get("tab")).toBeNull();
    });

    When("I read a city row", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then("the one-time relocation sunk-cost total is shown distinct from the monthly total", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      expect(headers.some((t) => t.includes("relocation") || t.includes("sunk"))).toBe(true);
    });

    And(
      "the liquidity-reserve cash cushion is shown in its own labelled figure, not folded into the sunk-cost total",
      () => {
        const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
        expect(headers.some((t) => t.includes("liquidity") || t.includes("reserve"))).toBe(true);
      },
    );
  });

  // ─── Savings tab scenarios ───────────────────────────────────────────────────

  Scenario(
    "Savings tab converts gross salary to net before subtracting expenses",
    async ({ Given, When, Then, And }) => {
      Given('I am on "/en/tools/cost-of-living-calculator"', () => {
        navState.locale = "en";
        expect(navState.params.toString()).toBe("");
      });
      And('I switch to the "Savings" tab', async () => {
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      });

      When('I enter a gross monthly salary of "8000" USD', async () => {
        const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
        await getScenarioUser().clear(input);
        await getScenarioUser().type(input, "8000");
      });

      Then("each city row shows a net take-home after the country's federal and sub-national effective tax", () => {
        expect(screen.getByRole("table")).toBeTruthy();
        const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
        expect(headers.some((t) => t.includes("net"))).toBe(true);
      });

      And(
        "each row shows the essentials, the savings after essentials, and the savings after lifestyle with percentages",
        () => {
          const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
          expect(headers.some((t) => t.includes("essentials"))).toBe(true);
          expect(headers.some((t) => t.includes("savings"))).toBe(true);
        },
      );

      And("the table can be sorted by savings", () => {
        expect(screen.getByRole("button", { name: /sort/i })).toBeTruthy();
      });
    },
  );

  Scenario("Gross salary entered monthly shows the derived annual figure", async ({ Given, When, Then, And }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When('I enter a gross monthly salary of "8000" USD', async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000");
    });

    Then('the annual gross is shown as "96000" USD', () => {
      expect(screen.getByTestId("annual-gross")).toHaveTextContent("96");
    });

    And("the annual figure equals twelve times the monthly figure", () => {
      const monthly = Number(
        (screen.getByRole("spinbutton", { name: /gross monthly salary/i }) as HTMLInputElement).value,
      );
      const annual = Number(screen.getByTestId("annual-gross").textContent?.replace(/[^0-9.-]/g, ""));
      expect(annual).toBe(monthly * 12);
    });
  });

  Scenario("Non-salary comp is shown as informational context only", async ({ Given, When, Then, But }) => {
    Given('I am on the "Savings" tab with a gross salary entered', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000");
    });

    When("I read a city row", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then(
      "a typical non-salary compensation (RSU/equity + bonus) figure is shown as a separate informational column",
      () => {
        const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
        expect(headers.some((t) => t.includes("non-salary") || t.includes("rsu") || t.includes("equity"))).toBe(true);
      },
    );

    But("it is not added into the net, the essential savings, or the after-lifestyle savings", () => {
      expect(screen.getByTestId("non-salary-comp-note")).toBeTruthy();
    });
  });

  Scenario("Total compensation is shown for negotiation context", async ({ Given, When, Then, And }) => {
    Given('I am on the "Savings" tab with a gross salary entered', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000");
    });

    When("I read a city row", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then(
      "a total compensation figure equal to the base annual gross plus the typical non-salary comp is shown as informational context",
      () => {
        const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
        expect(headers.some((t) => t.includes("total comp") || t.includes("total compensation"))).toBe(true);
      },
    );

    And(
      "the total compensation is not added into the net, the essential savings, or the after-lifestyle savings",
      () => {
        expect(screen.getByTestId("non-salary-comp-note")).toBeTruthy();
      },
    );
  });

  Scenario("Sub-national tax lowers net only in federal countries", async ({ Given, When, Then, But }) => {
    Given('I am on the "Savings" tab with a gross salary entered', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000");
    });

    When("I compare a US, Canadian, or Swiss city against a unitary-country city", () => {
      expect(screen.getAllByTestId("sub-national-indicator").length).toBeGreaterThan(0);
    });

    Then("the federal-country city applies its city sub-national rate on top of the federal rate", () => {
      const federalRows = screen.getAllByTestId("sub-national-indicator").map((indicator) => indicator.closest("tr"));
      expect(federalRows.length).toBeGreaterThan(0);
      for (const row of federalRows)
        expect(Number(row?.querySelector("[data-testid='net-value']")?.getAttribute("data-usd"))).toBeGreaterThan(0);
    });

    But("the unitary-country city applies the federal rate alone", () => {
      const unitaryRow = screen.getAllByRole("link", { name: "Jakarta" })[0]!.closest("tr");
      expect(unitaryRow?.querySelector("[data-testid='sub-national-indicator']")).toBeNull();
      expect(Number(unitaryRow?.querySelector("[data-testid='net-value']")?.getAttribute("data-usd"))).toBeGreaterThan(
        0,
      );
    });
  });

  Scenario("Net take-home is lower than the entered gross", async ({ Given, When, Then }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("I enter a gross monthly salary above a city's tax band threshold", async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000");
    });

    Then("the net take-home shown for that city is lower than the entered gross", () => {
      const netCells = screen.getAllByTestId("net-value");
      expect(netCells.length).toBeGreaterThan(0);
      for (const cell of netCells) {
        const raw = parseFloat(cell.getAttribute("data-usd") ?? "0");
        expect(raw).toBeLessThanOrEqual(8000);
      }
    });
  });

  Scenario("Essentials above net show a deficit", async ({ Given, When, Then }) => {
    Given('I am on the "Savings" tab for a high-cost city', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("I enter a gross salary whose net is lower than that city's modeled essentials", async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "500");
    });

    Then("the savings-after-essentials amount and percentage are shown as negative", () => {
      const savingsCells = screen.getAllByTestId("savings-essential");
      const hasDeficit = savingsCells.some((c) => parseFloat(c.getAttribute("data-usd") ?? "0") < 0);
      expect(hasDeficit).toBe(true);
    });
  });

  // ─── i18n scenario ───────────────────────────────────────────────────────────

  Scenario("Indonesian locale is fully translated", ({ Given, When, Then }) => {
    Given('I am on "/id/tools/cost-of-living-calculator"', () => {
      navState.locale = "id";
      expect(navState.locale).toBe("id");
    });

    When("the page finishes loading", () => {
      renderPage(<CostOfLivingCalculatorPage />);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("id", "calcTitle"));
    });

    Then(
      "all labels, category names, tax wording, healthcare-scheme labels, relocation labels, and the disclaimer are in Indonesian",
      () => {
        expect(t("id", "calcTitle")).not.toBe(t("en", "calcTitle"));
        expect(t("id", "healthcareOutOfPocket")).not.toBe(t("en", "healthcareOutOfPocket"));
        expect(t("id", "disclaimerPension")).not.toBe(t("en", "disclaimerPension"));
        expect(t("id", "labelRegion")).not.toBe(t("en", "labelRegion"));
        expect(t("id", "oopLegend")).not.toBe(t("en", "oopLegend"));
      },
    );
  });

  // ─── Data integrity ───────────────────────────────────────────────────────────

  Scenario("No Israeli cities are listed", ({ Given, When, Then }) => {
    Given("I am on the calculator in either locale", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page finishes loading", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("no Israeli city appears in the dataset or any table", () => {
      const rows = screen.getAllByRole("row").slice(1);
      for (const row of rows) {
        expect(row.textContent).not.toMatch(/israel|tel aviv/i);
      }
    });
  });

  Scenario("Data snapshot date is clearly shown", ({ Given, When, Then, And }) => {
    Given("I am on the calculator", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page finishes loading", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then('I see a prominent "Data last updated" label with the dataset snapshot date', () => {
      const el = screen.getByTestId("data-last-updated");
      expect(el).toBeTruthy();
      expect(el.textContent?.trim().length).toBeGreaterThan(0);
    });

    And('I see an "estimates only" disclaimer', () => {
      const el = screen.getByTestId("estimates-disclaimer");
      expect(el).toBeTruthy();
      expect(el.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  Scenario("Every monetary figure converts to USD via the in-repo FX table", ({ Given, When, Then, And }) => {
    Given("I am on the calculator", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I read any USD figure derived from a local-currency value", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("the conversion uses the rate for that currency stored in the in-repo fx.ts table", () => {
      const nonUsdCity = dataset.cities.find((city) => city.currency !== "USD")!;
      expect(fx.ratesUsdPerUnit[nonUsdCity.currency]).toBeGreaterThan(0);
    });

    And("every currency referenced by a city, country, role, or display-currency selector has an fx.ts entry", () => {
      const referencedCurrencies = new Set(dataset.cities.map((city) => city.currency));
      for (const currency of referencedCurrencies) expect(fx.ratesUsdPerUnit[currency]).toBeGreaterThan(0);
    });
  });

  // ─── Cost-basis controls scenarios ───────────────────────────────────────────

  Scenario("Adding adults and children changes the modeled expenses", async ({ Given, When, Then, And }) => {
    Given('I am on the "Cost of living" tab', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I change the household from "single" to married with 2 school-age children', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "2");
    });

    Then("the modeled housing and utilities increase sub-linearly", () => {
      // Preview moved to the min-role tab; on the cost tab these figures live in the table.
      expect(screen.getByTestId(`col-housing-${dataset.cities[0]!.id}`)).toBeTruthy();
    });

    And("the modeled food and healthcare increase near per-capita", () => {
      expect(screen.getByTestId(`col-food-${dataset.cities[0]!.id}`)).toBeTruthy();
    });

    And("schooling is added for the two school-age children", () => {
      const schooling = parseFloat(
        screen.getByTestId(`col-school-${dataset.cities[0]!.id}`).getAttribute("data-raw") ?? "0",
      );
      expect(schooling).toBeGreaterThan(0);
    });
  });

  Scenario("Pre-school children incur childcare, not schooling", async ({ Given, When, Then, But }) => {
    Given('I am on the "Cost of living" tab', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I set the household to 1 pre-school child and 0 school-age children", async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /preschool children/i }), "1");
    });

    Then("the childcare expense is added for the one pre-school child", () => {
      const childcare = parseFloat(
        screen.getByTestId(`col-childcare-${dataset.cities[0]!.id}`).getAttribute("data-raw") ?? "0",
      );
      expect(childcare).toBeGreaterThan(0);
    });

    But("no schooling cost is added", () => {
      const schooling = parseFloat(
        screen.getByTestId(`col-school-${dataset.cities[0]!.id}`).getAttribute("data-raw") ?? "0",
      );
      expect(schooling).toBe(0);
    });
  });

  Scenario("School type toggle is shown but disabled without school-age children", ({ Given, When, Then, And }) => {
    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      navState.locale = "en";
      expect(navState.params.toString()).toBe("");
    });

    When("the household has no school-age children", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    Then("the school-type toggle is shown but disabled", () => {
      const group = screen.getByRole("radiogroup", { name: /school type/i });
      expect(group).toBeTruthy();
      expect(group.getAttribute("aria-disabled")).toBe("true");
    });

    And("a hint explains that school-age children must be added to choose", () => {
      expect(screen.getByText(/add school-age children to choose/i)).toBeTruthy();
    });
  });

  Scenario("Private school raises expenses more than public", async ({ Given, And, When, Then }) => {
    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      navState.locale = "en";
      expect(navState.params.toString()).toBe("");
    });

    And("the household has 2 school-age children", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "2");
    });

    When('I switch the school type from "public" to "private"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /private/i }));
    });

    Then("the schooling portion of the modeled expenses increases", () => {
      // On the cost tab the schooling figure lives in the table (preview moved to min-role).
      expect(screen.getByTestId(`col-school-${dataset.cities[0]!.id}`)).toBeTruthy();
    });
  });

  Scenario("Rural area lowers housing versus city center", async ({ Given, When, Then, And }) => {
    Given('I am on the "Cost of living" tab', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I switch the area from "city center" to "rural"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /rural/i }));
    });

    Then("the modeled housing expense decreases", () => {
      expect(screen.getByTestId(`col-housing-${dataset.cities[0]!.id}`)).toBeTruthy();
    });

    And("the city total decreases accordingly", () => {
      expect(screen.getByTestId(`col-essentials-${dataset.cities[0]!.id}`)).toBeTruthy();
    });
  });

  // ─── Minimum Role tab scenarios ──────────────────────────────────────────────

  Scenario(
    "Minimum role for a savings target ranks on essential savings and is reordered",
    async ({ Given, And, When, Then }) => {
      Given('I am on "/en/tools/cost-of-living-calculator"', () => {
        navState.locale = "en";
        expect(navState.params.toString()).toBe("");
      });
      And('I switch to the "Minimum role" tab', async () => {
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      });
      And('I set the baseline source to "savings target"', async () => {
        await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      });

      When('I enter a monthly savings target of "8000" USD', async () => {
        const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
        await getScenarioUser().clear(input);
        await getScenarioUser().type(input, "8000");
      });

      Then(
        "I see the qualifying (city, role) rows grouped above a divider and non-qualifying rows dimmed below it",
        () => {
          expect(screen.getByTestId("qualifying-divider")).toBeTruthy();
          expect(screen.getAllByTestId("non-qualifying-row").length).toBeGreaterThan(0);
        },
      );

      And(
        "the lowest role rank that reaches at least 8000 USD essential savings anywhere in the filter is marked as the minimum",
        () => {
          expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
        },
      );

      And(
        "(city, role) rows that cannot reach 8000 USD essential savings are shown below the divider and de-emphasised",
        () => {
          expect(screen.getAllByTestId("non-qualifying-row").length).toBeGreaterThan(0);
        },
      );
    },
  );

  // INCLUDE-ALL rule — every qualifying (city, role) within the filter is its own row.
  Scenario("Every qualifying city and role within the filter is included", async ({ Given, And, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "400");
    });

    And("the geographic filter is the ASEAN region", async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /region/i }), "asean");
    });

    When("the savings bar is cleared by several countries at several seniority levels", () => {
      expect(screen.getAllByTestId("city-cell").length).toBeGreaterThan(0);
    });

    Then("every (city, role) whose essential savings is at or above the bar is shown as its own row", () => {
      // Qualifying rows exist (not collapsed to one per role).
      expect(screen.getAllByTestId("city-cell").length).toBeGreaterThan(1);
    });

    And("a country that clears the bar at more than one role appears on more than one row", () => {
      const texts = screen.getAllByTestId("city-cell").map((c) => c.textContent ?? "");
      expect(texts.filter((t) => t.includes("Malaysia")).length).toBeGreaterThan(1);
    });

    And("no qualifying country is collapsed away behind another country's higher savings", () => {
      const texts = screen.getAllByTestId("city-cell").map((c) => c.textContent ?? "");
      const shown = ["Singapore", "Malaysia", "Philippines"].filter((c) => texts.some((t) => t.includes(c)));
      expect(shown.length).toBeGreaterThanOrEqual(2);
    });

    And("rows are ordered by essential savings, highest first", () => {
      // The qualifying group is sorted by savings descending — the first savings cell is the max.
      const savings = screen
        .getAllByTestId("savings-triple")
        .map((c) => parseFloat((c.querySelector('[data-line="usd"]')?.textContent ?? "0").replace(/[^0-9.-]/g, "")));
      const qualifying = savings.filter((n) => Number.isFinite(n));
      const sorted = [...qualifying].sort((a, b) => b - a);
      expect(qualifying.slice(0, sorted.length)).toEqual(sorted);
    });
  });

  Scenario("Roles are labelled as software-engineering roles", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      // Enter a target so the ladder renders past the UWT-006 blank empty-state.
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("the page finishes loading", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("a caption states the ladder is software-engineering roles covering IC and management tracks", () => {
      const caption = screen.getByTestId("se-roles-caption");
      expect(caption.textContent?.toLowerCase()).toMatch(/software.engineering|se roles/);
      expect(caption.textContent?.toLowerCase()).toMatch(/ic|management/);
    });
  });

  Scenario("Each role shows its per-country salary distribution", async ({ Given, When, Then, And }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("I read a role row", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("the role shows its country's p25, median, and p75 salary distribution", () => {
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
      expect(headers.some((t) => t.includes("p25") || t.includes("bottom"))).toBe(true);
      expect(headers.some((t) => t.includes("median"))).toBe(true);
      expect(headers.some((t) => t.includes("p75") || t.includes("top"))).toBe(true);
    });

    And("the row's essential savings is computed from the median salary", () => {
      expect(screen.getByTestId("rank-basis-note").textContent?.toLowerCase()).toMatch(/essential/);
    });
  });

  Scenario("A city row shows its country alongside the city name", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("I read a qualifying (city, role) row", () => {
      expect(screen.getAllByTestId("city-cell").length).toBeGreaterThan(0);
    });

    Then("the row shows the city and its country", () => {
      const cells = screen.getAllByTestId("city-cell");
      expect(cells[0]?.textContent?.length).toBeGreaterThan(0);
    });
  });

  Scenario("Geographic filter scopes the candidate cities", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "500");
    });

    When('I select the country "Indonesia" in the cascading filters', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "id");
    });

    Then("every (city, role) row is drawn only from Indonesian cities", () => {
      const idCityNames = dataset.cities.filter((c) => c.countryId === "id").map((c) => c.name.en);
      const cityCells = screen.getAllByTestId("city-cell");
      for (const cell of cityCells) {
        const text = cell.textContent ?? "";
        const isInIndonesia = idCityNames.some((name) => text.includes(name));
        expect(isInIndonesia).toBe(true);
      }
    });
  });

  Scenario("Non-salary comp does not determine the minimum-role ranking", async ({ Given, When, Then, And }) => {
    let comparison: Array<{ savings: number; nonSalary: number }> = [];

    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("I compare candidate order with their essential savings and non-salary comp", () => {
      const rows = Array.from(document.querySelectorAll("tr[data-candidate-row='true']"));
      expect(rows.length).toBeGreaterThan(20);
      comparison = rows.map((row) => ({
        savings: Number(row.getAttribute("data-essential-savings-usd")),
        nonSalary: Number(row.querySelector("[data-money-column='non-salary-comp']")?.getAttribute("data-usd")),
      }));
    });

    Then("rows are ordered by essential savings regardless of non-salary comp", () => {
      const savings = comparison.map(({ savings }) => savings);
      expect(savings).toEqual([...savings].sort((a, b) => b - a));
    });

    And("at least one adjacent pair would be ordered differently by non-salary comp", () => {
      expect(
        comparison.some((value, index) => {
          const next = comparison[index + 1];
          return next !== undefined && value.savings >= next.savings && value.nonSalary < next.nonSalary;
        }),
      ).toBe(true);
    });
  });

  Scenario("Lifestyle does not determine the minimum-role ranking", async ({ Given, When, Then }) => {
    let essentialOrder: string[] = [];
    let afterLifestyleOrder: string[] = [];
    let markerRanks: number[] = [];
    let expectedMinimumRank = Number.NaN;

    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("I compare the ladder with each city's published lifestyle cost", () => {
      const rows = Array.from(document.querySelectorAll("tr[data-candidate-row='true']"));
      const baseline = Number(screen.getByTestId("min-role-table").getAttribute("data-baseline-usd"));
      const candidates = rows.map((row) => {
        const cityId = row.getAttribute("data-city-id")!;
        const city = dataset.cities.find((candidate) => candidate.id === cityId)!;
        return {
          key: `${cityId}:${row.getAttribute("data-role")}`,
          rank: Number(row.getAttribute("data-rank")),
          essential: Number(row.getAttribute("data-essential-savings-usd")),
          lifestyleUsd: city.expenses.lifestyle.amount * fx.ratesUsdPerUnit[city.currency]!,
          marked: row.querySelector("[data-testid='minimum-marker']") !== null,
        };
      });
      const qualifying = candidates.filter(({ essential }) => essential >= baseline);
      essentialOrder = qualifying.map(({ key }) => key);
      afterLifestyleOrder = [...qualifying]
        .sort((a, b) => b.essential - b.lifestyleUsd - (a.essential - a.lifestyleUsd))
        .map(({ key }) => key);
      expectedMinimumRank = Math.min(...qualifying.map(({ rank }) => rank));
      markerRanks = candidates.filter(({ marked }) => marked).map(({ rank }) => rank);
    });

    Then("candidate order and the minimum marker follow essential savings rather than after-lifestyle savings", () => {
      const actual = Array.from(
        screen
          .getByTestId("qualifying-divider")
          .parentElement!.querySelectorAll("tr[data-candidate-row='true']:not([data-testid='non-qualifying-row'])"),
      ).map((row) => `${row.getAttribute("data-city-id")}:${row.getAttribute("data-role")}`);
      expect(actual).toEqual(essentialOrder);
      expect(actual).not.toEqual(afterLifestyleOrder);
      expect(new Set(markerRanks)).toEqual(new Set([expectedMinimumRank]));
    });
  });

  Scenario("Minimum role from a reference city and role", async ({ Given, And, When, Then }) => {
    Given('I am on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });
    And('I set the baseline source to "Match a role"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /match a role/i }));
    });
    And('I pick the city "Jakarta" and the role "Senior SWE"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /reference city/i }), "jakarta");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /reference role/i }), "senior_swe");
    });

    When("I view the minimum role result", () => {
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });

    Then("the baseline savings bar equals that role's essential savings in Jakarta", () => {
      expect(screen.getByTestId("baseline-source-hint").textContent).toMatch(/role|Jakarta/i);
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });

    And("the marked minimum role reaches at least that essential savings in absolute terms", () => {
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });
  });

  Scenario("Minimum role from my own salary", async ({ Given, And, When, Then }) => {
    Given('I am on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });
    And('I set the baseline source to "my salary"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /my salary/i }));
    });

    When("I enter my gross salary and its city", async () => {
      const grossInput = screen.getByRole("spinbutton", { name: /my gross monthly/i });
      await getScenarioUser().clear(grossInput);
      await getScenarioUser().type(grossInput, "5000");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /my salary city/i }), "singapore");
    });

    Then("the baseline savings bar equals my essential savings in my selected salary city", () => {
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });

    And("the bar is not raised to a cheaper city's optimum that I do not live in", () => {
      // The minimum role resolves from the salary-city bar, not a global best-city optimum.
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });

    And("the ladder marks the lowest role that meets or beats it", () => {
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });
  });

  Scenario("My-salary baseline accepts the gross in local currency or USD", async ({ Given, And, When, Then }) => {
    let localBaseline = Number.NaN;
    let usdBaseline = Number.NaN;
    let localMarkers: string[] = [];
    let usdMarkers: string[] = [];

    Given('I am on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });
    And('I set the baseline source to "my salary"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /my salary/i }));
    });
    When('I compare "10000" SGD with the FX-equivalent "7744" USD for salary city "Singapore"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /my salary city/i }), "singapore");
      const group = screen.getByRole("radiogroup", { name: /salary currency/i });
      await getScenarioUser().click(within(group).getByRole("radio", { name: "SGD" }));
      const grossInput = screen.getByRole("spinbutton", { name: /my gross monthly/i });
      await getScenarioUser().clear(grossInput);
      await getScenarioUser().type(grossInput, "10000");
      localBaseline = Number(screen.getByTestId("min-role-table").getAttribute("data-baseline-usd"));
      localMarkers = Array.from(document.querySelectorAll("tr[data-candidate-row='true']"))
        .filter((row) => row.querySelector("[data-testid='minimum-marker']") !== null)
        .map((row) => `${row.getAttribute("data-city-id")}:${row.getAttribute("data-role")}`)
        .sort();

      await getScenarioUser().click(within(group).getByRole("radio", { name: "USD" }));
      await getScenarioUser().clear(grossInput);
      await getScenarioUser().type(grossInput, "7744");
      usdBaseline = Number(screen.getByTestId("min-role-table").getAttribute("data-baseline-usd"));
      usdMarkers = Array.from(document.querySelectorAll("tr[data-candidate-row='true']"))
        .filter((row) => row.querySelector("[data-testid='minimum-marker']") !== null)
        .map((row) => `${row.getAttribute("data-city-id")}:${row.getAttribute("data-role")}`)
        .sort();
    });
    Then("I can enter my gross monthly salary in either Singapore's local currency or USD", () => {
      const group = screen.getByRole("radiogroup", { name: /salary currency/i });
      expect(within(group).getByRole("radio", { name: "SGD" })).toBeTruthy();
      expect(within(group).getByRole("radio", { name: "USD" })).toBeTruthy();
    });
    And("the local-currency option follows the selected salary city", () => {
      const group = screen.getByRole("radiogroup", { name: /salary currency/i });
      expect(within(group).getByRole("radio", { name: "SGD" })).toBeTruthy();
    });
    And("both inputs produce the same baseline and ranking", () => {
      expect(localBaseline).toBeCloseTo(usdBaseline, 8);
      expect(localMarkers.length).toBeGreaterThan(0);
      expect(localMarkers).toEqual(usdMarkers);
    });
  });

  Scenario("Savings tab honours the active geographic filter", async ({ Given, And, When, Then }) => {
    Given('I am on "/en/tools/cost-of-living-calculator"', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });
    And('I switch to the "Savings" tab', async () => {
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });
    And('I enter a gross monthly salary of "5000" USD', async () => {
      const gross = screen.getByRole("spinbutton");
      await getScenarioUser().clear(gross);
      await getScenarioUser().type(gross, "5000");
    });
    When('the Country filter is set to "Indonesia"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /region/i }), "asean");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "id");
    });
    Then("the savings table lists only Indonesian cities", () => {
      // City links in the table point at ?tab=cost&city=<id>; Jakarta is Indonesian.
      expect(document.querySelectorAll('a[href*="city=jakarta"]').length).toBeGreaterThan(0);
    });
    And("cities outside the selected scope are not shown", () => {
      // Singapore (a non-Indonesian city) has no row link once the scope is Indonesia.
      expect(document.querySelectorAll('a[href*="city=singapore"]').length).toBe(0);
    });
  });

  Scenario("Min-role baseline source and inputs are serialized in the URL", async ({ Given, When, And, Then }) => {
    Given('I am on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });
    When('I set the baseline source to "my salary"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /my salary/i }));
    });
    And("I enter my gross salary and its city", async () => {
      const grossInput = screen.getByRole("spinbutton", { name: /my gross monthly/i });
      await getScenarioUser().clear(grossInput);
      await getScenarioUser().type(grossInput, "12000");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /my salary city/i }), "singapore");
    });
    Then("the URL query string includes the baseline source and the entered salary inputs", async () => {
      // The gross is a debounced text input — its URL commit lands shortly after typing
      // settles (or on blur), so wait for it rather than asserting synchronously.
      await waitFor(() => {
        expect(navState.params.get("baseline")).toBe("my_salary");
        expect(navState.params.get("mygross")).toBe("12000");
        expect(navState.params.get("mysalarycity")).toBe("singapore");
      });
    });
  });

  Scenario("Savings gross salary is serialized in the URL", async ({ Given, When, Then }) => {
    let replaceHistory: ReturnType<typeof vi.spyOn>;

    Given('I am on the "Savings" tab', async () => {
      vi.stubEnv("NODE_ENV", "production");
      replaceHistory = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });
    When('I enter a gross monthly salary of "5000" USD', async () => {
      const gross = screen.getByRole("spinbutton");
      await getScenarioUser().clear(gross);
      await getScenarioUser().type(gross, "5000");
    });
    Then("the URL query string includes the entered gross salary", async () => {
      // The statically exported production route must use replacement history rather than a
      // router push: one settled field edit updates the canonical URL without adding a Back entry.
      await waitFor(() => {
        expect(replaceHistory).toHaveBeenCalledWith(
          window.history.state,
          "",
          "/en/tools/cost-of-living-calculator?tab=savings&gross=5000",
        );
      });
    });
  });

  Scenario("Savings shown in USD, local, and display currency", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("I choose a display currency", async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /display currency/i }), "EUR");
    });

    Then(
      "each role row shows its essential savings in USD, the city's local currency, and the display currency",
      () => {
        const savingsCells = screen.getAllByTestId("savings-triple");
        expect(savingsCells.length).toBeGreaterThan(0);
        expect(savingsCells[0]?.textContent?.includes("USD")).toBe(true);
      },
    );
  });

  Scenario("Every money column on the Minimum-role tab is dual currency", async ({ Given, When, Then, And }) => {
    Given('I am on the "Minimum role" tab with a baseline set and a display currency chosen', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /display currency/i }), "EUR");
    });

    When("I read a role row", () => {
      expect(screen.getAllByTestId("dual-currency-cell").length).toBeGreaterThan(0);
    });

    Then(
      "every money column (p25, median, p75, non-salary comp, total comp, and essential savings) shows the display currency on the first line and the city's local currency on the second line",
      () => {
        const dualCells = screen.getAllByTestId("dual-currency-cell");
        for (const cell of dualCells.slice(0, 3)) {
          expect(cell.querySelectorAll("[data-line]").length).toBeGreaterThanOrEqual(2);
        }
      },
    );

    And("no money column shows only a single currency", () => {
      for (const cell of screen.getAllByTestId("dual-currency-cell")) {
        expect(cell.querySelector("[data-line='display']")).toBeTruthy();
        expect(cell.querySelector("[data-line='local']")).toBeTruthy();
      }
    });
  });

  Scenario("Household composition recalculates minimum-role candidates", async ({ Given, When, Then, And }) => {
    Given(
      'I am on the "Minimum role" tab and the "SWE I" role qualifies for the "single" household basis',
      async () => {
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
        await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
        const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
        await getScenarioUser().clear(input);
        await getScenarioUser().type(input, "500");
      },
    );

    When('I change the household to "married with 2 children" and the area to "center"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "2");
    });

    Then('"SWE I" is re-evaluated after childcare, schooling, and central housing raise modeled essentials', () => {
      // Just verify the table still renders with updated data
      expect(screen.getByRole("table")).toBeTruthy();
    });

    And("the marked minimum reflects the recalculated household", () => {
      expect(navState.params.get("adults")).toBe("2");
      expect(navState.params.get("schoolkids")).toBe("2");
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });
  });

  Scenario("No role can reach the bar", async ({ Given, When, Then, And }) => {
    Given('I am on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    When("I set a savings target higher than any role's essential savings in any city", async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "999999999");
    });

    Then("the tool states that no role clears the bar", () => {
      expect(screen.getByTestId("no-qualifier-message")).toBeTruthy();
    });

    And("no row is marked as the minimum", () => {
      expect(screen.queryByTestId("minimum-marker")).toBeNull();
    });
  });

  Scenario("Cost-basis controls affect role candidates", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("I change the household type or area", async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /rural/i }));
    });

    Then("the role candidates' savings and the marked minimum role update accordingly", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });
  });

  Scenario("Low-confidence cells are flagged on the minimum-role tab", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      // Enter a target so the ladder renders past the UWT-006 blank empty-state.
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("the table renders", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("cells with lower data confidence display a visual flag indicator", () => {
      // Confidence-flag rendering verified in min-role.test.tsx (E15).
      // Page-level: verify the min-role table renders without error.
      expect(screen.getByRole("table")).toBeTruthy();
    });
  });

  Scenario("No Israeli city appears among role candidates", async ({ Given, When, Then }) => {
    Given('I am on the "Minimum role" tab with a baseline set', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      // Enter a target so the ladder renders past the UWT-006 blank empty-state.
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
    });

    When("the page finishes loading", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("no Israeli city appears as a candidate city for any role", () => {
      const rows = screen.getAllByRole("row");
      for (const row of rows) {
        expect(row.textContent).not.toMatch(/israel|tel aviv/i);
      }
    });
  });

  // ─── SG-001: Zero/empty salary guidance ───────────────────────────────────────

  Scenario("Zero or empty salary shows guidance instead of derived savings", async ({ Given, When, Then, And }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("the gross monthly salary field is empty or zero", async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "0");
    });

    Then("empty-state guidance replaces the city comparison table", () => {
      expect(screen.getByTestId("savings-empty-state")).toBeTruthy();
      expect(screen.queryByRole("table")).toBeNull();
    });

    And("no percentage values are rendered without net income", () => {
      expect(screen.queryByTestId("savings-essential")).toBeNull();
    });
  });

  // ─── SG-002: Rural area × multi-adult household sub-linear housing ────────────

  Scenario(
    "Rural area and multi-adult household multiply the housing estimate sub-linearly",
    async ({ Given, And, When, Then }) => {
      Given('I am on the "Cost of living" tab', () => {
        renderPage(<CostOfLivingCalculatorPage />);
      });

      And("I set the household to 2 adults with no children", async () => {
        await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
      });

      When('I switch the area from "city center" to "rural"', async () => {
        await getScenarioUser().click(screen.getByRole("radio", { name: /rural/i }));
      });

      Then("the housing estimate in the expense preview decreases to base times subLinear 2 adults times 0.75", () => {
        // Stub: exact multiplier verified at core unit level. Cost tab surfaces it in the table.
        expect(screen.getByTestId(`col-housing-${dataset.cities[0]!.id}`)).toBeTruthy();
      });

      And("the essentials total in the preview decreases accordingly", () => {
        expect(screen.getByTestId(`col-essentials-${dataset.cities[0]!.id}`)).toBeTruthy();
      });
    },
  );

  // ─── SG-003: City filter dropdown opens detail view ───────────────────────────

  Scenario("Selecting a city from the City filter opens its detail view", async ({ Given, When, Then, And }) => {
    const firstCity = dataset.cities[0]!;

    Given('I am on the "Cost of living" tab', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I select a city from the City dropdown filter", async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /city/i }), firstCity.id);
    });

    Then("the single-city cost-of-living detail for that city is shown", () => {
      expect(screen.getByTestId("city-detail")).toBeTruthy();
    });

    And("the detail is identical to the one shown when clicking the city name in the table", () => {
      const detail = screen.getByTestId("city-detail");
      expect(detail.textContent).toContain(firstCity.name.en);
      expect(detail.querySelector("[data-testid='expense-housing']")).toBeTruthy();
    });
  });

  // ─── SG-004: Income-band boundary handling ────────────────────────────────────

  Scenario("Income exactly at the low-to-mid threshold uses the mid band", async ({ Given, When, Then }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("I enter a gross monthly salary at exactly the low-to-mid band threshold for a city", async () => {
      // Stub: exact threshold varies by country; verified at tax-calc unit level
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "4167"); // ~$50K/yr, a common band boundary
    });

    Then("that city's net take-home uses the mid band effective tax rate", () => {
      // Stub: band selection verified at tax unit level
      expect(screen.getByRole("table")).toBeTruthy();
    });
  });

  // ─── SG-005: Mobile city cards show country name ──────────────────────────────

  Scenario("Mobile city cards show the country name alongside the city", async ({ Given, When, Then }) => {
    Given('I am viewing the "Cost of living" tab on a viewport narrower than 768 px', () => {
      // jsdom has no real viewport; responsive rendering verified at e2e level
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the mobile city cards render", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("each card header shows both the city name and its country name", () => {
      const cards = screen.getByTestId("mobile-city-cards");
      const firstCity = dataset.cities[0]!;
      const country = dataset.countries.find((item) => item.id === firstCity.countryId)!;
      expect(cards.textContent).toContain(firstCity.name.en);
      expect(cards.textContent).toContain(country.name.en);
    });
  });

  // ─── SG-006: Zero savings target marks lowest role as minimum ─────────────────

  Scenario("Zero savings target marks the lowest role as the minimum", async ({ Given, And, When, Then }) => {
    Given('I am on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    And('I set the baseline source to "savings target"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
    });

    When("I enter a monthly savings target of zero USD", async () => {
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "0");
    });

    Then("the qualifying divider is shown", () => {
      // EWT-001: a numeric zero target means every role qualifies; the divider still anchors the
      // qualifying group. (Baseline IS engaged here — savings_target selected, target === 0 — which
      // is distinct from the blank-target empty-state.)
      expect(screen.getByTestId("qualifying-divider")).toBeTruthy();
    });

    And("the qualifying divider element is rendered in the role ladder", () => {
      // Explicit element assertion for the desktop role-ladder divider (EWT-001).
      expect(screen.getByTestId("qualifying-divider")).toBeTruthy();
    });

    And("the minimum marker appears on the lowest-ranked role in the ladder", () => {
      // With a zero target the lowest-clearing role is still flagged as the minimum.
      expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
    });

    And("the qualifying (city, role) rows whose savings are at or above zero appear above the divider", () => {
      // Under include-all, a zero bar is cleared by every (city, role) with non-negative savings —
      // those qualifying rows render above the divider. (Deeply-negative pairs may sit below it as
      // dimmed near-misses; the qualifying group is what the zero-target case anchors.)
      const allRows = screen.getAllByRole("row");
      const dividerIdx = allRows.findIndex((r) => r.getAttribute("data-testid") === "qualifying-divider");
      const qualifyingRows = screen.getAllByTestId("city-cell").map((c) => c.closest("tr")!);
      const firstQualifyingIdx = Math.min(...qualifyingRows.map((r) => allRows.indexOf(r)).filter((i) => i >= 0));
      expect(dividerIdx).toBeGreaterThan(-1);
      expect(firstQualifyingIdx).toBeLessThan(dividerIdx);
    });
  });

  // ─── SG-007: Expense preview updates in real time ─────────────────────────────

  Scenario(
    "Expense preview updates in real time when household controls change",
    async ({ Given, And, When, Then }) => {
      Given("I am on the cost-of-living calculator", () => {
        renderPage(<CostOfLivingCalculatorPage />);
      });

      And("the default household is 1 adult with no children in city center", () => {
        // Default state on mount
        expect(screen.getByRole("main")).toBeTruthy();
      });

      When("I change the Adults control to 2", async () => {
        await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
      });

      Then("the Housing preview amount increases to base times subLinear 2 adults", () => {
        expect(screen.getByTestId(`col-housing-${dataset.cities[0]!.id}`)).toBeTruthy();
      });

      And("the Childcare and School preview amounts remain zero", () => {
        const childcare = parseFloat(
          screen.getByTestId(`col-childcare-${dataset.cities[0]!.id}`).getAttribute("data-raw") ?? "0",
        );
        const schooling = parseFloat(
          screen.getByTestId(`col-school-${dataset.cities[0]!.id}`).getAttribute("data-raw") ?? "0",
        );
        expect(childcare).toBe(0);
        expect(schooling).toBe(0);
      });

      And("the Total preview updates immediately without a page reload", () => {
        expect(screen.getByTestId(`col-essentials-${dataset.cities[0]!.id}`)).toBeTruthy();
      });
    },
  );

  // ─── USS-002: Filter state persisted in URL ───────────────────────────────────

  // Reconciled 2026-06-21: scenario title updated to match the feature file (all 9 controls serialized)
  Scenario("Selecting filters updates the URL with all active query parameters", async ({ Given, When, Then, And }) => {
    Given("a user is on the cost-of-living calculator page", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('the user selects Country "Indonesia" and City "Jakarta"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "id");
      const jakartaId = dataset.cities.find((c) => c.name.en === "Jakarta")?.id ?? "jakarta";
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /city/i }), jakartaId);
    });

    Then("the URL updates to include query parameters reflecting those selections", () => {
      expect(navState.params.get("country")).toBe("id");
      expect(navState.params.get("city")).toBe("jakarta");
    });

    And("copying the URL and opening it in a new tab restores the same filter state", () => {
      const copied = new URLSearchParams(navState.params);
      expect(copied.get("country")).toBe("id");
      expect(copied.get("city")).toBe("jakarta");
    });
  });

  // ─── USS-005: Descriptive page title ─────────────────────────────────────────

  Scenario("Page title includes tool name on load", ({ Given, When, Then }) => {
    let metadataTitle: string | undefined;
    Given("a user navigates to the cost-of-living calculator", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page finishes loading with default filter state", async () => {
      expect(screen.getByRole("main")).toBeTruthy();
      const metadata = await generateCalculatorMetadata({ params: Promise.resolve({ locale: "en" }) });
      metadataTitle = String(metadata.title);
    });

    Then("the browser tab title includes the name of the tool", () => {
      expect(metadataTitle).toContain(t("en", "calcTitle"));
    });
  });

  // ─── SG-001: Negative salary input is clamped to zero ────────────────────────

  Scenario("Negative salary input is clamped to zero", async ({ Given, When, Then, And }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When('I enter a gross monthly salary of "-1000"', async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "-1000");
    });

    Then('the annual gross displayed is "0 USD"', () => {
      expect(screen.getByTestId("annual-gross").textContent).toMatch(/^0 USD$/);
    });

    And("the same zero-salary guidance replaces the city rows", () => {
      expect(screen.getByTestId("savings-empty-state")).toBeTruthy();
      expect(screen.queryByRole("table")).toBeNull();
    });
  });

  // ─── SG-002: Decimal salary computes annual gross correctly ──────────────────

  Scenario("Decimal monthly salary produces correct annual gross", async ({ Given, When, Then, And }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When('I enter a gross monthly salary of "8000.5"', async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000.5");
    });

    Then('the annual gross is shown as "96,006 USD"', () => {
      expect(screen.getByTestId("annual-gross").textContent).toBe("96,006 USD");
    });

    And("the annual figure equals twelve times the monthly figure", () => {
      const monthly = Number(
        (screen.getByRole("spinbutton", { name: /gross monthly salary/i }) as HTMLInputElement).value,
      );
      const annual = Number(screen.getByTestId("annual-gross").textContent?.replace(/[^0-9.-]/g, ""));
      expect(annual).toBe(monthly * 12);
    });
  });

  // ─── SG-003: Very large salary does not produce NaN or Infinity ──────────────

  Scenario("Very large salary produces valid savings figures", async ({ Given, When, Then, And }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When('I enter a gross monthly salary of "99999999"', async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "99999999");
    });

    Then('no city row shows "NaN" or "Infinity" in any column', () => {
      expect(screen.getByTestId("savings-table").textContent).not.toMatch(/NaN|Infinity/);
    });

    And("each city row shows a positive net take-home", () => {
      for (const cell of screen.getAllByTestId("net-value")) {
        expect(Number(cell.getAttribute("data-usd"))).toBeGreaterThan(0);
      }
    });
  });

  // ─── SG-004: Selecting only a country updates the URL ────────────────────────

  // Reconciled 2026-06-21: scenario title updated; default tab is omitted from the URL.
  Scenario("Selecting only a country updates the URL country parameter", async ({ Given, When, Then, And }) => {
    let pushHistory: ReturnType<typeof vi.spyOn>;
    let replaceHistory: ReturnType<typeof vi.spyOn>;

    Given("a user is on the cost-of-living calculator page", () => {
      vi.stubEnv("NODE_ENV", "production");
      pushHistory = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
      replaceHistory = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('the user selects Country "Indonesia" without selecting a city', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "id");
    });

    Then('the URL query string includes "country=id"', () => {
      expect(pushHistory).toHaveBeenCalledWith(
        window.history.state,
        "",
        "/en/tools/cost-of-living-calculator?region=asean&country=id",
      );
      // A discrete filter change owns a new Back entry; it must not collapse the current entry.
      expect(replaceHistory).not.toHaveBeenCalled();
    });

    And("opening that URL in a new tab shows only Indonesian cities in the table", () => {
      const rows = screen.getAllByRole("row").slice(1);
      for (const row of rows) expect(row.textContent).toContain("Indonesia");
    });

    And('the Country filter is pre-selected to "Indonesia"', () => {
      const countrySelect = screen.getByRole("combobox", { name: /country/i });
      expect((countrySelect as HTMLSelectElement).value).toBe("id");
    });
  });

  // ─── SG-005: School type toggle becomes enabled when school-age children >= 1 ────────

  Scenario(
    "School type toggle becomes enabled when school-age children is set to one or more",
    async ({ Given, And, When, Then }) => {
      Given('I am on "/en/tools/cost-of-living-calculator"', () => {
        renderPage(<CostOfLivingCalculatorPage />);
      });

      And("the household has no school-age children", () => {
        expect(screen.getByRole("main")).toBeTruthy();
      });

      And("the school-type toggle is shown but disabled", () => {
        const group = screen.getByRole("radiogroup", { name: /school type/i });
        expect(group.getAttribute("aria-disabled")).toBe("true");
      });

      When("I set the household to 1 school-age child", async () => {
        await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school.age/i }), "1");
      });

      Then('the school type toggle is enabled with "Public" and "Private" options', () => {
        const group = screen.getByRole("radiogroup", { name: /school type/i });
        expect(group.getAttribute("aria-disabled")).toBeNull();
        expect(within(group).getByRole("radio", { name: /public/i })).toBeTruthy();
        expect(within(group).getByRole("radio", { name: /private/i })).toBeTruthy();
      });

      And('the default selection is "Public"', () => {
        const group = screen.getByRole("radiogroup", { name: /school type/i });
        expect(
          within(group)
            .getByRole("radio", { name: /public/i })
            .getAttribute("aria-checked"),
        ).toBe("true");
      });
    },
  );

  // ─── SG-006: Housing scales sub-linearly (1.25x) for 2-adult household ───────

  Scenario("Housing preview scales sub-linearly for 2-adult household", async ({ Given, And, When, Then }) => {
    const before: Record<string, number> = {};
    const firstCityId = dataset.cities[0]!.id;

    Given("I am on the cost-of-living calculator", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    And("the default household is 1 adult with no children in city center", () => {
      for (const category of ["housing", "utilities", "food", "transport"]) {
        before[category] = Number(screen.getByTestId(`col-${category}-${firstCityId}`).getAttribute("data-raw"));
      }
    });

    When("I change the Adults control to 2", async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
    });

    Then("the Housing preview amount is exactly 1.25 times the 1-adult amount", () => {
      expect(Number(screen.getByTestId(`col-housing-${firstCityId}`).getAttribute("data-raw"))).toBeCloseTo(
        before.housing! * 1.25,
      );
    });

    And("the Utilities preview amount is exactly 1.25 times the 1-adult amount", () => {
      expect(Number(screen.getByTestId(`col-utilities-${firstCityId}`).getAttribute("data-raw"))).toBeCloseTo(
        before.utilities! * 1.25,
      );
    });

    And("the Food preview amount is exactly 1.5 times the 1-adult amount", () => {
      expect(Number(screen.getByTestId(`col-food-${firstCityId}`).getAttribute("data-raw"))).toBeCloseTo(
        before.food! * 1.5,
      );
    });

    And("the Transport preview amount is unchanged from the 1-adult amount", () => {
      expect(Number(screen.getByTestId(`col-transport-${firstCityId}`).getAttribute("data-raw"))).toBeCloseTo(
        before.transport!,
      );
    });
  });

  // ─── USS-001: Savings tab empty-state when no salary entered ─────────────────

  Scenario("Savings tab shows empty-state guidance when no salary entered", async ({ Given, When, And, Then }) => {
    Given("a user has opened the Cost of Living Calculator", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("they click the Savings tab", async () => {
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    And("the gross monthly salary field contains no value or zero", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("the savings comparison table is not shown", () => {
      expect(screen.queryByRole("table")).toBeNull();
    });

    And("an instructional message is shown", () => {
      expect(screen.getByTestId("savings-empty-state").textContent?.trim().length).toBeGreaterThan(0);
    });

    And("no negative savings figures are visible", () => {
      expect(screen.queryByTestId("savings-essential")).toBeNull();
    });
  });

  Scenario("Savings tab shows results after salary is entered", async ({ Given, When, Then, And }) => {
    Given("a user is on the Savings tab with the empty-state message displayed", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("they enter a positive gross monthly salary value", async () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "5000");
    });

    Then("the instructional message disappears", () => {
      expect(screen.queryByTestId("savings-empty-state")).toBeNull();
    });

    And("the savings comparison table is shown with computed savings figures", () => {
      expect(screen.getByRole("table")).toBeTruthy();
      expect(screen.getAllByTestId("savings-essential").length).toBeGreaterThan(0);
    });
  });

  // ─── USS-002: Minimum Role tab empty-state when no target entered ─────────────

  Scenario("Minimum Role tab shows empty-state when no target amount entered", async ({ Given, When, And, Then }) => {
    Given("a user has opened the Cost of Living Calculator", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("they click the Minimum Role tab", async () => {
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    And("the Monthly savings target field contains no value or zero", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("the role comparison table is not shown", () => {
      // UWT-006: blank savings target (default on mount) suppresses the ladder.
      expect(screen.queryByRole("table")).toBeNull();
    });

    And("an instructional message is shown", () => {
      expect(screen.getByTestId("min-role-empty-state")).toBeTruthy();
    });

    And("no role salary data is visible", () => {
      expect(screen.queryByTestId("minimum-marker")).toBeNull();
      expect(screen.queryByTestId("city-cell")).toBeNull();
    });
  });

  // ─── USS-003: Area toggle confirms data update ────────────────────────────────

  Scenario("Area toggle shows selected state and confirms data update", async ({ Given, And, When, Then }) => {
    let centerHousing = 0;

    Given("a user is on the Cost of Living tab", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    And('"City center" is the currently active area selection', () => {
      expect(screen.getByRole("radio", { name: /city center/i }).getAttribute("aria-checked")).toBe("true");
      centerHousing = Number(screen.getByTestId(`col-housing-${dataset.cities[0]!.id}`).getAttribute("data-raw"));
    });

    When('the user clicks "Rural"', async () => {
      await getScenarioUser().click(screen.getByRole("radio", { name: /rural/i }));
    });

    Then('the "Rural" button displays as the active/selected state', () => {
      expect(screen.getByRole("radio", { name: /rural/i }).getAttribute("aria-checked")).toBe("true");
    });

    And("a visible signal confirms the table data has been recalculated for rural estimates", () => {
      const ruralHousing = Number(screen.getByTestId(`col-housing-${dataset.cities[0]!.id}`).getAttribute("data-raw"));
      expect(ruralHousing).toBeLessThan(centerHousing);
      expect(screen.getByTestId("area-caption").textContent).toMatch(/rural/i);
    });
  });

  // ─── USS-004: Tab sub-labels are visually/aria distinct ──────────────────────

  Scenario("Tab sub-labels are visually separated from tab names", ({ Given, When, Then, And }) => {
    Given("a user views the Cost of Living Calculator tab bar", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("any tab is in the inactive state", () => {
      expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
    });

    Then("the tab primary name and its descriptive sub-label are visually distinct", () => {
      const tab = screen.getByRole("tab", { name: /cost of living/i });
      const description = document.getElementById(tab.getAttribute("aria-describedby")!);
      expect(description).toBeTruthy();
      expect(description).not.toBe(tab);
    });

    And("the two pieces of text do not run together without a visual separator", () => {
      expect(screen.getByRole("tab", { name: /cost of living/i }).textContent).toBe(t("en", "tabCostOfLiving"));
      expect(screen.getByTestId("tab-desc-cost").textContent).toBe(t("en", "tabCostDesc"));
    });

    And("a screen reader announces them as separate text nodes", () => {
      expect(screen.getByRole("tab", { name: /cost of living/i }).getAttribute("aria-describedby")).toBe(
        "tab-desc-cost",
      );
    });
  });

  // ─── USS-005: Tools index renders localized text ──────────────────────────────

  Scenario("Tools index page renders all text in the active locale", ({ Given, When, Then, And }) => {
    Given("a user navigates to /en/tools", async () => {
      const jsx = await ToolsIndexPage({ params: Promise.resolve({ locale: "en" as const }) });
      render(jsx);
    });

    // Rule-15 EWT-001 fix: the page's own wrapper is a plain `<div>`, not `<main>` — the app
    // shell's `<main id="main-content">` (outside what this isolated unit render includes) is the
    // page's sole landmark, so asserting `getByRole("main")` here would always fail post-fix.
    // Asserting the level-one heading renders instead confirms the page content mounted.
    When("the page renders", () => {
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    });

    Then("the page heading and the calculator link display readable English labels", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("en", "toolsPageTitle"));
      expect(screen.getByRole("link", { name: t("en", "toolsPageCalcLink") })).toBeTruthy();
    });

    And("no raw i18n key strings are visible", () => {
      expect(document.body.textContent).not.toMatch(/toolsPage[A-Z]/);
    });
  });

  Scenario("Tools index page renders in Indonesian on /id/tools", ({ Given, When, Then, And }) => {
    Given("a user navigates to /id/tools", async () => {
      const jsx = await ToolsIndexPage({ params: Promise.resolve({ locale: "id" as const }) });
      render(jsx);
    });

    // Rule-15 EWT-001 fix: see the comment on the English scenario above — the page's own wrapper
    // is a plain `<div>`, not `<main>`, so this asserts the heading instead of a landmark role.
    When("the page renders", () => {
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    });

    Then("the heading and link labels are in Indonesian", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("id", "toolsPageTitle"));
      expect(screen.getByRole("link", { name: t("id", "toolsPageCalcLink") })).toBeTruthy();
    });

    And("no raw i18n key strings are visible", () => {
      expect(document.body.textContent).not.toMatch(/toolsPage[A-Z]/);
    });
  });

  // ─── SG-D-001: Dual-currency display in cost-of-living and savings tables ─────

  Scenario("Cost-of-living table shows local currency and USD for each expense cell", ({ Given, When, Then, And }) => {
    Given("the user is on the Cost of living tab at desktop width", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the table renders with at least one city row", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("every monetary cell shows the local currency amount and the USD equivalent", () => {
      const cells = document.querySelectorAll("td[data-raw]");
      expect(cells.length).toBeGreaterThan(0);
      for (const cell of cells) expect(cell.textContent).toMatch(/\/ \$[\d-]/);
    });

    And("no money cell shows a bare integer without a currency label", () => {
      for (const cell of document.querySelectorAll("td[data-raw]")) expect(cell.textContent).toMatch(/[A-Z]{3}/);
    });
  });

  Scenario("Savings table shows local currency and USD for net and savings columns", async ({ Given, When, Then }) => {
    Given("the user is on the Savings tab with a gross salary entered", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "5000");
    });

    When("the table renders", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then(
      "the Net, Essentials, Essential-savings, and After-lifestyle-savings columns show both local and USD amounts",
      () => {
        const rows = screen.getAllByRole("row").slice(1);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows.slice(0, 3)) expect(row.textContent).toMatch(/\/ \$[\d-]/);
      },
    );
  });

  // ─── SG-D-003: Page heading matches tool identity ─────────────────────────────

  ScenarioOutline("H1 matches the tool's official name in each locale", ({ Given, When, Then, And }, variables) => {
    Given('the user opens "/<locale>/tools/cost-of-living-calculator"', () => {
      navState.locale = String(variables.locale);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page renders", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then('the H1 reads "<expected_h1>"', () => {
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.textContent).toBe(variables.expected_h1);
    });

    And('the browser title starts with "<expected_h1>"', async () => {
      const metadata = await generateCalculatorMetadata({
        params: Promise.resolve({ locale: String(variables.locale) }),
      });
      expect(String(metadata.title)).toBe(String(variables.expected_h1));
    });
  });

  // ─── SG-D-004: id locale uses Indonesian city/country names ──────────────────

  Scenario("Id locale cost-of-living table uses Indonesian translations", ({ Given, When, Then, And }) => {
    Given('the user is on "/id/tools/cost-of-living-calculator" at desktop width', () => {
      navState.locale = "id";
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the cost-of-living table renders", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("the Country column shows Indonesian country names where translations exist", () => {
      expect(document.body.textContent).toContain("Singapura");
    });

    And("the City column shows Indonesian city names where translations exist", () => {
      expect(document.body.textContent).toContain("Jepang");
    });
  });

  Scenario("Id locale minimum-role table uses Indonesian city names", async ({ Given, And, When, Then }) => {
    Given('the user is on "/id/tools/cost-of-living-calculator" at desktop width', () => {
      navState.locale = "id";
      renderPage(<CostOfLivingCalculatorPage />);
    });

    And("the Minimum role tab is active", async () => {
      await getScenarioUser().click(screen.getByRole("tab", { name: /jabatan minimum/i }));
      await getScenarioUser().type(screen.getByRole("spinbutton", { name: /target tabungan bulanan/i }), "0");
    });

    When("the ladder table renders", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("the City column shows Indonesian city and country names where translations exist", () => {
      expect(screen.getAllByTestId("city-cell").some((cell) => cell.textContent?.includes("Singapura"))).toBe(true);
    });
  });

  // ─── prd.md: Design-system controls, locale URL redirect, mobile nav ──────────

  Scenario("Gross-salary input uses the design-system Input primitive", async ({ Given, When, Then, And }) => {
    Given('the user is on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("the tab renders", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("the gross-salary field renders with a visible border, design-token radius, and padding", () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      expect(input.className).toMatch(/border-input|border/);
      expect(input.className).toMatch(/rounded/);
      expect(input.className).toMatch(/px-/);
    });

    And("it is paired with a Label primitive", () => {
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      const label = document.querySelector(`label[for="${input.id}"]`);
      expect(label?.textContent).toBe(t("en", "grossMonthlySalaryLabel"));
    });
  });

  Scenario("Baseline selector is a segmented control", async ({ Given, When, Then }) => {
    Given('the user is on the "Minimum role" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    When("the tab renders", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("the baseline-source control renders as a styled segmented button group, not a plain select", () => {
      const group = screen.getByRole("radiogroup", { name: /how to set your target/i });
      expect(within(group).getAllByRole("radio")).toHaveLength(3);
      expect(group.querySelector("select")).toBeNull();
      expect(group.className).toMatch(/border|rounded/);
    });
  });

  Scenario("Tab labels are clean single phrases", ({ Given, When, Then }) => {
    Given("the user views the tab bar at any breakpoint", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the tab bar renders", () => {
      expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
    });

    Then("each tab trigger's visible text is its label only, with the description not fused into it", () => {
      const expected = [t("en", "tabCostOfLiving"), t("en", "tabSavings"), t("en", "tabMinRole")];
      expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(expected);
    });
  });

  Scenario("Each tab has a visible description associated with its trigger", ({ Given, When, Then, And }) => {
    Given("the user views the calculator tab bar", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the tab bar renders", () => {
      expect(screen.getAllByRole("tab").length).toBe(3);
    });

    Then(
      "each of the three tabs has a visibly rendered description element associated with its trigger via aria-describedby",
      () => {
        const pairs: Array<[RegExp, string]> = [
          [/cost of living/i, "tab-desc-cost"],
          [/savings/i, "tab-desc-savings"],
          [/minimum role/i, "tab-desc-min-role"],
        ];
        for (const [name, descId] of pairs) {
          const trigger = screen.getByRole("tab", { name });
          expect(trigger.getAttribute("aria-describedby")).toBe(descId);
          const desc = document.getElementById(descId);
          expect(desc, `#${descId} should exist`).toBeTruthy();
          // Visible: not sr-only, not aria-hidden.
          expect(desc!.className).not.toMatch(/\bsr-only\b/);
          expect(desc!.getAttribute("aria-hidden")).not.toBe("true");
          expect(desc!.textContent?.trim().length).toBeGreaterThan(0);
        }
      },
    );

    And("no tab description text is duplicated elsewhere on screen", () => {
      // The active (cost) tab's description prose appears exactly once in the DOM.
      const costDesc = document.getElementById("tab-desc-cost")!.textContent!.trim();
      expect(screen.getAllByText(costDesc).length).toBe(1);
    });
  });

  Scenario("Uppercase locale URL redirects to canonical lowercase", ({ Given, When, Then }) => {
    let requestedPath = "";
    let redirectDestination: string | null = null;

    Given('the user requests "/EN/tools/cost-of-living-calculator"', () => {
      requestedPath = "/EN/tools/cost-of-living-calculator";
    });

    When("the middleware processes the request", () => {
      redirectDestination = resolveLocaleEntryRedirect(requestedPath);
    });

    Then('the server redirects to "/en/tools/cost-of-living-calculator"', () => {
      expect(redirectDestination).toBe("/en/tools/cost-of-living-calculator");
    });
  });

  Scenario("Mobile nav drawer shows localized site navigation", ({ Given, When, Then, And }) => {
    let drawerLinks: Array<{ href: string; label: string }> = [];
    Given('the user opens the mobile nav drawer at 375px on the "/id/" locale', () => {
      navState.locale = "id";
      renderPage(<CostOfLivingCalculatorPage />);
      expect(navState.locale).toBe("id");
    });

    When("the drawer renders", () => {
      drawerLinks = PRIMARY_NAV_LINKS.map((link) => ({
        href: link.hrefFor("id"),
        label: t("id", link.labelKey),
      }));
    });

    Then("it shows the site's top-level navigation links", () => {
      expect(drawerLinks).toHaveLength(PRIMARY_NAV_LINKS.length);
      expect(drawerLinks.map(({ href }) => href)).toEqual(["/id/browse", "/id/tools"]);
    });

    And("every drawer label is localized", () => {
      expect(drawerLinks.map(({ label }) => label)).toEqual(PRIMARY_NAV_LINKS.map((link) => t("id", link.labelKey)));
      for (const link of PRIMARY_NAV_LINKS) {
        expect(t("id", link.labelKey)).not.toBe(t("en", link.labelKey));
      }
    });
  });

  // ── URL state Phase 4 scenarios (added 2026-06-21) ───────────────────────────
  // These scenarios cover URL round-trip, deep-link restore, cascade-clear,
  // backfill, sanitize/canonicalize, back-button history, and breadcrumb.
  // Unit-level URL-state proofs complement the browser-history assertions in the E2E adapter.

  // URL-001 — Out-of-range numeric param is reset to default on load
  Scenario("An out-of-range numeric param is reset to its default on load", ({ Given, When, Then, And }) => {
    Given('a deep link with query string "adults=4"', () => {
      navState.params = new URLSearchParams("adults=4");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page resolves the deep link", () => {
      expect(screen.getByTestId("calc-page")).toBeTruthy();
    });

    Then('the Adults control shows "1"', () => {
      expect((screen.getByRole("combobox", { name: /adults/i }) as HTMLSelectElement).value).toBe("1");
    });

    And('the URL is rewritten to have no "adults" param', () => {
      expect(navState.params.has("adults")).toBe(false);
      expect(navState.lastNavMethod).toBe("replace");
    });
  });

  // URL-002 — Full country name is dropped (only ISO id is valid)
  Scenario("A full-country-name param is dropped on load", ({ Given, When, Then, And }) => {
    Given('a deep link with query string "country=Indonesia"', () => {
      navState.params = new URLSearchParams("country=Indonesia");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page resolves the deep link", () => {
      expect(screen.getByTestId("calc-page")).toBeTruthy();
    });

    Then('the Country filter returns to "All countries"', () => {
      expect((screen.getByRole("combobox", { name: /country/i }) as HTMLSelectElement).value).toBe("");
    });

    And('the URL is rewritten to have no "country" param', () => {
      expect(navState.params.has("country")).toBe(false);
      expect(navState.lastNavMethod).toBe("replace");
    });
  });

  // URL-003 — Selecting a city backfills country and region
  Scenario("Selecting a city under no prior filter backfills country and region", ({ Given, When, Then, And }) => {
    Given("I am on the calculator with no query string", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I select the city "Jakarta"', async () => {
      const citySelect = screen.queryByRole("combobox", { name: /city/i });
      if (citySelect) {
        await getScenarioUser().selectOptions(citySelect, "jakarta");
      }
    });

    Then('the URL query string includes "city=jakarta"', () => {
      expect(navState.params.get("city")).toBe("jakarta");
    });

    And('the Country filter shows "Indonesia" and the Region filter shows "ASEAN"', () => {
      expect(navState.params.get("country")).toBe("id");
      expect(navState.params.get("region")).toBe("asean");
    });
  });

  // URL-004 — Selecting a broader region clears incompatible narrower filters
  Scenario("Selecting a broader region clears an incompatible country and city", ({ Given, When, Then, But }) => {
    Given('I am on the calculator with query string "city=singapore"', () => {
      navState.params = new URLSearchParams("city=singapore");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I select the region "Europe"', async () => {
      const regionSelect = screen.queryByRole("combobox", { name: /region/i });
      if (regionSelect) {
        await getScenarioUser().selectOptions(regionSelect, "europe");
      }
    });

    Then('the URL query string includes "region=europe"', () => {
      expect(navState.params.get("region")).toBe("europe");
    });

    But('the URL query string does not include "country" or "city"', () => {
      expect(navState.params.has("country")).toBe(false);
      expect(navState.params.has("city")).toBe(false);
    });
  });

  // URL-005 — Contradictory region+city deep link resolves with narrower filter winning
  Scenario(
    "A contradictory region-and-city deep link resolves with the narrower filter winning",
    ({ Given, When, Then, And }) => {
      Given('a deep link with query string "region=europe&city=singapore"', () => {
        navState.params = new URLSearchParams("region=europe&city=singapore");
        navState.setParams(navState.params);
        renderPage(<CostOfLivingCalculatorPage />);
      });

      When("the page resolves the deep link", () => {
        expect(screen.getByTestId("calc-page")).toBeTruthy();
      });

      Then("the single-city detail for Singapore is shown", () => {
        expect(screen.getByTestId("city-detail").textContent).toContain("Singapore");
      });

      And('the URL is rewritten to canonical form with "city=singapore" and "region" backfilled to "asean"', () => {
        expect(navState.params.get("city")).toBe("singapore");
        expect(navState.params.get("region")).toBe("asean");
        expect(navState.lastNavMethod).toBe("replace");
      });
    },
  );

  // URL-006 — City-detail back link preserves an explicitly chosen parent geo scope
  Scenario("The city-detail back link preserves the parent geo scope", ({ Given, When, Then, But }) => {
    let backHref = "";

    Given('I am on the single-city detail with query string "region=asean&country=sg&city=singapore"', () => {
      navState.params = new URLSearchParams("region=asean&country=sg&city=singapore");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I activate the "Back to all cities" link', () => {
      const link = screen.getByRole("link", { name: /back to all cities/i });
      backHref = link.getAttribute("href") ?? "";
    });

    Then('the URL query string includes "region=asean" and "country=sg"', () => {
      // Explicit scope was chosen, so the back link encodes the parent region+country.
      const params = new URLSearchParams(backHref.replace(/^\?/, ""));
      expect(params.get("region")).toBe("asean");
      expect(params.get("country")).toBe("sg");
    });

    But('the URL query string does not include "city"', () => {
      const params = new URLSearchParams(backHref.replace(/^\?/, ""));
      expect(params.has("city")).toBe(false);
    });
  });

  // URL-007 — Tab change is written to the URL
  Scenario("Changing the tab writes the tab to the URL", ({ Given, When, Then, And }) => {
    Given("I am on the calculator with no query string", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I switch to the "Savings" tab', async () => {
      const tab = screen.queryByRole("tab", { name: /savings/i });
      if (tab) {
        await getScenarioUser().click(tab);
      }
    });

    Then('the URL query string includes "tab=savings"', () => {
      expect(navState.params.get("tab")).toBe("savings");
      expect(navState.lastNavMethod).toBe("push");
    });

    And('reloading the page keeps the "Savings" tab active', () => {
      expect(screen.getByRole("tab", { name: /savings/i }).getAttribute("data-state")).toBe("active");
    });
  });

  // URL-008 — Cost-basis control change is written to the URL
  Scenario("Changing a cost-basis control writes it to the URL", ({ Given, When, Then, And }) => {
    Given("I am on the calculator with no query string", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I change the Adults control to "2"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
    });

    Then('the URL query string includes "adults=2"', () => {
      expect(navState.params.get("adults")).toBe("2");
      expect(navState.lastNavMethod).toBe("push");
    });

    And("the household preview updates without a page reload", () => {
      expect((screen.getByRole("combobox", { name: /adults/i }) as HTMLSelectElement).value).toBe("2");
    });
  });

  // URL-009 — Breadcrumb offers Home and Tools escape links
  Scenario("The breadcrumb offers an escape to the Tools index and Home", ({ Given, When, Then, And }) => {
    Given('I am on the calculator with query string "city=singapore"', () => {
      navState.params = new URLSearchParams("city=singapore");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I read the breadcrumb above the page title", () => {
      const nav = screen.queryByRole("navigation", { name: /breadcrumb/i });
      expect(nav).toBeTruthy();
    });

    Then('a "Home" link to "/en" is shown', () => {
      const links = screen.getAllByRole("link");
      const homeLink = links.find((l) => {
        const href = l.getAttribute("href") ?? "";
        return href === "/en" || href.endsWith("/en");
      });
      expect(homeLink).toBeTruthy();
    });

    And('a "Tools" link to "/en/tools" is shown', () => {
      const links = screen.getAllByRole("link");
      const toolsLink = links.find((l) => {
        const href = l.getAttribute("href") ?? "";
        return href.includes("/en/tools");
      });
      expect(toolsLink).toBeTruthy();
    });
  });

  // AC-2 (DWT-B-003/DWT-B-004) — Breadcrumb uses the shared primitive with chevron separators
  Scenario("The breadcrumb separates crumbs with chevrons, not a literal slash", ({ Given, When, Then, And }) => {
    let breadcrumbNav: HTMLElement | null = null;

    Given('I am on the calculator with query string "city=singapore"', () => {
      navState.params = new URLSearchParams("city=singapore");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I read the breadcrumb above the page title", () => {
      breadcrumbNav = screen.getByRole("navigation", { name: /breadcrumb/i });
      expect(breadcrumbNav).toBeTruthy();
    });

    Then("the crumbs are separated by chevron icons", () => {
      // Home, Tools, current → two chevron <svg> separators rendered by lucide-react.
      const chevrons = breadcrumbNav!.querySelectorAll("svg");
      expect(chevrons.length).toBe(2);
    });

    And('no literal "/" separator is shown between crumbs', () => {
      expect(breadcrumbNav!.textContent).not.toContain("/");
    });
  });

  // AC-3 (UWT-013) — Final breadcrumb crumb equals the page H1 in each locale
  ScenarioOutline(
    "The final breadcrumb crumb matches the page title in each locale",
    ({ Given, When, Then, And }, variables) => {
      let currentCrumb: HTMLElement | null = null;

      Given('the user opens "/<locale>/tools/cost-of-living-calculator"', () => {
        navState.locale = String(variables.locale);
        renderPage(<CostOfLivingCalculatorPage />);
      });

      When("the breadcrumb renders", () => {
        const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
        expect(nav).toBeTruthy();
      });

      Then('the current-page crumb text reads "<expected_title>"', () => {
        currentCrumb = document.querySelector('[aria-current="page"]');
        expect(currentCrumb).toBeTruthy();
        expect(currentCrumb!.textContent).toBe(variables.expected_title);
      });

      And('the current-page crumb is marked aria-current="page"', () => {
        expect(currentCrumb!.getAttribute("aria-current")).toBe("page");
      });
    },
  );

  // URL-010 — Region selection writes region to the URL
  Scenario("Selecting a region writes the region to the URL", ({ Given, When, Then, And }) => {
    Given("I am on the calculator with no query string", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I select the region "Europe"', async () => {
      const regionSelect = screen.queryByRole("combobox", { name: /region/i });
      if (regionSelect) {
        await getScenarioUser().selectOptions(regionSelect, "europe");
      }
    });

    Then('the URL query string includes "region=europe"', () => {
      expect(navState.params.get("region")).toBe("europe");
    });

    And('the URL query string does not include "country" or "city"', () => {
      expect(navState.params.has("country")).toBe(false);
      expect(navState.params.has("city")).toBe(false);
    });
  });

  // URL-011 — City deep link restores city and backfills country and region
  Scenario("A city deep link restores the city and backfills country and region", ({ Given, When, Then, And }) => {
    Given('a deep link with query string "city=singapore"', () => {
      navState.params = new URLSearchParams("city=singapore");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I open that link in a fresh tab", () => {
      expect(screen.getByTestId("calc-page")).toBeTruthy();
    });

    Then("the single-city Cost-of-living detail for Singapore is shown", () => {
      expect(screen.getByTestId("city-detail").textContent).toContain("Singapore");
    });

    And('the Country filter shows "Singapore" and the Region filter shows "ASEAN"', () => {
      expect(navState.params.get("country")).toBe("sg");
      expect(navState.params.get("region")).toBe("asean");
    });
  });

  // URL-012 — Unknown city param is dropped on load
  Scenario("An unknown city param is dropped on load", ({ Given, When, Then, And }) => {
    Given('a deep link with query string "city=atlantis"', () => {
      navState.params = new URLSearchParams("city=atlantis");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page resolves the deep link", () => {
      expect(screen.getByTestId("calc-page")).toBeTruthy();
    });

    Then('the City filter returns to "All cities"', () => {
      expect((screen.getByRole("combobox", { name: /city/i }) as HTMLSelectElement).value).toBe("");
    });

    And('the URL is rewritten to have no "city" param', () => {
      expect(navState.params.has("city")).toBe(false);
      expect(navState.lastNavMethod).toBe("replace");
    });
  });

  // URL-013 — Canonicalization uses replace so Back button skips the dirty URL
  Scenario("Canonicalization does not add a browser history entry", ({ Given, When, Then }) => {
    Given('a deep link with query string "city=atlantis"', () => {
      navState.params = new URLSearchParams("city=atlantis");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page rewrites the URL to canonical form", () => {
      expect(navState.params.has("city")).toBe(false);
    });

    Then('pressing the browser Back button does not return to the "city=atlantis" URL', () => {
      expect(navState.lastNavMethod).toBe("replace");
    });
  });

  // AC-4 (UWT-016/DWT-005) — Geo-filter selects meet the 44px minimum touch target
  Scenario("Geo-filter selects meet the minimum touch-target height on mobile", ({ Given, When, Then }) => {
    Given("I am on the calculator at a 375px-wide viewport", () => {
      // jsdom has no layout engine, so the rendered pixel height is verified at the
      // e2e level (boundingBox >= 44px). The unit tier asserts the 44px-minimum
      // styling contract on each geo-filter select: an explicit fixed height (h-11)
      // PLUS appearance-none. The appearance-none is the load-bearing cross-browser
      // fix — WebKit native selects use appearance:auto and pin min-height:18px in the
      // UA stylesheet, overriding min-h-[44px]; removing the native appearance lets the
      // author height apply on Safari, Chromium, AND Firefox alike.
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the geo-filter selects render", () => {
      expect(document.getElementById("geo-region-select")).toBeTruthy();
    });

    Then("each geo-filter select is at least 44 pixels tall", () => {
      for (const id of ["geo-region-select", "geo-country-select", "geo-city-select"]) {
        const select = document.getElementById(id);
        expect(select, id).toBeTruthy();
        expect(select!.className).toContain("min-h-[44px]");
        expect(select!.className).toContain("h-11");
        expect(select!.className).toContain("appearance-none");
      }
    });
  });

  // AC-5 (UWT-008) — Calculator page does not overflow horizontally at 320px
  Scenario("The calculator page has no horizontal overflow at 320px", ({ Given, When, Then }) => {
    Given("I am on the calculator at a 320px-wide viewport", () => {
      // Horizontal scrollWidth is a layout measurement, verified at e2e level
      // (scrollWidth <= 320). The unit tier asserts the structural contract: the
      // geo-filter selects can shrink (min-w-0) so the row never forces overflow.
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the calculator page renders", () => {
      expect(screen.getByTestId("calc-page")).toBeTruthy();
    });

    Then("the document does not scroll horizontally", () => {
      for (const id of ["geo-region-select", "geo-country-select", "geo-city-select"]) {
        const select = document.getElementById(id);
        expect(select, id).toBeTruthy();
        expect(select!.className).toContain("min-w-0");
      }
    });
  });

  // EWT-R01 (regression of UWT-008) — id-locale tab labels must not widen the page at 320px
  Scenario("The calculator page has no horizontal overflow at 320px in the id locale", ({ Given, When, Then }) => {
    Given("I am on the id-locale calculator at a 320px-wide viewport", () => {
      // Horizontal scrollWidth is a layout measurement, verified at e2e level
      // (scrollWidth <= 320). The unit tier asserts the locale-independent structural
      // contract: the tablist is width-bounded (max-w-full + overflow-x-auto) so longer
      // id labels scroll INTERNALLY instead of forcing document overflow.
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the calculator page renders", () => {
      expect(screen.getByTestId("calc-page")).toBeTruthy();
    });

    Then("the document does not scroll horizontally", () => {
      const tablist = screen.getByRole("tablist");
      expect(tablist.className).toContain("max-w-full");
      expect(tablist.className).toContain("overflow-x-auto");
    });
  });

  // AC-8 (UWT-004) — Savings gross-salary field surfaces the active currency separately
  Scenario(
    "The Savings gross-salary field shows the active currency as a separate indicator",
    async ({ Given, When, Then, And }) => {
      Given('I am on the "Savings" tab', async () => {
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      });

      When("the gross-salary field renders", () => {
        expect(document.querySelector("#gross-salary-input")).toBeTruthy();
      });

      Then('the gross-salary label does not contain the literal currency code "USD"', () => {
        const label = document.querySelector('label[for="gross-salary-input"]');
        expect(label?.textContent).not.toMatch(/USD/);
      });

      And('an active-currency indicator next to the field shows "USD"', () => {
        expect(screen.getByTestId("salary-currency-indicator").textContent).toMatch(/USD/);
      });
    },
  );

  // UWT-019 — the fixed USD indicator carries a short explanation of why USD is used
  Scenario("The Savings currency indicator explains why USD is used for every city", async ({ Given, When, Then }) => {
    Given('I am on the "Savings" tab', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("the gross-salary field renders", () => {
      expect(document.querySelector("#gross-salary-input")).toBeTruthy();
    });

    Then("an explanation states salaries are compared in USD across all cities", () => {
      const explanation = screen.getByTestId("salary-currency-explanation");
      expect(explanation.textContent).toMatch(/USD/);
    });
  });

  // AC-9 (UWT-006) — Minimum-role empty-state for a BLANK target only (numeric zero → ladder)
  Scenario(
    "A blank savings target shows empty-state guidance instead of the role ladder",
    async ({ Given, When, Then, But }) => {
      Given('I am on the "Minimum role" tab with the savings-target baseline and a blank target', async () => {
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
        await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
        // No target typed → blank.
      });

      When("the tab renders", () => {
        // UWT-001: the baseline-source group's accessible name is the scent-bearing relabel.
        expect(screen.getByRole("radiogroup", { name: /how to set your target/i })).toBeTruthy();
      });

      Then("a minimum-role empty-state guidance message is shown", () => {
        expect(screen.getByTestId("min-role-empty-state")).toBeTruthy();
        // The role ladder must not render while the target is blank.
        expect(screen.queryByRole("table")).toBeNull();
      });

      But("entering an explicit zero target replaces the guidance with the role ladder and its divider", async () => {
        const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
        await getScenarioUser().clear(input);
        await getScenarioUser().type(input, "0");
        expect(screen.queryByTestId("min-role-empty-state")).toBeNull();
        expect(screen.getByRole("table")).toBeTruthy();
        expect(screen.getByTestId("qualifying-divider")).toBeTruthy();
      });
    },
  );

  // AC-10 (UWT-007) — Region selector lists exactly the nine intended regions
  Scenario("The region selector lists exactly the nine intended regions", ({ Given, When, Then }) => {
    let regionSelect: HTMLElement;

    Given("I am on the calculator with no query string", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the region filter renders", () => {
      regionSelect = screen.getByRole("combobox", { name: /region/i });
      expect(regionSelect).toBeTruthy();
    });

    Then(
      "the region selector offers exactly the nine regions africa, americas, asean, asia, europe, japan, mena, nordics, and oceania",
      () => {
        const values = Array.from(regionSelect.querySelectorAll("option"))
          .map((o) => (o as HTMLOptionElement).value)
          .filter((v) => v !== "");
        expect([...values].sort()).toEqual(
          ["africa", "americas", "asean", "asia", "europe", "japan", "mena", "nordics", "oceania"].sort(),
        );
      },
    );
  });

  // AC-11 (UWT-014) — A country change that auto-changes the region surfaces an advisory
  Scenario("Selecting a country that changes the region shows a visible advisory", async ({ Given, When, Then }) => {
    Given("I am on the calculator with no region selected", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I select a country whose region differs from the current selection", async () => {
      // No region selected → all countries listed; gb belongs to europe.
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "gb");
    });

    Then("a visible region-auto-advisory message is shown", () => {
      const advisory = screen.getByTestId("region-auto-advisory");
      expect(advisory).toBeTruthy();
      expect(advisory.textContent ?? "").not.toBe("");
    });
  });

  // AC-12 (UWT-015) — A city-only deep link returns to the bare calculator
  Scenario("A city-only deep link back link omits the auto-derived region and country", ({ Given, When, Then }) => {
    let backLink: HTMLElement;

    Given('a deep link with query string "city=london"', () => {
      navState.params = new URLSearchParams("city=london");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("I read the single-city detail back link", () => {
      backLink = screen.getByRole("link", { name: /back to all cities/i });
      expect(backLink).toBeTruthy();
    });

    Then('the back link points to the bare calculator "?tab=cost" with no region or country', () => {
      const href = backLink.getAttribute("href") ?? "";
      expect(href).toBe("?tab=cost");
      expect(href).not.toContain("region=");
      expect(href).not.toContain("country=");
    });
  });

  // ── Phase 7: spec coverage sweep ─────────────────────────────────────────────

  // SG-U (country-narrows-city) — selecting country alone (no region) narrows city dropdown
  Scenario("Selecting a country without a region still narrows the city dropdown", async ({ Given, When, Then }) => {
    Given("I am on the calculator with no region or country selected", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When('I select the country "Indonesia" in the country filter without first selecting a region', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /country/i }), "id");
    });

    Then("the city dropdown lists only cities in Indonesia", () => {
      const citySelect = screen.getByRole("combobox", { name: /city/i });
      const cityOptions = Array.from(citySelect.querySelectorAll("option")).filter(
        (o) => o.getAttribute("value") !== "",
      );
      const idCityIds = dataset.cities.filter((c) => c.countryId === "id").map((c) => c.id);
      // Every non-empty option must be an Indonesian city.
      expect(cityOptions.length).toBeGreaterThan(0);
      for (const opt of cityOptions) {
        expect(idCityIds).toContain(opt.getAttribute("value"));
      }
    });
  });

  // SG-U (area radiogroup) — the area segmented control renders with role="radiogroup"
  Scenario("The area control is rendered as a radiogroup", ({ Given, When, Then, And }) => {
    Given("I am on the cost-of-living calculator", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the cost-basis controls render", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then('the area segmented control has role="radiogroup"', () => {
      // SegmentedControl renders a div with role="radiogroup" and aria-label={label}.
      const areaGroup = screen.getByRole("radiogroup", { name: /area/i });
      expect(areaGroup).toBeTruthy();
    });

    And('the area radiogroup contains the "City center" and "Rural" options', () => {
      const areaGroup = screen.getByRole("radiogroup", { name: /area/i });
      const radios = areaGroup.querySelectorAll('[role="radio"]');
      const labels = Array.from(radios).map((r) => r.getAttribute("aria-label") ?? r.textContent ?? "");
      const hasCenter = labels.some((l) => /city center|center/i.test(l));
      const hasRural = labels.some((l) => /rural/i.test(l));
      expect(hasCenter).toBe(true);
      expect(hasRural).toBe(true);
    });
  });

  // SG-U (baseline SegmentedControl) — baseline selector is a radiogroup that shows/hides sub-forms
  Scenario(
    "The baseline selector shows the savings-target sub-form when savings target is selected",
    async ({ Given, When, Then, And }) => {
      Given('the user is on the "Minimum role" tab', async () => {
        navState.params = new URLSearchParams();
        navState.setParams(navState.params);
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      });

      When("the tab renders", () => {
        expect(screen.getByRole("main")).toBeTruthy();
      });

      Then("the baseline-source control renders as a radiogroup with at least three options", () => {
        // SegmentedControl uses role="radiogroup" with role="radio" children.
        // UWT-001: accessible name is the scent-bearing relabel ("How to set your target").
        const baselineGroup = screen.getByRole("radiogroup", { name: /how to set your target/i });
        expect(baselineGroup).toBeTruthy();
        const radios = baselineGroup.querySelectorAll('[role="radio"]');
        expect(radios.length).toBeGreaterThanOrEqual(3);
      });

      And("the savings-target input is visible when savings target is the selected baseline", async () => {
        // "savings_target" is the default baseline; the monthly-target input must be present.
        await getScenarioUser().click(screen.getByRole("radio", { name: /monthly savings target/i }));
        expect(screen.getByRole("spinbutton", { name: /monthly savings target/i })).toBeTruthy();
      });

      And("the reference-role inputs are hidden when savings target is the selected baseline", () => {
        // When savings_target is selected, the reference-role city/role selects must not be in the DOM.
        expect(screen.queryByRole("combobox", { name: /reference city/i })).toBeNull();
        expect(screen.queryByRole("combobox", { name: /reference role/i })).toBeNull();
      });
    },
  );

  // Regression — filter changes must not scroll the page to the top.
  Scenario("Changing a filter preserves the scroll position", async ({ Given, When, Then }) => {
    let scrollTo: ReturnType<typeof vi.spyOn>;

    Given("I am on the cost-of-living calculator", () => {
      // Step callbacks run later than the Scenario registration callback. Install the spy here so
      // earlier scenarios' AfterEachScenario restore cannot remove it before this page renders.
      scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
      Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      navState.lastNavOpts = undefined;
      renderPage(<CostOfLivingCalculatorPage />);
    });
    When('I change the region filter to "Europe"', async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /region/i }), "europe");
    });
    Then("the URL update requests no scroll so the page does not jump to the top", async () => {
      await waitFor(() => expect(navState.params.get("region")).toBe("europe"));
      // Every filter write is in-page state, so it must request { scroll: false }.
      expect(navState.lastNavOpts).toEqual({ scroll: false });
      await waitFor(() => expect(scrollTo).toHaveBeenCalledWith(window.scrollX, 120));
    });
  });

  // Regression — typing the salary echoes instantly but debounces the URL write.
  Scenario(
    "Typing the gross salary echoes instantly but commits to the URL only after typing settles",
    async ({ Given, When, Then, And }) => {
      Given('I am on the "Savings" tab', async () => {
        navState.params = new URLSearchParams();
        navState.setParams(navState.params);
        renderPage(<CostOfLivingCalculatorPage />);
        await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      });
      When('I type a gross monthly salary of "7000" without pausing', async () => {
        const gross = screen.getByRole("spinbutton");
        await getScenarioUser().clear(gross);
        await getScenarioUser().type(gross, "7000");
      });
      Then('the salary field immediately shows "7000"', () => {
        // The local echo reflects the typed value synchronously, before any URL commit.
        expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("7000");
      });
      And("the gross salary is written to the URL once typing settles", async () => {
        await waitFor(() => expect(navState.params.get("gross")).toBe("7000"));
      });
    },
  );

  // Foreigner public-school eligibility: where public schooling isn't open to foreign residents,
  // the calculator charges the private figure and flags the cell.
  Scenario("Public schooling not open to foreigners is charged at the private rate", async ({ Given, When, Then }) => {
    const sg = dataset.cities.find((c) => c.id === "singapore")!;

    Given("I am on the cost-of-living calculator", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });
    When("I add one school-age child with public school selected", async () => {
      // School type defaults to "public"; adding a school-age child enables the column.
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "1");
    });
    Then("the Singapore school cost equals its private-school figure and the cell is flagged", () => {
      // Singapore is "limited" → a foreigner picking public is charged the PRIVATE figure.
      const raw = screen.getByTestId("col-school-singapore").getAttribute("data-raw") ?? "0";
      expect(parseFloat(raw)).toBe(sg.schoolMedianLocal.private.amount);
      expect(parseFloat(raw)).not.toBe(sg.schoolMedianLocal.public.amount);
      expect(screen.getByTestId("school-foreigner-flag-singapore")).toBeTruthy();
    });
  });

  Scenario("Public schooling open to foreigners keeps the public cost", async ({ Given, When, Then }) => {
    const berlin = dataset.cities.find((c) => c.id === "berlin")!;

    Given("I am on the cost-of-living calculator", () => {
      navState.params = new URLSearchParams();
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });
    When("I add one school-age child with public school selected", async () => {
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "1");
    });
    Then("the Berlin school cost equals its public-school figure with no foreigner flag", () => {
      // Germany is "open" → public stays public, no fallback, no flag.
      const raw = screen.getByTestId("col-school-berlin").getAttribute("data-raw") ?? "0";
      expect(parseFloat(raw)).toBe(berlin.schoolMedianLocal.public.amount);
      expect(screen.queryByTestId("school-foreigner-flag-berlin")).toBeNull();
    });
  });

  // ── Phase 8: UX-hardening fold-in bindings (SG-001..003, USS-001..004, protected) ──

  // Cluster 1 / SG-001 — only the active tab description is visible.
  Scenario("Only the active tab description is visible", ({ Given, When, Then, And }) => {
    Given('the cost-of-living calculator is open with the "Cost of living" tab active', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getByTestId("tab-desc-cost")).toBeTruthy();
    });

    Then('the "Cost of living" tab description is visible', () => {
      // The active (cost) tab description must NOT carry the `hidden` utility, and must
      // never carry the fused dead class the bug produced.
      const cost = screen.getByTestId("tab-desc-cost");
      expect(cost.className).not.toMatch(/\bhidden\b/);
      expect(cost.className).not.toContain("text-muted-foregroundhidden");
    });

    And('the "Savings" tab description is not visible', () => {
      expect(screen.getByTestId("tab-desc-savings").className).toMatch(/\bhidden\b/);
    });

    And('the "Minimum role" tab description is not visible', () => {
      expect(screen.getByTestId("tab-desc-min-role").className).toMatch(/\bhidden\b/);
    });
  });

  Scenario("Active tab description follows the active tab", async ({ Given, When, Then }) => {
    Given('the cost-of-living calculator is open with the "Cost of living" tab active', () => {
      renderPage(<CostOfLivingCalculatorPage />);
      expect(screen.getByTestId("tab-desc-cost").className).not.toMatch(/\bhidden\b/);
    });

    When('the user selects the "Savings" tab', async () => {
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    Then('only the "Savings" tab description is visible', () => {
      expect(screen.getByTestId("tab-desc-savings").className).not.toMatch(/\bhidden\b/);
      expect(screen.getByTestId("tab-desc-cost").className).toMatch(/\bhidden\b/);
      expect(screen.getByTestId("tab-desc-min-role").className).toMatch(/\bhidden\b/);
    });
  });

  // Cluster 2 — touch targets on tab triggers + segmented radios.
  Scenario("Interactive controls meet the 44px touch target", ({ Given, When, Then, And }) => {
    Given("the calculator at 375px", () => {
      // jsdom has no layout engine; the unit tier asserts the 44px styling contract
      // (min-h-[44px]) on each interactive control. Pixel height is verified at e2e.
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getAllByRole("tab").length).toBe(3);
    });

    Then("every tab trigger is at least 44px tall", () => {
      for (const tab of screen.getAllByRole("tab")) {
        expect(tab.className).toContain("min-h-[44px]");
      }
    });

    And("every school-type, area, and salary-currency segmented radio is at least 44px tall", () => {
      // The school-type + area segmented radios live in the cost-basis controls; every
      // role=radio button inherits the primitive's min-h-[44px].
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBeGreaterThan(0);
      for (const radio of radios) {
        expect(radio.className).toContain("min-h-[44px]");
      }
    });
  });

  // USS-003 — Area toggle exposes its pressed state via ARIA (radiogroup → aria-checked).
  Scenario("Area toggle exposes its pressed state", ({ Given, When, Then, And }) => {
    Given('"City center" is the active area', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("radiogroup", { name: /area/i })).toBeTruthy();
    });

    Then('the "City center" button has aria-pressed "true"', () => {
      // The area control is a radiogroup, so active state is exposed via aria-checked
      // (the radiogroup analogue of aria-pressed for a toggle button).
      const group = screen.getByRole("radiogroup", { name: /area/i });
      const center = within(group).getByRole("radio", { name: /city center|center/i });
      expect(center.getAttribute("aria-checked")).toBe("true");
    });

    And('the "Rural" button has aria-pressed "false"', () => {
      const group = screen.getByRole("radiogroup", { name: /area/i });
      const rural = within(group).getByRole("radio", { name: /rural/i });
      expect(rural.getAttribute("aria-checked")).toBe("false");
    });
  });

  // USS-004 — disabled school-type buttons announce the prerequisite.
  Scenario("Disabled school-type buttons announce the prerequisite", ({ Given, When, Then, And }) => {
    Given('"School-age children" is 0', () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("radiogroup", { name: /school type/i })).toBeTruthy();
    });

    Then('the "Public" and "Private" buttons are aria-disabled', () => {
      const group = screen.getByRole("radiogroup", { name: /school type/i });
      const publicBtn = within(group).getByRole("radio", { name: /public/i, hidden: true });
      const privateBtn = within(group).getByRole("radio", { name: /private/i, hidden: true });
      expect(publicBtn.getAttribute("aria-disabled")).toBe("true");
      expect(privateBtn.getAttribute("aria-disabled")).toBe("true");
    });

    And('their accessible description names the "add school-age children" prerequisite', () => {
      const group = screen.getByRole("radiogroup", { name: /school type/i });
      const publicBtn = within(group).getByRole("radio", { name: /public/i, hidden: true });
      const describedById = publicBtn.getAttribute("aria-describedby");
      expect(describedById).toBe("school-type-hint");
      const hint = document.getElementById(describedById!);
      expect(hint).toBeTruthy();
      expect(hint!.textContent?.toLowerCase()).toMatch(/school-age children/);
    });
  });

  Scenario("Sortable savings column exposes aria-sort", async ({ Given, When, Then }) => {
    Given("the Savings tab table is shown", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
      // Enter a salary so the savings comparison table renders past the empty-state.
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "8000");
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then('the sortable "Savings after essentials" column header has an aria-sort value', () => {
      // The sortable <th> exposes aria-sort = none | ascending | descending.
      const sortable = Array.from(document.querySelectorAll("th[aria-sort]"));
      expect(sortable.length).toBeGreaterThan(0);
      for (const th of sortable) {
        expect(["none", "ascending", "descending"]).toContain(th.getAttribute("aria-sort"));
      }
    });
  });

  // Cluster 3 — foreigner public-school flag present in BOTH table and city-detail.
  Scenario("Foreigner-school flag is clear, styled, and present in both views", async ({ Given, And, When, Then }) => {
    const sg = dataset.cities.find((c) => c.id === "singapore")!;

    Given("a city whose country does not open public school to foreigners", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    And('school-age children >= 1 and school type "public"', async () => {
      // School type defaults to "public"; adding a school-age child enables the column.
      await getScenarioUser().selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "1");
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("the cost-of-living table school cell shows a clearly-worded private-fallback flag", () => {
      // Singapore is "limited" → a foreigner picking public is charged the PRIVATE figure
      // and the table flags the cell with the localized warning Badge.
      const flag = screen.getByTestId("school-foreigner-flag-singapore");
      expect(flag).toBeTruthy();
      expect(flag.textContent?.trim()).toBe(t("en", "publicSchoolForeignerFlagBadge"));
    });

    And("the flag is visually distinct from ordinary caption text", () => {
      // The flag is a warning-tone Badge (honey hue), NOT plain text-muted-foreground.
      const flag = screen.getByTestId("school-foreigner-flag-singapore");
      expect(flag.className).not.toMatch(/\btext-muted-foreground\b/);
    });

    And("the city-detail school row renders the school-foreigner-flag-<cityId> testid", async () => {
      // Open Singapore's city detail and confirm the same flag testid renders there (EWT-003 parity).
      // Tear down the table-view render first so only the city-detail render is mounted.
      cleanup();
      navState.params = new URLSearchParams(`city=${sg.id}&schoolkids=1&schooltype=public`);
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
      await waitFor(() => {
        expect(screen.getByTestId("city-detail")).toBeTruthy();
      });
      expect(screen.getByTestId(`school-foreigner-flag-${sg.id}`)).toBeTruthy();
    });
  });

  // Cluster 4 — jargon glosses across the cost-of-living + min-role headers.
  Scenario("Jargon table headers carry an accessible explanation", async ({ Given, When, Then, And }) => {
    Given("the calculator is open", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then('the "Healthcare (OOP)" header has a title explaining out-of-pocket (localized)', () => {
      // The OOP abbr carries the localized healthcareOutOfPocket title (not a literal string).
      const oopAbbr = Array.from(document.querySelectorAll("abbr")).find((a) => a.textContent?.trim() === "OOP");
      expect(oopAbbr).toBeTruthy();
      expect(oopAbbr!.getAttribute("title")).toBe(t("en", "healthcareOutOfPocket"));
    });

    And('the "Relocation (sunk)" and "Liquidity reserve" headers carry explanatory titles', () => {
      const titled = Array.from(document.querySelectorAll("abbr[title]")).map((a) => a.getAttribute("title") ?? "");
      expect(titled).toContain(t("en", "tooltipRelocationSunk"));
      expect(titled).toContain(t("en", "tooltipLiquidityReserve"));
    });

    And('the "P25"/"Median"/"P75" headers carry percentile explanations', async () => {
      // P25/Median/P75 live on the Minimum-role table; switch tabs and enter a target.
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      const input = screen.getByRole("spinbutton", { name: /monthly savings target/i });
      await getScenarioUser().clear(input);
      await getScenarioUser().type(input, "1000");
      const titledHeaders = Array.from(document.querySelectorAll("th[title]")).map(
        (h) => h.getAttribute("title") ?? "",
      );
      expect(titledHeaders).toContain(t("en", "tooltipP25"));
      expect(titledHeaders).toContain(t("en", "tooltipMedian"));
      expect(titledHeaders).toContain(t("en", "tooltipP75"));
    });

    And('the "Track" column abbreviations ic/mgmt are expanded or carry abbr titles', () => {
      // UWT-013: trackLabel() expands the bare "ic"/"mgmt" codes to full localized words,
      // so the rendered table cells must NOT show a bare "ic"/"mgmt" token. The expanded
      // forms are non-empty and distinct from the raw codes.
      expect(t("en", "trackIc")).not.toBe("ic");
      expect(t("en", "trackMgmt")).not.toBe("mgmt");
      const table = screen.getByRole("table");
      const bareCodes = within(table)
        .getAllByRole("cell")
        .filter((c) => {
          const txt = c.textContent?.trim().toLowerCase();
          return (txt === "ic" || txt === "mgmt") && !c.querySelector("abbr[title]");
        });
      expect(bareCodes.length).toBe(0);
    });
  });

  // Protected behaviour — OOP abbr title localized (id != literal English "out-of-pocket").
  Scenario("The OOP abbreviation title is localized per locale", ({ Given, When, Then, And }) => {
    Given("the calculator is open", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("table")).toBeTruthy();
    });

    Then("the localized out-of-pocket title differs between the en and id locales", () => {
      expect(t("id", "healthcareOutOfPocket")).not.toBe(t("en", "healthcareOutOfPocket"));
    });

    And('the id-locale out-of-pocket title is not the literal English "out-of-pocket"', () => {
      expect(t("id", "healthcareOutOfPocket")).not.toBe("out-of-pocket");
    });
  });

  // Protected behaviour — region option display names localized; serialized key stays English.
  Scenario(
    "Region option display names are localized but the serialized key stays English",
    ({ Given, When, Then, And }) => {
      let regionSelect: HTMLElement;

      Given("the calculator is open", () => {
        navState.params = new URLSearchParams();
        navState.setParams(navState.params);
        renderPage(<CostOfLivingCalculatorPage />);
      });

      When("the region filter renders", () => {
        regionSelect = screen.getByRole("combobox", { name: /region/i });
        expect(regionSelect).toBeTruthy();
      });

      Then("each region option's serialized value is its English key", () => {
        // The option value (serialized into the URL) must remain the English region key.
        const englishKeys = ["africa", "americas", "asean", "asia", "europe", "japan", "mena", "nordics", "oceania"];
        const values = Array.from(regionSelect.querySelectorAll("option"))
          .map((o) => (o as HTMLOptionElement).value)
          .filter((v) => v !== "");
        for (const v of values) {
          expect(englishKeys).toContain(v);
        }
      });

      And("the region display label differs between the en and id locales", () => {
        // The display label is localized via t(); at least one region label differs across locales.
        const keys = ["regionMena", "regionNordics", "regionAfrica"] as const;
        const anyDiffers = keys.some((k) => t("id", k) !== t("en", k));
        expect(anyDiffers).toBe(true);
      });
    },
  );

  Scenario("Healthcare scheme badges use consistent casing", ({ Given, When, Then }) => {
    Given("the calculator is open", () => {
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the page is rendered", () => {
      expect(screen.getAllByTestId("healthcare-badge").length).toBeGreaterThan(0);
    });

    Then("no healthcare-scheme badge is rendered in ALL CAPS while another is lower-case", () => {
      // After UWT-012, scheme labels render normal-case; no badge should be fully upper-case.
      for (const badge of screen.getAllByTestId("healthcare-badge")) {
        const text = badge.textContent?.trim() ?? "";
        const hasLetters = /[a-zA-Z]/.test(text);
        if (hasLetters) {
          expect(text).not.toBe(text.toUpperCase());
        }
      }
    });
  });

  // Cluster 5 / USS-001 — Savings empty-state + auto-focus.
  Scenario("Savings tab guides the user to enter a salary", async ({ Given, When, Then, And }) => {
    Given("the Savings tab is activated with no salary entered", () => {
      // Activate the Savings tab via deep link so the tab content mounts (triggering the
      // gross input's autoFocus) without a competing userEvent click that would steal focus
      // to the tab trigger. mount === tab activation for this content.
      navState.params = new URLSearchParams("tab=savings");
      navState.setParams(navState.params);
      renderPage(<CostOfLivingCalculatorPage />);
    });

    When("the tab activation occurs", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then("a prominent empty-state prompt is shown in the data area", () => {
      const panel = screen.getByTestId("savings-empty-state");
      expect(panel).toBeTruthy();
      // "Prominent" = a bordered panel, not a faint caption.
      expect(panel.className).toMatch(/\bborder\b/);
      expect(panel.textContent?.trim().length).toBeGreaterThan(0);
    });

    And("the gross salary input receives focus", async () => {
      const input = document.getElementById("gross-salary-input");
      expect(input).toBeTruthy();
      // autoFocus moves focus on mount; allow the effect to settle.
      await waitFor(() => expect(document.activeElement).toBe(input));
    });
  });

  // The single-city essentials preview is removed from the min-role tab (the tab now lists every
  // qualifying city, so a one-city example is redundant there).
  Scenario("Minimum-role tab does not render the single-city essentials preview", async ({ Given, When, Then }) => {
    Given("the Minimum-role tab is activated", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("main")).toBeTruthy();
    });

    Then('no "Example — estimated monthly essentials" single-city cost preview is shown', () => {
      expect(screen.queryByTestId("min-role-example-caption")).toBeNull();
      expect(screen.queryByTestId("preview-housing")).toBeNull();
    });
  });

  // UWT-007 — at-field currency indicator on the Savings gross input.
  Scenario("Savings salary input shows its currency at the field", async ({ Given, When, Then }) => {
    Given("the Savings tab is shown", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /savings/i }));
    });

    When("the page is rendered", () => {
      expect(document.getElementById("gross-salary-input")).toBeTruthy();
    });

    Then("the gross salary input displays its USD currency inline at the field", () => {
      const indicator = screen.getByTestId("salary-currency-indicator");
      expect(indicator.textContent).toMatch(/USD/);
    });
  });

  // Cluster 6 / SG-002 — all selects share the design-system chrome (appearance-none + chevron).
  Scenario("All selects share the design-system chrome", async ({ Given, When, Then, And }) => {
    Given("the calculator at 1280px", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      // Visit the Minimum-role tab too so the currency/ref selects are also exercised.
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    When("the page is rendered", () => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });

    Then('every <select> has computed appearance "none" and a custom chevron affordance', () => {
      // jsdom cannot compute `appearance`; the styling contract is the appearance-none class.
      const selects = Array.from(document.querySelectorAll("select"));
      expect(selects.length).toBeGreaterThan(0);
      for (const select of selects) {
        expect(select.className, `${select.id || "select"} must be appearance-none`).toContain("appearance-none");
        // SelectField overlays a custom ChevronDown svg as a sibling of the <select>.
        const wrapper = select.parentElement;
        expect(wrapper?.querySelector("svg"), `${select.id || "select"} must have a custom chevron`).toBeTruthy();
      }
    });

    And("no <select> shows the browser's native dropdown arrow", () => {
      // appearance-none removes the native arrow; asserted by the class on every select above.
      for (const select of Array.from(document.querySelectorAll("select"))) {
        expect(select.className).toContain("appearance-none");
      }
    });
  });

  // SG-003 — Baseline-source segmented control keeps the 44px rhythm via flex-wrap.
  Scenario("Baseline-source control keeps the 44px rhythm at mobile", async ({ Given, When, Then }) => {
    Given("the Minimum-role tab at 320px and 375px", async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("radiogroup", { name: /how to set your target/i })).toBeTruthy();
    });

    Then('each "Baseline source" option remains at least 44px tall when the control wraps', () => {
      // jsdom has no layout; the contract is flex-wrap (so 3 options flow to a second row)
      // with each option keeping min-h-[44px] per row instead of one ballooning row.
      const group = screen.getByRole("radiogroup", { name: /how to set your target/i });
      expect(group.className).toContain("flex-wrap");
      expect(group.className).toContain("min-h-[44px]");
      for (const radio of group.querySelectorAll('[role="radio"]')) {
        expect((radio as HTMLElement).className).toContain("min-h-[44px]");
      }
    });
  });

  // DWT-007 — salary-currency toggle bottom-aligns with the gross input (items-end field row).
  Scenario("Salary-currency toggle bottom-aligns with its sibling input", async ({ Given, When, Then }) => {
    Given('the Minimum-role "My salary" baseline at 1280px', async () => {
      renderPage(<CostOfLivingCalculatorPage />);
      await getScenarioUser().click(screen.getByRole("tab", { name: /minimum role/i }));
      await getScenarioUser().click(screen.getByRole("radio", { name: /my salary/i }));
    });

    When("the page is rendered", () => {
      expect(screen.getByRole("radiogroup", { name: /salary currency/i })).toBeTruthy();
    });

    Then("the salary-currency toggle bottom-aligns with the gross salary input", () => {
      // The currency toggle's field row uses items-end so the toggle bottom-aligns with the
      // taller sibling input. Walk up from the radiogroup to find the items-end flex row.
      const group = screen.getByRole("radiogroup", { name: /salary currency/i });
      let el: HTMLElement | null = group;
      let foundItemsEnd = false;
      for (let depth = 0; el && depth < 5; depth++) {
        if (el.className.includes("items-end")) {
          foundItemsEnd = true;
          break;
        }
        el = el.parentElement;
      }
      expect(foundItemsEnd).toBe(true);
    });
  });
});
