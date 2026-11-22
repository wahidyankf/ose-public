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
  BENCHMARK_TIER_ANCHORS,
  DEFAULT_SUBSTITUTE_HARNESS,
  FRONTIER_VENDORS,
  HARNESS_DISPLAY_NAMES,
  HARNESS_IN_HOUSE_LINES,
  MIN_SCORED_BENCHMARKS,
  NEAREST_OPTION_COUNT,
  ROSTER_CATALOG_HARNESSES,
  SUBSTITUTE_HARNESSES,
  TIERS,
  rosterScopeParams,
} from "@/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import { OPERATORS, operatorById } from "@/features/ai-benchmark/core/data/operators";
import type { BenchmarkTier, HarnessId, Model, Tier } from "@/features/ai-benchmark/core/data/types";
import { HARNESS_IDS, filterModels } from "@/features/ai-benchmark/core/filter";
import { blendedPrice, priceRatio } from "@/features/ai-benchmark/core/price";
import { benchmarkScore, scoredFigure } from "@/features/ai-benchmark/core/score";
import { frontierModels, substitutesFor, type SubstituteResult } from "@/features/ai-benchmark/core/substitute";
import {
  assignBenchmarkTier,
  assignConsensusTier,
  benchmarkTierAnchors,
  byConsensusDesc,
  computeBenchmarkTierGroups,
  computeTierGroups,
  rankBenchmarkModels,
  scoreModels,
  type BenchmarkRow,
  type ConsensusModel,
} from "@/features/ai-benchmark/core/tiers";
import { formatDate, formatPercent, formatUsd, priceComparison, tf } from "@/features/ai-benchmark/shell/format";
import { SubstituteFinder } from "@/features/ai-benchmark/shell/substitute-finder";
import { TIER_BG_CLASS, tierLabel } from "@/features/ai-benchmark/shell/tier-style";
import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";
import {
  benchmarkAnchors,
  dataset as fixtureDataset,
  fig,
  model,
  price,
  quadAnchors,
  tiered,
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
  roster?: Model[];
  consensus?: ConsensusModel;
  tier?: Tier;
  benchmarkTier?: BenchmarkTier;
  blended?: number;
  result?: SubstituteResult;
  locale?: Locale;
  harness?: HarnessId;
  /** The harness the reader picked in the substitute finder; unset = the default. */
  finderHarness?: HarnessId;
  filterTier?: Tier;
  subIds?: string[];
  section?: ConsensusModel[];
  ranked?: BenchmarkRow[];
  unranked?: Model[];
  viewportWidth?: number;
  viewportHeight?: number;
  errorSpy?: ReturnType<typeof vi.spyOn>;
};

let ctx: Ctx = {};
let view: ReturnType<typeof render> | undefined;

