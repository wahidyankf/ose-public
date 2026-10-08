import path from "path";
import { readFileSync } from "fs";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";

// The page reads its locale from useParams() and its state from useSearchParams(). `navState`
// holds both so each scenario can set them before rendering; `router.push` records the URL it
// was given, and `followPush()` applies it and re-renders, standing in for a navigation.
const { navState } = vi.hoisted(() => ({
  navState: { locale: "en" as string, search: "" as string, lastPush: undefined as string | undefined },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: navState.locale }),
  useSearchParams: () => new URLSearchParams(navState.search),
  useRouter: () => ({
    push: (url: string) => {
      navState.lastPush = url;
    },
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/en/tools/ai-benchmark",
  notFound: vi.fn(),
}));

import "./helpers/test-setup";
import AiBenchmarkPage from "@/app/[locale]/tools/ai-benchmark/page";
import {
  BENCHMARK_SPECS,
  DEFAULT_SUBSTITUTE_HARNESS,
  FRONTIER_VENDORS,
  HARNESS_DISPLAY_NAMES,
  HARNESS_IN_HOUSE_LINES,
  METHOD_EXAMPLE,
  MIN_SCORED_BENCHMARKS,
  NEAREST_OPTION_COUNT,
  ROSTER_CATALOG_HARNESSES,
  SUBSTITUTE_HARNESSES,
  TIERS,
  TIER_ANCHORS,
  rosterScopeParams,
} from "@/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import { OPERATORS, operatorById } from "@/features/ai-benchmark/core/data/operators";
import type { HarnessId, Model, Tier } from "@/features/ai-benchmark/core/data/types";
import { HARNESS_IDS, filterModels } from "@/features/ai-benchmark/core/filter";
import { blendedPrice, priceRatio } from "@/features/ai-benchmark/core/price";
import { compositeIndex, scoreOver, scoredBenchmarks, scoredFigure } from "@/features/ai-benchmark/core/score";
import { frontierModels, substitutesFor, type SubstituteResult } from "@/features/ai-benchmark/core/substitute";
import {
  assignTier,
  byIndexDesc,
  computeTierGroups,
  meetsAnchor,
  scoreModels,
  tierAnchors,
} from "@/features/ai-benchmark/core/tiers";
import {
  formatDate,
  formatIndex,
  formatPercent,
  formatUsd,
  priceComparison,
  tf,
} from "@/features/ai-benchmark/shell/format";
import { TIER_BG_CLASS, tierLabel } from "@/features/ai-benchmark/shell/tier-style";
import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";
import {
  anchors,
  dataset as fixtureDataset,
  fig,
  flat,
  goModel,
  harnessModel,
  model,
  price,
} from "../features/ai-benchmark/core/fixtures";

// vitest-cucumber bindings for the AI benchmark feature. Scoring rules bind to the pure core with
// fixture data; page scenarios render the real route in jsdom. Pixel-level layout, contrast, and
// target-size scenarios are measured in a real browser by the e2e steps; their unit bindings here
// pin the declarative contract (classes, tokens, document order) those measurements rely on.

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature"),
);

const TOKENS_CSS = readFileSync(path.resolve(process.cwd(), "../../libs/web-ui-token/src/ayokoding.css"), "utf8");

type Ctx = {
  model?: Model;
  anchor?: Model;
  roster?: Model[];
  index?: number;
  tier?: Tier;
  blended?: number;
  result?: SubstituteResult;
  locale?: Locale;
  harness?: HarnessId;
  /** The harness the reader picked in the substitute finder; unset = the default. */
  finderHarness?: HarnessId;
  filterTier?: Tier;
  subIds?: string[];
  viewportWidth?: number;
  viewportHeight?: number;
  errorSpy?: ReturnType<typeof vi.spyOn>;
};

let ctx: Ctx = {};
let view: ReturnType<typeof render> | undefined;

const full = dataset;
const scored = scoreModels(full);
const rated = scored.filter((s) => s.index !== undefined);
const byId = (id: string) => full.models.find((m) => m.id === id)!;

function renderPage(locale: Locale = "en", search = "") {
  navState.locale = locale;
  navState.search = search;
  document.documentElement.lang = locale;
  view = render(<AiBenchmarkPage />);
}

/** Apply the URL the last `router.push` received and re-render, as a navigation would. */
function followPush() {
  const url = navState.lastPush ?? "";
  const q = url.indexOf("?");
  navState.search = q === -1 ? "" : url.slice(q + 1);
  view!.rerender(<AiBenchmarkPage />);
}

function chooseModel(target: Model) {
  fireEvent.change(screen.getByLabelText(t("en", "aiBenchFinderLabel")), { target: { value: target.id } });
  followPush();
  ctx.model = target;
}

function chooseTarget(name: string) {
  chooseModel(full.models.find((m) => m.name === name)!);
}

const harnessIdByName = (name: string): HarnessId => HARNESS_IDS.find((h) => HARNESS_DISPLAY_NAMES[h] === name)!;
const finderHarnessSelect = () => screen.getByLabelText(t("en", "aiBenchFinderHarnessLabel")) as HTMLSelectElement;
const selectedLabel = (select: HTMLSelectElement) => select.selectedOptions[0]!.textContent;

function chooseFinderHarness(harness: HarnessId) {
  fireEvent.change(finderHarnessSelect(), { target: { value: harness } });
  followPush();
  ctx.finderHarness = harness;
}

/**
 * The first finder harness (default first) and frontier model whose tier no model of that harness
 * reaches, so the finder can only offer nearest options. Picked from the live roster, so the check
 * holds whatever each harness lists.
 */
function nearestCombination(): { harness: HarnessId; target: Model } {
  for (const harness of SUBSTITUTE_HARNESSES) {
    for (const target of frontierModels(full)) {
      const result = substitutesFor(target, full, harness);
      if (result.kind === "nearest" && result.models.length > 0) return { harness, target };
    }
  }
  throw new Error("every frontier model has a same-tier substitute in every finder harness");
}

/** The blended-price cell text for a listed substitute: a dash where no price is published. */
const blendedText = (m: Model) => (blendedPrice(m.price) === undefined ? "—" : formatUsd(blendedPrice(m.price)!, "en"));

function idsIn(testId: string, root: ParentNode = document): string[] {
  return Array.from(root.querySelectorAll(`[data-testid="${testId}"]`), (el) => el.getAttribute("data-model-id")!);
}

const tierMapIds = () => idsIn("ai-bench-tier-row", screen.getByTestId("ai-bench-tier-map"));
const tableIds = () => idsIn("ai-bench-table-row", screen.getByTestId("ai-bench-table"));
const subIds = () => idsIn("ai-bench-sub-item");
const tableRow = (id: string) => screen.getByTestId("ai-bench-table").querySelector(`tr[data-model-id="${id}"]`)!;
const sorted = (xs: string[]) => [...xs].sort();

/** The first harness × tier combination that matches no model in the live roster. */
function emptyCombination(): { harness: HarnessId; tier: Tier } {
  for (const harness of HARNESS_IDS) {
    for (const tier of TIERS) {
      if (filterModels(full, { harness, tier }).length === 0) return { harness, tier };
    }
  }
  throw new Error("every harness × tier combination matches a model");
}

