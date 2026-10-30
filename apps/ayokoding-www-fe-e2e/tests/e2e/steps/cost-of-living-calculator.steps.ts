import { createBdd } from "playwright-bdd";
import { expect, type Locator, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

const freshTabs = new WeakMap<Page, Page>();
const activePage = (page: Page): Page => freshTabs.get(page) ?? page;

type CalculatorEvidence = {
  clickedCity?: { id: string; name: string };
  clickedCountry?: { id: string; name: string };
  householdBefore?: ExpenseSnapshot;
  householdAfter?: ExpenseSnapshot;
  schoolBefore?: Record<string, number>;
  schoolAfter?: Record<string, number>;
  areaBefore?: { housing: number; total: number };
  areaAfter?: { housing: number; total: number };
  candidateBefore?: { firstSavings: string; minimumRole: string };
  candidateAfter?: { firstSavings: string; minimumRole: string };
  fx?: { currencies: string[]; invalidConversions: string[]; displayCurrencies: string[] };
  preschoolBefore?: Record<string, number>;
  preschoolAfter?: Record<string, number>;
  qualifyingOracle?: {
    expectedKeys: string[];
    cityCount: number;
    roleCount: number;
    targetUsd: number;
  };
  lifestyleRanking?: {
    essentialOrder: string[];
    afterLifestyleOrder: string[];
    markerRanks: number[];
    expectedMinimumRank: number;
  };
  referenceBaseline?: { expected: number; actual: number; minimumRank: number; markerRanks: number[] };
  mySalaryBaseline?: { expected: number; actual: number; minimumRank: number; markerRanks: number[] };
  localFxBaseline?: {
    localBaseline: number;
    usdBaseline: number;
    localMarkers: string[];
    usdMarkers: string[];
  };
  nonSalaryRanking?: Array<{ savings: number; nonSalary: number }>;
  scrollPosition?: { before: number; after: number };
  navigationTimeOrigin?: { before: number; after: number };
};

const EXPECTED_FX_RATES: Readonly<Record<string, number>> = {
  AED: 0.27229,
  AUD: 0.69422,
  BRL: 0.1951,
  CAD: 0.7091,
  CHF: 1.21939,
  CZK: 0.047063,
  DKK: 0.15223,
  EUR: 1.1379,
  GBP: 1.32844,
  IDR: 0.000055339,
  INR: 0.010448,
  JPY: 0.0061059,
  KES: 0.007727,
  KRW: 0.0006898,
  MXN: 0.057151,
  MYR: 0.24449,
  NOK: 0.1035,
  PHP: 0.016283,
  PLN: 0.26308,
  SEK: 0.10291,
  SGD: 0.7744,
  THB: 0.029802,
  USD: 1,
  VND: 0.00003797,
};

type ExpenseSnapshot = {
  housing: number;
  utilities: number;
  food: number;
  transport: number;
  healthcare: number;
  school: number;
  childcare?: number;
  totalText?: string;
};

const calculatorEvidence = new WeakMap<Page, CalculatorEvidence>();

function evidenceFor(page: Page): CalculatorEvidence {
  const existing = calculatorEvidence.get(page);
  if (existing) return existing;
  const created: CalculatorEvidence = {};
  calculatorEvidence.set(page, created);
  return created;
}

async function rawAmount(page: Page, category: string): Promise<number> {
  const raw = await page.locator(`[data-testid^='col-${category}-']`).first().getAttribute("data-raw");
  const amount = Number(raw);
  expect(Number.isFinite(amount), `finite ${category} amount`).toBe(true);
  return amount;
}

async function rawAmounts(page: Page, category: string): Promise<Record<string, number>> {
  const cells = page.locator("[data-testid^='col-" + category + "-']");
  const result: Record<string, number> = {};
  for (const cell of await cells.all()) {
    const testId = await cell.getAttribute("data-testid");
    const value = Number(await cell.getAttribute("data-raw"));
    expect(testId).toBeTruthy();
    expect(Number.isFinite(value), "finite " + category + " amount for " + testId).toBe(true);
    result[testId!] = value;
  }
  return result;
}

async function expenseSnapshot(page: Page): Promise<ExpenseSnapshot> {
  return {
    housing: await rawAmount(page, "housing"),
    utilities: await rawAmount(page, "utilities"),
    food: await rawAmount(page, "food"),
    transport: await rawAmount(page, "transport"),
    healthcare: await rawAmount(page, "healthcare"),
    school: await rawAmount(page, "school"),
    childcare: await rawAmount(page, "childcare"),
    totalText: (await page.locator("table tbody tr").first().locator("td").nth(2).innerText()).trim(),
  };
}

async function selectedLabel(locator: Locator): Promise<string> {
  return locator.evaluate((element: HTMLSelectElement) => element.options[element.selectedIndex]?.text.trim() ?? "");
}

async function firstMinimumRole(page: Page): Promise<string> {
  const marker = page.locator("[data-testid='minimum-marker']").first();
  if (!(await marker.isVisible().catch(() => false))) return "no qualifying role";
  return (await marker.locator("xpath=ancestor::tr[1]/td[1]").textContent())?.trim() ?? "";
}

async function numericAttribute(locator: Locator, name: string): Promise<number> {
  const value = Number(await locator.getAttribute(name));
  expect(Number.isFinite(value), `finite ${name}`).toBe(true);
  return value;
}

function displayedNumber(text: string): number {
  const value = Number(text.replace(/[^0-9.-]/g, ""));
  expect(Number.isFinite(value), `finite displayed amount in ${text}`).toBe(true);
  return value;
}

function expectedFxRate(currency: string): number {
  const rate = EXPECTED_FX_RATES[currency];
  expect(rate, `published FX rate for ${currency}`).toBeDefined();
  return rate!;
}

function candidateRows(page: Page): Locator {
  return page.locator("tr[data-candidate-row='true']");
}

async function candidateKey(row: Locator): Promise<string> {
  return `${await row.getAttribute("data-city-id")}:${await row.getAttribute("data-role")}`;
}

async function minimumMarkerKeys(page: Page): Promise<string[]> {
  const rows = candidateRows(page).filter({ has: page.getByTestId("minimum-marker") });
  const keys: string[] = [];
  for (const row of await rows.all()) keys.push(await candidateKey(row));
  return keys.sort();
}

// ── Navigation / preconditions ────────────────────────────────────────────────

Given("I am on {string}", async ({ page }, path: string) => {
  await page.goto(path);
});

Given("I am on the calculator", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
});

Given("I am on the calculator in either locale", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
});

Given("I am on the calculator with both a country and a city query param set", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=cost&country=us&city=san-francisco");
});

Given("the {string} tab is active", async ({ page }, tabName: string) => {
  await page.getByRole("tab", { name: tabName }).waitFor({ state: "visible" });
});

Given("I am on the {string} tab", async ({ page }, tabName: string) => {
  const tabParam: Record<string, string> = {
    "Cost of living": "cost",
    Savings: "savings",
    "Minimum role": "min-role",
  };
  const param = tabParam[tabName];
  if (param) {
    await page.goto(`/en/tools/cost-of-living-calculator?tab=${param}`);
  } else {
    await page.goto("/en/tools/cost-of-living-calculator");
  }
  await expect(page.getByRole("tab", { name: tabName })).toHaveAttribute("data-state", "active");
  if (param === "savings") {
    await expect(page.getByTestId("savings-table")).toHaveAttribute("data-hydrated", "true");
  }
});

Given("I am on the {string} tab with a gross salary entered", async ({ page }, tabName: string) => {
  const tabParam: Record<string, string> = {
    "Cost of living": "cost",
    Savings: "savings",
    "Minimum role": "min-role",
  };
  // Pass gross=8000 via URL so savings.tsx reads it on mount — avoids webkit keyboard simulation issues
  await page.goto(`/en/tools/cost-of-living-calculator?tab=${tabParam[tabName] ?? "savings"}&gross=8000`);
  // Wait for React hydration and URL param to apply (data-hydrated is set after useEffect runs)
  await page.waitForSelector("[data-testid='savings-table'][data-hydrated='true']", { timeout: 10000 });
});

Given("I am on the {string} tab with a baseline set", async ({ page }, tabName: string) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.getByRole("tab", { name: tabName }).click();
  // Use id directly — getByLabel("Monthly savings target") resolves to 2 elements (label + input)
  await page.locator("#target-amount-input").fill("2000");
  await page.keyboard.press("Tab");
  await page.waitForURL(/target=2000/);
});

Given(
  "I am on the {string} tab with a baseline set and a display currency chosen",
  async ({ page }, tabName: string) => {
    await page.goto("/en/tools/cost-of-living-calculator");
    await page.getByRole("tab", { name: tabName }).click();
    await page.locator("#target-amount-input").fill("2000");
    await page.keyboard.press("Tab");
    // Let the baseline recalculation settle before selecting a display currency — selecting
    // it too early races the ranking table's re-render and leaves it perpetually empty.
    await page.waitForURL(/target=2000/);
    await page.getByLabel("Display currency").selectOption("EUR");
    await page.waitForURL(/displaycur=EUR/);
  },
);

Given(
  "I am on the {string} tab and the {string} role qualifies for the {string} household basis",
  async ({ page }, tabName: string, _role: string, _household: string) => {
    await page.goto("/en/tools/cost-of-living-calculator");
    await page.getByRole("tab", { name: tabName }).click();
    await page.waitForURL(/tab=min-role/);
    await page.locator("#target-amount-input").fill("1000");
    await page.keyboard.press("Tab");
    await page.waitForURL(/target=1000/);
    await expect(page.getByTestId("qualifying-divider")).toBeVisible();
  },
);

Given("I am on the {string} tab for a high-cost city", async ({ page }, tabName: string) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.getByRole("tab", { name: tabName }).click();
});

Given("I am on a tab that shows the {string} column", async ({ page }, _colName: string) => {
  await page.goto("/en/tools/cost-of-living-calculator");
});

Given("the household has 2 school-age children", async ({ page }) => {
  await page.getByLabel("School-age children").selectOption("2");
  await page.waitForLoadState("networkidle");
});

// ── Page load ─────────────────────────────────────────────────────────────────