const full = dataset;
const scored = scoreModels(full);
const rated = scored.filter((s) => s.tier !== "insufficient" && s.tier !== "no-consensus");
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

  // ── Consensus tiers ────────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The consensus tier is the tier the model holds on the most benchmarks
  ScenarioOutline(
    "The consensus tier is the tier the model holds on the most benchmarks",
    ({ Given, When, Then, And }, variables) => {
      type Held = "ultra" | "planning" | "execution" | "fast" | "unranked";
      Given(
        'a fixture model holding "<deepSwe>", "<terminalBench>", "<sweAtlas>", and "<frontierCode>" tiers on the four benchmarks',
        () => {
          const held = [variables.deepSwe, variables.terminalBench, variables.sweAtlas, variables.frontierCode].map(
            (t) => t as Held,
          );
          ctx.model = tiered("m", held[0]!, held[1]!, held[2]!, held[3]!);
          ctx.roster = [...quadAnchors(), ctx.model];
        },
      );
      When("its consensus tier is assigned", () => {
        ctx.consensus = assignConsensusTier(ctx.model!, fixtureDataset(ctx.roster!));
      });
      Then('that model\'s consensus tier is "<tier>"', () => {
        expect(ctx.consensus!.tier).toBe(variables.tier);
      });
      And("its consensus count is <agreeing> of <considered> benchmarks", () => {
        expect(ctx.consensus!.agreeing).toBe(Number(variables.agreeing));
        expect(ctx.consensus!.considered).toBe(Number(variables.considered));
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Models in one consensus section are ordered by consensus strength
  Scenario("Models in one consensus section are ordered by consensus strength", ({ Given, When, Then }) => {
    Given("fixture models in the planning consensus tier agreeing on 2 of 4, 3 of 4, and 3 of 3 benchmarks", () => {
      ctx.roster = [
        ...quadAnchors(),
        tiered("c-2of4", "planning", "planning", "execution", "execution"),
        tiered("b-3of4", "planning", "planning", "planning", "execution"),
        tiered("a-3of3", "planning", "planning", "planning", "unranked"),
      ];
    });
    When("the planning consensus section is ordered", () => {
      ctx.section = computeTierGroups(fixtureDataset(ctx.roster!)).planning;
    });
    Then("the order is 3 of 4, then 3 of 3, then 2 of 4", () => {
      // The per-benchmark anchor in the planning tier also agrees 3 of 3; assert relative order.
      const ids = ctx.section!.map((s) => s.model.id);
      expect(ids.indexOf("b-3of4")).toBeLessThan(ids.indexOf("a-3of3"));
      expect(ids.indexOf("a-3of3")).toBeLessThan(ids.indexOf("c-2of4"));
      expect(ids.indexOf("b-3of4")).toBe(0);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: no-consensus models
  Scenario("no-consensus models", ({ Given, And, When, Then }) => {
    let split: Model[] = [];
    Given("the roster holds models whose benchmarks split below half", () => {
      split = scored.filter((s) => s.tier === "no-consensus").map((s) => s.model);
      expect(split.length).toBeGreaterThan(0);
    });
    And("the AI benchmark page is open in the Consensus tiers view", () => {
      renderPage();
    });
    When("the page renders", () => {
      expect(screen.getByTestId("ai-bench-page")).toBeTruthy();
    });
    Then("those models are listed inside the closed no-consensus disclosure", () => {
      const details = screen.getByTestId("ai-bench-no-consensus") as HTMLDetailsElement;
      expect(details.tagName).toBe("DETAILS");
      expect(details.open).toBe(false);
      expect(sorted(idsIn("ai-bench-no-consensus-item", details))).toEqual(sorted(split.map((m) => m.id)));
    });
    And("each of those models has no consensus tier", () => {
      for (const m of split) expect(assignConsensusTier(m, full).tier).toBe("no-consensus");
    });
    And("those models appear in no tier section", () => {
      const inSections = tierMapIds();
      for (const m of split) expect(inSections).not.toContain(m.id);
    });
    And("the insufficient-data disclosure does not list them", () => {
      const insufficient = screen.getByTestId("ai-bench-insufficient");
      for (const m of split) {
        expect(insufficient.querySelector(`[data-model-id="${m.id}"]`)).toBeNull();
      }
    });
  });

  // ── Tiers ────────────────────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Every roster model appears in exactly one tier section
  Scenario("Every roster model appears in exactly one tier section", ({ Given, When, Then }) => {
    let groups: ReturnType<typeof computeTierGroups>;
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the tier groups are computed", () => {
      groups = computeTierGroups(full);
    });
    Then('each model appears in exactly one of "ultra", "planning", "execution", "fast", or "insufficient"', () => {
      const all = TIERS.flatMap((tier) => groups[tier].map((s) => s.model.id));
      const noConsensus = groups["no-consensus"].map((s) => s.model.id);
      expect(sorted([...all, ...noConsensus])).toEqual(sorted(full.models.map((m) => m.id)));
    });
  });

  // ── Price ────────────────────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The blended price weights input three to one against output
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Only chosen-harness models at the same or a higher tier are listed
  Scenario("Only chosen-harness models at the same or a higher tier are listed", ({ Given, And, When, Then }) => {
    Given('a frontier fixture model in the "planning" tier', () => {
      ctx.model = tiered("frontier", "planning", "planning", "planning", "execution", { vendor: "OpenAI" });
      ctx.roster = [...quadAnchors(), ctx.model];
      expect(assignConsensusTier(ctx.model, fixtureDataset(ctx.roster)).tier).toBe("planning");
    });
    And(
      'fixture models of the "command-code-pro" harness in the "ultra", "planning", and "execution" tiers and one with insufficient data',
      () => {
        ctx.roster!.push(
          tiered("pro-planning", "planning", "planning", "planning", "execution", {
            harnesses: ["command-code-pro"],
          }),
          tiered("pro-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["command-code-pro"] }),
          tiered("pro-execution", "execution", "execution", "execution", "execution", {
            harnesses: ["command-code-pro"],
          }),
          tiered("pro-insufficient", "planning", "unranked", "unranked", "unranked", {
            harnesses: ["command-code-pro"],
          }),
        );
      },
    );
    And('fixture models of the "opencode-go" harness in the "ultra" and "planning" tiers', () => {
      ctx.roster!.push(
        tiered("go-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["opencode-go"] }),
        tiered("go-planning", "planning", "planning", "planning", "execution", { harnesses: ["opencode-go"] }),
      );
    });
    When('substitutes are listed for the frontier model from the "command-code-pro" harness', () => {
      ctx.result = substitutesFor(ctx.model!, fixtureDataset(ctx.roster!), "command-code-pro");
    });
    Then('the substitutes are only the "ultra" and "planning" models of the "command-code-pro" harness', () => {
      expect(ctx.result!.kind).toBe("matches");
      expect(sorted(ctx.result!.models.map((s) => s.model.id))).toEqual(["pro-planning", "pro-ultra"]);
      for (const s of ctx.result!.models) expect(s.model.harnesses).toContain("command-code-pro");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Substitutes are ordered best first
  Scenario("Substitutes are ordered best first", ({ Given, And, When, Then }) => {
    Given('a frontier fixture model in the "planning" tier', () => {
      ctx.model = tiered("frontier", "planning", "planning", "planning", "execution", { vendor: "OpenAI" });
      ctx.roster = [...quadAnchors(), ctx.model];
      expect(assignConsensusTier(ctx.model, fixtureDataset(ctx.roster)).tier).toBe("planning");
    });
    And(
      'fixture models of the "command-code-pro" harness in the "ultra", "planning", and "execution" tiers and one with insufficient data',
      () => {
        ctx.roster!.push(
          tiered("pro-planning", "planning", "planning", "planning", "execution", {
            harnesses: ["command-code-pro"],
          }),
          tiered("pro-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["command-code-pro"] }),
          tiered("pro-execution", "execution", "execution", "execution", "execution", {
            harnesses: ["command-code-pro"],
          }),
          tiered("pro-insufficient", "planning", "unranked", "unranked", "unranked", {
            harnesses: ["command-code-pro"],
          }),
        );
      },
    );
    And('fixture models of the "opencode-go" harness in the "ultra" and "planning" tiers', () => {
      ctx.roster!.push(
        tiered("go-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["opencode-go"] }),
        tiered("go-planning", "planning", "planning", "planning", "execution", { harnesses: ["opencode-go"] }),
      );
    });
    When('substitutes are listed for the frontier model from the "command-code-pro" harness', () => {
      ctx.result = substitutesFor(ctx.model!, fixtureDataset(ctx.roster!), "command-code-pro");
    });
    Then("the substitutes are ordered by consensus tier from highest to lowest, then by consensus strength", () => {
      expect(ctx.result!.kind).toBe("matches");
      expect(ctx.result!.models.map((s) => s.model.id)).toEqual(["pro-ultra", "pro-planning"]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The substitute finder offers three harnesses with Command Code Pro chosen first
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Choosing a frontier model lists its Command Code Pro substitutes with a price comparison
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
      Then(
        "the finder lists Command Code Pro models with their consensus tier, consensus count, and blended price",
        () => {
          const expected = substitutesFor(ctx.model!, full, "command-code-pro");
          expect(expected.kind).toBe("matches");
          expect(subIds()).toEqual(expected.models.map((s) => s.model.id));
          for (const s of expected.models) {
            expect(s.model.harnesses).toContain("command-code-pro");
            const item = document.querySelector(`[data-testid="ai-bench-sub-item"][data-model-id="${s.model.id}"]`)!;
            expect(within(item as HTMLElement).getByTestId("ai-bench-sub-tier").textContent).toBe(
              tierLabel(s.tier, "en"),
            );
            expect(within(item as HTMLElement).getByTestId("ai-bench-sub-count").textContent).toBe(
              tf("en", "aiBenchTierConsensusCount", { agreeing: s.agreeing, considered: s.considered }),
            );
            expect(within(item as HTMLElement).getByTestId("ai-bench-sub-blended").textContent).toBe(
              blendedText(s.model),
            );
          }
        },
      );
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: A frontier model above every model of the chosen harness shows the nearest options
  Scenario(
    "A frontier model above every model of the chosen harness shows the nearest options",
    ({ Given, When, Then, And }) => {
      Given("the AI benchmark page is open", () => {
        renderPage();
      });
      When("the reader chooses a harness and a frontier model whose tier is above every model of that harness", () => {
        // Under consensus tiers every finder harness lists an ultra model and ultra is the top
        // tier, so no live frontier/harness pair can satisfy the precondition. Verify the contract
        // with a controlled roster through the real finder UI instead.
        const fixtureModels = [
          ...quadAnchors(),
          tiered("fixture-frontier-ultra", "ultra", "ultra", "ultra", "ultra", { vendor: "Anthropic" }),
          tiered("fixture-go-planning", "planning", "planning", "planning", "execution", {
            vendor: "OpenWeights",
            harnesses: ["opencode-go"],
          }),
          tiered("fixture-go-execution", "execution", "execution", "execution", "execution", {
            vendor: "OpenWeights",
            harnesses: ["opencode-go"],
          }),
          tiered("fixture-go-fast", "fast", "fast", "fast", "fast", {
            vendor: "OpenWeights",
            harnesses: ["opencode-go"],
          }),
        ];
        const fixture = fixtureDataset(fixtureModels);
        const target = fixture.models.find((m) => m.id === "fixture-frontier-ultra")!;
        const harness: HarnessId = "opencode-go";
        const result = substitutesFor(target, fixture, harness);
        expect(result.kind).toBe("nearest");
        expect(result.models.length).toBeGreaterThan(0);
        ctx.roster = fixtureModels;
        ctx.model = target;
        ctx.finderHarness = harness;
        ctx.result = result;
        cleanup();
        view = render(
          <SubstituteFinder
            dataset={fixture}
            selectedId={target.id}
            harness={harness}
            locale="en"
            onSelect={() => undefined}
            onSelectHarness={() => undefined}
          />,
        );
      });
      Then("the finder states that no model of that harness reaches that model's tier", () => {
        const fixture = fixtureDataset(ctx.roster!);
        expect(screen.getByTestId("ai-bench-finder-lead").textContent).toBe(
          tf("en", "aiBenchFinderNearest", {
            harness: HARNESS_DISPLAY_NAMES[ctx.finderHarness!],
            tier: tierLabel(assignConsensusTier(ctx.model!, fixture).tier, "en"),
          }),
        );
      });
      And("the finder lists the highest-scoring models of that harness as the nearest options", () => {
        const fixture = fixtureDataset(ctx.roster!);
        const harness = ctx.finderHarness!;
        const fixtureScored = scoreModels(fixture);
        const candidates = fixtureScored
          .filter((s) => s.tier !== "insufficient")
          .filter((s) => s.model.harnesses.includes(harness) && s.model.id !== ctx.model!.id)
          .sort(byConsensusDesc);
        const listed = subIds().map((id) => fixtureScored.find((s) => s.model.id === id)!);
        // Compare consensus strength, not ids: equally strong models keep their id order on both sides.
        expect(listed.map((s) => [s.tier, s.agreeing, s.considered])).toEqual(
          candidates.slice(0, NEAREST_OPTION_COUNT).map((s) => [s.tier, s.agreeing, s.considered]),
        );
        for (const s of listed) expect(s.model.harnesses).toContain(harness);
        expect(screen.getByTestId("ai-bench-sub-list").getAttribute("data-kind")).toBe("nearest");
        expect(substitutesFor(ctx.model!, fixture, harness).kind).toBe("nearest");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Changing the finder's harness lists that harness's models
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
                tier: tierLabel(assignConsensusTier(ctx.model!, full).tier, "en"),
              }),
        );
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: AI benchmark choices are kept in the URL
  Scenario("AI benchmark choices are kept in the URL", ({ Given, When, Then, And }) => {
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
    When('the reader changes the finder\'s harness to "Command Code"', () => {
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
    When('the reader changes the score basis to "Terminal-Bench"', () => {
      fireEvent.change(screen.getByLabelText(t("en", "aiBenchScoreBasisLabel")), {
        target: { value: "terminal-bench" },
      });
      followPush();
      ctx.subIds = tierMapIds();
    });
    Then("the URL carries that benchmark as the score basis", () => {
      expect(new URLSearchParams(navState.search).get("benchmark")).toBe("terminal-bench");
    });
    And("reloading that URL shows the same per-benchmark ranking", () => {
      cleanup();
      renderPage("en", navState.search);
      expect((screen.getByLabelText(t("en", "aiBenchScoreBasisLabel")) as HTMLSelectElement).value).toBe(
        "terminal-bench",
      );
      expect(tierMapIds()).toEqual(ctx.subIds);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: unrecognized URL values fall back to the default
  ScenarioOutline("unrecognized URL values fall back to the default", ({ Given, When, Then, But }, variables) => {
    Given('the URL carries the "<key>" parameter with an unknown value', () => {
      ctx.errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      navState.search = `${variables.key}=not-a-value`;
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then('the "<control>" falls back to its default', () => {
      if (variables.control === "substitute harness") {
        expect(finderHarnessSelect().value).toBe("command-code-pro");
        expect(selectedLabel(finderHarnessSelect())).toBe("Command Code Pro");
      } else if (variables.control === "harness filter") {
        expect(sorted(tableIds())).toEqual(sorted(full.models.map((m) => m.id)));
        expect((screen.getByLabelText(t("en", "aiBenchFilterHarness")) as HTMLSelectElement).value).toBe("");
      } else {
        const groups = computeTierGroups(full);
        expect(tierMapIds()).toEqual(
          (["ultra", "planning", "execution", "fast"] as const).flatMap((tier) => groups[tier].map((s) => s.model.id)),
        );
        expect((screen.getByLabelText(t("en", "aiBenchScoreBasisLabel")) as HTMLSelectElement).value).toBe("");
      }
    });
    But("no error is surfaced to the reader", () => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(ctx.errorSpy).not.toHaveBeenCalled();
    });
  });

  // ── Page header and dates ────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: AI benchmark renders fully in both locales
  ScenarioOutline("AI benchmark renders fully in both locales", ({ Given, When, Then, And }, variables) => {
    Given('the AI benchmark page is loaded in the "<locale>" locale at a 390 px viewport', () => {
      ctx.viewportWidth = 390;
      ctx.locale = variables.locale as Locale;
    });
    When("the AI benchmark page renders", () => {
      // Open every disclosure and pick a finder target so every string path renders.
      renderPage(ctx.locale, "sub=gpt-5.6-terra");
      for (const d of Array.from(document.querySelectorAll("details"))) d.open = true;
    });
    Then('the page shows a level-one heading in "<language>"', () => {
      const code: Locale = variables.language === "Indonesian" ? "id" : "en";
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t(code, "aiBenchTitle"));
      expect(t(code, "aiBenchTitle")).not.toBe(t(code === "en" ? "id" : "en", "aiBenchTitle"));
    });
    And('the document language attribute is "<locale>"', () => {
      expect(document.documentElement.lang).toBe(variables.locale);
    });
    And("the substitute finder is present above the fold", () => {
      expect(screen.getByTestId("ai-bench-page").children[1]).toBe(screen.getByTestId("ai-bench-finder"));
    });
    And("every tier section is present", () => {
      for (const tier of ["ultra", "planning", "execution", "fast"]) {
        expect(screen.getByTestId(`ai-bench-tier-${tier}`)).toBeTruthy();
      }
      expect(screen.getByTestId("ai-bench-insufficient")).toBeTruthy();
      expect(screen.getByTestId("ai-bench-no-consensus")).toBeTruthy();
    });
    And("no rendered text matches a raw translation key", () => {
      expect(document.body.textContent).not.toMatch(/aiBench|\{\w+\}/);
    });
    And("no raw translation key is rendered", () => {
      expect(document.body.textContent).not.toMatch(/aiBench|\{\w+\}/);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The last-updated date is shown before the substitute finder
  Scenario("The last-updated date is shown before the substitute finder", ({ Given, When, Then, And }) => {
    Given("the dataset carries a last-updated date", () => {
      expect(full.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    And("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the page renders", () => {
      expect(screen.getByTestId("ai-bench-page")).toBeTruthy();
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The page states that only independent results are scored
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Each consensus tier section states the consensus rule
  Scenario("Each consensus tier section states the consensus rule", ({ Given, When, Then, And }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the tier map is rendered in the Consensus tiers view", () => {
      renderPage();
    });
    Then("every tier section states that its models hold that tier on the most benchmarks", () => {
      for (const tier of ["ultra", "planning", "execution", "fast"] as const) {
        const rule = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByTestId("ai-bench-tier-rule");
        expect(rule.textContent).toBe(tf("en", "aiBenchTierConsensusRule", { tier: tierLabel(tier, "en") }));
      }
    });
    And("no tier section names a composite anchor or a composite floor score", () => {
      for (const tier of ["ultra", "planning", "execution", "fast"] as const) {
        const section = within(screen.getByTestId(`ai-bench-tier-${tier}`));
        expect(section.queryByTestId("ai-bench-tier-floor")).toBeNull();
      }
      expect(document.querySelector('[data-testid="ai-bench-tier-map"]')!.textContent).not.toMatch(
        /composite|average/i,
      );
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Every rated model row shows its bar, consensus count, and API price in text
  Scenario(
    "Every rated model row shows its bar, consensus count, and API price in text",
    ({ Given, When, Then, And, But }) => {
      let rows: HTMLElement[] = [];
      Given("the full roster is loaded", () => {
        expect(rated.length).toBeGreaterThan(0);
      });
      When("the tier map is rendered in the Consensus tiers view", () => {
        renderPage();
        rows = within(screen.getByTestId("ai-bench-tier-map")).getAllByTestId("ai-bench-tier-row");
      });
      Then("every rated model row carries the model name and its consensus count in text", () => {
        expect(sorted(rows.map((r) => r.getAttribute("data-model-id")!))).toEqual(sorted(rated.map((s) => s.model.id)));
        for (const row of rows) {
          const s = scored.find((x) => x.model.id === row.getAttribute("data-model-id")!)!;
          expect(within(row).getByTestId("ai-bench-tier-row-name").textContent).toBe(s.model.name);
          expect(within(row).getByTestId("ai-bench-tier-row-count").textContent).toBe(
            tf("en", "aiBenchTierConsensusCount", { agreeing: s.agreeing, considered: s.considered }),
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
      But("no rated model row shows a composite index", () => {
        for (const row of rows) expect(within(row).queryByTestId("ai-bench-tier-row-index")).toBeNull();
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Bar length is proportional to the agreeing count
  Scenario("Bar length is proportional to the agreeing count", ({ Given, When, Then }) => {
    let pair: [string, string];
    Given("two rated models agreeing on different numbers of benchmarks", () => {
      const top = [...rated].sort(byConsensusDesc);
      pair = [top[0]!.model.id, top[top.length - 1]!.model.id];
      expect(top[0]!.agreeing).not.toBe(top[top.length - 1]!.agreeing);
    });
    When("the tier map is rendered in the Consensus tiers view", () => {
      renderPage();
    });
    Then("the ratio of their bar lengths equals the ratio of their agreeing counts out of all benchmarks", () => {
      const width = (id: string) => {
        const row = document.querySelector(`[data-testid="ai-bench-tier-row"][data-model-id="${id}"]`)!;
        return parseFloat((row.querySelector('[data-testid="ai-bench-bar"]') as HTMLElement).style.width);
      };
      const byAgreeing = (id: string) => scored.find((s) => s.model.id === id)!.agreeing;
      const [a, b] = pair;
      expect(width(a) / width(b)).toBeCloseTo(byAgreeing(a) / byAgreeing(b), 6);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The tier is carried in text, not by colour alone
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: A limited-access model is labelled
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: insufficient-data models
  Scenario("insufficient-data models", ({ Given, When, Then, And }) => {
    let insufficient: Model[] = [];
    Given("the roster holds models scored on fewer than two benchmarks", () => {
      insufficient = scored.filter((s) => s.tier === "insufficient").map((s) => s.model);
      expect(insufficient.length).toBeGreaterThan(0);
    });
    And("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the page renders", () => {
      expect(screen.getByTestId("ai-bench-page")).toBeTruthy();
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
    And('each of those models has consensus tier "insufficient" and no consensus count', () => {
      for (const m of insufficient) {
        const consensus = assignConsensusTier(m, full);
        expect(consensus.tier).toBe("insufficient");
        expect(consensus.agreeing).toBe(0);
      }
    });
  });

  // ── Data table ───────────────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The data table is present without any interaction
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The table lists every model's scores, tier, and prices
  Scenario("The table lists every model's scores, tier, and prices", ({ Given, When, Then }) => {
    Given("the full roster is loaded", () => {
      expect(full.models.length).toBeGreaterThan(0);
    });
    When("the data table is rendered", () => {
      renderPage();
    });
    Then(
      "each model row lists the tier of the active view, every benchmark score, input price, output price, and blended price",
      () => {
        expect(sorted(tableIds())).toEqual(sorted(full.models.map((m) => m.id)));
        for (const s of scored) {
          const row = tableRow(s.model.id) as HTMLElement;
          const cell = (id: string) => within(row).getByTestId(id).textContent;
          expect(cell("ai-bench-table-tier")).toBe(tierLabel(s.tier, "en"));
          expect(within(row).queryByTestId("ai-bench-table-index")).toBeNull();
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Every benchmark score names and links its operator
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Cost per task is shown where an independent operator publishes it
  Scenario("Cost per task is shown where an independent operator publishes it", ({ Given, When, Then, And }) => {
    Given("a model whose independent operator publishes a cost per task", () => {
      ctx.model = full.models.find((m) => m.costPerTask !== undefined)!;
      expect(ctx.model).toBeDefined();
    });
    And("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the data table is rendered", () => {
      expect(screen.getByTestId("ai-bench-table-section")).toBeTruthy();
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The methodology lists every benchmark, the roster, the operator order, and the consensus minimum
  Scenario(
    "The methodology lists every benchmark, the roster, the operator order, and the consensus minimum",
    ({ Given, When, Then, And }) => {
      let details: HTMLElement;
      Given("the AI benchmark page is open", () => {
        renderPage();
      });
      When("the reader opens the methodology section", () => {
        details = openMethodology();
      });
      Then("it lists every benchmark with its version", () => {
        const items = within(details).getAllByTestId("ai-bench-method-benchmark");
        expect(items.map((i) => i.getAttribute("data-benchmark"))).toEqual(BENCHMARK_SPECS.map((b) => b.id));
        BENCHMARK_SPECS.forEach((b, i) => {
          expect(items[i]!.textContent).toContain(b.name);
          expect(items[i]!.textContent).toContain(tf("en", "aiBenchMethodVersion", { version: b.version }));
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
      And("it states the minimum number of benchmarks needed for a consensus tier", () => {
        expect(within(details).getByTestId("ai-bench-method-index").textContent).toBe(
          tf("en", "aiBenchMethodIndex", { min: MIN_SCORED_BENCHMARKS }),
        );
      });
      And("it states that no average or composite score is computed", () => {
        expect(within(details).getByTestId("ai-bench-method-no-average").textContent).toBe(
          t("en", "aiBenchMethodNoAverage"),
        );
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The methodology states the consensus rule
  Scenario("The methodology states the consensus rule", ({ Given, When, Then, And }) => {
    let details: HTMLElement;
    Given("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the reader opens the methodology section", () => {
      details = openMethodology();
    });
    Then("it states that a model's consensus tier is the tier it holds on the most benchmarks", () => {
      expect(within(details).getByTestId("ai-bench-method-consensus").textContent).toBe(
        t("en", "aiBenchMethodConsensus"),
      );
    });
    And("it states that a consensus tie goes to the highest tied tier", () => {
      expect(within(details).getByTestId("ai-bench-method-consensus").textContent).toMatch(/highest/);
    });
    And(
      "it states that a tier needs at least half of the model's tiered benchmarks to agree, and a model below half has no consensus tier",
      () => {
        const text = within(details).getByTestId("ai-bench-method-consensus").textContent!;
        expect(text).toMatch(/half/);
        expect(text).toContain("no consensus tier");
      },
    );
    And(
      "it states that models are ordered inside a tier by how many benchmarks agree, then by how many benchmarks rated the model",
      () => {
        expect(within(details).getByTestId("ai-bench-method-consensus-order").textContent).toBe(
          t("en", "aiBenchMethodConsensusOrder"),
        );
      },
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The page lists every operator with its checked date and terms
  Scenario("The page lists every operator with its checked date and terms", ({ Given, When, Then, And }) => {
    Given("the dataset names its benchmark operators and price sources", () => {
      const used = new Set(full.models.flatMap((m) => m.figures.map((f) => f.operator)));
      for (const id of used) expect(OPERATORS.map((o) => o.id)).toContain(id);
    });
    And("the AI benchmark page is open", () => {
      renderPage();
    });
    When("the page renders", () => {
      expect(screen.getByTestId("ai-bench-page")).toBeTruthy();
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

  // ── Filters ──────────────────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The page with no query parameters shows the whole roster
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: harness filter
  ScenarioOutline("harness filter", ({ Given, When, Then, And }, variables) => {
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
    And("only models that harness exposes are shown in the tier map", () => {
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: tier filter
  ScenarioOutline("tier filter", ({ Given, When, Then, And }, variables) => {
    Given('the URL carries "<query>"', () => {
      navState.search = variables.query;
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then('only models in that tier are shown in the "<view>"', () => {
      if (variables.view === "tier map") {
        const expected = scored.filter((s) => s.tier === "planning").map((s) => s.model.id);
        expect(expected.length).toBeGreaterThan(0);
        expect(sorted(tierMapIds())).toEqual(sorted(expected));
        expect(screen.queryByTestId("ai-bench-tier-ultra")).toBeNull();
      } else {
        const shown = filterModels(full, { benchmark: "deep-swe", tier: "planning" }, full);
        expect(shown.length).toBeGreaterThan(0);
        const { groups } = computeBenchmarkTierGroups({ ...full, models: shown }, "deep-swe", full);
        expect(tierMapIds()).toEqual(groups.planning.map((r) => r.model.id));
        for (const id of tierMapIds()) {
          expect(assignBenchmarkTier(byId(id), "deep-swe", full)).toBe("planning");
        }
      }
    });
    And("only models in that tier are shown in the data table", () => {
      if (variables.view === "tier map") {
        expect(sorted(tableIds())).toEqual(sorted(scored.filter((s) => s.tier === "planning").map((s) => s.model.id)));
      } else {
        expect(sorted(tableIds())).toEqual(sorted(tierMapIds()));
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Harness and tier parameters intersect
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: A duplicated query parameter resolves to its first value
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: resetting a control removes it from the URL
  ScenarioOutline("resetting a control removes it from the URL", ({ Given, When, Then, And }, variables) => {
    const controlLabel = () =>
      variables.control === "tier filter" ? t("en", "aiBenchFilterTier") : t("en", "aiBenchScoreBasisLabel");
    Given('the URL carries "<query>"', () => {
      navState.search = variables.query;
    });
    When('the reader resets the "<control>" to its default', () => {
      renderPage("en", navState.search);
      fireEvent.change(screen.getByLabelText(controlLabel()), { target: { value: "" } });
      followPush();
    });
    Then('the URL no longer carries the "<parameter>" parameter', () => {
      expect(new URLSearchParams(navState.search).has(variables.parameter)).toBe(false);
    });
    And("the URL keeps its other parameters", () => {
      const before = new URLSearchParams(variables.query);
      const after = new URLSearchParams(navState.search);
      for (const [key, value] of before) {
        if (key !== variables.parameter) expect(after.get(key)).toBe(value);
      }
    });
    And('the "<control>" shows its default', () => {
      expect((screen.getByLabelText(controlLabel()) as HTMLSelectElement).value).toBe("");
      if (variables.control === "score basis") {
        const groups = computeTierGroups(full);
        expect(tierMapIds()).toEqual(
          (["ultra", "planning", "execution", "fast"] as const).flatMap((tier) => groups[tier].map((s) => s.model.id)),
        );
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: A filter combination matching no model renders an explicit empty state
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

  // ── Score basis (average vs per-benchmark) ─────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The score basis defaults to the consensus tiers
  Scenario("The score basis defaults to the consensus tiers", ({ Given, When, Then, And }) => {
    const scoreBasisSelect = () => screen.getByLabelText(t("en", "aiBenchScoreBasisLabel")) as HTMLSelectElement;
    Given("the URL carries no benchmark parameter", () => {
      navState.search = "";
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then("the tier map groups models by consensus tier", () => {
      const groups = computeTierGroups(full);
      expect(tierMapIds()).toEqual(
        (["ultra", "planning", "execution", "fast"] as const).flatMap((tier) => groups[tier].map((s) => s.model.id)),
      );
    });
    And('the score basis control shows "Consensus tiers"', () => {
      expect(scoreBasisSelect().value).toBe("");
      expect(selectedLabel(scoreBasisSelect())).toBe(t("en", "aiBenchScoreBasisConsensus"));
      expect(scoreBasisSelect().options).toHaveLength(1 + BENCHMARK_SPECS.length);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Naming a benchmark ranks models by its raw score
  Scenario("Naming a benchmark ranks models by its raw score", ({ Given, When, Then, And }) => {
    Given("fixture models scoring 60, 80, and 70 on DeepSWE 1.1", () => {
      ctx.roster = [
        model("low", [fig("deep-swe", 60, "1.1")]),
        model("high", [fig("deep-swe", 80, "1.1")]),
        model("mid", [fig("deep-swe", 70, "1.1")]),
      ];
    });
    When("the models are ranked for the DeepSWE score basis", () => {
      const { ranked, unranked } = rankBenchmarkModels(ctx.roster!, "deep-swe");
      ctx.ranked = ranked;
      ctx.unranked = unranked;
    });
    Then("the ranked order is 80, 70, then 60", () => {
      expect(ctx.ranked!.map((r) => r.score)).toEqual([80, 70, 60]);
      expect(ctx.unranked).toEqual([]);
    });
    And("each shown score equals that model's DeepSWE figure with no normalization", () => {
      for (const r of ctx.ranked!) expect(r.score).toBe(benchmarkScore(r.model, "deep-swe"));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Only the pinned version counts in a per-benchmark view
  Scenario("Only the pinned version counts in a per-benchmark view", ({ Given, When, Then }) => {
    Given("a fixture model scoring 90 on Terminal-Bench 2.1 with no Terminal-Bench 4.0 figure", () => {
      ctx.model = model("m", [fig("terminal-bench", 90, "2.1")]);
    });
    When("the models are ranked for the Terminal-Bench score basis", () => {
      const { ranked, unranked } = rankBenchmarkModels([ctx.model!], "terminal-bench");
      ctx.ranked = ranked;
      ctx.unranked = unranked;
    });
    Then("that model is unranked", () => {
      expect(ctx.ranked).toEqual([]);
      expect(ctx.unranked!.map((m) => m.id)).toEqual([ctx.model!.id]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Models without a score on the chosen benchmark are listed as unranked
  Scenario("Models without a score on the chosen benchmark are listed as unranked", ({ Given, And, When, Then }) => {
    Given("the roster holds models with no scored FrontierCode-AA figure", () => {
      const missing = full.models.filter((m) => benchmarkScore(m, "frontiercode-aa") === undefined);
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.length).toBeLessThan(full.models.length);
    });
    And("the URL carries a benchmark parameter naming FrontierCode-AA", () => {
      navState.search = "benchmark=frontiercode-aa";
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then("those models are listed inside the closed unranked disclosure", () => {
      const details = screen.getByTestId("ai-bench-insufficient") as HTMLDetailsElement;
      expect(details.open).toBe(false);
      const expected = sorted(
        full.models.filter((m) => benchmarkScore(m, "frontiercode-aa") === undefined).map((m) => m.id),
      );
      expect(sorted(idsIn("ai-bench-insufficient-item", details))).toEqual(expected);
    });
    And("the ranked list holds only models with a scored FrontierCode-AA figure in descending raw-score order", () => {
      const expected = full.models
        .flatMap((m) => {
          const score = benchmarkScore(m, "frontiercode-aa");
          return score === undefined ? [] : [{ id: m.id, score }];
        })
        .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
      expect(expected.length).toBeGreaterThan(0);
      expect(tierMapIds()).toEqual(expected.map((e) => e.id));
      for (const e of expected) {
        const row = screen.getByTestId("ai-bench-tier-map").querySelector(`[data-model-id="${e.id}"]`)!;
        expect(within(row as HTMLElement).getByTestId("ai-bench-tier-row-index").textContent).toBe(
          formatPercent(e.score, "en"),
        );
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The methodology explains the per-benchmark view
  Scenario("The methodology explains the per-benchmark view", ({ Given, When, Then, And }) => {
    Given("the AI benchmark page is open", () => {
      renderPage("en", "");
    });
    When("the reader opens the methodology section", () => {
      fireEvent.click(screen.getByRole("link", { name: t("en", "aiBenchJumpToMethod") }));
    });
    Then("it names the five score basis options: the consensus tiers and the four benchmarks", () => {
      const text = screen.getByTestId("ai-bench-method-score-basis").textContent!;
      expect(text).toContain(t("en", "aiBenchScoreBasisConsensus"));
      for (const b of BENCHMARK_SPECS) expect(text).toContain(b.name);
    });
    And("it states that a per-benchmark view shows raw operator figures with no normalization", () => {
      expect(screen.getByTestId("ai-bench-method-raw").textContent).toBe(t("en", "aiBenchMethodRawScores"));
    });
    And("it states that models without a scored figure on the chosen benchmark are unranked", () => {
      expect(screen.getByTestId("ai-bench-method-unranked").textContent).toBe(t("en", "aiBenchMethodUnranked"));
    });
  });

  // ── Per-benchmark tiers ────────────────────────────────────────────────────

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark
  ScenarioOutline(
    "A model is placed in the highest per-benchmark tier whose anchor it meets on that benchmark",
    ({ Given, And, When, Then }, variables) => {
      Given("fixture DeepSWE anchors scoring 60 for ultra, 55 for planning, and 45 for execution", () => {
        ctx.roster = benchmarkAnchors("deep-swe", 60, 55, 45);
      });
      And("a fixture model scoring <score> on DeepSWE 1.1", () => {
        ctx.model = model("m", [fig("deep-swe", Number(variables.score), "1.1")]);
      });
      When("its DeepSWE tier is assigned", () => {
        ctx.benchmarkTier = assignBenchmarkTier(ctx.model!, "deep-swe", fixtureDataset([...ctx.roster!, ctx.model!]));
      });
      Then('that model\'s DeepSWE tier is "<tier>"', () => {
        expect(ctx.benchmarkTier).toBe(variables.tier);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Per-benchmark tier sections name their benchmark anchor and floor
  Scenario("Per-benchmark tier sections name their benchmark anchor and floor", ({ Given, When, Then, And }) => {
    const anchors = benchmarkTierAnchors(full, "terminal-bench");
    Given("the URL carries a benchmark parameter naming Terminal-Bench", () => {
      navState.search = "benchmark=terminal-bench";
    });
    When("the page renders", () => {
      renderPage("en", navState.search);
    });
    Then("the ultra, planning, and execution sections each name their Terminal-Bench anchor model", () => {
      for (const tier of ["ultra", "planning", "execution"] as const) {
        const floor = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByTestId("ai-bench-tier-floor");
        expect(floor.textContent).toContain(anchors[tier]!.model.name);
      }
    });
    And("each of those sections states its floor as a raw Terminal-Bench score", () => {
      for (const tier of ["ultra", "planning", "execution"] as const) {
        const floor = within(screen.getByTestId(`ai-bench-tier-${tier}`)).getByTestId("ai-bench-tier-floor");
        expect(floor.textContent).toContain("Terminal-Bench");
        expect(floor.textContent).toContain(formatPercent(anchors[tier]!.score, "en"));
      }
    });
    And("the fast section states that it holds models below the Terminal-Bench execution floor", () => {
      expect(within(screen.getByTestId("ai-bench-tier-fast")).getByTestId("ai-bench-tier-floor").textContent).toBe(
        tf("en", "aiBenchTierBenchmarkFastFloor", { benchmark: "Terminal-Bench" }),
      );
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The methodology lists every benchmark's tier anchors
  Scenario("The methodology lists every benchmark's tier anchors", ({ Given, When, Then, And }) => {
    Given("the AI benchmark page is open", () => {
      renderPage("en", "");
    });
    When("the reader opens the methodology section", () => {
      fireEvent.click(screen.getByRole("link", { name: t("en", "aiBenchJumpToMethod") }));
    });
    Then("it lists every benchmark with its ultra, planning, and execution anchor and floor score", () => {
      const items = screen.getAllByTestId("ai-bench-method-benchmark-anchor");
      expect(items.map((i) => i.getAttribute("data-benchmark"))).toEqual(BENCHMARK_SPECS.map((b) => b.id));
      for (const item of items) {
        const benchmark = item.getAttribute("data-benchmark") as (typeof BENCHMARK_SPECS)[number]["id"];
        for (const tier of ["ultra", "planning", "execution"] as const) {
          const anchor = byId(BENCHMARK_TIER_ANCHORS[benchmark][tier]);
          expect(item.textContent, `${benchmark}/${tier}`).toContain(anchor.name);
          expect(item.textContent, `${benchmark}/${tier}`).toContain(
            formatPercent(benchmarkScore(anchor, benchmark)!, "en"),
          );
        }
      }
    });
    And("it states that a per-benchmark tier compares raw scores on that benchmark only", () => {
      expect(screen.getByTestId("ai-bench-method-benchmark-tiers").textContent).toBe(
        t("en", "aiBenchMethodBenchmarkTiers"),
      );
    });
  });

  // ── Accessibility and layout (declarative contract; measured by the e2e steps) ──

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Tier colours meet contrast in both themes
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
        const tier = assignConsensusTier(
          byId(bar.closest("[data-model-id]")!.getAttribute("data-model-id")!),
          full,
        ).tier;
        expect(bar.className).toContain(TIER_BG_CLASS[tier]);
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The document never scrolls horizontally
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Every interactive target meets the minimum target size
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: Tier map label text never exceeds the page's body text size
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/ai-benchmark.feature: The substitute finder is visible above the fold on a phone
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
});