describeFeature(feature, ({ Background, Scenario, ScenarioOutline, AfterEachScenario }) => {
  Background(({ Given }) => {
    Given("the AI benchmark dataset is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
  });

  AfterEachScenario(() => {
    ctx.errorSpy?.mockRestore();
    ctx = {};
    view = undefined;
    navState.locale = "en";
    navState.search = "";
    navState.lastPush = undefined;
    document.documentElement.lang = "";
    document.documentElement.classList.remove("dark");
    cleanup();
  });

  // ── Composite index ──────────────────────────────────────────────────────────

  Scenario("The composite index is the equal-weight mean of the scored benchmarks", ({ Given, When, Then }) => {
    Given("a fixture model scoring 70 on DeepSWE, 40 on Terminal-Bench, and 61 on SWE-Atlas-QnA", () => {
      ctx.model = model("m", [fig("deep-swe", 70), fig("terminal-bench", 40), fig("swe-atlas-qna", 61)]);
    });
    When("its composite index is computed", () => {
      ctx.index = compositeIndex(ctx.model!);
    });
    Then("the composite index is 57", () => {
      expect(ctx.index).toBe(57);
    });
  });

  Scenario("Only figures for the pinned benchmark version enter the composite index", ({ Given, And, When, Then }) => {
    Given("a fixture model scoring 60 on DeepSWE 1.1 and 40 on Terminal-Bench 4.0", () => {
      ctx.model = model("m", [fig("deep-swe", 60, "1.1"), fig("terminal-bench", 40, "4.0")]);
    });
    And("that model also carries a Terminal-Bench 2.1 figure of 90", () => {
      ctx.model!.figures.push(fig("terminal-bench", 90, "2.1"));
    });
    When("its composite index is computed", () => {
      ctx.index = compositeIndex(ctx.model!);
    });
    Then("the composite index is 50", () => {
      expect(ctx.index).toBe(50);
    });
  });

  Scenario("A model scored on fewer than two benchmarks has insufficient data", ({ Given, When, Then, And }) => {
    Given("a fixture model with a score on only one composite benchmark", () => {
      ctx.model = model("m", [fig("deep-swe", 90)]);
    });
    When("its tier is assigned", () => {
      ctx.tier = assignTier(ctx.model!, fixtureDataset([...anchors(), ctx.model!]));
    });
    Then('that model\'s tier is "insufficient"', () => {
      expect(ctx.tier).toBe("insufficient");
    });
    And("that model has no composite index", () => {
      expect(compositeIndex(ctx.model!)).toBeUndefined();
    });
  });

  // ── Tiers ────────────────────────────────────────────────────────────────────

  Scenario("A model meets an anchor when its composite index reaches the anchor's", ({ Given, And, When, Then }) => {
    Given("a fixture anchor scoring 70 on DeepSWE and 20 on Terminal-Bench with no SWE-Atlas-QnA score", () => {
      ctx.anchor = model("anchor", [fig("deep-swe", 70), fig("terminal-bench", 20)]);
    });
    And("a fixture model scoring 66 on DeepSWE, 22 on Terminal-Bench, and 70 on SWE-Atlas-QnA", () => {
      ctx.model = model("m", [fig("deep-swe", 66), fig("terminal-bench", 22), fig("swe-atlas-qna", 70)]);
    });
    When("the model is compared with the anchor", () => {
      ctx.index = compositeIndex(ctx.model!);
    });
    Then(
      "the model's composite index is above the anchor's even though it trails on DeepSWE and Terminal-Bench",
      () => {
        expect(ctx.index).toBeGreaterThan(compositeIndex(ctx.anchor!)!);
        expect(scoreOver(ctx.model!, ["deep-swe", "terminal-bench"])).toBeLessThan(
          scoreOver(ctx.anchor!, ["deep-swe", "terminal-bench"])!,
        );
      },
    );
    And("the model meets the anchor", () => {
      expect(meetsAnchor(ctx.model!, ctx.anchor!)).toBe(true);
    });
  });

  ScenarioOutline(
    "A model is placed in the highest tier whose anchor it meets",
    ({ Given, And, When, Then }, variables) => {
      Given(
        "fixture tier anchors scoring 60 for ultra, 55 for planning, and 45 for execution on every composite benchmark",
        () => {
          ctx.roster = anchors(60, 55, 45);
        },
      );
      And("a fixture model scoring <score> on every composite benchmark", () => {
        ctx.model = flat("m", Number(variables.score));
      });
      When("its tier is assigned", () => {
        ctx.tier = assignTier(ctx.model!, fixtureDataset([...ctx.roster!, ctx.model!]));
      });
      Then('that model\'s tier is "<tier>"', () => {
        expect(ctx.tier).toBe(variables.tier);
      });
    },
  );

  Scenario("Each tier anchor lands in the tier it defines", ({ Given, When, Then, And }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("every model's tier is assigned", () => {
      ctx.roster = full.models;
    });
    Then('the ultra anchor is in the "ultra" tier', () => {
      expect(assignTier(byId(TIER_ANCHORS.ultra), full)).toBe("ultra");
    });
    And('the planning anchor is in the "planning" tier', () => {
      expect(assignTier(byId(TIER_ANCHORS.planning), full)).toBe("planning");
    });
    And('the execution anchor is in the "execution" tier', () => {
      expect(assignTier(byId(TIER_ANCHORS.execution), full)).toBe("execution");
    });
  });

  Scenario("Every tier anchor is a previous-generation model with general access", ({ Given, When, Then, And }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the tier anchors are inspected", () => {
      ctx.roster = Object.values(TIER_ANCHORS).map(byId);
    });
    Then("every tier anchor has general access", () => {
      for (const a of ctx.roster!) expect(a.access, a.id).toBe("general");
    });
    And("every tier anchor has a newer model from the same vendor in the roster", () => {
      for (const a of ctx.roster!) {
        const newer = full.models.filter(
          (m) => m.vendor === a.vendor && m.releaseDate !== undefined && m.releaseDate > a.releaseDate!,
        );
        expect(newer.length, a.id).toBeGreaterThan(0);
      }
    });
  });

  Scenario("Every listed harness's in-house model line is in the roster", ({ Given, When, Then, And }) => {
    let lines: Array<{ line: (typeof HARNESS_IN_HOUSE_LINES)[number]; models: Model[] }> = [];
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the in-house model lines of the listed harnesses are inspected", () => {
      lines = HARNESS_IN_HOUSE_LINES.map((line) => ({
        line,
        models: full.models.filter((m) => m.vendor === line.vendor && m.line === line.line),
      }));
    });
    Then("each in-house model line has at least one model in the roster", () => {
      expect(lines.length).toBeGreaterThan(0);
      for (const { line, models } of lines) expect(models.length, `${line.vendor} ${line.line}`).toBeGreaterThan(0);
    });
    And("each of those models is offered in its own harness", () => {
      for (const { line, models } of lines) {
        for (const m of models) expect(m.harnesses, m.id).toContain(line.harness);
      }
    });
  });

  Scenario("Every roster model belongs to exactly one tier group", ({ Given, When, Then }) => {
    let groups: ReturnType<typeof computeTierGroups>;
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the tier groups are computed", () => {
      groups = computeTierGroups(full);
    });
    Then('each model appears in exactly one of "ultra", "planning", "execution", "fast", or "insufficient"', () => {
      const all = TIERS.flatMap((tier) => groups[tier].map((s) => s.model.id));
      expect(sorted(all)).toEqual(sorted(full.models.map((m) => m.id)));
    });
  });

  // ── Price ────────────────────────────────────────────────────────────────────

  Scenario("The blended price weights input three to one against output", ({ Given, When, Then }) => {
    Given("a fixture model priced at 4 dollars input and 20 dollars output per million tokens", () => {
      ctx.model = model("m", [], { price: price(4, 20) });
    });
    When("its blended price is computed", () => {
      ctx.blended = blendedPrice(ctx.model!.price);
    });
    Then("the blended price is 8 dollars per million tokens", () => {
      expect(ctx.blended).toBe(8);
    });
  });

  // ── Substitute finder ────────────────────────────────────────────────────────

  Scenario(
    "Substitutes are models of the chosen harness in the same or a higher tier",
    ({ Given, And, When, Then }) => {
      Given('a frontier fixture model in the "planning" tier', () => {
        ctx.model = flat("frontier", 57, { vendor: "OpenAI" });
        ctx.roster = [...anchors(60, 55, 45), ctx.model];
        expect(assignTier(ctx.model, fixtureDataset(ctx.roster))).toBe("planning");
      });
      And(
        'fixture models of the "command-code-pro" harness in the "ultra", "planning", and "execution" tiers and one with insufficient data',
        () => {
          ctx.roster!.push(
            harnessModel("command-code-pro", "pro-planning", 56),
            harnessModel("command-code-pro", "pro-ultra", 65),
            harnessModel("command-code-pro", "pro-execution", 50),
            harnessModel("command-code-pro", "pro-insufficient", undefined),
          );
        },
      );
      And('fixture models of the "opencode-go" harness in the "ultra" and "planning" tiers', () => {
        ctx.roster!.push(goModel("go-ultra", 66), goModel("go-planning", 57));
      });
      When('substitutes are listed for the frontier model from the "command-code-pro" harness', () => {
        ctx.result = substitutesFor(ctx.model!, fixtureDataset(ctx.roster!), "command-code-pro");
      });
      Then('the substitutes are only the "ultra" and "planning" models of the "command-code-pro" harness', () => {
        expect(ctx.result!.kind).toBe("matches");
        expect(sorted(ctx.result!.models.map((s) => s.model.id))).toEqual(["pro-planning", "pro-ultra"]);
        for (const s of ctx.result!.models) expect(s.model.harnesses).toContain("command-code-pro");
      });
      And("the substitutes are ordered by composite index from highest to lowest", () => {
        expect(ctx.result!.models.map((s) => s.model.id)).toEqual(["pro-ultra", "pro-planning"]);
      });
    },
  );

  Scenario(
    "The substitute finder offers three harnesses with Command Code Pro chosen first",
    ({ Given, When, Then, And }) => {
      let select: HTMLSelectElement;
      Given("the AI benchmark page is open", () => {
        renderPage();
      });
      When("the reader looks at the substitute finder's harness choice", () => {
        select = finderHarnessSelect();
      });
      Then('it offers "Command Code Pro", "Command Code", and "OpenCode Go" in that order', () => {
        const labels = Array.from(select.options, (o) => o.textContent);
        expect(labels).toEqual(["Command Code Pro", "Command Code", "OpenCode Go"]);
        expect(labels).toEqual(SUBSTITUTE_HARNESSES.map((h) => HARNESS_DISPLAY_NAMES[h]));
      });
      And('"Command Code Pro" is chosen by default', () => {
        expect(DEFAULT_SUBSTITUTE_HARNESS).toBe("command-code-pro");
        expect(select.value).toBe(DEFAULT_SUBSTITUTE_HARNESS);
        expect(selectedLabel(select)).toBe("Command Code Pro");
      });
    },
  );

  Scenario(
    "Choosing a frontier model lists its Command Code Pro substitutes with a price comparison",
    ({ Given, When, Then, And }) => {
      Given("the AI benchmark page is open", () => {
        renderPage();
      });
      When("the reader chooses a frontier model that has Command Code Pro models in its tier or higher", () => {
        const target = frontierModels(full).find(
          (m) => substitutesFor(m, full, DEFAULT_SUBSTITUTE_HARNESS).kind === "matches",
        );
        if (target === undefined)
          throw new Error("no frontier model has a Command Code Pro model in its tier or higher");
        chooseModel(target);
      });
      Then("the finder lists Command Code Pro models with their tier, composite index, and blended price", () => {
        const expected = substitutesFor(ctx.model!, full, "command-code-pro");
        expect(expected.kind).toBe("matches");
        expect(subIds()).toEqual(expected.models.map((s) => s.model.id));
        for (const s of expected.models) {
          expect(s.model.harnesses).toContain("command-code-pro");
          const item = document.querySelector(`[data-testid="ai-bench-sub-item"][data-model-id="${s.model.id}"]`)!;
          expect(within(item as HTMLElement).getByTestId("ai-bench-sub-tier").textContent).toBe(
            tierLabel(s.tier, "en"),
          );
          expect(within(item as HTMLElement).getByTestId("ai-bench-sub-index").textContent).toBe(
            formatIndex(s.index!, "en"),
          );
          expect(within(item as HTMLElement).getByTestId("ai-bench-sub-blended").textContent).toBe(
            blendedText(s.model),
          );
        }
      });
      And("each listed model states how its blended price compares with the chosen model's", () => {
        for (const s of substitutesFor(ctx.model!, full, "command-code-pro").models) {
          const item = document.querySelector(`[data-testid="ai-bench-sub-item"][data-model-id="${s.model.id}"]`)!;
          expect(within(item as HTMLElement).getByTestId("ai-bench-sub-compare").textContent).toBe(
            priceComparison(priceRatio(s.model, ctx.model!), "en"),
          );
        }
      });
    },
  );

  Scenario(
    "A frontier model above every model of the chosen harness shows the nearest options",
    ({ Given, When, Then, And }) => {
      Given("the AI benchmark page is open", () => {
        renderPage();
      });
      When("the reader chooses a harness and a frontier model whose tier is above every model of that harness", () => {
        const { harness, target } = nearestCombination();
        if (harness !== DEFAULT_SUBSTITUTE_HARNESS) chooseFinderHarness(harness);
        ctx.finderHarness = harness;
        chooseModel(target);
      });
      Then("the finder states that no model of that harness reaches that model's tier", () => {
        expect(screen.getByTestId("ai-bench-finder-lead").textContent).toBe(
          tf("en", "aiBenchFinderNearest", {
            harness: HARNESS_DISPLAY_NAMES[ctx.finderHarness!],
            tier: tierLabel(assignTier(ctx.model!, full), "en"),
          }),
        );
      });
      And("the finder lists the highest-scoring models of that harness as the nearest options", () => {
        const harness = ctx.finderHarness!;
        const candidates = rated
          .filter((s) => s.model.harnesses.includes(harness) && s.model.id !== ctx.model!.id)
          .sort(byIndexDesc);
        const listed = subIds().map((id) => scored.find((s) => s.model.id === id)!);
        // Compare indexes, not ids: equal-index models may swap places without changing the claim.
        expect(listed.map((s) => s.index)).toEqual(candidates.slice(0, NEAREST_OPTION_COUNT).map((s) => s.index));
        for (const s of listed) expect(s.model.harnesses).toContain(harness);
        expect(screen.getByTestId("ai-bench-sub-list").getAttribute("data-kind")).toBe("nearest");
      });
    },
  );

  ScenarioOutline(
    "Changing the finder's harness lists that harness's models",
    ({ Given, When, Then, And }, variables) => {
      Given("the AI benchmark page is open", () => {
        renderPage();
      });
      When('the reader chooses "GPT-5.6 Terra" in the substitute finder', () => {
        chooseTarget("GPT-5.6 Terra");
      });
      And('the reader changes the finder\'s harness to "<harness>"', () => {
        chooseFinderHarness(harnessIdByName(variables.harness!));
      });
      Then('the finder lists only "<harness>" models', () => {
        const harness = harnessIdByName(variables.harness!);
        const expected = substitutesFor(ctx.model!, full, harness);
        expect(expected.models.length).toBeGreaterThan(0);
        expect(subIds()).toEqual(expected.models.map((s) => s.model.id));
        for (const s of expected.models) expect(s.model.harnesses).toContain(harness);
        expect(finderHarnessSelect().value).toBe(harness);
      });
      And('the finder\'s lead line names "<harness>"', () => {
        const harness = harnessIdByName(variables.harness!);
        const kind = substitutesFor(ctx.model!, full, harness).kind;
        const lead = screen.getByTestId("ai-bench-finder-lead").textContent;
        expect(lead).toContain(variables.harness);
        expect(lead).toBe(
          kind === "matches"
            ? tf("en", "aiBenchFinderMatches", { harness: variables.harness! })
            : tf("en", "aiBenchFinderNearest", {
                harness: variables.harness!,
                tier: tierLabel(assignTier(ctx.model!, full), "en"),
              }),
        );
      });
    },
  );

  Scenario("The chosen substitute target is kept in the URL", ({ Given, When, Then, And }) => {
    Given("the AI benchmark page is open", () => {
      renderPage();
    });
    When('the reader chooses "GPT-5.6 Terra" in the substitute finder', () => {
      chooseTarget("GPT-5.6 Terra");
      ctx.subIds = subIds();
    });
    Then("the URL carries that model as the substitute target", () => {
      expect(new URLSearchParams(navState.search).get("sub")).toBe(ctx.model!.id);
    });
    And("reloading that URL shows the same substitute list", () => {
      const search = navState.search;
      cleanup();
      renderPage("en", search);
      expect(subIds()).toEqual(ctx.subIds);
      expect(subIds().length).toBeGreaterThan(0);
    });
  });

  Scenario("The chosen substitute harness is kept in the URL", ({ Given, When, Then, And }) => {
    Given("the AI benchmark page is open", () => {
      renderPage();
    });
    When('the reader chooses "GPT-5.6 Terra" in the substitute finder', () => {
      chooseTarget("GPT-5.6 Terra");
    });
    And('the reader changes the finder\'s harness to "Command Code"', () => {
      chooseFinderHarness(harnessIdByName("Command Code"));
      ctx.subIds = subIds();
    });
    Then("the URL carries that harness as the substitute harness", () => {
      const params = new URLSearchParams(navState.search);
      expect(params.get("sub-harness")).toBe("command-code");
      expect(params.get("sub")).toBe(ctx.model!.id);
      expect(params.has("harness")).toBe(false);
    });
    And("reloading that URL shows the same harness and the same substitute list", () => {
      const search = navState.search;
      cleanup();
      renderPage("en", search);
      expect(finderHarnessSelect().value).toBe("command-code");
      expect(subIds()).toEqual(ctx.subIds);
      expect(subIds().length).toBeGreaterThan(0);
    });
  });

  Scenario("An unrecognized substitute harness falls back to Command Code Pro", ({ Given, When, Then, But }) => {
    Given("the URL carries a substitute harness parameter with an unknown value", () => {
      ctx.errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    When("the page renders", () => {
      renderPage("en", "sub-harness=not-a-harness");
    });
    Then('the finder\'s harness is "Command Code Pro"', () => {
      expect(finderHarnessSelect().value).toBe("command-code-pro");
      expect(selectedLabel(finderHarnessSelect())).toBe("Command Code Pro");
    });
    But("no error is surfaced to the reader", () => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(ctx.errorSpy).not.toHaveBeenCalled();
    });
  });

  // ── Page header and dates ────────────────────────────────────────────────────

  Scenario("The English page renders its localized heading", ({ Given, When, Then, And }) => {
    Given('the locale is "en"', () => {
      ctx.locale = "en";
    });
    When("the AI benchmark page renders", () => {
      renderPage(ctx.locale);
    });
    Then("the page shows a level-one heading in English", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("en", "aiBenchTitle"));
    });
    And('the document language attribute is "en"', () => {
      expect(document.documentElement.lang).toBe("en");
    });
  });

  Scenario("The Indonesian page renders its localized heading", ({ Given, When, Then, And }) => {
    Given('the locale is "id"', () => {
      ctx.locale = "id";
    });
    When("the AI benchmark page renders", () => {
      renderPage(ctx.locale);
    });
    Then("the page shows a level-one heading in Indonesian", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("id", "aiBenchTitle"));
      expect(t("id", "aiBenchTitle")).not.toBe(t("en", "aiBenchTitle"));
    });
    And('the document language attribute is "id"', () => {
      expect(document.documentElement.lang).toBe("id");
    });
  });

  Scenario("The last-updated date is shown before the substitute finder", ({ Given, When, Then, And }) => {
    Given("the dataset carries a last-updated date", () => {
      expect(full.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    When("the page renders", () => {
      renderPage();
    });
    Then("the last-updated date is shown in text", () => {
      const time = screen.getByTestId("ai-bench-last-updated").querySelector("time")!;
      expect(time.textContent).toBe(formatDate(full.lastUpdated, "en"));
      expect(time.getAttribute("dateTime")).toBe(full.lastUpdated);
    });
    And("the last-updated date precedes the substitute finder in document order", () => {
      const pos = screen
        .getByTestId("ai-bench-last-updated")
        .compareDocumentPosition(screen.getByTestId("ai-bench-finder"));
      expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  Scenario("The page states that only independent results are scored", ({ Given, When, Then, And }) => {
    Given("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the page renders", () => {
      expect(screen.getByTestId("ai-bench-page")).toBeTruthy();
    });
    Then("a line stating that only independently run results are scored is visible without interaction", () => {
      const line = screen.getByTestId("ai-bench-independent-only");
      expect(line.textContent).toContain(t("en", "aiBenchIndependentOnly"));
      expect(line.closest("details")).toBeNull();
      expect(line.className).not.toMatch(/\bhidden\b/);
    });
    And("that line states that vendor-reported results are excluded", () => {
      expect(screen.getByTestId("ai-bench-independent-only").textContent).toMatch(
        /vendor reports are neither shown nor counted/,
      );
    });
  });

  // ── Tier map ─────────────────────────────────────────────────────────────────

  Scenario("Each tier section names its anchor and floor score", ({ Given, When, Then, And }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the tier map is rendered", () => {
      renderPage();
    });
    Then("the ultra, planning, and execution sections each name their anchor model", () => {
      for (const tier of ["ultra", "planning", "execution"] as const) {
        const floor = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByTestId("ai-bench-tier-floor");
        expect(floor.textContent).toContain(byId(TIER_ANCHORS[tier]).name);
      }
    });
    And("each of those sections states its floor score", () => {
      const a = tierAnchors(full);
      for (const tier of ["ultra", "planning", "execution"] as const) {
        const floor = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByTestId("ai-bench-tier-floor");
        expect(floor.textContent).toContain(formatIndex(a[tier]!.index!, "en"));
      }
    });
    And("the fast section states that it holds rated models below the execution floor", () => {
      expect(within(screen.getByTestId("ai-bench-tier-fast")).getByTestId("ai-bench-tier-floor").textContent).toBe(
        t("en", "aiBenchTierFastFloor"),
      );
    });
  });

  Scenario("Every rated model row shows its bar, index, and API price in text", ({ Given, When, Then, And }) => {
    let rows: HTMLElement[] = [];
    Given("the full roster is loaded", () => {
      expect(rated.length).toBeGreaterThan(0);
    });
    When("the tier map is rendered", () => {
      renderPage();
      rows = within(screen.getByTestId("ai-bench-tier-map")).getAllByTestId("ai-bench-tier-row");
    });
    Then("every rated model row carries the model name and its composite index in text", () => {
      expect(sorted(rows.map((r) => r.getAttribute("data-model-id")!))).toEqual(sorted(rated.map((s) => s.model.id)));
      for (const row of rows) {
        const m = byId(row.getAttribute("data-model-id")!);
        expect(within(row).getByTestId("ai-bench-tier-row-name").textContent).toBe(m.name);
        expect(within(row).getByTestId("ai-bench-tier-row-index").textContent).toBe(
          formatIndex(compositeIndex(m)!, "en"),
        );
      }
    });
    And("every rated model row carries one capability bar", () => {
      for (const row of rows) expect(within(row).getAllByTestId("ai-bench-bar")).toHaveLength(1);
    });
    And(
      "every rated model row carries its input and output API price in text, or states that no public API price exists",
      () => {
        for (const row of rows) {
          const m = byId(row.getAttribute("data-model-id")!);
          const text = within(row).getByTestId("ai-bench-price").textContent;
          if (m.price === undefined) expect(text).toBe(t("en", "aiBenchNoPrice"));
          else {
            expect(text).toContain(formatUsd(m.price.input, "en"));
            expect(text).toContain(formatUsd(m.price.output, "en"));
          }
        }
      },
    );
  });

  Scenario("Bar length is proportional to the composite index", ({ Given, When, Then }) => {
    let pair: [string, string];
    Given("two rated models whose composite indices differ", () => {
      const top = [...rated].sort(byIndexDesc);
      pair = [top[0]!.model.id, top[top.length - 1]!.model.id];
      expect(top[0]!.index).not.toBe(top[top.length - 1]!.index);
    });
    When("the tier map is rendered", () => {
      renderPage();
    });
    Then("the ratio of their bar lengths equals the ratio of their composite indices", () => {
      const width = (id: string) => {
        const row = document.querySelector(`[data-testid="ai-bench-tier-row"][data-model-id="${id}"]`)!;
        return parseFloat((row.querySelector('[data-testid="ai-bench-bar"]') as HTMLElement).style.width);
      };
      const [a, b] = pair;
      expect(width(a) / width(b)).toBeCloseTo(compositeIndex(byId(a))! / compositeIndex(byId(b))!, 6);
    });
  });

  Scenario("The tier is carried in text, not by colour alone", ({ Given, When, Then }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the tier map is rendered", () => {
      renderPage();
    });
    Then("every tier section has a text heading naming its tier", () => {
      for (const tier of ["ultra", "planning", "execution", "fast"] as const) {
        const heading = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByRole("heading", { level: 3 });
        expect(heading.textContent).toBe(tierLabel(tier, "en"));
      }
    });
  });

  Scenario("A limited-access model is labelled", ({ Given, When, Then }) => {
    Given("the roster holds a model with limited access", () => {
      ctx.model = rated.find((s) => s.model.access === "limited")!.model;
      expect(ctx.model).toBeDefined();
    });
    When("the tier map is rendered", () => {
      renderPage();
    });
    Then("that model's row carries a limited-access label in text", () => {
      const row = document.querySelector(`[data-testid="ai-bench-tier-row"][data-model-id="${ctx.model!.id}"]`)!;
      expect(within(row as HTMLElement).getByTestId("ai-bench-limited").textContent).toBe(
        t("en", "aiBenchLimitedAccess"),
      );
    });
  });

  Scenario("Models with insufficient data are listed in a collapsed section", ({ Given, When, Then, And }) => {
    let insufficient: Model[] = [];
    Given("the roster holds models scored on fewer than two benchmarks", () => {
      insufficient = scored.filter((s) => s.tier === "insufficient").map((s) => s.model);
      expect(insufficient.length).toBeGreaterThan(0);
    });
    When("the page renders", () => {
      renderPage();
    });
    Then("those models are listed inside a closed disclosure", () => {
      const details = screen.getByTestId("ai-bench-insufficient") as HTMLDetailsElement;
      expect(details.tagName).toBe("DETAILS");
      expect(details.open).toBe(false);
      expect(sorted(idsIn("ai-bench-insufficient-item", details))).toEqual(sorted(insufficient.map((m) => m.id)));
    });
    And("each listed model shows whatever independent scores it has", () => {
      for (const m of insufficient) {
        const item = document.querySelector(`[data-testid="ai-bench-insufficient-item"][data-model-id="${m.id}"]`)!;
        const text = within(item as HTMLElement).getByTestId("ai-bench-insufficient-scores").textContent!;
        const figures = BENCHMARK_SPECS.flatMap((b) => scoredFigure(m, b.id) ?? []);
        if (figures.length === 0) expect(text).toBe(t("en", "aiBenchInsufficientNone"));
        for (const f of figures) {
          expect(text).toContain(formatPercent(f.value, "en"));
          expect(text).toContain(operatorById(f.operator).shortName);
        }
      }
    });
  });

  // ── Data table ───────────────────────────────────────────────────────────────

  Scenario("The data table is present without any interaction", ({ Given, When, Then, And }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the page first renders", () => {
      renderPage();
    });
    Then("a data table is present in the document", () => {
      expect(screen.getByRole("table")).toBe(screen.getByTestId("ai-bench-table"));
    });
    And("the table has a caption", () => {
      expect(screen.getByTestId("ai-bench-table").querySelector("caption")!.textContent).toBe(
        t("en", "aiBenchTableCaption"),
      );
    });
    And("every table header cell declares a scope", () => {
      const ths = Array.from(screen.getByTestId("ai-bench-table").querySelectorAll("th"));
      expect(ths.length).toBeGreaterThan(0);
      for (const th of ths) expect(["col", "row"]).toContain(th.getAttribute("scope"));
    });
  });

  Scenario("The table lists every model's scores, tier, and prices", ({ Given, When, Then }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the data table is rendered", () => {
      renderPage();
    });
    Then(
      "each model row lists its tier, every benchmark score, composite index, input price, output price, and blended price",
      () => {
        expect(sorted(tableIds())).toEqual(sorted(full.models.map((m) => m.id)));
        for (const s of scored) {
          const row = tableRow(s.model.id) as HTMLElement;
          const cell = (id: string) => within(row).getByTestId(id).textContent;
          expect(cell("ai-bench-table-tier")).toBe(tierLabel(s.tier, "en"));
          expect(cell("ai-bench-table-index")).toBe(s.index === undefined ? "—" : formatIndex(s.index, "en"));
          const p = s.model.price;
          expect(cell("ai-bench-table-input")).toBe(p === undefined ? "—" : formatUsd(p.input, "en"));
          expect(cell("ai-bench-table-output")).toBe(p === undefined ? "—" : formatUsd(p.output, "en"));
          expect(cell("ai-bench-table-blended")).toBe(p === undefined ? "—" : formatUsd(blendedPrice(p)!, "en"));
          const scores = within(row).queryAllByTestId("ai-bench-score");
          const expected = BENCHMARK_SPECS.flatMap((b) => scoredFigure(s.model, b.id) ?? []);
          expect(scores.map((c) => c.getAttribute("data-benchmark"))).toEqual(expected.map((f) => f.benchmark));
          scores.forEach((c, i) => expect(c.textContent).toContain(formatPercent(expected[i]!.value, "en")));
        }
      },
    );
  });

  Scenario("Every benchmark score names and links its operator", ({ Given, When, Then, And }) => {
    let cells: HTMLElement[] = [];
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the data table is rendered", () => {
      renderPage();
      cells = within(screen.getByTestId("ai-bench-table")).getAllByTestId("ai-bench-score");
      expect(cells.length).toBeGreaterThan(0);
    });
    Then("every benchmark score cell names the operator that ran it", () => {
      for (const c of cells) {
        const m = byId(c.closest("tr")!.getAttribute("data-model-id")!);
        const f = scoredFigure(m, c.getAttribute("data-benchmark") as never)!;
        expect(within(c).getByTestId("ai-bench-score-operator").textContent).toBe(operatorById(f.operator).shortName);
      }
    });
    And("every benchmark score cell links to its source", () => {
      for (const c of cells) {
        const m = byId(c.closest("tr")!.getAttribute("data-model-id")!);
        const f = scoredFigure(m, c.getAttribute("data-benchmark") as never)!;
        const link = c.querySelector("a")!;
        expect(link.getAttribute("href")).toBe(f.source);
        expect(link.getAttribute("rel")).toContain("noopener");
      }
    });
  });

  Scenario("Cost per task is shown where an independent operator publishes it", ({ Given, When, Then }) => {
    Given("a model whose independent operator publishes a cost per task", () => {
      ctx.model = full.models.find((m) => m.costPerTask !== undefined)!;
      expect(ctx.model).toBeDefined();
    });
    When("the data table is rendered", () => {
      renderPage();
    });
    Then("that model's row shows its cost per task in dollars", () => {
      const cell = within(tableRow(ctx.model!.id) as HTMLElement).getByTestId("ai-bench-table-cost");
      expect(cell.textContent).toBe(formatUsd(ctx.model!.costPerTask!.usd, "en"));
    });
  });

  // ── Methodology ──────────────────────────────────────────────────────────────

  function openMethodology() {
    const details = screen.getByTestId("ai-bench-methodology") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByRole("link", { name: t("en", "aiBenchJumpToMethod") }));
    expect(details.open).toBe(true);
    return details;
  }

  Scenario("The page explains how the score is calculated", ({ Given, When, Then, And }) => {
    let details: HTMLElement;
    Given("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the reader opens the methodology section", () => {
      details = openMethodology();
    });
    Then("it lists every composite benchmark with its version and weight", () => {
      const items = within(details).getAllByTestId("ai-bench-method-benchmark");
      expect(items.map((i) => i.getAttribute("data-benchmark"))).toEqual(BENCHMARK_SPECS.map((b) => b.id));
      BENCHMARK_SPECS.forEach((b, i) => {
        expect(items[i]!.textContent).toContain(b.name);
        expect(items[i]!.textContent).toContain(tf("en", "aiBenchMethodVersion", { version: b.version }));
        expect(items[i]!.textContent).toContain(tf("en", "aiBenchMethodWeight", { weight: b.weight }));
      });
    });
    And("it states which models the roster covers", () => {
      const roster = within(details).getByTestId("ai-bench-method-roster").textContent;
      expect(roster).toBe(tf("en", "aiBenchMethodRoster", rosterScopeParams()));
      for (const vendor of FRONTIER_VENDORS) expect(roster).toContain(vendor);
      expect(roster).toContain("every OpenCode Go and Command Code model with a named vendor");
      for (const h of ROSTER_CATALOG_HARNESSES) expect(roster).toContain(HARNESS_DISPLAY_NAMES[h]);
      for (const l of HARNESS_IN_HOUSE_LINES) expect(roster).toContain(`${l.vendor} ${l.line}`);
    });
    And("it states the operator order used to pick each figure", () => {
      const orders = within(details).getAllByTestId("ai-bench-method-operator-order");
      BENCHMARK_SPECS.forEach((b, i) => {
        expect(orders[i]!.textContent).toContain(b.operatorOrder.map((o) => operatorById(o).shortName).join(" → "));
      });
    });
    And("it states the minimum number of benchmarks needed for a tier", () => {
      expect(within(details).getByTestId("ai-bench-method-index").textContent).toBe(
        tf("en", "aiBenchMethodIndex", { min: MIN_SCORED_BENCHMARKS }),
      );
    });
    And("it lists every tier anchor with its floor score", () => {
      const a = tierAnchors(full);
      const items = within(details).getAllByTestId("ai-bench-method-anchor");
      expect(items.map((i) => i.getAttribute("data-tier"))).toEqual(["ultra", "planning", "execution"]);
      for (const item of items) {
        const anchor = a[item.getAttribute("data-tier") as "ultra"]!;
        expect(item.textContent).toContain(anchor.model.name);
        expect(item.textContent).toContain(formatIndex(anchor.index!, "en"));
      }
    });
  });

  Scenario("The worked example matches the computed index", ({ Given, When, Then, And }) => {
    let details: HTMLElement;
    Given("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the reader opens the methodology section", () => {
      details = openMethodology();
    });
    Then("the worked example shows a model's benchmark scores and the resulting composite index", () => {
      const m = byId(METHOD_EXAMPLE.indexModel);
      const text = within(details).getByTestId("ai-bench-method-example-index").textContent!;
      expect(text).toContain(m.name);
      for (const b of scoredBenchmarks(m)) expect(text).toContain(formatIndex(scoredFigure(m, b)!.value, "en"));
      expect(text).toContain(formatIndex(compositeIndex(m)!, "en"));
      // The like-for-like example states the outcome the scoring code reaches.
      const compare = within(details).getByTestId("ai-bench-method-example-compare").textContent!;
      const outcome = meetsAnchor(byId(METHOD_EXAMPLE.compareModel), byId(TIER_ANCHORS[METHOD_EXAMPLE.compareTier]));
      expect(compare).toContain(t("en", outcome ? "aiBenchMethodMeets" : "aiBenchMethodMisses"));
    });
    And("the worked example's composite index equals that model's index in the data table", () => {
      const m = byId(METHOD_EXAMPLE.indexModel);
      const tableIndex = within(tableRow(m.id) as HTMLElement).getByTestId("ai-bench-table-index").textContent!;
      expect(within(details).getByTestId("ai-bench-method-example-index").textContent).toContain(
        `index ${tableIndex}.`,
      );
    });
  });

  Scenario("The page lists every operator with its checked date and terms", ({ Given, When, Then, And }) => {
    Given("the dataset names its benchmark operators and price sources", () => {
      const used = new Set(full.models.flatMap((m) => m.figures.map((f) => f.operator)));
      for (const id of used) expect(OPERATORS.map((o) => o.id)).toContain(id);
    });
    When("the page renders", () => {
      renderPage();
    });
    Then("a sources section lists every named operator", () => {
      const entries = within(screen.getByTestId("ai-bench-sources")).getAllByTestId("ai-bench-source-operator");
      expect(entries.map((e) => e.getAttribute("data-operator-id"))).toEqual(OPERATORS.map((o) => o.id));
      OPERATORS.forEach((o, i) => expect(entries[i]!.querySelector("a")!.getAttribute("href")).toBe(o.url));
    });
    And("each operator entry states the date it was last checked", () => {
      const entries = screen.getAllByTestId("ai-bench-source-operator");
      OPERATORS.forEach((o, i) => {
        expect(entries[i]!.textContent).toContain(
          tf("en", "aiBenchSourcesChecked", { date: formatDate(o.checkedOn, "en") }),
        );
      });
    });
    And("each operator entry states how its figures are cited", () => {
      for (const e of screen.getAllByTestId("ai-bench-source-operator")) {
        expect(within(e).getByTestId("ai-bench-source-cited").textContent).toBe(t("en", "aiBenchSourcesCitedAs"));
      }
    });
  });

  ScenarioOutline("No raw translation key leaks on either locale", ({ Given, When, Then }, variables) => {
    Given('the locale is "<locale>"', () => {
      ctx.locale = variables.locale as Locale;
    });
    When("the AI benchmark page renders", () => {
      // Open every disclosure and pick a finder target so every string path renders.
      renderPage(ctx.locale, "sub=gpt-5.6-terra");
      for (const d of Array.from(document.querySelectorAll("details"))) d.open = true;
    });
    Then("no rendered text matches a raw translation key", () => {
      expect(document.body.textContent).not.toMatch(/aiBench|\{\w+\}/);
    });
  });

  // ── Filters ──────────────────────────────────────────────────────────────────

  Scenario("The page with no query parameters shows the whole roster", ({ Given, When, Then }) => {
    Given("the URL carries no query parameters", () => {
      navState.search = "";
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then("every roster model is shown in the data table", () => {
      expect(sorted(tableIds())).toEqual(sorted(full.models.map((m) => m.id)));
    });
  });

  Scenario("A harness parameter narrows the tier map and the table", ({ Given, When, Then, And }) => {
    Given("the URL carries a harness parameter naming a known harness", () => {
      ctx.harness = "codex-cli";
    });
    When("the page renders", () => {
      renderPage("en", `harness=${ctx.harness}`);
    });
    Then("only models that harness exposes are shown in the tier map", () => {
      const expected = rated.filter((s) => s.model.harnesses.includes(ctx.harness!)).map((s) => s.model.id);
      expect(expected.length).toBeGreaterThan(0);
      expect(sorted(tierMapIds())).toEqual(sorted(expected));
    });
    And("only models that harness exposes are shown in the data table", () => {
      const expected = full.models.filter((m) => m.harnesses.includes(ctx.harness!)).map((m) => m.id);
      expect(expected.length).toBeLessThan(full.models.length);
      expect(sorted(tableIds())).toEqual(sorted(expected));
    });
  });

  ScenarioOutline(
    "Every listed harness is a known harness parameter value",
    ({ Given, When, Then, And }, variables) => {
      Given('the URL carries the harness parameter "<harness>"', () => {
        ctx.harness = variables.harness as HarnessId;
      });
      When("the page renders", () => {
        renderPage("en", `harness=${ctx.harness}`);
      });
      Then('the harness filter shows "<name>"', () => {
        const select = screen.getByLabelText(t("en", "aiBenchFilterHarness")) as HTMLSelectElement;
        expect(HARNESS_IDS).toContain(ctx.harness);
        expect(HARNESS_DISPLAY_NAMES[ctx.harness!]).toBe(variables.name);
        expect(select.value).toBe(ctx.harness);
        expect(selectedLabel(select)).toBe(variables.name);
      });
      And("the result count equals the number of models that harness exposes", () => {
        const count = filterModels(full, { harness: ctx.harness }).length;
        expect(screen.getByTestId("ai-bench-result-count").textContent).toBe(
          tf("en", "aiBenchFilterResultCount", { count, total: full.models.length }),
        );
      });
    },
  );

  Scenario("A tier parameter narrows the tier map and the table", ({ Given, When, Then, And }) => {
    Given("the URL carries a tier parameter naming a known tier", () => {
      ctx.filterTier = "planning";
    });
    When("the page renders", () => {
      renderPage("en", `tier=${ctx.filterTier}`);
    });
    Then("only models in that tier are shown in the tier map", () => {
      const expected = scored.filter((s) => s.tier === ctx.filterTier).map((s) => s.model.id);
      expect(expected.length).toBeGreaterThan(0);
      expect(sorted(tierMapIds())).toEqual(sorted(expected));
      expect(screen.queryByTestId("ai-bench-tier-ultra")).toBeNull();
    });
    And("only models in that tier are shown in the data table", () => {
      expect(sorted(tableIds())).toEqual(
        sorted(scored.filter((s) => s.tier === ctx.filterTier).map((s) => s.model.id)),
      );
    });
  });

  Scenario("Harness and tier parameters intersect", ({ Given, When, Then }) => {
    Given("the URL carries both a harness parameter and a tier parameter", () => {
      ctx.harness = "opencode-go";
      ctx.filterTier = "execution";
    });
    When("the page renders", () => {
      renderPage("en", `harness=${ctx.harness}&tier=${ctx.filterTier}`);
    });
    Then("only models satisfying both filters are shown", () => {
      const expected = scored
        .filter((s) => s.tier === ctx.filterTier && s.model.harnesses.includes(ctx.harness!))
        .map((s) => s.model.id);
      expect(expected.length).toBeGreaterThan(0);
      expect(expected.length).toBeLessThan(scored.filter((s) => s.tier === ctx.filterTier).length);
      expect(sorted(tableIds())).toEqual(sorted(expected));
      expect(sorted(tierMapIds())).toEqual(sorted(expected));
    });
  });

  Scenario("An unrecognized filter value falls back to the unfiltered view", ({ Given, When, Then, But }) => {
    Given("the URL carries a harness parameter with an unknown value", () => {
      ctx.errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    When("the page renders", () => {
      renderPage("en", "harness=not-a-harness");
    });
    Then("every roster model is shown", () => {
      expect(sorted(tableIds())).toEqual(sorted(full.models.map((m) => m.id)));
      expect((screen.getByLabelText(t("en", "aiBenchFilterHarness")) as HTMLSelectElement).value).toBe("");
    });
    But("no error is surfaced to the reader", () => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(ctx.errorSpy).not.toHaveBeenCalled();
    });
  });

  Scenario("A duplicated query parameter resolves to its first value", ({ Given, When, Then }) => {
    Given("the URL carries the harness parameter twice with two different known harness values", () => {
      navState.search = "harness=cursor&harness=opencode-go";
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then("the filter uses the first of the two values", () => {
      expect((screen.getByLabelText(t("en", "aiBenchFilterHarness")) as HTMLSelectElement).value).toBe("cursor");
      expect(sorted(tableIds())).toEqual(
        sorted(full.models.filter((m) => m.harnesses.includes("cursor")).map((m) => m.id)),
      );
    });
  });

  Scenario('Resetting a filter to "All" removes it from the URL', ({ Given, When, Then }) => {
    Given("the URL carries both a harness parameter and a tier parameter", () => {
      navState.search = "harness=opencode-go&tier=execution";
    });
    When('the reader resets the tier filter to "All tiers"', () => {
      renderPage("en", navState.search);
      fireEvent.change(screen.getByLabelText(t("en", "aiBenchFilterTier")), { target: { value: "" } });
      followPush();
    });
    Then("the URL retains the harness parameter but no longer carries the tier parameter", () => {
      const params = new URLSearchParams(navState.search);
      expect(params.get("harness")).toBe("opencode-go");
      expect(params.has("tier")).toBe(false);
      expect((screen.getByLabelText(t("en", "aiBenchFilterTier")) as HTMLSelectElement).value).toBe("");
    });
  });

  Scenario("A filter combination matching no model renders an explicit empty state", ({ Given, When, Then, But }) => {
    Given("the URL carries a filter combination that matches no model", () => {
      const { harness, tier } = emptyCombination();
      navState.search = `harness=${harness}&tier=${tier}`;
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then("an explicit empty-state message is shown", () => {
      const empty = screen.getByTestId("ai-bench-empty-state");
      expect(empty.textContent).toContain(t("en", "aiBenchEmptyStateTitle"));
      expect(empty.getAttribute("role")).toBe("status");
    });
    But("the tier map and the data table do not render", () => {
      expect(screen.queryByTestId("ai-bench-tier-map")).toBeNull();
      expect(screen.queryByTestId("ai-bench-table")).toBeNull();
      expect(screen.queryByTestId("ai-bench-insufficient")).toBeNull();
    });
  });

  // ── Accessibility and layout (declarative contract; measured by the e2e steps) ──

  ScenarioOutline("Tier colours meet contrast in both themes", ({ Given, When, Then, And }, variables) => {
    let bars: HTMLElement[] = [];
    Given('the page is rendered in the "<theme>" theme', () => {
      document.documentElement.classList.toggle("dark", variables.theme === "dark");
      renderPage();
    });
    When("the computed styles of the tier tokens are read from the live page", () => {
      bars = within(screen.getByTestId("ai-bench-tier-map")).getAllByTestId("ai-bench-bar");
    });
    Then("every tier label colour meets the WCAG AA contrast ratio against its background", () => {
      // Tier names are set in the page's body text colour; the tier hue only marks the swatch.
      for (const tier of ["ultra", "planning", "execution", "fast"] as const) {
        const heading = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByRole("heading", { level: 3 });
        expect(heading.className).not.toMatch(/text-\[var\(--chart-tier/);
      }
    });
    And("every tier bar fill meets the WCAG non-text contrast ratio against the page background", () => {
      const block = variables.theme === "dark" ? TOKENS_CSS.slice(TOKENS_CSS.indexOf(".dark")) : TOKENS_CSS;
      for (const tier of TIERS) expect(block).toMatch(new RegExp(`--chart-tier-${tier}:`));
      for (const bar of bars) {
        const tier = assignTier(byId(bar.closest("[data-model-id]")!.getAttribute("data-model-id")!), full);
        expect(bar.className).toContain(TIER_BG_CLASS[tier]);
      }
    });
  });

  ScenarioOutline("The document never scrolls horizontally", ({ Given, When, Then }, variables) => {
    let region: HTMLElement;
    Given('the AI benchmark page is loaded at a "<width>" px viewport in the "<locale>" locale', () => {
      ctx.viewportWidth = Number(variables.width);
      renderPage(variables.locale as Locale);
    });
    When("the document's scroll width is compared with its client width", () => {
      region = screen.getByRole("region", { name: t(variables.locale as Locale, "aiBenchTableHeading") });
    });
    Then("the document scroll width does not exceed the document client width", () => {
      // The only wide element, the table, scrolls inside its own keyboard-focusable region.
      expect(ctx.viewportWidth).toBeGreaterThan(0);
      expect(region.className).toMatch(/\boverflow-x-auto\b/);
      expect(region.getAttribute("tabindex")).toBe("0");
      expect(region.contains(screen.getByTestId("ai-bench-table"))).toBe(true);
      expect(screen.getByTestId("ai-bench-page").className).toMatch(/\bmax-w-6xl\b/);
    });
  });

  ScenarioOutline("Every interactive target meets the minimum target size", ({ Given, When, Then }, variables) => {
    let targets: Element[] = [];
    Given('the AI benchmark page is loaded at a "<width>" px viewport', () => {
      ctx.viewportWidth = Number(variables.width);
      renderPage("en", "sub=gpt-5.6-terra");
    });
    When("the bounding box of every link, form control, and disclosure control is measured", () => {
      targets = Array.from(screen.getByTestId("ai-bench-page").querySelectorAll("a, select, button, summary"));
    });
    Then("every measured target is at least 24 CSS pixels wide and at least 24 CSS pixels tall", () => {
      expect(targets.length).toBeGreaterThan(0);
      for (const el of targets) {
        const label = el.textContent ?? el.tagName;
        if (el.tagName === "A") {
          expect(el.className, label).toMatch(/\bmin-h-6\b/);
          expect(el.className, label).toMatch(/\bmin-w-6\b/);
          // min-width has no effect on an inline box, so the link must be laid out as a block.
          expect(el.className, label).toMatch(/\binline-(flex|block)\b/);
        } else if (el.tagName === "SUMMARY") {
          expect(el.className, label).toMatch(/\bmin-h-11\b/);
        } else {
          expect(el.className, label).toMatch(/\bh-11\b/);
        }
      }
    });
  });

  Scenario("Tier map label text never exceeds the page's body text size", ({ Given, When, Then, And }) => {
    let label: HTMLElement;
    Given("the AI benchmark page is loaded at a 1440 px viewport", () => {
      ctx.viewportWidth = 1440;
      renderPage();
    });
    When("the computed font sizes of a tier map model label and the page body text are read from the live page", () => {
      label = within(screen.getByTestId("ai-bench-tier-map")).getAllByTestId("ai-bench-tier-row-name")[0]!;
    });
    Then("the model label's computed font size is no larger than the page body text's computed font size", () => {
      expect(label.className).toMatch(/\btext-sm\b/);
      expect(label.className).not.toMatch(/\b(?:md|lg|xl):text-/);
    });
    And("the model label's computed font size is at least 12 CSS pixels", () => {
      expect(label.className).not.toMatch(/text-\[(?:[0-9]|1[01])px\]/);
    });
  });

  ScenarioOutline("The substitute finder is visible above the fold on a phone", ({ Given, When, Then }, variables) => {
    let finder: HTMLElement;
    Given('the AI benchmark page is loaded at a "<width>" px wide, "<height>" px tall viewport', () => {
      ctx.viewportWidth = Number(variables.width);
      ctx.viewportHeight = Number(variables.height);
      renderPage();
    });
    When("the vertical offset of the substitute finder is read from the live page", () => {
      finder = screen.getByTestId("ai-bench-finder");
    });
    Then("that offset is less than the viewport height", () => {
      // jsdom has no layout: assert only the short text header precedes the finder (title, purpose,
      // date, scoring line — no media); the live e2e measures the real offset.
      const page = screen.getByTestId("ai-bench-page");
      expect(page.children[0]!.tagName).toBe("HEADER");
      expect(page.children[1]).toBe(finder);
      const header = page.children[0]!;
      expect(header.children).toHaveLength(4);
      expect(header.querySelector("img, svg, picture, video")).toBeNull();
    });
  });

  ScenarioOutline("The page behaves identically in both locales", ({ Given, When, Then, And }, variables) => {
    Given('the AI benchmark page is loaded in the "<locale>" locale at a 390 px viewport', () => {
      ctx.viewportWidth = 390;
      ctx.locale = variables.locale as Locale;
    });
    When("the page renders", () => {
      renderPage(ctx.locale);
    });
    Then("the substitute finder is present above the fold", () => {
      expect(screen.getByTestId("ai-bench-page").children[1]).toBe(screen.getByTestId("ai-bench-finder"));
    });
    And("every tier section is present", () => {
      for (const tier of ["ultra", "planning", "execution", "fast"]) {
        expect(screen.getByTestId(`ai-bench-tier-${tier}`)).toBeTruthy();
      }
      expect(screen.getByTestId("ai-bench-insufficient")).toBeTruthy();
    });
    And("no raw translation key is rendered", () => {
      expect(document.body.textContent).not.toMatch(/aiBench|\{\w+\}/);
    });
  });
});