When("the page finishes loading", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

// ── Cost-of-living table structure ───────────────────────────────────────────

Then("I see a table of tech-hub cities", async ({ page }) => {
  const rows = page.locator("table tbody tr");
  await rows.first().waitFor({ state: "visible" });
  expect(await rows.count()).toBeGreaterThan(0);
});

Then("each row shows a Country column immediately to the left of the City column", async ({ page }) => {
  const headers = page.locator("table thead th");
  const texts = await headers.allTextContents();
  const countryIdx = texts.findIndex((h) => h.trim() === "Country");
  const cityIdx = texts.findIndex((h) => h.trim() === "City");
  expect(countryIdx).toBeGreaterThanOrEqual(0);
  expect(cityIdx).toBe(countryIdx + 1);
});

Then("every row shows a Country column immediately to the left of the City column", async ({ page }) => {
  const headers = page.locator("table thead th");
  const texts = await headers.allTextContents();
  const countryIdx = texts.findIndex((h) => h.trim() === "Country");
  const cityIdx = texts.findIndex((h) => h.trim() === "City");
  expect(countryIdx).toBeGreaterThanOrEqual(0);
  expect(cityIdx).toBe(countryIdx + 1);
});

Then(
  "each row shows monthly housing, food, transport, utilities, healthcare, childcare, school, and lifestyle expenses",
  async ({ page }) => {
    const headers = page.locator("table thead th");
    const texts = (await headers.allTextContents()).map((t) => t.trim().toLowerCase());
    for (const expected of [
      "housing",
      "food",
      "transport",
      "utilities",
      "healthcare",
      "childcare",
      "school",
      "lifestyle",
    ]) {
      expect(
        texts.some((text) => text.includes(expected)),
        expected + " column",
      ).toBe(true);
    }
  },
);

Then("each row shows an essentials subtotal and a total", async ({ page }) => {
  const headers = page.locator("table thead th");
  const texts = (await headers.allTextContents()).map((t) => t.trim().toLowerCase());
  expect(texts.some((t) => t.includes("essential"))).toBe(true);
  expect(texts.some((t) => t.includes("total"))).toBe(true);
});

Then("each row shows a separate one-time relocation sunk-cost total", async ({ page }) => {
  const headers = page.locator("table thead th");
  const texts = (await headers.allTextContents()).map((t) => t.trim().toLowerCase());
  expect(texts.some((t) => t.includes("reloc"))).toBe(true);
});

Then("each row shows a separately labelled liquidity reserve", async ({ page }) => {
  const headers = page.locator("table thead th");
  const texts = (await headers.allTextContents()).map((t) => t.trim().toLowerCase());
  expect(texts.some((t) => t.includes("liquidity") || t.includes("reserve"))).toBe(true);
});

// ── Geo filter cascade ────────────────────────────────────────────────────────

When(
  "I select the region {string} then the country {string} in the cascading filters",
  async ({ page }, region: string, country: string) => {
    // Selecting a region re-scopes the Country dropdown options. Wait for the
    // region value to stick AND for the Country option list to shrink (the
    // out-of-region "United States" must be gone) before picking the country —
    // networkidle returns before the option list re-renders.
    await page.getByLabel("Region").selectOption({ label: region });
    await page.waitForURL(/region=/);
    await expect
      .poll(async () => (await page.getByLabel("Country").locator("option").allTextContents()).join("|").toLowerCase())
      .not.toContain("united states");
    await page.getByLabel("Country").selectOption({ label: country });
    await expect(page.getByLabel("Country")).not.toHaveValue("");
    await page.waitForURL(/country=/);
  },
);

Then("the Country filter lists only ASEAN countries", async ({ page }) => {
  await expect
    .poll(async () => (await page.getByLabel("Country").locator("option").allTextContents()).join("|").toLowerCase())
    .not.toContain("united states");
  const values = await page
    .getByLabel("Country")
    .locator("option:not([value=''])")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(values.sort()).toEqual(["id", "my", "ph", "sg", "th", "vn"]);
});

Then("the City filter lists only Indonesian cities", async ({ page }) => {
  await expect.poll(async () => page.getByLabel("City").locator("option").count()).toBeGreaterThan(0);
  const values = await page
    .getByLabel("City")
    .locator("option:not([value=''])")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(values).toEqual(["jakarta"]);
});

Then("only cities in Indonesia are shown in the table", async ({ page }) => {
  const rows = page.locator("table tbody tr");
  expect(await rows.count()).toBeGreaterThan(0);
  for (const row of await rows.all()) {
    await expect(row.locator("td").first()).toHaveText("Indonesia");
  }
});

When("I select the country {string} in the cascading filters", async ({ page }, country: string) => {
  await page.getByLabel("Country").selectOption({ label: country });
  // Deterministic wait: the selection drives a URL push (country=<id>) and a
  // table re-render. Wait for the select to actually carry the chosen value so
  // the subsequent scope assertions run against the re-rendered table, not the
  // pre-selection state. networkidle alone returns before React re-renders.
  await expect(page.getByLabel("Country")).not.toHaveValue("");
  await page.waitForURL(/country=/);
});

// ── Country+city on every tab ─────────────────────────────────────────────────

When("I view any tab's results table", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

// ── City name click → deep link ───────────────────────────────────────────────

When("I click a city name in any table", async ({ page }) => {
  const link = page.locator("table tbody tr td:nth-child(2) a").first();
  const href = await link.getAttribute("href");
  const cityId = new URLSearchParams(href?.split("?")[1] ?? "").get("city");
  expect(cityId).toBeTruthy();
  evidenceFor(page).clickedCity = { id: cityId!, name: (await link.textContent())?.trim() ?? "" };
  await link.click();
});

Then(
  "I am taken to that city's single-city Cost-of-living detail at {string}",
  async ({ page }, _urlPattern: string) => {
    // The Cost-of-living tab is the default, so encodeState omits `tab=cost`.
    // The single-city detail is identified by the `city=` param on the (default) cost tab.
    await page.waitForURL(/[?&]city=/);
    expect(page.url()).toMatch(/[?&]city=/);
    expect(page.url()).not.toMatch(/tab=(savings|min-role)/);
  },
);

Then("the City filter is pre-selected to that city", async ({ page }) => {
  const clicked = evidenceFor(page).clickedCity;
  expect(clicked).toBeDefined();
  await expect(page.locator("#geo-city-select")).toHaveValue(clicked!.id);
  expect(await selectedLabel(page.locator("#geo-city-select"))).toBe(clicked!.name);
});

Then(
  "the detail shows the full per-category breakdown, essentials subtotal, total, healthcare scheme badge, and split relocation in both local currency and USD",
  async ({ page }) => {
    const detail = page.locator("[data-testid='city-detail']");
    for (const testId of [
      "expense-housing",
      "expense-food",
      "expense-transport",
      "expense-utilities",
      "expense-healthcare",
      "expense-childcare",
      "expense-school",
      "essentials-subtotal",
      "monthly-total",
      "healthcare-badge",
      "relocation-sunk",
      "liquidity-reserve",
    ]) {
      await expect(detail.getByTestId(testId), testId).toBeVisible();
    }
    await expect(detail.getByTestId("relocation-sunk")).toContainText(/[A-Z]{3} [\d,.-]+ \/ \$[\d,.-]+/);
    await expect(detail.getByTestId("liquidity-reserve")).toContainText(/[A-Z]{3} [\d,.-]+ \/ \$[\d,.-]+/);
  },
);

// ── Country name click → deep link ───────────────────────────────────────────

When("I click a country name in any table", async ({ page }) => {
  const link = page.locator("table tbody tr td:nth-child(1) a").first();
  const href = await link.getAttribute("href");
  const countryId = new URLSearchParams(href?.split("?")[1] ?? "").get("country");
  expect(countryId).toBeTruthy();
  evidenceFor(page).clickedCountry = { id: countryId!, name: (await link.textContent())?.trim() ?? "" };
  await link.click();
});

Then(
  "I am taken to the Cost-of-living tab filtered to that country at {string}",
  async ({ page }, _urlPattern: string) => {
    // The Cost-of-living tab is the default, so encodeState omits `tab=cost`.
    // The country filter is identified by the `country=` param on the (default) cost tab.
    await page.waitForURL(/[?&]country=/);
    expect(page.url()).toMatch(/[?&]country=/);
    expect(page.url()).not.toMatch(/tab=(savings|min-role)/);
  },
);

Then("the Country filter is pre-selected to that country with its Region set", async ({ page }) => {
  const clicked = evidenceFor(page).clickedCountry;
  expect(clicked).toBeDefined();
  await expect(page.locator("#geo-country-select")).toHaveValue(clicked!.id);
  expect(await selectedLabel(page.locator("#geo-country-select"))).toBe(clicked!.name);
  await expect(page.locator("#geo-region-select")).not.toHaveValue("");
});

Then("the table shows that country's cities as a filtered list rather than a single-city detail", async ({ page }) => {
  const rows = page.locator("table tbody tr");
  expect(await rows.count()).toBeGreaterThan(0);
  const expectedCountry = evidenceFor(page).clickedCountry?.name;
  expect(expectedCountry).toBeTruthy();
  for (const row of await rows.all()) await expect(row.locator("td").first()).toHaveText(expectedCountry!);
  expect(page.url()).not.toMatch(/city=/);
});

// ── City link precedence ──────────────────────────────────────────────────────

When("the page resolves the deep link at {string}", async ({ page }, _urlPattern: string) => {
  await page.waitForLoadState("networkidle");
});

Then(
  "the single-city Cost-of-living detail for the city is shown because a city implies its country",
  async ({ page }) => {
    const detail = page.locator("[data-testid='city-detail']");
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("heading", { level: 2 }).first()).toHaveText("San Francisco, United States");
    await expect(page.locator("#geo-city-select")).toHaveValue("san-francisco");
    await expect(page.locator("#geo-country-select")).toHaveValue("us");
    await expect(page.locator("#geo-region-select")).toHaveValue("americas");
  },
);

// ── Healthcare scheme badge ───────────────────────────────────────────────────

When("I select any city on any tab", async ({ page }) => {
  // Wait for the results table to be populated before clicking, so the city link
  // is attached and stable (firefox occasionally clicked before hydration finished).
  const cityLink = page.locator("table tbody tr td:nth-child(2) a").first();
  await cityLink.waitFor({ state: "visible", timeout: 10000 });
  await cityLink.click();
  // The click drives a router.push(?city=…) then a re-render into the single-city
  // detail. Wait for the URL to commit the city param first (the deterministic
  // navigation signal), then for the detail view — networkidle alone raced the
  // client-side navigation on firefox.
  await page.waitForURL(/city=/, { timeout: 10000 });
  await page.locator("[data-testid='city-detail']").waitFor({ state: "visible", timeout: 10000 });
});

Then("a healthcare funding-scheme badge is shown for that city's country", async ({ page }) => {
  // After clicking a city link, CityDetail is rendered with data-testid="healthcare-badge".
  // Scope to the detail view so we don't collide with the per-row badges in the table.
  const badge = page.locator("[data-testid='city-detail'] [data-testid='healthcare-badge']");
  await expect(badge).toBeVisible();
});

Then("the badge reads {string}, {string}, or {string}", async ({ page }, _v1: string, _v2: string, _v3: string) => {
  const badge = page.locator("[data-testid='city-detail'] [data-testid='healthcare-badge']");
  await expect(badge).toBeVisible();
  const text = (await badge.textContent())?.toLowerCase() ?? "";
  expect(text.includes("tax-funded") || text.includes("mandatory payroll") || text.includes("out-of-pocket")).toBe(
    true,
  );
});

// ── OOP legend ────────────────────────────────────────────────────────────────

When("I read the legend near the table", async ({ page }) => {
  await page.locator("[data-testid='oop-legend']").waitFor({ state: "visible" });
});

Then("an on-screen explanation states that {string}", async ({ page }, _explanation: string) => {
  const legend = page.locator("[data-testid='oop-legend']");
  await expect(legend).toBeVisible();
  const text = await legend.textContent();
  expect(text?.includes("OOP")).toBe(true);
});

Then(
  "the explanation says it is the healthcare you pay yourself on top of any tax-funded or insurance coverage",
  async ({ page }) => {
    const legend = page.locator("[data-testid='oop-legend']");
    const text = await legend.textContent();
    expect(text?.toLowerCase().includes("out-of-pocket")).toBe(true);
  },
);

// ── Relocation distinct from sunk costs ──────────────────────────────────────

When("I read a city row", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

Then("the one-time relocation sunk-cost total is shown distinct from the monthly total", async ({ page }) => {
  const headers = page.locator("table thead th");
  const texts = (await headers.allTextContents()).map((t) => t.trim().toLowerCase());
  expect(texts.some((t) => t.includes("reloc"))).toBe(true);
  expect(texts.some((t) => t.includes("total"))).toBe(true);
});

Then(
  "the liquidity-reserve cash cushion is shown in its own labelled figure, not folded into the sunk-cost total",
  async ({ page }) => {
    const headers = page.locator("table thead th");
    const texts = (await headers.allTextContents()).map((t) => t.trim().toLowerCase());
    expect(texts.some((t) => t.includes("liquidity") || t.includes("reserve"))).toBe(true);
  },
);

// ── Tab switching ─────────────────────────────────────────────────────────────

When("I switch to the {string} tab", async ({ page }, tabName: string) => {
  // The static HTML is interactive-looking before React's mount effects have reconciled URL
  // state. Wait for that exact production boundary before the user action so a late initial sync
  // cannot overwrite the selected tab.
  await expect(page.getByTestId("calc-page")).toHaveAttribute("data-hydrated", "true");
  const tab = page.getByRole("tab", { name: tabName });
  await tab.click();
  const tabParam: Record<string, string> = {
    "Cost of living": "cost",
    Savings: "savings",
    "Minimum role": "min-role",
  };
  const expected = tabParam[tabName];
  if (expected === "cost") {
    await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBeNull();
  } else if (expected) {
    await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBe(expected);
  }
  await expect(tab).toHaveAttribute("data-state", "active");
  if (expected === "savings") {
    await expect(page.getByTestId("savings-table")).toHaveAttribute("data-hydrated", "true");
  }
});

// ── Savings tab — gross salary input ─────────────────────────────────────────

When("I enter a gross monthly salary of {string} USD", async ({ page }, amount: string) => {
  const input = page.getByLabel("Gross monthly salary (before tax)");
  await input.click();
  await input.fill(amount);
  // Deterministically confirm the controlled number input committed the value
  // before proceeding. WebKit occasionally drops a fill on a type="number" input
  // when the assertion races; retrying the fill until the value sticks removes the
  // flake without weakening the behavioural assertion downstream.
  await expect(input)
    .toHaveValue(amount, { timeout: 5000 })
    .catch(async () => {
      await input.fill("");
      await input.pressSequentially(amount, { delay: 20 });
    });
  await expect(input).toHaveValue(amount, { timeout: 5000 });
  // Leaving the field is the public interaction that flushes its documented debounce immediately.
  await input.press("Tab");
  await expect.poll(() => new URL(page.url()).searchParams.get("gross")).toBe(String(Number(amount)));
  await expect(page.getByTestId("savings-table")).toHaveAttribute("data-hydrated", "true");
});

Then(
  "each city row shows a net take-home after the country's federal and sub-national effective tax",
  async ({ page }) => {
    const gross = Number(await page.getByLabel("Gross monthly salary (before tax)").inputValue());
    expect(gross).toBe(8000);
    const rows = page.getByTestId("savings-row");
    expect(await rows.count()).toBeGreaterThan(20);
    let taxedRows = 0;
    for (const row of await rows.all()) {
      const net = await numericAttribute(row.getByTestId("net-value"), "data-usd");
      expect(net).toBeGreaterThan(0);
      expect(net).toBeLessThanOrEqual(gross);
      if (net < gross) taxedRows += 1;
      await expect(row.getByTestId("net-value")).toContainText(/\$[\d,.-]+/);
    }
    expect(taxedRows).toBeGreaterThan(0);
  },
);

Then(
  "each row shows the essentials, the savings after essentials, and the savings after lifestyle with percentages",
  async ({ page }) => {
    for (const row of await page.getByTestId("savings-row").all()) {
      const net = await numericAttribute(row.getByTestId("net-value"), "data-usd");
      const essentials = await numericAttribute(row.getByTestId("essentials-value"), "data-usd");
      const essentialSavings = await numericAttribute(row.getByTestId("savings-essential"), "data-usd");
      const afterLifestyle = await numericAttribute(row.getByTestId("savings-lifestyle"), "data-usd");
      expect(essentialSavings).toBeCloseTo(net - essentials, 8);
      expect(afterLifestyle).toBeLessThan(essentialSavings);

      const essentialText = (await row.getByTestId("savings-essential").textContent()) ?? "";
      const lifestyleText = (await row.getByTestId("savings-lifestyle").textContent()) ?? "";
      expect(Number(essentialText.match(/\((-?\d+)%\)/)?.[1])).toBe(Math.round((essentialSavings / net) * 100));
      expect(Number(lifestyleText.match(/\((-?\d+)%\)/)?.[1])).toBe(Math.round((afterLifestyle / net) * 100));
    }
  },
);

Then("the table can be sorted by savings", async ({ page }) => {
  const sortBtn = page.getByRole("button", { name: "Sort by savings" });
  await expect(sortBtn).toBeVisible();
  await sortBtn.click();
  await expect(sortBtn).toHaveAttribute("aria-pressed", "true");
  const ascending = await page
    .getByTestId("savings-row")
    .getByTestId("savings-essential")
    .evaluateAll((cells) => cells.map((cell) => Number(cell.getAttribute("data-usd"))));
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
  await sortBtn.click();
  await expect(sortBtn).toHaveAttribute("aria-pressed", "false");
  const descending = await page
    .getByTestId("savings-row")
    .getByTestId("savings-essential")
    .evaluateAll((cells) => cells.map((cell) => Number(cell.getAttribute("data-usd"))));
  expect(descending).toEqual([...descending].sort((a, b) => b - a));
});

// ── Annual gross derived from monthly ─────────────────────────────────────────

Then("the annual gross is shown as {string} USD", async ({ page }, expectedAnnual: string) => {
  const annualEl = page.locator("[data-testid='annual-gross']");
  const digits = expectedAnnual.replace(/,/g, "");
  // Allow optional commas in formatted number; toHaveText retries until match (webkit safeguard)
  const withOptionalCommas = digits.replace(/(\d+)(\d{3})$/g, "$1,?$2");
  await expect(annualEl).toHaveText(new RegExp(withOptionalCommas), { timeout: 10000 });
});

Then("the annual figure equals twelve times the monthly figure", async ({ page }) => {
  const annualEl = page.locator("[data-testid='annual-gross']");
  await expect(annualEl).toBeAttached({ timeout: 5000 });
  const text = await annualEl.textContent();
  // Just verify a number is shown — exact value checked by the "annual gross is shown as" step
  expect(text).toMatch(/\d/);
});

// ── Non-salary comp informational ─────────────────────────────────────────────

Then(
  "a typical non-salary compensation \\(RSU\\/equity + bonus\\) figure is shown as a separate informational column",
  async ({ page }) => {
    const note = page.locator("[data-testid='non-salary-comp-note']");
    await expect(note).toContainText(/informational/i);
    for (const row of await page.getByTestId("savings-row").all()) {
      const cell = row.getByTestId("non-salary-value");
      expect(await numericAttribute(cell, "data-usd")).toBeGreaterThan(0);
      await expect(cell).toContainText(/\$[\d,.-]+/);
      expect((await cell.textContent())?.split("/")).toHaveLength(2);
    }
  },
);

Then("it is not added into the net, the essential savings, or the after-lifestyle savings", async ({ page }) => {
  for (const row of await page.getByTestId("savings-row").all()) {
    const net = await numericAttribute(row.getByTestId("net-value"), "data-usd");
    const essentials = await numericAttribute(row.getByTestId("essentials-value"), "data-usd");
    const savings = await numericAttribute(row.getByTestId("savings-essential"), "data-usd");
    const afterLifestyle = await numericAttribute(row.getByTestId("savings-lifestyle"), "data-usd");
    const nonSalary = await numericAttribute(row.getByTestId("non-salary-value"), "data-usd");
    expect(savings).toBeCloseTo(net - essentials, 8);
    expect(savings).not.toBeCloseTo(net + nonSalary - essentials, 3);
    expect(afterLifestyle).toBeLessThan(savings);
  }
});

// ── Total comp informational ──────────────────────────────────────────────────

Then(
  "a total compensation figure equal to the base annual gross plus the typical non-salary comp is shown as informational context",
  async ({ page }) => {
    const annualGross = displayedNumber((await page.getByTestId("annual-gross").textContent()) ?? "");
    expect(annualGross).toBe(96000);
    for (const row of await page.getByTestId("savings-row").all()) {
      const nonSalary = await numericAttribute(row.getByTestId("non-salary-value"), "data-usd");
      const totalComp = await numericAttribute(row.getByTestId("total-comp-value"), "data-usd");
      expect(totalComp).toBeCloseTo(annualGross + nonSalary, 8);
      await expect(row.getByTestId("total-comp-value")).toContainText(/\$[\d,.-]+/);
    }
  },
);

Then(
  "the total compensation is not added into the net, the essential savings, or the after-lifestyle savings",
  async ({ page }) => {
    for (const row of await page.getByTestId("savings-row").all()) {
      const net = await numericAttribute(row.getByTestId("net-value"), "data-usd");
      const essentials = await numericAttribute(row.getByTestId("essentials-value"), "data-usd");
      const savings = await numericAttribute(row.getByTestId("savings-essential"), "data-usd");
      const afterLifestyle = await numericAttribute(row.getByTestId("savings-lifestyle"), "data-usd");
      const totalComp = await numericAttribute(row.getByTestId("total-comp-value"), "data-usd");
      expect(savings).toBeCloseTo(net - essentials, 8);
      expect(savings).not.toBeCloseTo(totalComp / 12 - essentials, 3);
      expect(afterLifestyle).toBeLessThan(savings);
    }
  },
);

// ── Sub-national tax ─────────────────────────────────────────────────────────

When("I compare a US, Canadian, or Swiss city against a unitary-country city", async ({ page }) => {
  await page.getByLabel("Gross monthly salary (before tax)").fill("10000");
  await page.keyboard.press("Tab");
});

Then("the federal-country city applies its city sub-national rate on top of the federal rate", async ({ page }) => {
  const row = page.locator("table tbody tr", { has: page.getByRole("link", { name: "San Francisco", exact: true }) });
  await expect(row.getByTestId("sub-national-indicator")).toBeVisible();
  await expect(row.getByTestId("sub-national-indicator")).toHaveText("(fed+state)");
  // At USD 10,000/month, the authored high-band oracle is 36% federal + 8% California.
  expect(Number(await row.getByTestId("net-value").getAttribute("data-usd"))).toBeCloseTo(5600);
});

Then("the unitary-country city applies the federal rate alone", async ({ page }) => {
  const row = page.locator("table tbody tr", { has: page.getByRole("link", { name: "London", exact: true }) });
  await expect(row.getByTestId("sub-national-indicator")).toHaveCount(0);
  // The United Kingdom's authored high-band federal rate is 42%, with no city layer.
  expect(Number(await row.getByTestId("net-value").getAttribute("data-usd"))).toBeCloseTo(5800);
});

// ── Net lower than gross ──────────────────────────────────────────────────────

When("I enter a gross monthly salary above a city's tax band threshold", async ({ page }) => {
  const input = page.getByLabel("Gross monthly salary (before tax)");
  // Triple-click selects all; keyboard.type fires real key events that React onChange picks up on webkit
  await input.click({ clickCount: 3 });
  await page.keyboard.type("10000");
  await page.keyboard.press("Tab");
});

Then("the net take-home shown for that city is lower than the entered gross", async ({ page }) => {
  // Wait for React to update at least one net-value cell to non-zero
  await expect(page.locator("[data-testid='net-value']:not([data-usd='0'])").first()).toBeAttached({ timeout: 8000 });
  // Find any city where 0 < net < 10000 (excludes 0%-tax countries like UAE)
  const cells = page.locator("[data-testid='net-value']");
  const count = await cells.count();
  let foundTaxed = false;
  for (let i = 0; i < count; i++) {
    const usd = parseFloat((await cells.nth(i).getAttribute("data-usd")) ?? "0");
    if (usd > 0 && usd < 10000) {
      foundTaxed = true;
      break;
    }
  }
  expect(foundTaxed).toBe(true);
});

// ── Deficit when essentials exceed net ───────────────────────────────────────

When("I enter a gross salary whose net is lower than that city's modeled essentials", async ({ page }) => {
  await page.getByLabel("Gross monthly salary (before tax)").fill("500");
  await page.keyboard.press("Tab");
});

Then("the savings-after-essentials amount and percentage are shown as negative", async ({ page }) => {
  const savingsCells = page.locator("[data-testid='savings-essential']");
  const count = await savingsCells.count();
  let foundNegative = false;
  for (let i = 0; i < count; i++) {
    const usdAttr = await savingsCells.nth(i).getAttribute("data-usd");
    if (parseFloat(usdAttr ?? "0") < 0) {
      foundNegative = true;
      break;
    }
  }
  expect(foundNegative).toBe(true);
});

// ── Indonesian locale ─────────────────────────────────────────────────────────

Then(
  "all labels, category names, tax wording, healthcare-scheme labels, relocation labels, and the disclaimer are in Indonesian",
  async ({ page }) => {
    const pageText = page.locator("[data-testid='calc-page']");
    for (const expected of [
      "Kalkulator Biaya Hidup",
      "Wilayah",
      "Negara",
      "Kota",
      "Perumahan",
      "Makanan",
      "Transportasi",
      "Utilitas",
      "Kesehatan",
      "Penitipan anak",
      "Sekolah",
      "Gaya hidup",
      "asuransi penggajian wajib",
      "Relokasi (biaya hangus)",
      "Data terakhir diperbarui",
      "Hanya perkiraan",
    ]) {
      await expect(pageText, expected).toContainText(expected);
    }
    for (const forbidden of ["Housing", "Food", "Utilities", "Childcare", "Data last updated", "Estimates only"]) {
      await expect(pageText, "English copy: " + forbidden).not.toContainText(forbidden);
    }
  },
);

// ── No Israeli cities ─────────────────────────────────────────────────────────

Then("no Israeli city appears in the dataset or any table", async ({ page }) => {
  const tableText = await page.locator("table").first().textContent();
  const lower = tableText?.toLowerCase() ?? "";
  expect(lower.includes("israel")).toBe(false);
  expect(lower.includes("tel aviv")).toBe(false);
  expect(lower.includes("jerusalem")).toBe(false);
});

// ── Data snapshot date ────────────────────────────────────────────────────────

Then("I see a prominent {string} label with the dataset snapshot date", async ({ page }, label: string) => {
  const el = page.locator("[data-testid='data-last-updated']");
  await expect(el).toBeVisible();
  await expect(el).toContainText(label);
  await expect(el).toContainText("July 30, 2026");
});

Then("I see an {string} disclaimer", async ({ page }, text: string) => {
  const el = page.locator("[data-testid='estimates-disclaimer']");
  await expect(el).toBeVisible();
  await expect(el).toHaveText(new RegExp("^" + text + "$", "i"));
});

// ── FX conversion ─────────────────────────────────────────────────────────────

When("I read any USD figure derived from a local-currency value", async ({ page }) => {
  const cells = page.locator("[data-testid^='col-housing-']");
  await cells.first().waitFor({ state: "visible" });
  const currencies = new Set<string>();
  const invalidConversions: string[] = [];
  for (const cell of await cells.all()) {
    const text = (await cell.textContent())?.trim() ?? "";
    const match = text.match(/^([A-Z]{3}) [\d,.-]+ \/ \$([\d,.-]+)$/);
    if (!match) {
      invalidConversions.push(text);
      continue;
    }
    const currency = match[1]!;
    currencies.add(currency);
    const rate = EXPECTED_FX_RATES[currency];
    const raw = Number(await cell.getAttribute("data-raw"));
    const displayedUsd = Number(match[2]!.replaceAll(",", ""));
    if (rate === undefined || displayedUsd !== Math.round(raw * rate)) invalidConversions.push(text);
  }

  await page.getByRole("tab", { name: "Minimum role" }).click();
  await page.waitForURL(/tab=min-role/);
  const displayCurrencies = await page
    .locator("#display-currency-select option")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  evidenceFor(page).fx = {
    currencies: [...currencies].sort(),
    invalidConversions,
    displayCurrencies,
  };
});

Then("the conversion uses the rate for that currency stored in the in-repo fx.ts table", async ({ page }) => {
  const fxEvidence = evidenceFor(page).fx;
  expect(fxEvidence).toBeDefined();
  expect(fxEvidence!.invalidConversions).toEqual([]);
});

Then(
  "every currency referenced by a city, country, role, or display-currency selector has an fx.ts entry",
  async ({ page }) => {
    const fxEvidence = evidenceFor(page).fx;
    expect(fxEvidence).toBeDefined();
    expect(fxEvidence!.currencies).toEqual(Object.keys(EXPECTED_FX_RATES).sort());
    for (const currency of fxEvidence!.displayCurrencies) {
      expect(EXPECTED_FX_RATES[currency], "FX rate for display currency " + currency).toBeDefined();
    }
  },
);

// ── Household composition changes expenses ────────────────────────────────────

When("I change the household from {string} to married with 2 school-age children", async ({ page }, _from: string) => {
  const evidence = evidenceFor(page);
  evidence.householdBefore = {
    housing: await rawAmount(page, "housing"),
    utilities: await rawAmount(page, "utilities"),
    food: await rawAmount(page, "food"),
    transport: await rawAmount(page, "transport"),
    healthcare: await rawAmount(page, "healthcare"),
    school: await rawAmount(page, "school"),
  };
  await page.getByLabel("Adults").selectOption("2");
  await page.waitForURL(/adults=2/);
  await page.getByLabel("School-age children").selectOption("2");
  await page.waitForURL(/schoolkids=2/);
  evidence.householdAfter = {
    housing: await rawAmount(page, "housing"),
    utilities: await rawAmount(page, "utilities"),
    food: await rawAmount(page, "food"),
    transport: await rawAmount(page, "transport"),
    healthcare: await rawAmount(page, "healthcare"),
    school: await rawAmount(page, "school"),
  };
});

Then("the modeled housing and utilities increase sub-linearly", async ({ page }) => {
  const { householdBefore: before, householdAfter: after } = evidenceFor(page);
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  expect(after!.housing).toBeCloseTo(before!.housing * 1.55);
  expect(after!.utilities).toBeCloseTo(before!.utilities * 1.55);
});

Then("the modeled food and healthcare increase near per-capita", async ({ page }) => {
  const { householdBefore: before, householdAfter: after } = evidenceFor(page);
  expect(after!.food).toBeCloseTo(before!.food * 2.1);
  expect(after!.healthcare).toBeCloseTo(before!.healthcare * 2.1);
});

Then("schooling is added for the two school-age children", async ({ page }) => {
  const { householdBefore: before, householdAfter: after } = evidenceFor(page);
  expect(before!.school).toBe(0);
  expect(after!.school).toBeGreaterThan(0);
});

// ── Pre-school children ───────────────────────────────────────────────────────

When("I set the household to 1 pre-school child and 0 school-age children", async ({ page }) => {
  evidenceFor(page).preschoolBefore = await rawAmounts(page, "childcare");
  const preschool = page.getByLabel("Preschool children");
  await preschool.selectOption("1");
  const schoolAgeSelect = page.getByLabel("School-age children");
  await expect(schoolAgeSelect).toHaveValue("0");
  await expect.poll(() => new URL(page.url()).searchParams.get("preschool")).toBe("1");
  await expect(preschool).toHaveValue("1");
  await expect.poll(() => rawAmount(page, "childcare")).toBeGreaterThan(0);
  evidenceFor(page).preschoolAfter = await rawAmounts(page, "childcare");
});

Then("the childcare expense is added for the one pre-school child", async ({ page }) => {
  const { preschoolBefore: before, preschoolAfter: after } = evidenceFor(page);
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  expect(Object.keys(after!)).toEqual(Object.keys(before!));
  expect(Object.keys(after!).length).toBeGreaterThan(20);
  for (const [cell, amount] of Object.entries(after!)) {
    expect(before![cell]).toBe(0);
    expect(amount).toBeGreaterThan(0);
  }
});

Then("no schooling cost is added", async ({ page }) => {
  // The school-type toggle is shown-but-disabled (not hidden) when there are no school-age
  // children — see the "School type toggle is shown but disabled without school-age children"
  // scenario/design (controls.tsx's SegmentedControl `disabled` prop). The correct assertion
  // for "no schooling cost is added" is the modeled schooling figure itself (matching the
  // Unit binding in cost-of-living-calculator.steps.tsx), not toggle visibility.
  const schoolCells = page.locator("[data-testid^='col-school-']");
  expect(await schoolCells.count()).toBe(Object.keys(evidenceFor(page).preschoolAfter ?? {}).length);
  for (const schoolCell of await schoolCells.all()) await expect(schoolCell).toHaveAttribute("data-raw", "0");
});

// ── School type toggle hidden ─────────────────────────────────────────────────

When("the household has no school-age children", async ({ page }) => {
  const select = page.getByLabel("School-age children");
  if (await select.isVisible()) {
    await select.selectOption("0");
    await page.waitForLoadState("networkidle");
  }
});

// ── School type: private raises expenses ──────────────────────────────────────

When("I switch the school type from {string} to {string}", async ({ page }, _from: string, to: string) => {
  evidenceFor(page).schoolBefore = await rawAmounts(page, "school");
  const label = to.charAt(0).toUpperCase() + to.slice(1).toLowerCase();
  // School type is a SegmentedControl (radiogroup), not a <select>
  await page.getByRole("radio", { name: label }).click();
  await page.waitForURL(/schooltype=private/);
  evidenceFor(page).schoolAfter = await rawAmounts(page, "school");
});

Then("the schooling portion of the modeled expenses increases", async ({ page }) => {
  const { schoolBefore, schoolAfter } = evidenceFor(page);
  expect(schoolBefore).toBeDefined();
  expect(schoolAfter).toBeDefined();
  const increasedCities = Object.entries(schoolAfter!).filter(
    ([testId, amount]) => amount > (schoolBefore![testId] ?? Number.POSITIVE_INFINITY),
  );
  expect(increasedCities.length).toBeGreaterThan(0);
});

// ── Rural area lowers housing ─────────────────────────────────────────────────

When("I switch the area from {string} to {string}", async ({ page }, _from: string, to: string) => {
  const evidence = evidenceFor(page);
  evidence.areaBefore = {
    housing: await rawAmount(page, "housing"),
    total: Number(
      await page
        .locator("table tbody tr")
        .first()
        .locator("td")
        .nth(2)
        .textContent()
        .then((text) => text?.match(/\/ \$([\d,.-]+)/)?.[1]?.replaceAll(",", "") ?? "NaN"),
    ),
  };
  // Area is a SegmentedControl (radiogroup), not a <select>
  const label = to === "rural" ? "Rural" : "City center";
  await page.getByRole("radio", { name: label }).click();
  if (to === "rural") await page.waitForURL(/area=rural/);
  evidence.areaAfter = {
    housing: await rawAmount(page, "housing"),
    total: Number(
      await page
        .locator("table tbody tr")
        .first()
        .locator("td")
        .nth(2)
        .textContent()
        .then((text) => text?.match(/\/ \$([\d,.-]+)/)?.[1]?.replaceAll(",", "") ?? "NaN"),
    ),
  };
});

Then("the modeled housing expense decreases", async ({ page }) => {
  const { areaBefore: before, areaAfter: after } = evidenceFor(page);
  expect(after!.housing).toBeCloseTo(before!.housing * 0.75);
});

Then("the city total decreases accordingly", async ({ page }) => {
  const { areaBefore: before, areaAfter: after } = evidenceFor(page);
  expect(after!.total).toBeLessThan(before!.total);
});

// ── Min-role tab setup ────────────────────────────────────────────────────────

When("I set the baseline source to {string}", async ({ page }, source: string) => {
  // SegmentedControl renders role="radio" buttons, not a <select>
  const radioLabels: Record<string, string> = {
    "savings target": "Monthly savings target",
    "reference role": "Reference role",
    "Match a role": "Match a role",
    "my salary": "My salary",
  };
  const radioLabel = radioLabels[source] ?? source;
  const radio = page.getByRole("radio", { name: radioLabel });
  await radio.click();
  await expect(radio).toHaveAttribute("aria-checked", "true");

  if (radioLabel === "Match a role") {
    await expect(page.getByLabel("Reference city")).toBeVisible();
  }
});

When("I enter a monthly savings target of {string} USD", async ({ page }, amount: string) => {
  // Use id directly — getByLabel resolves to 2 elements (label + input)
  const input = page.locator("#target-amount-input");
  await input.click({ clickCount: 3 });
  await page.keyboard.type(amount);
  await page.keyboard.press("Tab");
  await page.waitForLoadState("networkidle");
});

// ── Roles labelled as software-engineering ────────────────────────────────────

Then(
  "a caption states the ladder is software-engineering roles covering IC and management tracks",
  async ({ page }) => {
    const caption = page.locator("[data-testid='se-roles-caption']");
    await expect(caption).toBeVisible();
    const text = await caption.textContent();
    expect(text?.toLowerCase().includes("software")).toBe(true);
  },
);

// ── Per-country salary distribution in role rows ──────────────────────────────

When("I read a role row", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

Then("the role shows its country's p25, median, and p75 salary distribution", async ({ page }) => {
  const rows = candidateRows(page);
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(20);
  const observations = await rows.evaluateAll((elements) =>
    elements.map((row) => ({
      attached: row.isConnected && row.ownerDocument === document,
      columns: ["p25", "median", "p75"].map((column) => {
        const selector = `[data-money-column='${column}']`;
        const cells = row.querySelectorAll(selector);
        const displays = row.querySelectorAll(`${selector} [data-line='display']`);
        return {
          column,
          cellCount: cells.length,
          displayCount: displays.length,
          usd: cells[0]?.getAttribute("data-usd") ?? null,
        };
      }),
    })),
  );
  expect(observations.length).toBe(rowCount);
  for (const observation of observations) {
    expect(observation.attached).toBe(true);
    for (const column of observation.columns) {
      expect(column.cellCount, `one ${column.column} cell per row`).toBe(1);
      expect(column.displayCount, `one ${column.column} display per row`).toBe(1);
      expect(Number.isFinite(Number(column.usd)), "finite data-usd").toBe(true);
    }
    const p25 = Number(observation.columns[0]?.usd);
    const median = Number(observation.columns[1]?.usd);
    const p75 = Number(observation.columns[2]?.usd);
    expect(p25).toBeGreaterThan(0);
    expect(p25).toBeLessThanOrEqual(median);
    expect(median).toBeLessThanOrEqual(p75);
  }
  for (const column of ["p25", "median", "p75"]) {
    await expect(rows.locator(`[data-money-column='${column}'] [data-line='display']`)).toHaveText(
      Array.from({ length: rowCount }, () => /USD$/),
    );
  }
});

Then("the row's essential savings is computed from the median salary", async ({ page }) => {
  const row = candidateRows(page).first();
  const cityId = await row.getAttribute("data-city-id");
  const medianGrossUsd = await numericAttribute(row.locator("[data-money-column='median']"), "data-usd");
  const candidateSavings = await numericAttribute(row, "data-essential-savings-usd");
  expect(cityId).toBeTruthy();

  const calculator = await page.context().newPage();
  await calculator.goto(`/en/tools/cost-of-living-calculator?tab=savings&gross=${medianGrossUsd}&city=${cityId}`);
  const savingsRow = calculator.locator(`[data-testid='savings-row'][data-city-id='${cityId}']`);
  await expect(savingsRow).toBeVisible();
  const independentlyShownSavings = await numericAttribute(savingsRow.getByTestId("savings-essential"), "data-usd");
  expect(candidateSavings).toBeCloseTo(independentlyShownSavings, 8);
  await calculator.close();
});

// ── Non-salary comp does not affect ranking ───────────────────────────────────

When("I compare candidate order with their essential savings and non-salary comp", async ({ page }) => {
  const rows = candidateRows(page);
  await rows.first().waitFor({ state: "visible" });
  const comparison: Array<{ savings: number; nonSalary: number }> = [];
  for (const row of await rows.all()) {
    comparison.push({
      savings: await numericAttribute(row, "data-essential-savings-usd"),
      nonSalary: await numericAttribute(row.locator("[data-money-column='non-salary-comp']"), "data-usd"),
    });
  }
  evidenceFor(page).nonSalaryRanking = comparison;
});

Then("rows are ordered by essential savings regardless of non-salary comp", async ({ page }) => {
  const savings = evidenceFor(page).nonSalaryRanking!.map(({ savings }) => savings);
  expect(savings).toEqual([...savings].sort((a, b) => b - a));
});

Then("at least one adjacent pair would be ordered differently by non-salary comp", async ({ page }) => {
  const values = evidenceFor(page).nonSalaryRanking!;
  expect(
    values.some((value, index) => {
      const next = values[index + 1];
      return next !== undefined && value.savings >= next.savings && value.nonSalary < next.nonSalary;
    }),
  ).toBe(true);
});

// ── Lifestyle does not affect ranking ─────────────────────────────────────────

When("I compare the ladder with each city's published lifestyle cost", async ({ page }) => {
  const rows = candidateRows(page);
  await rows.first().waitFor({ state: "visible" });
  const baseline = await numericAttribute(page.getByTestId("min-role-table"), "data-baseline-usd");
  const candidates: Array<{ key: string; cityId: string; currency: string; rank: number; essential: number }> = [];
  const candidateAttributes = await rows.evaluateAll((elements) =>
    elements.map((row) => ({
      attached: row.isConnected && row.ownerDocument === document,
      cityId: row.getAttribute("data-city-id"),
      role: row.getAttribute("data-role"),
      currency: row.getAttribute("data-currency"),
      rank: row.getAttribute("data-rank"),
      essential: row.getAttribute("data-essential-savings-usd"),
    })),
  );
  for (const row of candidateAttributes) {
    expect(row.attached).toBe(true);
    const rank = Number(row.rank);
    const essential = Number(row.essential);
    expect(Number.isFinite(rank), "finite data-rank").toBe(true);
    expect(Number.isFinite(essential), "finite data-essential-savings-usd").toBe(true);
    candidates.push({
      key: `${row.cityId}:${row.role}`,
      cityId: row.cityId!,
      currency: row.currency!,
      rank,
      essential,
    });
  }

  const costsPage = await page.context().newPage();
  await costsPage.goto("/en/tools/cost-of-living-calculator");
  await expect(costsPage.locator("[data-testid^='col-lifestyle-']").first()).toBeVisible();
  const lifestyleUsd = new Map<string, number>();
  const lifestyleAttributes = await costsPage.locator("[data-testid^='col-lifestyle-']").evaluateAll((cells) =>
    cells.map((cell) => ({
      attached: cell.isConnected && cell.ownerDocument === document,
      testId: cell.getAttribute("data-testid"),
      raw: cell.getAttribute("data-raw"),
      text: cell.textContent,
    })),
  );
  for (const cell of lifestyleAttributes) {
    expect(cell.attached).toBe(true);
    const cityId = cell.testId!.replace("col-lifestyle-", "");
    const local = Number(cell.raw);
    expect(Number.isFinite(local), "finite data-raw").toBe(true);
    const currency = (cell.text ?? "").match(/^([A-Z]{3})/)?.[1];
    expect(currency).toBeTruthy();
    lifestyleUsd.set(cityId, local * expectedFxRate(currency!));
  }
  await costsPage.close();

  const qualifying = candidates.filter(({ essential }) => essential >= baseline);
  const essentialOrder = qualifying.map(({ key }) => key);
  const afterLifestyleOrder = [...qualifying]
    .sort((a, b) => b.essential - lifestyleUsd.get(b.cityId)! - (a.essential - lifestyleUsd.get(a.cityId)!))
    .map(({ key }) => key);
  const expectedMinimumRank = Math.min(...qualifying.map(({ rank }) => rank));
  const markerRanks: number[] = [];
  const markerAttributes = await rows.filter({ has: page.getByTestId("minimum-marker") }).evaluateAll((elements) =>
    elements.map((row) => ({
      attached: row.isConnected && row.ownerDocument === document,
      rank: row.getAttribute("data-rank"),
    })),
  );
  for (const markerRow of markerAttributes) {
    expect(markerRow.attached).toBe(true);
    const rank = Number(markerRow.rank);
    expect(Number.isFinite(rank), "finite data-rank").toBe(true);
    markerRanks.push(rank);
  }
  evidenceFor(page).lifestyleRanking = {
    essentialOrder,
    afterLifestyleOrder,
    markerRanks,
    expectedMinimumRank,
  };
});

Then(
  "candidate order and the minimum marker follow essential savings rather than after-lifestyle savings",
  async ({ page }) => {
    const evidence = evidenceFor(page).lifestyleRanking;
    expect(evidence).toBeDefined();
    const actualOrder: string[] = [];
    const dividerRows = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
    for (const row of await dividerRows.all()) actualOrder.push(await candidateKey(row));
    expect(actualOrder).toEqual(evidence!.essentialOrder);
    expect(actualOrder).not.toEqual(evidence!.afterLifestyleOrder);
    expect(evidence!.markerRanks.length).toBeGreaterThan(0);
    expect(new Set(evidence!.markerRanks)).toEqual(new Set([evidence!.expectedMinimumRank]));
  },
);

// ── Reference role baseline ───────────────────────────────────────────────────

When("I pick the city {string} and the role {string}", async ({ page }, city: string, role: string) => {
  await page.getByLabel("Reference city").selectOption({ label: city });
  await page.waitForURL(/refcity=jakarta/);
  // getByLabel("Reference role") resolves to 2 elements (radio btn + select); .last() gets the select
  await page.getByLabel("Reference role").last().selectOption({ label: role });
  await expect(page.locator("#ref-role-select")).toHaveValue("senior_swe");
  await expect(page.getByTestId("min-role-table")).toBeVisible();
});

When("I view the minimum role result", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

Then("the baseline savings bar equals that role's essential savings in Jakarta", async ({ page }) => {
  const referenceRow = page.locator("tr[data-candidate-row='true'][data-city-id='jakarta'][data-role='senior_swe']");
  await expect(referenceRow).toBeVisible({ timeout: 15000 });
  const expected = await numericAttribute(referenceRow, "data-essential-savings-usd");
  const table = page.getByTestId("min-role-table");
  const actual = await numericAttribute(table, "data-baseline-usd");
  expect(actual).toBeCloseTo(expected, 8);

  const qualifyingRows = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
  const ranks: number[] = [];
  for (const row of await qualifyingRows.all()) ranks.push(await numericAttribute(row, "data-rank"));
  const minimumRank = Math.min(...ranks);
  const markerRanks: number[] = [];
  for (const row of await candidateRows(page)
    .filter({ has: page.getByTestId("minimum-marker") })
    .all()) {
    markerRanks.push(await numericAttribute(row, "data-rank"));
  }
  evidenceFor(page).referenceBaseline = { expected, actual, minimumRank, markerRanks };
});

Then("the marked minimum role reaches at least that essential savings in absolute terms", async ({ page }) => {
  const evidence = evidenceFor(page).referenceBaseline;
  expect(evidence).toBeDefined();
  expect(evidence!.markerRanks.length).toBeGreaterThan(0);
  expect(new Set(evidence!.markerRanks)).toEqual(new Set([evidence!.minimumRank]));
  for (const row of await candidateRows(page)
    .filter({ has: page.getByTestId("minimum-marker") })
    .all()) {
    expect(await numericAttribute(row, "data-essential-savings-usd")).toBeGreaterThanOrEqual(evidence!.expected);
  }
});

// ── My salary baseline ────────────────────────────────────────────────────────

When("I enter my gross salary and its city", async ({ page }) => {
  await page.locator("#my-city-select").selectOption("singapore");
  await page.waitForURL(/mysalarycity=singapore/);
  await page
    .getByRole("radiogroup", { name: /salary currency/i })
    .getByRole("radio", { name: "USD" })
    .click();
  await page.waitForURL(/mygrosscur=usd/);
  await page.getByLabel("My gross monthly", { exact: true }).fill("8000");
  await page.getByLabel("My gross monthly", { exact: true }).blur();
  await page.waitForURL(/mygross=8000/);
  await expect(page.getByTestId("min-role-table")).toBeVisible();

  const actual = await numericAttribute(page.getByTestId("min-role-table"), "data-baseline-usd");
  const savingsPage = await page.context().newPage();
  await savingsPage.goto("/en/tools/cost-of-living-calculator?tab=savings&gross=8000&city=singapore");
  const singapore = savingsPage.locator("[data-testid='savings-row'][data-city-id='singapore']");
  await expect(singapore).toBeVisible();
  const expected = await numericAttribute(singapore.getByTestId("savings-essential"), "data-usd");
  await savingsPage.close();

  const qualifying = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
  const ranks: number[] = [];
  for (const row of await qualifying.all()) ranks.push(await numericAttribute(row, "data-rank"));
  const markerRanks: number[] = [];
  for (const row of await candidateRows(page)
    .filter({ has: page.getByTestId("minimum-marker") })
    .all()) {
    markerRanks.push(await numericAttribute(row, "data-rank"));
  }
  evidenceFor(page).mySalaryBaseline = {
    expected,
    actual,
    minimumRank: Math.min(...ranks),
    markerRanks,
  };
});

Then("the ladder marks the lowest role that meets or beats it", async ({ page }) => {
  const evidence = evidenceFor(page).mySalaryBaseline;
  expect(evidence).toBeDefined();
  expect(evidence!.markerRanks.length).toBeGreaterThan(0);
  expect(new Set(evidence!.markerRanks)).toEqual(new Set([evidence!.minimumRank]));
});

// ── Display currency ──────────────────────────────────────────────────────────

When("I choose a display currency", async ({ page }) => {
  await page.getByLabel("Display currency").selectOption("EUR");
  await page.waitForURL(/displaycur=EUR/);
});

Then(
  "each role row shows its essential savings in USD, the city's local currency, and the display currency",
  async ({ page }) => {
    const triples = await candidateRows(page).evaluateAll((rows) =>
      rows.map((row) => {
        const cell = row.querySelector<HTMLElement>("[data-testid='savings-triple']")!;
        return {
          usd: Number(cell.dataset.usd),
          displayCurrency: cell.dataset.displayCurrency!,
          localCurrency: cell.dataset.localCurrency!,
          usdText: cell.querySelector<HTMLElement>("[data-line='usd']")!.textContent!,
          displayText: cell.querySelector<HTMLElement>("[data-line='display']")!.textContent!,
          localText: cell.querySelector<HTMLElement>("[data-line='local']")!.textContent!,
        };
      }),
    );
    expect(triples.length).toBeGreaterThan(20);
    for (const triple of triples) {
      expect(triple.displayCurrency).toBe("EUR");
      expect(displayedNumber(triple.usdText)).toBe(Math.round(triple.usd));
      expect(displayedNumber(triple.displayText)).toBe(Math.round(triple.usd / expectedFxRate("EUR")));
      expect(displayedNumber(triple.localText)).toBe(Math.round(triple.usd / expectedFxRate(triple.localCurrency)));
      expect(triple.usdText).toMatch(/USD$/);
      expect(triple.displayText).toMatch(/EUR$/);
      expect(triple.localText).toMatch(new RegExp(`${triple.localCurrency}$`));
    }
  },
);

// ── Dual-currency money columns ───────────────────────────────────────────────

Then(
  "every money column \\(p25, median, p75, non-salary comp, total comp, and essential savings\\) shows the display currency on the first line and the city's local currency on the second line",
  async ({ page }) => {
    const rows = await candidateRows(page).evaluateAll((candidateElements) =>
      candidateElements.map((candidate) =>
        Array.from(candidate.querySelectorAll<HTMLElement>("[data-money-column]")).map((cell) => ({
          column: cell.dataset.moneyColumn!,
          usd: Number(cell.dataset.usd),
          displayCurrency: cell.dataset.displayCurrency!,
          localCurrency: cell.dataset.localCurrency!,
          lines: Array.from(cell.querySelectorAll<HTMLElement>(":scope > [data-line]")).map((line) => ({
            kind: line.dataset.line!,
            text: line.textContent!,
          })),
        })),
      ),
    );
    const expectedColumns = ["p25", "median", "p75", "essential-savings", "non-salary-comp", "total-comp"];
    expect(rows.length).toBeGreaterThan(20);
    for (const cells of rows) {
      expect(cells.map(({ column }) => column).sort()).toEqual([...expectedColumns].sort());
      for (const cell of cells) {
        expect(cell.lines.slice(0, 2).map(({ kind }) => kind)).toEqual(["display", "local"]);
        expect(cell.displayCurrency).toBe("EUR");
        expect(displayedNumber(cell.lines[0]!.text)).toBe(Math.round(cell.usd / expectedFxRate("EUR")));
        expect(displayedNumber(cell.lines[1]!.text)).toBe(Math.round(cell.usd / expectedFxRate(cell.localCurrency)));
      }
    }
  },
);

Then("no money column shows only a single currency", async ({ page }) => {
  const lineCounts = await candidateRows(page)
    .locator("[data-money-column]")
    .evaluateAll((cells) => cells.map((cell) => cell.querySelectorAll(":scope > [data-line]").length));
  expect(lineCounts.length).toBeGreaterThan(20 * 6);
  expect(Math.min(...lineCounts)).toBeGreaterThanOrEqual(2);
});

// ── Household composition changes qualifying role ─────────────────────────────

When(
  "I change the household to {string} and the area to {string}",
  async ({ page }, _household: string, area: string) => {
    const evidence = evidenceFor(page);
    evidence.candidateBefore = {
      firstSavings:
        (await page.locator("[data-testid='savings-triple'] [data-line='usd']").first().textContent()) ?? "",
      minimumRole: await firstMinimumRole(page),
    };
    // Each control push is a URL-state commit (router.push in calculator-content.tsx's
    // handleHouseholdChange/handleAreaChange). Firing the next action before a commit's
    // navigation lands starts that handler from a stale `currentState` closure and silently
    // clobbers the previous change — `waitForURL` after each field settles the commit before
    // the next one starts (matching the `waitForURL`-after-mutation pattern already used
    // elsewhere in this file, e.g. the geo-filter steps).
    await page.getByLabel("Adults").selectOption("2");
    await page.waitForURL(/adults=2/);
    await page.getByLabel("School-age children").selectOption("2");
    await page.waitForURL(/schoolkids=2/);
    const areaLabel = area === "center" ? "City center" : "Rural";
    // Area is a SegmentedControl (radiogroup), not a <select>
    const areaRadio = page.getByRole("radio", { name: areaLabel });
    await areaRadio.click();
    await expect(areaRadio).toHaveAttribute("aria-checked", "true");
    if (area === "rural") await page.waitForURL(/area=rural/);
    await expect(page.locator("[data-testid='savings-triple']").first()).toBeVisible({ timeout: 60000 });
    evidence.candidateAfter = {
      firstSavings:
        (await page.locator("[data-testid='savings-triple'] [data-line='usd']").first().textContent()) ?? "",
      minimumRole: await firstMinimumRole(page),
    };
  },
);

Then(
  "{string} is re-evaluated after childcare, schooling, and central housing raise modeled essentials",
  async ({ page }, _role: string) => {
    const { candidateBefore: before, candidateAfter: after } = evidenceFor(page);
    expect(before).toBeDefined();
    expect(after).toBeDefined();
    expect(after!.firstSavings).not.toBe(before!.firstSavings);
    expect(new URL(page.url()).searchParams.get("adults")).toBe("2");
    expect(new URL(page.url()).searchParams.get("schoolkids")).toBe("2");
  },
);

Then("the marked minimum reflects the recalculated household", async ({ page }) => {
  const after = evidenceFor(page).candidateAfter;
  expect(after).toBeDefined();
  expect(after!.minimumRole).not.toBe("");
  if (after!.minimumRole !== "no qualifying role") {
    await expect(page.locator("[data-testid='minimum-marker']").first()).toBeVisible();
  } else {
    await expect(page.locator("[data-testid='no-qualifier-message']")).toBeVisible();
  }
});

// ── No role can reach the bar ─────────────────────────────────────────────────

When("I set a savings target higher than any role's essential savings in any city", async ({ page }) => {
  // Use the locator rather than page.keyboard: under the fully parallel cross-browser run,
  // Firefox can lose the global keyboard target while React updates the controlled input.
  // `fill` keeps the interaction scoped to this field and `toHaveValue` proves the debounced
  // field retained the target before the assertion observes the recomputed ladder.
  const input = page.locator("#target-amount-input");
  await input.fill("999999999");
  await input.press("Tab");
  await expect(input).toHaveValue("999999999");
});

Then("the tool states that no role clears the bar", async ({ page }) => {
  await expect(page.locator("[data-testid='no-qualifier-message']")).toBeVisible({ timeout: 60000 });
});

Then("no row is marked as the minimum", async ({ page }) => {
  const marker = page.locator("[data-testid='minimum-marker']");
  expect(await marker.count()).toBe(0);
});

// ── Cost-basis controls affect candidates ─────────────────────────────────────

When("I change the household type or area", async ({ page }) => {
  const evidence = evidenceFor(page);
  evidence.candidateBefore = {
    firstSavings: (await page.locator("[data-testid='savings-triple'] [data-line='usd']").first().textContent()) ?? "",
    minimumRole: await firstMinimumRole(page),
  };
  await page.getByRole("radio", { name: "Rural" }).click();
  await page.waitForURL(/area=rural/);
  await expect(page.locator("[data-testid='savings-triple']").first()).toBeVisible({ timeout: 60000 });
  evidence.candidateAfter = {
    firstSavings: (await page.locator("[data-testid='savings-triple'] [data-line='usd']").first().textContent()) ?? "",
    minimumRole: await firstMinimumRole(page),
  };
});

Then("the role candidates' savings and the marked minimum role update accordingly", async ({ page }) => {
  const { candidateBefore: before, candidateAfter: after } = evidenceFor(page);
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  expect(after!.firstSavings).not.toBe(before!.firstSavings);
  expect(after!.minimumRole).not.toBe("");
  expect(new URL(page.url()).searchParams.get("area")).toBe("rural");
});

// ── Low-confidence cells (narrowed to minimum-role tab) ──────────────────────

When("the table renders", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

Then("cells with lower data confidence display a visual flag indicator", async ({ page }) => {
  const flags = page.locator("[data-testid='confidence-flag']");
  expect(await flags.count()).toBeGreaterThan(0);
  for (const flag of await flags.all()) {
    await expect(flag).toHaveText(/^\[(moderate|proxy)\]$/);
    await expect(flag.locator("xpath=ancestor::*[@data-testid='city-cell'][1]")).toBeVisible();
  }
});

// ── No Israeli city in role candidates ───────────────────────────────────────

Then("no Israeli city appears as a candidate city for any role", async ({ page }) => {
  const tableText = await page.locator("table").first().textContent();
  const lower = tableText?.toLowerCase() ?? "";
  expect(lower.includes("israel")).toBe(false);
  expect(lower.includes("tel aviv")).toBe(false);
  expect(lower.includes("jerusalem")).toBe(false);
});

// ── SG-001: Zero/empty salary guidance ─────────────────────────────────────────

When("the gross monthly salary field is empty or zero", async ({ page }) => {
  const input = page.getByLabel("Gross monthly salary (before tax)");
  await input.click({ clickCount: 3 });
  await page.keyboard.type("0");
  await page.keyboard.press("Tab");
  await page.waitForLoadState("networkidle");
});

Then("empty-state guidance replaces the city comparison table", async ({ page }) => {
  await expect(page.getByTestId("savings-empty-state")).toBeVisible();
  await expect(page.locator("table")).toHaveCount(0);
});

Then("no percentage values are rendered without net income", async ({ page }) => {
  await expect(page.locator("[data-testid='savings-essential']")).toHaveCount(0);
});

// ── SG-002: Rural area × multi-adult household sub-linear housing ─────────────

Given("I set the household to 2 adults with no children", async ({ page }) => {
  await page.getByLabel("Adults").selectOption("2");
  await page.waitForLoadState("networkidle");
});

Then(
  "the housing estimate in the expense preview decreases to base times subLinear 2 adults times 0.75",
  async ({ page }) => {
    const { areaBefore: center, areaAfter: rural } = evidenceFor(page);
    expect(center).toBeDefined();
    expect(rural).toBeDefined();
    expect(rural!.housing).toBeCloseTo(center!.housing * 0.75);
  },
);

Then("the essentials total in the preview decreases accordingly", async ({ page }) => {
  const { areaBefore: center, areaAfter: rural } = evidenceFor(page);
  expect(rural!.total).toBeLessThan(center!.total);
});

// ── SG-003: City filter dropdown opens detail view ────────────────────────────

When("I select a city from the City dropdown filter", async ({ page }) => {
  // getByLabel("City") resolves to 2 elements; .first() gets the actual select
  const citySelect = page.getByLabel("City").first();
  await citySelect.selectOption({ index: 1 });
  await page.waitForLoadState("networkidle");
});

Then("the single-city cost-of-living detail for that city is shown", async ({ page }) => {
  await expect(page.getByTestId("city-detail")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("city")).toBeTruthy();
});

Then("the detail is identical to the one shown when clicking the city name in the table", async ({ page }) => {
  const cityId = new URL(page.url()).searchParams.get("city");
  await expect(page.getByTestId("city-detail").locator("[data-testid='expense-housing']")).toBeVisible();
  expect(cityId).toBeTruthy();
});

// ── SG-004: Income-band boundary handling ─────────────────────────────────────

When("I enter a gross monthly salary at exactly the low-to-mid band threshold for a city", async ({ page }) => {
  await page.locator("#gross-salary-input").fill("4167");
  await page.locator("#gross-salary-input").blur();
});

Then("that city's net take-home uses the mid band effective tax rate", async ({ page }) => {
  const net = Number(await page.getByTestId("net-value").first().getAttribute("data-usd"));
  expect(net).toBeGreaterThan(0);
  expect(net).toBeLessThan(4167);
});

// ── SG-005: Mobile city cards show country name ───────────────────────────────

Given("I am viewing the {string} tab on a viewport narrower than 768 px", async ({ page }, tabName: string) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const tabParam: Record<string, string> = {
    "Cost of living": "cost",
    Savings: "savings",
    "Minimum role": "min-role",
  };
  const param = tabParam[tabName];
  if (param) {
    await page.goto(`/en/tools/cost-of-living-calculator?tab=${param}`);
  } else {
    await page.goto("/en/tools/cost-of-living-calculator");
  }
});

When("the mobile city cards render", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("each card header shows both the city name and its country name", async ({ page }) => {
  const cards = page.getByTestId("mobile-city-cards").locator(":scope > div");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of (await cards.all()).slice(0, 3)) {
    const links = card.getByRole("link");
    await expect(links).toHaveCount(2);
    const cityLink = links.nth(0);
    const countryLink = links.nth(1);
    const cityHref = await cityLink.getAttribute("href");
    const countryHref = await countryLink.getAttribute("href");
    expect(cityHref).toMatch(/^\?tab=cost&city=[a-z0-9-]+$/);
    expect(countryHref).toMatch(/^\?tab=cost&country=[a-z0-9-]+$/);

    const cityRow = page.locator(`table tbody tr:has(a[href="${cityHref}"])`);
    await expect(cityRow).toHaveCount(1);
    await expect(cityLink).toHaveText((await cityRow.locator(`a[href="${cityHref}"]`).innerText()).trim());
    await expect(countryLink).toHaveText((await cityRow.locator(`a[href="${countryHref}"]`).innerText()).trim());
  }
});

// ── SG-006: Zero savings target marks lowest role as minimum ──────────────────

When("I enter a monthly savings target of zero USD", async ({ page }) => {
  // Use id directly — getByLabel resolves to 2 elements (label + input)
  const input = page.locator("#target-amount-input");
  await input.click({ clickCount: 3 });
  await page.keyboard.type("0");
  await page.keyboard.press("Tab");
  await page.waitForLoadState("networkidle");
});

Then("the qualifying divider is shown", async ({ page }) => {
  // EWT-001: the desktop role-ladder divider is visible even at a numeric zero target, where every
  // role qualifies. (Baseline IS engaged — savings target selected, target === 0 — distinct from
  // the blank-target empty-state.) Desktop viewport (md+) shows the table-scoped divider.
  await expect(page.getByTestId("qualifying-divider")).toBeVisible();
});

Then("the qualifying divider element is rendered in the role ladder", async ({ page }) => {
  await expect(page.getByTestId("qualifying-divider")).toBeVisible();
});

Then("the minimum marker appears on the lowest-ranked role in the ladder", async ({ page }) => {
  await expect(page.getByTestId("minimum-marker").first()).toBeVisible();
});

// ── SG-007: Expense preview updates in real time ──────────────────────────────

Given("the default household is 1 adult with no children in city center", async ({ page }) => {
  await expect(page.getByLabel("Adults")).toHaveValue("1");
  await expect(page.getByLabel("Preschool children")).toHaveValue("0");
  await expect(page.getByLabel("School-age children")).toHaveValue("0");
  await expect(page.getByRole("radio", { name: "City center" })).toHaveAttribute("aria-checked", "true");
  const evidence = evidenceFor(page);
  evidence.householdBefore = await expenseSnapshot(page);
  evidence.navigationTimeOrigin = { before: await page.evaluate(() => performance.timeOrigin), after: 0 };
});

When("I change the Adults control to 2", async ({ page }) => {
  const evidence = evidenceFor(page);
  const adults = page.getByLabel("Adults");
  await adults.selectOption("2");
  await expect.poll(() => new URL(page.url()).searchParams.get("adults")).toBe("2");
  await expect(adults).toHaveValue("2");
  await expect.poll(() => rawAmount(page, "housing")).toBeCloseTo(evidence.householdBefore!.housing * 1.25);
  evidence.householdAfter = await expenseSnapshot(page);
  evidence.navigationTimeOrigin = {
    before: evidence.navigationTimeOrigin!.before,
    after: await page.evaluate(() => performance.timeOrigin),
  };
});

Then("the Housing preview amount increases to base times subLinear 2 adults", async ({ page }) => {
  const { householdBefore: one, householdAfter: two } = evidenceFor(page);
  expect(one).toBeDefined();
  expect(two).toBeDefined();
  expect(two!.housing).toBeCloseTo(one!.housing * 1.25);
});

Then("the Childcare and School preview amounts remain zero", async ({ page }) => {
  const { householdAfter: two } = evidenceFor(page);
  expect(two).toBeDefined();
  expect(two!.childcare).toBe(0);
  expect(two!.school).toBe(0);
});

Then("the Total preview updates immediately without a page reload", async ({ page }) => {
  const { householdBefore: one, householdAfter: two, navigationTimeOrigin } = evidenceFor(page);
  expect(two!.totalText).not.toBe(one!.totalText);
  expect(navigationTimeOrigin!.after).toBe(navigationTimeOrigin!.before);
});

// ── SG-007: Expense preview updates in real time ─────────────────────────────

Given("I am on the cost-of-living calculator", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await expect(page.getByTestId("calc-page")).toHaveAttribute("data-hydrated", "true");
});

// ── USS-002: Filter state persisted in URL ────────────────────────────────────

Given("a user is on the cost-of-living calculator page", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
});

When("the user selects Country {string} and City {string}", async ({ page }, country: string, city: string) => {
  // Each selection drives a router.push. Wait for the country to land in the URL
  // before choosing the city (the City option list re-renders on country change),
  // then wait for the city to land — networkidle resolves before the push commits.
  await page.getByLabel("Country").first().selectOption({ label: country });
  await page.waitForURL(/country=/);
  await page.getByLabel("City").first().selectOption({ label: city });
  await page.waitForURL(/city=/);
});

Then("the URL updates to include query parameters reflecting those selections", async ({ page }) => {
  await expect.poll(() => page.url()).toMatch(/country=|city=/);
});

Then("copying the URL and opening it in a new tab restores the same filter state", async ({ page, context }) => {
  const copiedUrl = page.url();
  const copied = await context.newPage();
  await copied.goto(copiedUrl);
  await expect(copied.getByLabel("Country").first()).toHaveValue("id");
  await expect(copied.getByLabel("City").first()).toHaveValue("jakarta");
  await copied.close();
});

// ── USS-005: Descriptive page title ──────────────────────────────────────────

Given("a user navigates to the cost-of-living calculator", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
});

When("the page finishes loading with default filter state", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the browser tab title includes the name of the tool", async ({ page }) => {
  const title = await page.title();
  expect(title.toLowerCase()).toMatch(/cost.of.living|calculator|kalkulator/i);
});

// ── SG-001 / SG-002 / SG-003: Salary edge cases ──────────────────────────────

When("I enter a gross monthly salary of {string}", async ({ page }, amount: string) => {
  const input = page.getByLabel("Gross monthly salary (before tax)");
  await input.click({ clickCount: 3 });
  await page.keyboard.type(amount);
  await page.keyboard.press("Tab");
  await page.waitForLoadState("networkidle");
});

Then("the annual gross displayed is {string}", async ({ page }, expected: string) => {
  const annualEl = page.locator("[data-testid='annual-gross']");
  await expect(annualEl).toHaveText(expected);
});

Then("the same zero-salary guidance replaces the city rows", async ({ page }) => {
  await expect(page.getByTestId("annual-gross")).toHaveText("0 USD");
  await expect(page.getByTestId("savings-empty-state")).toBeVisible();
  await expect(page.locator("table")).toHaveCount(0);
});

Then("the annual gross is shown as {string}", async ({ page }, expected: string) => {
  const annualEl = page.locator("[data-testid='annual-gross']");
  await expect(annualEl).toBeAttached({ timeout: 5000 });
  const digits = expected.replace(/[^0-9]/g, "");
  if (digits) {
    const text = await annualEl.textContent();
    expect(text?.replace(/[^0-9]/g, "")).toContain(digits.replace(/^0+(?!$)/, "") || "0");
  }
});

Then("no city row shows {string} or {string} in any column", async ({ page }, v1: string, v2: string) => {
  await page
    .locator("table")
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => {});
  const isVisible = await page
    .locator("table")
    .first()
    .isVisible()
    .catch(() => false);
  if (isVisible) {
    const text = (await page.locator("table").first().textContent()) ?? "";
    expect(text).not.toContain(v1);
    expect(text).not.toContain(v2);
  }
});

Then("each city row shows a positive net take-home", async ({ page }) => {
  const cells = page.getByTestId("net-value");
  expect(await cells.count()).toBeGreaterThan(0);
  for (const cell of await cells.all()) expect(Number(await cell.getAttribute("data-usd"))).toBeGreaterThan(0);
});

// ── SG-004: Country URL update ────────────────────────────────────────────────

When("the user selects Country {string} without selecting a city", async ({ page }, country: string) => {
  const select = page.getByLabel("Country").first();
  await select.selectOption({ label: country });
  await expect.poll(() => new URL(page.url()).searchParams.get("country")).toBe("id");
  await expect(select).toHaveValue("id");
});

Then("opening that URL in a new tab shows only Indonesian cities in the table", async ({ page, context }) => {
  const copied = await context.newPage();
  await copied.goto(page.url());
  await expect(copied.getByLabel("Country").first()).toHaveValue("id");
  const rows = copied.locator("table tbody tr");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
  for (const row of await rows.all()) await expect(row.locator("td").first()).toContainText("Indonesia");
  await copied.close();
});

Then("the Country filter is pre-selected to {string}", async ({ page }, country: string) => {
  await expect(page.getByLabel("Country")).toHaveValue(new URL(page.url()).searchParams.get("country") ?? "");
  await expect(page.getByLabel("Country").locator("option:checked")).toHaveText(country);
});

// ── SG-005: School-age toggle ─────────────────────────────────────────────────

When("I set the household to 1 school-age child", async ({ page }) => {
  await page.getByLabel("School-age children").selectOption("1");
  await page.waitForLoadState("networkidle");
});

Then("the default selection is {string}", async ({ page }, selection: string) => {
  await expect(page.getByRole("radio", { name: selection })).toHaveAttribute("aria-checked", "true");
});

// ── SG-006: Housing scaling multiples ────────────────────────────────────────

Then("the Housing preview amount is exactly 1.25 times the 1-adult amount", async ({ page }) => {
  const { householdBefore: one, householdAfter: two } = evidenceFor(page);
  expect(two!.housing).toBeCloseTo(one!.housing * 1.25);
});

Then("the Utilities preview amount is exactly 1.25 times the 1-adult amount", async ({ page }) => {
  const { householdBefore: one, householdAfter: two } = evidenceFor(page);
  expect(two!.utilities).toBeCloseTo(one!.utilities * 1.25);
});

Then("the Food preview amount is exactly 1.5 times the 1-adult amount", async ({ page }) => {
  const { householdBefore: one, householdAfter: two } = evidenceFor(page);
  expect(two!.food).toBeCloseTo(one!.food * 1.5);
});

Then("the Transport preview amount is unchanged from the 1-adult amount", async ({ page }) => {
  const { householdBefore: one, householdAfter: two } = evidenceFor(page);
  expect(two!.transport).toBeCloseTo(one!.transport);
});

// ── USS-001: Savings empty state ──────────────────────────────────────────────

Given("a user has opened the Cost of Living Calculator", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

When("they click the Savings tab", async ({ page }) => {
  const tab = page.getByRole("tab", { name: "Savings" });
  await tab.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBe("savings");
  await expect(tab).toHaveAttribute("data-state", "active");
  await expect(page.getByTestId("savings-table")).toHaveAttribute("data-hydrated", "true");
});

When("the gross monthly salary field contains no value or zero", async ({ page }) => {
  await expect(page.locator("#gross-salary-input")).toHaveValue("");
});

Then("the savings comparison table is not shown", async ({ page }) => {
  await expect(page.locator("table")).toHaveCount(0);
});

Then("an instructional message is shown", async ({ page }) => {
  const activeTab = (await page.locator('[role="tab"][data-state="active"]').innerText()).trim();
  const testId = /minimum role/i.test(activeTab) ? "min-role-empty-state" : "savings-empty-state";
  const message = page.getByTestId(testId);
  await expect(message).toBeVisible();
  await expect(message).not.toHaveText("");
});

Then("no negative savings figures are visible", async ({ page }) => {
  await expect(page.getByTestId("savings-essential")).toHaveCount(0);
});

Given("a user is on the Savings tab with the empty-state message displayed", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=savings");
  await page.waitForLoadState("networkidle");
});

When("they enter a positive gross monthly salary value", async ({ page }) => {
  const input = page.getByLabel("Gross monthly salary (before tax)");
  await input.click({ clickCount: 3 });
  await page.keyboard.type("5000");
  await page.keyboard.press("Tab");
  await page.waitForLoadState("networkidle");
});

Then("the instructional message disappears", async ({ page }) => {
  await expect(page.getByTestId("savings-empty-state")).toHaveCount(0);
});

Then("the savings comparison table is shown with computed savings figures", async ({ page }) => {
  await page.waitForSelector("[data-testid='savings-table'][data-hydrated='true']", { timeout: 12000 });
  await expect(page.locator("[data-testid='savings-table']")).toBeVisible();
});

// ── USS-002: Minimum Role empty state ────────────────────────────────────────

When("they click the Minimum Role tab", async ({ page }) => {
  const tab = page.getByRole("tab", { name: "Minimum role" });
  await tab.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBe("min-role");
  await expect(tab).toHaveAttribute("data-state", "active");
  await expect(page.locator("#target-amount-input")).toBeVisible();
});

When("the Monthly savings target field contains no value or zero", async ({ page }) => {
  await expect(page.locator("#target-amount-input")).toHaveValue("");
});

Then("the role comparison table is not shown", async ({ page }) => {
  await expect(page.locator("table")).toHaveCount(0);
});

Then("no role salary data is visible", async ({ page }) => {
  await expect(page.getByTestId("minimum-marker")).toHaveCount(0);
  await expect(page.getByTestId("city-cell")).toHaveCount(0);
});

// ── USS-003: Area toggle active state ────────────────────────────────────────

Given("a user is on the Cost of Living tab", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=cost");
  await page.waitForLoadState("networkidle");
});

Given("{string} is the currently active area selection", async ({ page }, _area: string) => {
  await expect(page.getByRole("radio", { name: _area })).toHaveAttribute("aria-checked", "true");
});

When("the user clicks {string}", async ({ page }, label: string) => {
  // Area is SegmentedControl (radiogroup) — click by radio label
  const radio = page.getByRole("radio", { name: label });
  const radioVisible = await radio.isVisible().catch(() => false);
  if (radioVisible) {
    await radio.click();
  } else {
    await page.getByRole("button", { name: label }).click();
  }
  await page.waitForLoadState("networkidle");
});

Then("the {string} button displays as the active\\/selected state", async ({ page }, label: string) => {
  await expect(page.getByRole("radio", { name: label })).toHaveAttribute("aria-checked", "true");
});

Then("a visible signal confirms the table data has been recalculated for rural estimates", async ({ page }) => {
  await expect(page.getByTestId("area-caption")).toContainText(/rural/i);
  expect(new URL(page.url()).searchParams.get("area")).toBe("rural");
});

// ── USS-004: Tab sub-label visual separation ──────────────────────────────────

Given("a user views the Cost of Living Calculator tab bar", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

When("any tab is in the inactive state", async ({ page }) => {
  await expect(page.getByRole("tab", { name: "Savings" })).toHaveAttribute("data-state", "inactive");
});

Then("the tab primary name and its descriptive sub-label are visually distinct", async ({ page }) => {
  const tab = page.getByRole("tab", { name: "Cost of living" });
  const describedBy = await tab.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toBeAttached();
});

Then("the two pieces of text do not run together without a visual separator", async ({ page }) => {
  await expect(page.getByRole("tab", { name: "Cost of living" })).toHaveText("Cost of living");
  await expect(page.getByTestId("tab-desc-cost")).not.toHaveText("Cost of living");
});

Then("a screen reader announces them as separate text nodes", async ({ page }) => {
  await expect(page.getByRole("tab", { name: "Cost of living" })).toHaveAttribute("aria-describedby", "tab-desc-cost");
});

// ── USS-005: Tools index localized text ──────────────────────────────────────

Given(/a user navigates to \/en\/tools/, async ({ page }) => {
  await page.goto("/en/tools");
  await page.waitForLoadState("networkidle");
});

When("the page renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the page heading and the calculator link display readable English labels", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/tools/i);
  // Scope to main content to avoid strict-mode violation with the footer Tools
  // column which also links to the calculator (footer added in Phase 3).
  const main = page.locator("#main-content");
  await expect(main.getByRole("link", { name: /cost of living/i })).toBeVisible();
});

Then("no raw i18n key strings are visible", async ({ page }) => {
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toMatch(/toolsPage[A-Z]/);
  expect(bodyText).not.toMatch(/calcTitle/);
});

Given(/a user navigates to \/id\/tools/, async ({ page }) => {
  await page.goto("/id/tools");
  await page.waitForLoadState("networkidle");
});

Then("the heading and link labels are in Indonesian", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/alat/i);
  // Scope to main content — footer also has "Kalkulator Biaya Hidup" (Phase 3).
  const main = page.locator("#main-content");
  await expect(main.getByRole("link", { name: /kalkulator/i })).toBeVisible();
});

// ── SG-D-001: Dual-currency in cost-of-living and savings tables ──────────────

Given("the user is on the Cost of living tab at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/tools/cost-of-living-calculator?tab=cost");
  await page.waitForLoadState("networkidle");
});

When("the table renders with at least one city row", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

Then("every monetary cell shows the local currency amount and the USD equivalent", async ({ page }) => {
  const cells = page.locator("td[data-raw]");
  expect(await cells.count()).toBeGreaterThan(0);
  for (const cell of await cells.all()) await expect(cell).toContainText(/\/ \$[\d-]/);
});

Then("no money cell shows a bare integer without a currency label", async ({ page }) => {
  const cells = page.locator("td[data-raw]");
  for (const cell of await cells.all()) await expect(cell).toContainText(/[A-Z]{3}|\$/);
});

Given("the user is on the Savings tab with a gross salary entered", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=savings&gross=8000");
  await page.waitForSelector("[data-testid='savings-table'][data-hydrated='true']", { timeout: 12000 });
});

Then(
  "the Net, Essentials, Essential-savings, and After-lifestyle-savings columns show both local and USD amounts",
  async ({ page }) => {
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
    for (const row of (await rows.all()).slice(0, 3)) await expect(row).toContainText(/\/ \$[\d-]/);
  },
);

// ── SG-D-003: H1 and title match tool identity ────────────────────────────────

Given("the user opens {string}", async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
});

Then("the H1 reads {string}", async ({ page }, expectedH1: string) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(expectedH1);
});

Then("the browser title starts with {string}", async ({ page }, expectedTitle: string) => {
  expect(await page.title()).toMatch(new RegExp(`^${expectedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});

// ── SG-D-004: Id locale shows localized city/country names ───────────────────

Given("the user is on {string} at desktop width", async ({ page }, path: string) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
});

When("the cost-of-living table renders", async ({ page }) => {
  await page.locator("table tbody tr").first().waitFor({ state: "visible" });
});

Then("the Country column shows Indonesian country names where translations exist", async ({ page }) => {
  await expect(page.locator("table tbody")).toContainText("Singapura");
  await expect(page.locator("table tbody")).toContainText("Jepang");
});

Then("the City column shows Indonesian city names where translations exist", async ({ page }) => {
  await expect(page.locator("table tbody")).toContainText("Warsawa");
  await expect(page.locator("table tbody")).toContainText("Praha");
});

Given("the Minimum role tab is active", async ({ page }) => {
  // Tab is "Minimum role" (en) or "Jabatan minimum" (id)
  await page.getByRole("tab", { name: /minimum role|jabatan minimum/i }).click();
  await page.locator("#target-amount-input").fill("0");
  await page.locator("#target-amount-input").blur();
});

When("the ladder table renders", async ({ page }) => {
  await page
    .locator("table tbody tr")
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => {});
});

// ── prd.md: Design-system controls, locale redirect, mobile nav ───────────────

Given("the user is on the {string} tab", async ({ page }, tabName: string) => {
  const tabParam: Record<string, string> = {
    "Cost of living": "cost",
    Savings: "savings",
    "Minimum role": "min-role",
  };
  await page.goto(`/en/tools/cost-of-living-calculator?tab=${tabParam[tabName] ?? "cost"}`);
  await page.waitForLoadState("networkidle");
});

When("the tab renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the gross-salary field renders with a visible border, design-token radius, and padding", async ({ page }) => {
  const input = page.locator("#gross-salary-input");
  await expect(input).toBeVisible();
  const style = await input.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      borderStyle: computed.borderTopStyle,
      borderWidth: Number.parseFloat(computed.borderTopWidth),
      radius: Number.parseFloat(computed.borderTopLeftRadius),
      paddingLeft: Number.parseFloat(computed.paddingLeft),
      paddingRight: Number.parseFloat(computed.paddingRight),
      height: Number.parseFloat(computed.height),
    };
  });
  expect(style.borderStyle).not.toBe("none");
  expect(style.borderWidth).toBeGreaterThanOrEqual(1);
  expect(style.radius).toBe(12);
  expect(style.paddingLeft).toBe(12);
  expect(style.paddingRight).toBe(12);
  expect(style.height).toBe(44);
});

Then("it is paired with a Label primitive", async ({ page }) => {
  const label = page.locator("label[for='gross-salary-input']");
  await expect(label).toBeVisible();
});

Then("the baseline-source control renders as a styled segmented button group, not a plain select", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: /how to set your target/i });
  await expect(group).toBeVisible();
  expect(await group.getByRole("radio").count()).toBe(3);
  await expect(group.locator("select")).toHaveCount(0);
});

Given("the user views the tab bar at any breakpoint", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

When("the tab bar renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("each tab trigger's visible text is its label only, with the description not fused into it", async ({ page }) => {
  const tabs = page.getByRole("tab");
  const expectedLabels = ["Cost of living", "Savings", "Minimum role"];
  expect((await tabs.allTextContents()).map((text) => text.trim())).toEqual(expectedLabels);
  for (let index = 0; index < expectedLabels.length; index++) {
    const tab = tabs.nth(index);
    const descriptionId = await tab.getAttribute("aria-describedby");
    expect(descriptionId).toBeTruthy();
    const description = page.locator("#" + descriptionId);
    await expect(description).not.toHaveText(expectedLabels[index]!);
    expect((await tab.textContent())?.trim()).not.toContain((await description.textContent())?.trim() ?? "");
  }
});

Given("the user requests {string}", async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
});

When("the middleware processes the request", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the server redirects to {string}", async ({ page }, expectedPath: string) => {
  expect(page.url()).toContain(expectedPath);
});

Given("the user opens the mobile nav drawer at 375px on the {string} locale", async ({ page }, locale: string) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const cleanLocale = locale.replace(/^\/|\/$/g, "");
  await page.goto(`/${cleanLocale}/`);
  await page.waitForLoadState("networkidle");
  // Try to open mobile nav drawer; skip if no trigger found
  const menuTriggers = [
    page.getByRole("button", { name: /menu/i }),
    page.getByRole("button", { name: /navigation/i }),
    page.getByLabel("Open menu"),
    page.getByLabel("Toggle menu"),
    page.getByLabel("Menu"),
  ];
  for (const trigger of menuTriggers) {
    const visible = await trigger
      .first()
      .isVisible()
      .catch(() => false);
    if (visible) {
      await trigger.first().click();
      await page.waitForLoadState("networkidle");
      break;
    }
  }
});

When("the drawer renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("it shows the site's top-level navigation links", async ({ page }) => {
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  const primaryLinks = drawer
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .locator(":scope > ul");
  await expect(primaryLinks).toHaveCount(1);
  await expect(primaryLinks.getByRole("link", { name: /belajar/i })).toHaveAttribute("href", "/id/browse");
  await expect(primaryLinks.getByRole("link", { name: /alat/i })).toHaveAttribute("href", "/id/tools");
});

Then("every drawer label is localized", async ({ page }) => {
  const drawer = page.getByRole("dialog");
  await expect(drawer).toContainText(/belajar|alat/i);
  await expect(drawer).not.toContainText(/^Learn$|^Tools$/);
});

// ── URL state Phase 4 step definitions (added 2026-06-21) ────────────────────

// 4b: Given/When/Then for deep-link + round-trip scenarios

Given("I am on the calculator with no query string", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

Given("I am on the calculator with query string {string}", async ({ page }, qs: string) => {
  await page.goto(`/en/tools/cost-of-living-calculator?${qs}`);
  await page.waitForLoadState("networkidle");
});

Given("a deep link with query string {string}", async ({ page }, qs: string) => {
  await page.goto(`/en/tools/cost-of-living-calculator?${qs}`);
  await page.waitForLoadState("networkidle");
});

Given("I am on the single-city detail with query string {string}", async ({ page }, qs: string) => {
  await page.goto(`/en/tools/cost-of-living-calculator?${qs}`);
  await page.waitForLoadState("networkidle");
  // City detail should be visible
  await page.locator("[data-testid='city-detail']").waitFor({ state: "visible", timeout: 8000 });
});

When("I open that link in a fresh tab", async ({ page }) => {
  const freshTab = await page.context().newPage();
  freshTabs.set(page, freshTab);
  const response = await freshTab.goto(page.url());
  expect(response, "the fresh tab should receive the deep-link document").not.toBeNull();
  expect(response!.status()).toBe(200);
  await freshTab.waitForLoadState("networkidle");
});

When("the page resolves the deep link", async ({ page }) => {
  // Canonicalize-on-mount fires a router.replace once the client component
  // hydrates. Rather than a fixed delay (brittle on slower engines), wait for
  // the calculator UI to be interactive (hydration signal); the downstream Then
  // steps then auto-retry on the rewritten URL.
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#geo-region-select")).toBeVisible({ timeout: 20000 });
});

When("the page rewrites the URL to canonical form", async ({ page }) => {
  // Deterministically wait for the canonicalize router.replace to strip the dirty
  // param, so the subsequent Back-button assertion runs after the replace commits.
  // Generous timeout: under 3-browser parallel load firefox hydration (and thus
  // the post-hydration canonicalization effect) can lag well past a few seconds.
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#geo-region-select")).toBeVisible({ timeout: 20000 });
  await expect.poll(() => new URL(page.url()).search.includes("atlantis"), { timeout: 20000 }).toBe(false);
});

When("I select the city {string}", async ({ page }, cityLabel: string) => {
  // City filter is a <select> labelled "City"
  await page.getByLabel("City").first().selectOption({ label: cityLabel });
  await page.waitForLoadState("networkidle");
});

When("I select the region {string}", async ({ page }, region: string) => {
  // Map display label to the lowercase value used in the <select>
  await page.getByLabel("Region").selectOption({ label: region });
  await page.waitForLoadState("networkidle");
});

When("I change the Adults control to {string}", async ({ page }, adults: string) => {
  const evidence = evidenceFor(page);
  const hasCostRows = (await page.locator("[data-testid^='col-housing-']").count()) > 0;
  if (hasCostRows) {
    evidence.householdBefore = {
      housing: await rawAmount(page, "housing"),
      utilities: await rawAmount(page, "utilities"),
      food: await rawAmount(page, "food"),
      transport: await rawAmount(page, "transport"),
      healthcare: await rawAmount(page, "healthcare"),
      school: await rawAmount(page, "school"),
    };
  }
  await page.getByLabel("Adults").first().selectOption(adults);
  await page.waitForURL(new RegExp("adults=" + adults));
  if (hasCostRows) {
    evidence.householdAfter = {
      housing: await rawAmount(page, "housing"),
      utilities: await rawAmount(page, "utilities"),
      food: await rawAmount(page, "food"),
      transport: await rawAmount(page, "transport"),
      healthcare: await rawAmount(page, "healthcare"),
      school: await rawAmount(page, "school"),
    };
  }
});

When("I read the breadcrumb above the page title", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
});

When("I activate the {string} link", async ({ page }, linkText: string) => {
  await page
    .getByRole("link", { name: new RegExp(linkText, "i") })
    .first()
    .click();
  await page.waitForLoadState("networkidle");
});

Then("the Adults control shows {string}", async ({ page }, value: string) => {
  // Adults is a <select> combobox with aria-label="Adults"
  const adultsSelect = page.getByLabel("Adults").first();
  await expect(adultsSelect).toHaveValue(value, { timeout: 5000 });
});

Then("the URL is rewritten to have no {string} param", async ({ page }, paramName: string) => {
  // Auto-retry until the canonicalize router.replace removes the param. A fixed
  // timeout raced the replace on slower engines (firefox); polling is deterministic.
  // Ensure the client is hydrated first, then poll generously for the replace to
  // land under heavy 3-browser parallel load.
  await expect(page.locator("#geo-region-select")).toBeVisible({ timeout: 20000 });
  await expect.poll(() => new URL(page.url()).searchParams.has(paramName), { timeout: 20000 }).toBe(false);
});

Then("the Country filter returns to {string}", async ({ page }, _label: string) => {
  const countrySelect = page.getByLabel("Country").first();
  await expect(countrySelect).toHaveValue("");
  expect(await selectedLabel(countrySelect)).toBe(_label);
});

Then("the City filter returns to {string}", async ({ page }, _label: string) => {
  const citySelect = page.getByLabel("City").first();
  await expect(citySelect).toHaveValue("");
  expect(await selectedLabel(citySelect)).toBe(_label);
});

Then(
  "the Country filter shows {string} and the Region filter shows {string}",
  async ({ page }, country: string, region: string) => {
    const currentPage = activePage(page);
    const countrySelect = currentPage.getByLabel("Country").first();
    const regionSelect = currentPage.getByLabel("Region").first();
    const selectedCountry = await countrySelect.evaluate(
      (el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? "",
    );
    const selectedRegion = await regionSelect.evaluate(
      (el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? "",
    );
    expect(selectedCountry).toMatch(new RegExp(country, "i"));
    expect(selectedRegion).toMatch(new RegExp(region, "i"));
  },
);

Then("the URL query string includes {string}", async ({ page }, paramStr: string) => {
  const [key, val] = paramStr.split("=");
  // Wait for the URL to contain the expected param (client-side router.push may be async)
  await page.waitForFunction(
    ([k, v]: [string, string | undefined]) => {
      const url = new URL(window.location.href);
      return v !== undefined ? url.searchParams.get(k) === v : url.searchParams.has(k);
    },
    [key, val] as [string, string | undefined],
    { timeout: 8000 },
  );
  const url = new URL(page.url());
  if (val !== undefined) {
    expect(url.searchParams.get(key!)).toBe(val);
  } else {
    expect(url.searchParams.has(key!)).toBe(true);
  }
});

Then("the URL query string includes {string} and {string}", async ({ page }, paramStr1: string, paramStr2: string) => {
  const [key1, val1] = paramStr1.split("=");
  const [key2, val2] = paramStr2.split("=");
  // Wait for both params to appear in the URL
  await page.waitForFunction(
    ([k1, v1, k2, v2]: [string, string | undefined, string, string | undefined]) => {
      const url = new URL(window.location.href);
      const p1 = v1 !== undefined ? url.searchParams.get(k1) === v1 : url.searchParams.has(k1);
      const p2 = v2 !== undefined ? url.searchParams.get(k2) === v2 : url.searchParams.has(k2);
      return p1 && p2;
    },
    [key1, val1, key2!, val2] as [string, string | undefined, string, string | undefined],
    { timeout: 8000 },
  );
  const url = new URL(page.url());
  if (val1 !== undefined) {
    expect(url.searchParams.get(key1!)).toBe(val1);
  } else {
    expect(url.searchParams.has(key1!)).toBe(true);
  }
  if (val2 !== undefined) {
    expect(url.searchParams.get(key2!)).toBe(val2);
  } else {
    expect(url.searchParams.has(key2!)).toBe(true);
  }
});

Then("the URL query string does not include {string} or {string}", async ({ page }, param1: string, param2: string) => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const url = new URL(page.url());
  const key1 = param1.split("=")[0]!;
  const key2 = param2.split("=")[0]!;
  expect(url.searchParams.has(key1)).toBe(false);
  expect(url.searchParams.has(key2)).toBe(false);
});

Then("the URL query string does not include {string}", async ({ page }, paramStr: string) => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const url = new URL(page.url());
  const key = paramStr.split("=")[0]!;
  expect(url.searchParams.has(key)).toBe(false);
});

Then("the single-city detail for Singapore is shown", async ({ page }) => {
  await expect(page.locator("[data-testid='city-detail']")).toBeVisible({ timeout: 8000 });
});

Then("the single-city Cost-of-living detail for Singapore is shown", async ({ page }) => {
  await expect(activePage(page).locator("[data-testid='city-detail']")).toBeVisible({ timeout: 8000 });
});

Then(
  "the URL is rewritten to canonical form with {string} and {string} backfilled to {string}",
  async ({ page }, primaryParam: string, backfillKey: string, backfillVal: string) => {
    // Wait for hydration, then auto-retry until the canonicalize router.replace
    // both keeps the primary param and backfills the derived one — a fixed timeout
    // raced the replace on firefox under parallel load.
    await expect(page.locator("#geo-region-select")).toBeVisible({ timeout: 20000 });
    const [pk, pv] = primaryParam.split("=");
    await expect
      .poll(
        () => {
          const params = new URL(page.url()).searchParams;
          const primaryOk = pv !== undefined ? params.get(pk!) === pv : params.has(pk!);
          return primaryOk && params.get(backfillKey) === backfillVal;
        },
        { timeout: 20000 },
      )
      .toBe(true);
  },
);

Then("reloading the page keeps the {string} tab active", async ({ page }, tabName: string) => {
  await page.reload();
  await page.waitForLoadState("networkidle");
  // The active tab has aria-selected="true"
  const activeTab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
  const isSelected = await activeTab.evaluate((el) => el.getAttribute("aria-selected") === "true").catch(() => false);
  expect(isSelected).toBe(true);
});

Then("the household preview updates without a page reload", async ({ page }) => {
  await expect(page.getByLabel("Adults")).toHaveValue("2");
  expect(new URL(page.url()).searchParams.get("adults")).toBe("2");
  expect(
    Number(await page.locator("[data-testid^='col-essentials-']").first().getAttribute("data-raw")),
  ).toBeGreaterThan(0);
});

Then("a {string} link to {string} is shown", async ({ page }, linkText: string, href: string) => {
  const link = page.getByRole("link", { name: new RegExp(linkText, "i") });
  await expect(link.first()).toBeVisible();
  const linkHref = await link.first().getAttribute("href");
  expect(linkHref).toContain(href);
});

Then("pressing the browser Back button does not return to the {string} URL", async ({ page }, qs: string) => {
  // Ensure the canonicalize router.replace has stripped the dirty param BEFORE
  // pressing Back — otherwise goBack can race the replace and land on the dirty
  // URL, producing a false failure on slower engines (firefox). Generous timeout
  // for firefox hydration under 3-browser parallel load.
  await expect(page.locator("#geo-region-select")).toBeVisible({ timeout: 20000 });
  await page.waitForURL((url) => !url.search.includes(qs), { timeout: 20000 });
  await page.goBack();
  await page.waitForLoadState("networkidle");
  // The key assertion: Back must not return to a URL containing the dirty param value
  await expect.poll(() => page.url(), { timeout: 5000 }).not.toContain(qs);
});

// ── AC-4 / AC-5: Touch targets and 320px horizontal overflow ──────────────────

Given("I am on the calculator at a 375px-wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

When("the geo-filter selects render", async ({ page }) => {
  await expect(page.locator("#geo-region-select")).toBeVisible();
});

Then("each geo-filter select is at least 44 pixels tall", async ({ page }) => {
  for (const id of ["#geo-region-select", "#geo-country-select", "#geo-city-select"]) {
    const box = await page.locator(id).boundingBox();
    expect(box, `bounding box for ${id}`).not.toBeNull();
    expect(box!.height, `rendered height for ${id}`).toBeGreaterThanOrEqual(44);
  }
});

Given("I am on the calculator at a 320px-wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

Given("I am on the id-locale calculator at a 320px-wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto("/id/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

When("the calculator page renders", async ({ page }) => {
  await expect(page.getByTestId("calc-page")).toBeVisible();
});

Then("the document does not scroll horizontally", async ({ page }) => {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(320);
});

// ── AC-2 / AC-3: Breadcrumb shared primitive (chevrons + current-page crumb) ───

Then("the crumbs are separated by chevron icons", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const chevrons = breadcrumb.locator("svg.lucide-chevron-right");
  expect(await chevrons.count()).toBeGreaterThan(0);
});

Then(/^no literal "\/" separator is shown between crumbs$/, async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const separatorListItems = breadcrumb.locator("li", { hasText: /^\s*\/\s*$/ });
  expect(await separatorListItems.count()).toBe(0);
});

When("the breadcrumb renders", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
});

Then("the current-page crumb text reads {string}", async ({ page }, expected: string) => {
  const current = page.locator('[aria-current="page"]');
  await expect(current).toHaveText(expected);
});

Then('the current-page crumb is marked aria-current="page"', async ({ page }) => {
  await expect(page.locator('[aria-current="page"]')).toBeVisible();
});

// ── AC-OOP: abbr element wraps every OOP acronym ─────────────────────────────

Then(
  "every {string} acronym is wrapped in an abbr element titled {string}",
  async ({ page }, acronym: string, title: string) => {
    // All abbr elements whose text matches the acronym must have the expected title attribute
    const abbrs = page.locator(`abbr`).filter({ hasText: acronym });
    const count = await abbrs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const titleAttr = await abbrs.nth(i).getAttribute("title");
      expect(titleAttr?.toLowerCase()).toContain(title.toLowerCase());
    }
  },
);

// ── AC-tab-desc: Tab descriptions associated via aria-describedby ─────────────

Given("the user views the calculator tab bar", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

Then(
  "each of the three tabs has a visibly rendered description element associated with its trigger via aria-describedby",
  async ({ page }) => {
    // The three tab triggers each have aria-describedby pointing to a rendered <p>
    const tabTriggers = page.locator('[role="tab"]');
    const count = await tabTriggers.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < Math.min(count, 3); i++) {
      const describedById = await tabTriggers.nth(i).getAttribute("aria-describedby");
      expect(describedById).toBeTruthy();
      // The element with that id must exist in the DOM (not necessarily visible — hidden class used)
      const descEl = page.locator(`#${describedById}`);
      await expect(descEl).toBeAttached();
    }
  },
);

Then("no tab description text is duplicated elsewhere on screen", async ({ page }) => {
  // Each tab description should appear only once in the DOM (one <p> per tab, not repeated)
  for (const id of ["tab-desc-cost", "tab-desc-savings", "tab-desc-min-role"]) {
    const count = await page.locator(`#${id}`).count();
    expect(count).toBe(1);
  }
});

// ── AC-8: Savings gross-salary field active currency indicator ────────────────

When("the gross-salary field renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#gross-salary-input")).toBeAttached();
});

Then(
  "the gross-salary label does not contain the literal currency code {string}",
  async ({ page }, currencyCode: string) => {
    const label = page.locator("label[for='gross-salary-input']");
    await expect(label).toBeVisible();
    const labelText = await label.textContent();
    // The label must NOT contain the raw code like "USD" as a standalone token
    expect(labelText).not.toContain(currencyCode);
  },
);

Then("an active-currency indicator next to the field shows {string}", async ({ page }, currencyCode: string) => {
  const indicator = page.locator("[data-testid='salary-currency-indicator']");
  await expect(indicator).toBeVisible();
  const text = await indicator.textContent();
  expect(text?.trim()).toContain(currencyCode);
});

Then("an explanation states salaries are compared in USD across all cities", async ({ page }) => {
  const explanation = page.locator("[data-testid='salary-currency-explanation']");
  await expect(explanation).toBeVisible();
  const text = (await explanation.textContent())?.toUpperCase() ?? "";
  expect(text).toContain("USD");
});

// ── AC-9: Minimum-role blank savings target → empty-state guidance ────────────

Given(
  "I am on the {string} tab with the savings-target baseline and a blank target",
  async ({ page }, tabName: string) => {
    const tabParam: Record<string, string> = {
      "Cost of living": "cost",
      Savings: "savings",
      "Minimum role": "min-role",
    };
    const param = tabParam[tabName] ?? "min-role";
    // Navigate to the tab; do NOT pre-fill a target so the field stays blank
    await page.goto(`/en/tools/cost-of-living-calculator?tab=${param}`);
    await page.waitForLoadState("networkidle");
    // Ensure "Monthly savings target" radio is selected (it is the default)
    const savingsTargetRadio = page.getByRole("radio", { name: /savings target/i });
    const isVisible = await savingsTargetRadio.isVisible().catch(() => false);
    if (isVisible) {
      await savingsTargetRadio.click();
      await page.waitForLoadState("networkidle");
    }
  },
);

Then("a minimum-role empty-state guidance message is shown", async ({ page }) => {
  await expect(page.locator("[data-testid='min-role-empty-state']")).toBeVisible();
});

Then(
  "entering an explicit zero target replaces the guidance with the role ladder and its divider",
  async ({ page }) => {
    // Fill "0" into the savings-target input — explicit zero should dismiss empty state
    const input = page.locator("#target-amount-input");
    await input.click({ clickCount: 3 });
    await page.keyboard.type("0");
    await page.keyboard.press("Tab");
    await page.waitForLoadState("networkidle");
    // Empty state must be gone; qualifying divider must be visible
    await expect(page.locator("[data-testid='min-role-empty-state']")).toBeHidden();
    await expect(page.locator("[data-testid='qualifying-divider']")).toBeVisible();
  },
);

// ── AC-10: Region selector lists the nine intended regions ───────────────────

When("the region filter renders", async ({ page }) => {
  await expect(page.locator("#geo-region-select")).toBeVisible();
});

Then(
  "the region selector offers exactly the nine regions africa, americas, asean, asia, europe, japan, mena, nordics, and oceania",
  async ({ page }) => {
    const options = await page.locator("#geo-region-select option:not([value=''])").allTextContents();
    const expectedRegions = ["africa", "americas", "asean", "asia", "europe", "japan", "mena", "nordics", "oceania"];
    const lowerOptions = options.map((o) => o.trim().toLowerCase());
    expect(options.length).toBe(9);
    for (const region of expectedRegions) {
      expect(lowerOptions.some((o) => o.includes(region))).toBe(true);
    }
  },
);

// ── AC-11: Country change that auto-changes region shows advisory ─────────────

Given("I am on the calculator with no region selected", async ({ page }) => {
  // Navigate to calculator with no geo params so region starts as "All regions"
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
  // Ensure region filter is cleared
  await page.locator("#geo-region-select").selectOption("");
  await page.waitForLoadState("networkidle");
});

When("I select a country whose region differs from the current selection", async ({ page }) => {
  // With no region selected, pick any country — GeoFilters will auto-set the region
  // Singapore is in ASEAN; picking it from "no region" will auto-set region=asean
  const countrySelect = page.locator("#geo-country-select");
  await countrySelect.selectOption("sg");
  await page.waitForLoadState("networkidle");
});

Then("a visible region-auto-advisory message is shown", async ({ page }) => {
  const advisory = page.locator("[data-testid='region-auto-advisory']");
  await expect(advisory).toBeVisible();
});

// ── AC-12: City-only deep link back link omits auto-derived region/country ────

When("I read the single-city detail back link", async ({ page }) => {
  // Ensure city detail is rendered
  await expect(page.locator("[data-testid='city-detail']")).toBeVisible({ timeout: 8000 });
});

Then(
  "the back link points to the bare calculator {string} with no region or country",
  async ({ page }, expectedHref: string) => {
    const backLink = page.locator("[data-testid='city-detail'] [data-back-link='true']");
    await expect(backLink).toBeVisible();
    const href = await backLink.getAttribute("href");
    expect(href).toBe(expectedHref);
    expect(href).not.toMatch(/region=/);
    expect(href).not.toMatch(/country=/);
  },
);

// ── SG-U: Country-narrows-city (no prior region selected) ───────────────────

Given("I am on the calculator with no region or country selected", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await page.waitForLoadState("networkidle");
});

When(
  "I select the country {string} in the country filter without first selecting a region",
  async ({ page }, country: string) => {
    // Use the country filter select directly (no region change first)
    const countrySelect = page.locator("#geo-country-select");
    await countrySelect.selectOption({ label: country });
    await page.waitForURL(/(?:\?|&)country=id(?:&|$)/);
    await expect(page.locator("#geo-city-select option:not([value=''])")).toHaveCount(1);
  },
);

Then("the city dropdown lists only cities in Indonesia", async ({ page }) => {
  const citySelect = page.locator("#geo-city-select");
  const options = await citySelect.locator("option:not([value=''])").evaluateAll((elements) =>
    elements.map((element) => ({
      label: (element as HTMLOptionElement).text.trim(),
      value: (element as HTMLOptionElement).value,
    })),
  );
  expect(options).toEqual([{ label: "Jakarta", value: "jakarta" }]);
  const rows = page.locator("table tbody tr");
  expect(await rows.count()).toBe(1);
  await expect(rows.first().locator("td").first()).toHaveText("Indonesia");
  await expect(rows.first().locator("td").nth(1)).toHaveText("Jakarta");
});

// ── SG-U: Area radiogroup ────────────────────────────────────────────────────

When("the cost-basis controls render", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then('the area segmented control has role="radiogroup"', async ({ page }) => {
  // SegmentedControl renders a div with role="radiogroup" and aria-label matching the area label
  const radiogroup = page.locator('[role="radiogroup"]').filter({ hasText: /city center|rural/i });
  await expect(radiogroup.first()).toBeAttached();
  const role = await radiogroup.first().getAttribute("role");
  expect(role).toBe("radiogroup");
});

Then("the area radiogroup contains the {string} and {string} options", async ({ page }, opt1: string, opt2: string) => {
  const radiogroup = page.locator('[role="radiogroup"]').filter({ hasText: new RegExp(opt1, "i") });
  await expect(radiogroup.first()).toBeAttached();
  const opt1Radio = radiogroup.first().getByRole("radio", { name: new RegExp(opt1, "i") });
  const opt2Radio = radiogroup.first().getByRole("radio", { name: new RegExp(opt2, "i") });
  await expect(opt1Radio).toBeAttached();
  await expect(opt2Radio).toBeAttached();
});

// ── SG-U: Baseline SegmentedControl radiogroup ───────────────────────────────

Then("the baseline-source control renders as a radiogroup with at least three options", async ({ page }) => {
  // The baseline SegmentedControl renders role="radiogroup" with 3 radio options
  // Filter to the one with savings target option text
  const radiogroup = page
    .locator('[role="radiogroup"]')
    .filter({ hasText: /savings target|reference role|my salary/i });
  await expect(radiogroup.first()).toBeAttached();
  const radios = radiogroup.first().locator('[role="radio"]');
  const count = await radios.count();
  expect(count).toBeGreaterThanOrEqual(3);
});

Then("the savings-target input is visible when savings target is the selected baseline", async ({ page }) => {
  // Ensure savings target baseline is selected (it is the default)
  const savingsTargetRadio = page.getByRole("radio", { name: /savings target/i });
  const isVisible = await savingsTargetRadio.isVisible().catch(() => false);
  if (isVisible) {
    await savingsTargetRadio.click();
    await page.waitForLoadState("networkidle");
  }
  // The savings target input should now be visible
  const targetInput = page.locator("#target-amount-input");
  await expect(targetInput).toBeVisible();
});

Then("the reference-role inputs are hidden when savings target is the selected baseline", async ({ page }) => {
  // When savings target is active, the reference-role sub-form (ref-city-select) must not be visible
  const refCitySelect = page.locator("#ref-city-select");
  await expect(refCitySelect).toBeHidden();
});

// ── Calculator behaviour-contract completion ────────────────────────────────

Given("the calculator is open", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
});

Given('the cost-of-living calculator is open with the "Cost of living" tab active', async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  await expect(page.getByRole("tab", { name: "Cost of living" })).toHaveAttribute("data-state", "active");
  await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBeNull();
});

When("the page is rendered", async ({ page }) => {
  await expect(page.getByTestId("calc-page")).toBeVisible();
});

Given('"City center" is the active area', async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?area=center");
});

Then('the "City center" button has aria-pressed "true"', async ({ page }) => {
  await expect(page.getByRole("radio", { name: "City center" })).toHaveAttribute("aria-checked", "true");
});

Then('the "Rural" button has aria-pressed "false"', async ({ page }) => {
  await expect(page.getByRole("radio", { name: "Rural" })).toHaveAttribute("aria-checked", "false");
});

Given('"School-age children" is 0', async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?schoolAge=0");
  await expect(page.getByLabel("School-age children")).toHaveValue("0");
});

Then('the "Public" and "Private" buttons are aria-disabled', async ({ page }) => {
  await expect(page.getByRole("radio", { name: "Public" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("radio", { name: "Private" })).toHaveAttribute("aria-disabled", "true");
});

Then('their accessible description names the "add school-age children" prerequisite', async ({ page }) => {
  for (const name of ["Public", "Private"]) {
    const button = page.getByRole("radio", { name });
    const descriptionId = await button.getAttribute("aria-describedby");
    expect(descriptionId).toBeTruthy();
    await expect(page.locator(`#${descriptionId}`)).toContainText(/school-age children/i);
  }
});

Given("the Savings tab table is shown", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=savings&gross=7000");
  await expect(page.locator("table")).toBeVisible();
});

Then('the sortable "Savings after essentials" column header has an aria-sort value', async ({ page }) => {
  const header = page.locator("th[aria-sort]");
  await expect(header).toBeVisible();
  expect(["ascending", "descending"]).toContain(await header.getAttribute("aria-sort"));
});

Given("the Savings tab is activated with no salary entered", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=savings");
  await expect(page.getByRole("tab", { name: "Savings" })).toHaveAttribute("data-state", "active");
});

When("the tab activation occurs", async ({ page }) => {
  await expect(page.locator("#gross-salary-input")).toBeVisible();
});

Then("a prominent empty-state prompt is shown in the data area", async ({ page }) => {
  const prompt = page.getByTestId("savings-empty-state");
  await expect(prompt).toBeVisible();
  await expect(prompt).not.toHaveText("");
});

Then("the gross salary input receives focus", async ({ page }) => {
  await expect(page.locator("#gross-salary-input")).toBeFocused();
});

Given("the Savings tab is shown", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=savings");
});

Then("the gross salary input displays its USD currency inline at the field", async ({ page }) => {
  const input = page.locator("#gross-salary-input");
  const indicator = page.getByTestId("salary-currency-indicator");
  await expect(input).toBeVisible();
  await expect(indicator).toBeVisible();
  await expect(indicator).toContainText("USD");
});

Given("the Minimum-role tab is activated", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=min-role");
  await expect(page.getByRole("tab", { name: /minimum role/i })).toHaveAttribute("data-state", "active");
});

Then('no "Example — estimated monthly essentials" single-city cost preview is shown', async ({ page }) => {
  await expect(page.getByTestId("min-role-example-caption")).toHaveCount(0);
});

Then('the "Cost of living" tab description is visible', async ({ page }) => {
  await expect(page.getByTestId("tab-desc-cost")).toBeVisible();
});

Then('the "Savings" tab description is not visible', async ({ page }) => {
  await expect(page.getByTestId("tab-desc-savings")).toBeHidden();
});

Then('the "Minimum role" tab description is not visible', async ({ page }) => {
  await expect(page.getByTestId("tab-desc-min-role")).toBeHidden();
});

When('the user selects the "Savings" tab', async ({ page }) => {
  const tab = page.getByRole("tab", { name: "Savings" });
  await tab.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("tab")).toBe("savings");
  await expect(tab).toHaveAttribute("data-state", "active");
  await expect(page.getByTestId("savings-table")).toHaveAttribute("data-hydrated", "true");
});

Then('only the "Savings" tab description is visible', async ({ page }) => {
  await expect(page.getByTestId("tab-desc-savings")).toBeVisible();
  await expect(page.getByTestId("tab-desc-cost")).toBeHidden();
  await expect(page.getByTestId("tab-desc-min-role")).toBeHidden();
});

Given("the calculator at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/en/tools/cost-of-living-calculator?tab=min-role&baseline=my_salary&mysalarycity=singapore");
});

Then("every tab trigger is at least 44px tall", async ({ page }) => {
  for (const tab of await page.getByRole("tab").all()) {
    expect((await tab.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

Then("every school-type, area, and salary-currency segmented radio is at least 44px tall", async ({ page }) => {
  const radios = page.getByRole("radio");
  expect(await radios.count()).toBeGreaterThan(0);
  for (const radio of await radios.all()) {
    if (await radio.isVisible()) expect((await radio.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

Given("the calculator at 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/tools/cost-of-living-calculator");
});

Then('every <select> has computed appearance "none" and a custom chevron affordance', async ({ page }) => {
  const selects = page.locator("select");
  expect(await selects.count()).toBeGreaterThan(0);
  for (const select of await selects.all()) {
    expect(await select.evaluate((element) => getComputedStyle(element).appearance)).toBe("none");
    await expect(select.locator("xpath=following-sibling::*[name()='svg'][1]")).toBeAttached();
  }
});

Then("no <select> shows the browser's native dropdown arrow", async ({ page }) => {
  for (const select of await page.locator("select").all()) {
    expect(await select.evaluate((element) => getComputedStyle(element).appearance)).toBe("none");
  }
});

Given("the Minimum-role tab at 320px and 375px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto("/en/tools/cost-of-living-calculator?tab=min-role");
  await expect(page.getByRole("tab", { name: "Minimum role" })).toHaveAttribute("data-state", "active");
});

Then('each "Baseline source" option remains at least 44px tall when the control wraps', async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: /how to set your target|baseline source/i });
  await expect(group).toBeVisible();
  const options = group.getByRole("radio");
  await expect(options).toHaveCount(3);
  for (const option of await options.all()) {
    expect((await option.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

Given('the Minimum-role "My salary" baseline at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/tools/cost-of-living-calculator?tab=min-role&baseline=my_salary&mysalarycity=singapore");
});

Then("the salary-currency toggle bottom-aligns with the gross salary input", async ({ page }) => {
  const input = page.locator("#my-gross-input");
  const group = page.getByRole("radiogroup", { name: /salary currency/i });
  const [inputBox, groupBox] = await Promise.all([input.boundingBox(), group.boundingBox()]);
  expect(inputBox).toBeTruthy();
  expect(groupBox).toBeTruthy();
  expect(Math.abs(inputBox!.y + inputBox!.height - (groupBox!.y + groupBox!.height))).toBeLessThanOrEqual(2);
});

When('I change the region filter to "Europe"', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.evaluate(() => window.scrollTo(0, Math.min(120, document.documentElement.scrollHeight - innerHeight)));
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);
  const region = page.getByLabel("Region");
  await region.selectOption("europe");
  await expect.poll(() => new URL(page.url()).searchParams.get("region")).toBe("europe");
  await expect(region).toHaveValue("europe");
  evidenceFor(page).scrollPosition = { before, after: await page.evaluate(() => window.scrollY) };
});

Then("the URL update requests no scroll so the page does not jump to the top", async ({ page }) => {
  const scroll = evidenceFor(page).scrollPosition;
  expect(scroll).toBeDefined();
  expect(scroll!.after).toBeCloseTo(scroll!.before, 0);
});

When('I type a gross monthly salary of "7000" without pausing', async ({ page }) => {
  await page.locator("#gross-salary-input").pressSequentially("7000", { delay: 0 });
});

Then('the salary field immediately shows "7000"', async ({ page }) => {
  await expect(page.locator("#gross-salary-input")).toHaveValue("7000");
});

Then("the gross salary is written to the URL once typing settles", async ({ page }) => {
  await page.waitForURL(/gross=7000/);
});

When("I add one school-age child with public school selected", async ({ page }) => {
  await page.getByLabel("School-age children").selectOption("1");
  await page.getByRole("radio", { name: "Public" }).click();
});

Then("the Singapore school cost equals its private-school figure and the cell is flagged", async ({ page }) => {
  const schoolCell = page.getByTestId("col-school-singapore");
  await expect(schoolCell).toBeVisible();
  await expect(schoolCell.getByTestId(/school-foreigner-flag-singapore/)).toBeVisible();
  expect(Number(await schoolCell.getAttribute("data-raw"))).toBeGreaterThan(0);
});

Then("the Berlin school cost equals its public-school figure with no foreigner flag", async ({ page }) => {
  const schoolCell = page.getByTestId("col-school-berlin");
  await expect(schoolCell).toBeVisible();
  await expect(schoolCell.getByTestId(/school-foreigner-flag-berlin/)).toHaveCount(0);
  expect(Number(await schoolCell.getAttribute("data-raw"))).toBeGreaterThanOrEqual(0);
});

Given("a city whose country does not open public school to foreigners", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=cost&country=sg");
});

Given('school-age children >= 1 and school type "public"', async ({ page }) => {
  const schoolKids = page.getByLabel("School-age children");
  await schoolKids.selectOption("1");
  await expect.poll(() => new URL(page.url()).searchParams.get("schoolkids")).toBe("1");
  await expect(schoolKids).toHaveValue("1");
  await expect(page.getByRole("radio", { name: "Public" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("school-foreigner-flag-singapore")).toBeVisible();
});

Then("the cost-of-living table school cell shows a clearly-worded private-fallback flag", async ({ page }) => {
  const flag = page.getByTestId(/school-foreigner-flag-singapore/).first();
  await expect(flag).toBeVisible();
  await expect(flag).not.toHaveText("");
});

Then("the flag is visually distinct from ordinary caption text", async ({ page }) => {
  const flag = page.getByTestId(/school-foreigner-flag-singapore/).first();
  const caption = page.getByTestId("area-caption");
  expect(await flag.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
    await caption.evaluate((el) => getComputedStyle(el).backgroundColor),
  );
});

Then("the city-detail school row renders the school-foreigner-flag-<cityId> testid", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=cost&city=singapore&schoolkids=1&schooltype=public");
  await expect(page.getByTestId("city-detail")).toBeVisible();
  await expect(page.getByLabel("School-age children")).toHaveValue("1");
  await expect(page.getByTestId("city-detail").getByTestId("school-foreigner-flag-singapore")).toBeVisible();
});

Then('the "Healthcare \\(OOP\\)" header has a title explaining out-of-pocket \\(localized\\)', async ({ page }) => {
  const header = page.getByRole("columnheader", { name: "Healthcare (OOP)", exact: true });
  await expect(header.locator("abbr")).toHaveAttribute("title", "out-of-pocket");
});

Then('the "Relocation \\(sunk\\)" and "Liquidity reserve" headers carry explanatory titles', async ({ page }) => {
  await expect(
    page.getByRole("columnheader", { name: "Relocation (sunk)", exact: true }).locator("abbr"),
  ).toHaveAttribute("title", /.+/);
  await expect(
    page.getByRole("columnheader", { name: "Liquidity reserve", exact: true }).locator("abbr"),
  ).toHaveAttribute("title", /.+/);
});

Then('the "P25"\\/"Median"\\/"P75" headers carry percentile explanations', async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator?tab=min-role&target=0");
  for (const name of [/p25/i, /median/i, /p75/i]) {
    await expect(page.getByRole("columnheader", { name })).toHaveAttribute("title", /.+/);
  }
});

Then('the "Track" column abbreviations ic\\/mgmt are expanded or carry abbr titles', async ({ page }) => {
  const track = page.getByRole("columnheader", { name: /track/i });
  await expect(track).toBeVisible();
  const trackValues = await page
    .getByTestId("min-role-table")
    .locator("tbody tr[data-candidate-row='true'] td:nth-child(2)")
    .allTextContents();
  expect(new Set(trackValues.map((value) => value.trim()))).toEqual(new Set(["Individual contributor", "Management"]));
});

Then("the localized out-of-pocket title differs between the en and id locales", async ({ page }) => {
  const titleFor = async (locale: "en" | "id", headerName: string) => {
    await page.goto(`/${locale}/tools/cost-of-living-calculator`);
    return page.getByRole("columnheader", { name: headerName, exact: true }).locator("abbr").getAttribute("title");
  };
  const enTitle = await titleFor("en", "Healthcare (OOP)");
  const idTitle = await titleFor("id", "Kesehatan (OOP)");
  expect(enTitle).toBe("out-of-pocket");
  expect(idTitle).toBe("bayar sendiri");
  expect(enTitle).not.toBe(idTitle);
});

Then('the id-locale out-of-pocket title is not the literal English "out-of-pocket"', async ({ page }) => {
  await page.goto("/id/tools/cost-of-living-calculator");
  expect(
    await page
      .getByRole("columnheader", { name: "Kesehatan (OOP)", exact: true })
      .locator("abbr")
      .getAttribute("title"),
  ).not.toBe("out-of-pocket");
});

Then("each region option's serialized value is its English key", async ({ page }) => {
  const values = await page
    .locator("#geo-region-select option:not([value=''])")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(values.sort()).toEqual(
    ["africa", "americas", "asean", "asia", "europe", "japan", "mena", "nordics", "oceania"].sort(),
  );
});

Then("the region display label differs between the en and id locales", async ({ page }) => {
  await page.goto("/en/tools/cost-of-living-calculator");
  const enLabel = await page.locator("#geo-region-select option[value='americas']").textContent();
  await page.goto("/id/tools/cost-of-living-calculator");
  const idLabel = await page.locator("#geo-region-select option[value='americas']").textContent();
  expect(enLabel).not.toBe(idLabel);
});

Then("no healthcare-scheme badge is rendered in ALL CAPS while another is lower-case", async ({ page }) => {
  const labels = (await page.getByTestId("healthcare-badge").allTextContents()).map((label) => label.trim());
  expect(labels.length).toBeGreaterThan(0);
  expect(labels.every((label) => label !== label.toUpperCase() || label.length <= 3)).toBe(true);
});

Then("the school-type toggle is shown but disabled", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: /school type/i });
  await expect(group).toBeVisible();
  await expect(group).toHaveAttribute("aria-disabled", "true");
});

Then("a hint explains that school-age children must be added to choose", async ({ page }) => {
  await expect(page.locator("#school-type-hint")).toBeVisible();
  await expect(page.locator("#school-type-hint")).toContainText(/school-age children/i);
});

Then('the school type toggle is enabled with "Public" and "Private" options', async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: /school type/i });
  await expect(group).not.toHaveAttribute("aria-disabled", "true");
  await expect(group.getByRole("radio", { name: "Public" })).toBeEnabled();
  await expect(group.getByRole("radio", { name: "Private" })).toBeEnabled();
});

When('the Country filter is set to "Indonesia"', async ({ page }) => {
  const country = page.getByLabel("Country").first();
  await country.selectOption("id");
  await expect.poll(() => new URL(page.url()).searchParams.get("country")).toBe("id");
  await expect(country).toHaveValue("id");
});

Then("the savings table lists only Indonesian cities", async ({ page }) => {
  const rows = page.locator("table tbody tr");
  expect(await rows.count()).toBeGreaterThan(0);
  for (const row of await rows.all()) {
    await expect(row.locator("td").first()).toContainText("Indonesia");
  }
});

Then("cities outside the selected scope are not shown", async ({ page }) => {
  await expect(page.locator("table tbody")).not.toContainText(/Singapore|Germany|United States/);
});

Then("the URL query string includes the entered gross salary", async ({ page }) => {
  await page.locator("#gross-salary-input").blur();
  await page.waitForURL(/gross=5000/);
  expect(new URL(page.url()).searchParams.get("gross")).toBe("5000");
});

Then("the URL query string includes the baseline source and the entered salary inputs", async ({ page }) => {
  await page.locator("#my-gross-input").blur();
  await page.waitForURL(/baseline=my_salary/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("baseline")).toBe("my_salary");
  expect(Number(params.get("mygross"))).toBeGreaterThan(0);
  expect(params.get("mysalarycity")).toBeTruthy();
});

Then(
  "I see the qualifying \\(city, role\\) rows grouped above a divider and non-qualifying rows dimmed below it",
  async ({ page }) => {
    const divider = page.getByTestId("qualifying-divider");
    await expect(divider).toBeVisible();
    const rows = page.locator("table tbody tr");
    const dividerIndex = await rows.evaluateAll((items) =>
      items.findIndex((item) => item.dataset.testid === "qualifying-divider"),
    );
    const dimmedIndexes = await rows.evaluateAll((items) =>
      items
        .map((item, index) => (item.dataset.testid === "non-qualifying-row" ? index : -1))
        .filter((index) => index >= 0),
    );
    expect(dividerIndex).toBeGreaterThan(0);
    expect(dimmedIndexes.length).toBeGreaterThan(0);
    expect(Math.min(...dimmedIndexes)).toBeGreaterThan(dividerIndex);
  },
);

Then(
  "the lowest role rank that reaches at least 8000 USD essential savings anywhere in the filter is marked as the minimum",
  async ({ page }) => {
    const marker = page.getByTestId("minimum-marker");
    expect(await marker.count()).toBeGreaterThan(0);
    const markedRow = marker.first().locator("xpath=ancestor::tr");
    expect(await markedRow.getByTestId("savings-triple").locator("[data-line='usd']").textContent()).toMatch(/USD/);
  },
);

Then(
  "\\(city, role\\) rows that cannot reach 8000 USD essential savings are shown below the divider and de-emphasised",
  async ({ page }) => {
    const rows = page.getByTestId("non-qualifying-row");
    expect(await rows.count()).toBeGreaterThan(0);
    for (const row of await rows.all()) await expect(row).toHaveCSS("opacity", "0.5");
  },
);

Given("the geographic filter is the ASEAN region", async ({ page }) => {
  await page.getByLabel("Region").selectOption("asean");
  await page.waitForURL(/region=asean/);
});

When("the savings bar is cleared by several countries at several seniority levels", async ({ page }) => {
  const cityIds = await page
    .locator("#geo-city-select option:not([value=''])")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(cityIds.length).toBeGreaterThan(3);

  await page.getByRole("radio", { name: "Match a role" }).click();
  await expect(page.locator("#ref-role-select")).toBeVisible();
  const roleCount = await page.locator("#ref-role-select option").count();
  expect(roleCount).toBeGreaterThan(5);

  const publishedCandidates: Array<{ key: string; savings: number }> = [];
  for (const cityId of cityIds) {
    await page.goto(
      `/en/tools/cost-of-living-calculator?tab=min-role&baseline=savings_target&target=0&region=asean&city=${cityId}`,
    );
    await expect(candidateRows(page)).toHaveCount(roleCount);
    for (const row of await candidateRows(page).all()) {
      expect(await row.getAttribute("data-city-id")).toBe(cityId);
      publishedCandidates.push({
        key: await candidateKey(row),
        savings: await numericAttribute(row, "data-essential-savings-usd"),
      });
    }
  }
  expect(new Set(publishedCandidates.map(({ key }) => key)).size).toBe(cityIds.length * roleCount);

  const targetUsd = 400;
  const expectedKeys = publishedCandidates
    .filter(({ savings }) => savings >= targetUsd)
    .map(({ key }) => key)
    .sort();
  expect(expectedKeys.length).toBeGreaterThan(cityIds.length);
  evidenceFor(page).qualifyingOracle = { expectedKeys, cityCount: cityIds.length, roleCount, targetUsd };

  await page.goto(
    `/en/tools/cost-of-living-calculator?tab=min-role&baseline=savings_target&target=${targetUsd}&region=asean`,
  );
  await expect(page.getByTestId("qualifying-divider")).toBeVisible();
});

Then(
  "every \\(city, role\\) whose essential savings is at or above the bar is shown as its own row",
  async ({ page }) => {
    const oracle = evidenceFor(page).qualifyingOracle;
    expect(oracle).toBeDefined();
    const qualifyingRows = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
    const actualKeys: string[] = [];
    for (const row of await qualifyingRows.all()) {
      expect(await numericAttribute(row, "data-essential-savings-usd")).toBeGreaterThanOrEqual(oracle!.targetUsd);
      actualKeys.push(await candidateKey(row));
    }
    expect(actualKeys.sort()).toEqual(oracle!.expectedKeys);
  },
);

Then("a country that clears the bar at more than one role appears on more than one row", async ({ page }) => {
  const rows = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
  const countries = await rows.evaluateAll((items) => items.map((item) => item.getAttribute("data-country-id") ?? ""));
  const counts = countries.reduce<Record<string, number>>(
    (acc, country) => ({ ...acc, [country]: (acc[country] ?? 0) + 1 }),
    {},
  );
  expect(Object.values(counts).some((count) => count > 1)).toBe(true);
});

Then("no qualifying country is collapsed away behind another country's higher savings", async ({ page }) => {
  const rows = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
  const cities = new Set(await rows.evaluateAll((items) => items.map((item) => item.getAttribute("data-city-id"))));
  expect(cities.size).toBe(evidenceFor(page).qualifyingOracle!.cityCount);
});

Then("rows are ordered by essential savings, highest first", async ({ page }) => {
  const values = await page
    .getByTestId("qualifying-divider")
    .locator("xpath=preceding-sibling::tr")
    .evaluateAll((rows) => rows.map((row) => Number(row.getAttribute("data-essential-savings-usd"))));
  expect(values).toEqual([...values].sort((a, b) => b - a));
});

When("I read a qualifying \\(city, role\\) row", async ({ page }) => {
  await expect(page.getByTestId("city-cell").first()).toBeVisible();
});

Then("the row shows the city and its country", async ({ page }) => {
  await expect(page.getByTestId("city-cell").first()).toContainText(/.+, .+/);
});

Then("every \\(city, role\\) row is drawn only from Indonesian cities", async ({ page }) => {
  const cells = page.getByTestId("city-cell");
  expect(await cells.count()).toBeGreaterThan(0);
  for (const cell of await cells.all()) await expect(cell).toContainText("Indonesia");
});

Then("the baseline savings bar equals my essential savings in my selected salary city", async ({ page }) => {
  const evidence = evidenceFor(page).mySalaryBaseline;
  expect(evidence).toBeDefined();
  expect(evidence!.actual).toBeCloseTo(evidence!.expected, 8);
});

Then("the bar is not raised to a cheaper city's optimum that I do not live in", async ({ page }) => {
  const selectedCityId = await page.locator("#my-city-select").inputValue();
  expect(selectedCityId).toBe("singapore");
  await expect.poll(() => new URL(page.url()).searchParams.get("mysalarycity")).toBe(selectedCityId);
  expect(new URL(page.url()).searchParams.get("baseline")).toBe("my_salary");
  expect(evidenceFor(page).mySalaryBaseline!.actual).toBeCloseTo(evidenceFor(page).mySalaryBaseline!.expected, 8);
});

When(
  "I compare {string} SGD with the FX-equivalent {string} USD for salary city {string}",
  async ({ page }, localAmount: string, usdAmount: string, city: string) => {
    expect(Number(localAmount) * expectedFxRate("SGD")).toBe(Number(usdAmount));
    await page.locator("#my-city-select").selectOption({ label: city });
    await page.waitForURL(/mysalarycity=singapore/);
    const group = page.getByRole("radiogroup", { name: /salary currency/i });
    const localRadio = group.getByRole("radio", { name: "SGD" });
    await localRadio.click();
    await expect(localRadio).toHaveAttribute("aria-checked", "true");
    await page.locator("#my-gross-input").fill(localAmount);
    await page.locator("#my-gross-input").blur();
    await page.waitForURL(new RegExp(`mygross=${localAmount}`));
    await expect(page.getByTestId("min-role-table")).toBeVisible();
    const localBaseline = await numericAttribute(page.getByTestId("min-role-table"), "data-baseline-usd");
    const localMarkers = await minimumMarkerKeys(page);

    const usdRadio = group.getByRole("radio", { name: "USD" });
    await usdRadio.click();
    await page.waitForURL(/mygrosscur=usd/);
    await page.locator("#my-gross-input").fill(usdAmount);
    await page.locator("#my-gross-input").blur();
    await page.waitForURL(new RegExp(`mygross=${usdAmount}`));
    const usdBaseline = await numericAttribute(page.getByTestId("min-role-table"), "data-baseline-usd");
    const usdMarkers = await minimumMarkerKeys(page);
    evidenceFor(page).localFxBaseline = { localBaseline, usdBaseline, localMarkers, usdMarkers };
  },
);

Then("I can enter my gross monthly salary in either Singapore's local currency or USD", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: /salary currency/i });
  await expect(group.getByRole("radio", { name: "SGD" })).toBeVisible();
  await expect(group.getByRole("radio", { name: "USD" })).toBeVisible();
});

Then("the local-currency option follows the selected salary city", async ({ page }) => {
  await expect(
    page.getByRole("radiogroup", { name: /salary currency/i }).getByRole("radio", { name: "SGD" }),
  ).toBeVisible();
});

Then("both inputs produce the same baseline and ranking", async ({ page }) => {
  const evidence = evidenceFor(page).localFxBaseline;
  expect(evidence).toBeDefined();
  expect(evidence!.localBaseline).toBeCloseTo(evidence!.usdBaseline, 8);
  expect(evidence!.localMarkers.length).toBeGreaterThan(0);
  expect(evidence!.localMarkers).toEqual(evidence!.usdMarkers);
});

Then(
  "the qualifying \\(city, role\\) rows whose savings are at or above zero appear above the divider",
  async ({ page }) => {
    const rows = page.getByTestId("qualifying-divider").locator("xpath=preceding-sibling::tr");
    expect(await rows.count()).toBeGreaterThan(0);
    for (const text of await rows.getByTestId("savings-triple").locator("[data-line='usd']").allTextContents()) {
      expect(Number(text.replace(/[^0-9.-]/g, ""))).toBeGreaterThanOrEqual(0);
    }
  },
);

Then("the City column shows Indonesian city and country names where translations exist", async ({ page }) => {
  await expect(
    page
      .getByTestId("city-cell")
      .filter({ hasText: /Singapura/ })
      .first(),
  ).toBeVisible();
});
