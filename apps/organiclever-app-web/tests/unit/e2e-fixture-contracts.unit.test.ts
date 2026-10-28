import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { setImmediate } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { Effect } from "effect";
import { PgliteService } from "@/shared/runtime";
import { runMigrations } from "@/contexts/journal/infrastructure/run-migrations";
import { getExerciseProgress } from "@/contexts/stats/application/stats";

type Language = "en" | "id";
type Step = (fixtures: { page: FixturePage }) => Promise<void>;
const capture = vi.hoisted(() => ({ steps: new Map<string, Step>() }));
vi.mock("playwright-bdd", () => ({
  createBdd: () => {
    const register = (title: string, callback: Step) => capture.steps.set(title, callback);
    return { Given: register, When: register, Then: register };
  },
}));
vi.mock("@playwright/test", () => ({
  expect: (value: unknown) => {
    if (!(value instanceof FixtureLocator)) return expect(value);
    return {
      toBeVisible: async () => expect(await value.visible()).toBe(true),
      toHaveAttribute: async (name: string, expected: string) => expect(await value.getAttribute(name)).toBe(expected),
    };
  },
}));

type LocatorTarget = { kind: "settings" } | { kind: "language"; code: Language } | { kind: "squat" };
class FixtureLocator {
  constructor(
    readonly page: FixturePage,
    readonly target: LocatorTarget,
  ) {}
  async visible(): Promise<boolean> {
    if (this.target.kind === "settings") return true;
    if (this.target.kind === "language") return true;
    const db = this.page.db;
    if (db === undefined) throw new Error("Missing actual in-memory fixture database");
    const progress = await Effect.runPromise(
      getExerciseProgress(30).pipe(Effect.provideService(PgliteService, { db })),
    );
    return Object.hasOwn(progress, "Squat");
  }
  async getAttribute(name: string): Promise<string> {
    expect(name).toBe("data-active");
    if (this.target.kind !== "language") throw new Error("Unexpected attribute target");
    return String(this.page.language === this.target.code);
  }
  async click(): Promise<void> {
    if (this.target.kind !== "language") throw new Error("Unexpected fixture click");
    await this.page.clickLanguage(this.target.code);
  }
}
class FixturePage {
  readonly events: string[] = [];
  private clickedResolve: (() => void) | undefined;
  readonly clicked = new Promise<void>((resolve) => {
    this.clickedResolve = resolve;
  });
  private documentResolve: (() => void) | undefined;
  private pendingLanguage: Language | undefined;
  private clickResolve: (() => void) | undefined;
  private clickCompleted = false;
  private saveCompleted = false;
  private documentCompleted = false;
  constructor(
    public language: Language = "en",
    readonly db?: PGlite,
  ) {}
  async goto(url: string): Promise<void> {
    this.events.push(`goto:${new URL(url).pathname}`);
  }
  locator(selector: string): FixtureLocator {
    expect(selector).toBe("[data-testid='settings-screen']");
    return new FixtureLocator(this, { kind: "settings" });
  }
  getByTestId(id: string): FixtureLocator {
    if (id === "lang-btn-en") return new FixtureLocator(this, { kind: "language", code: "en" });
    if (id === "lang-btn-id") return new FixtureLocator(this, { kind: "language", code: "id" });
    throw new Error(`Unexpected fixture locator: ${id}`);
  }
  getByRole(role: string, options: { name: string }): FixtureLocator {
    expect(role).toBe("button");
    expect(options.name).toBe("Squat progress");
    return new FixtureLocator(this, { kind: "squat" });
  }
  async waitForLoadState(event: string): Promise<void> {
    expect(event).toBe("domcontentloaded");
    this.events.push("old-document-load-state");
  }
  waitForEvent(event: string): Promise<void> {
    expect(event).toBe("domcontentloaded");
    this.events.push("arm:domcontentloaded");
    if (this.documentResolve !== undefined) throw new Error("Duplicate document listener");
    return new Promise((resolve) => {
      this.documentResolve = resolve;
    });
  }
  clickLanguage(code: Language): Promise<void> {
    this.events.push(`click:lang-btn-${code}`);
    this.pendingLanguage = code;
    this.clickedResolve?.();
    return new Promise((resolve) => {
      this.clickResolve = resolve;
    });
  }
  completeClick(): void {
    if (this.clickCompleted) return;
    if (this.clickResolve === undefined) throw new Error("No initiated click to complete");
    this.clickCompleted = true;
    this.events.push("click-returned");
    this.clickResolve();
  }
  completeSave(): void {
    if (this.saveCompleted) return;
    if (!this.clickCompleted) throw new Error("Save phase must follow click delivery");
    this.saveCompleted = true;
    this.events.push("save-complete");
  }
  completeNewDocument(): void {
    if (this.documentCompleted) return;
    if (!this.clickCompleted || !this.saveCompleted || this.pendingLanguage === undefined)
      throw new Error("New document must follow completed click and save");
    this.documentCompleted = true;
    this.language = this.pendingLanguage;
    this.documentResolve?.();
  }
  async waitForFunction(predicate: () => boolean): Promise<void> {
    expect(predicate()).toBe(true);
  }
  async evaluate<T>(callback: () => T | Promise<T>): Promise<T> {
    return await callback();
  }
}
async function step(title: string, page: FixturePage): Promise<void> {
  const callback = capture.steps.get(title);
  if (callback === undefined) throw new Error(`Original registered callback missing: ${title}`);
  await callback({ page });
}

let database: PGlite | undefined;
beforeAll(async () => {
  // This file is installed at apps/organiclever-app-web/tests/unit/.
  await import("../../../organiclever-app-web-e2e/steps/settings.steps");
  await import("../../../organiclever-app-web-e2e/steps/progress-screen.steps");
});
afterEach(async () => {
  if (database !== undefined) {
    await database.close();
    database = undefined;
  }
  vi.unstubAllGlobals();
});

describe("Original browser language callbacks", () => {
  for (const test of [
    {
      title: "the user selects Indonesian language",
      from: "en",
      to: "id",
      thenStep: "the language is set to Indonesian",
      opensSettings: false,
    },
    {
      title: "the user selects English language",
      from: "id",
      to: "en",
      thenStep: "the language is set to English",
      opensSettings: false,
    },
    {
      title: "the settings screen shows language is Indonesian",
      from: "en",
      to: "id",
      thenStep: "the language is set to Indonesian",
      opensSettings: true,
    },
    {
      title: "the settings screen shows language is English",
      from: "id",
      to: "en",
      thenStep: "the language is set to English",
      opensSettings: true,
    },
  ] as const) {
    it(`arms the new document before click: ${test.title}`, async () => {
      const page = new FixturePage(test.from);
      let settled = false;
      const running = step(test.title, page).then(
        () => {
          settled = true;
          return { ok: true as const };
        },
        (error) => {
          settled = true;
          return { ok: false as const, error: unknownError(error) };
        },
      );
      await page.clicked;
      try {
        expect(page.events).toEqual([
          ...(test.opensSettings ? ["goto:/app/settings"] : []),
          "arm:domcontentloaded",
          `click:lang-btn-${test.to}`,
        ]);
        expect(page.language).toBe(test.from);
        page.completeClick();
        // A check-phase checkpoint drains the completed click's microtasks.
        // No elapsed-time sleep/poll is used; the new document stays deferred.
        await setImmediate();
        expect(settled).toBe(false);
        page.completeSave();
        await setImmediate();
        expect(settled).toBe(false);
        expect(page.language).toBe(test.from);
        page.completeNewDocument();
        const outcome = await running;
        if (!outcome.ok) throw outcome.error;
        await step(test.thenStep, page);
      } finally {
        page.completeClick();
        page.completeSave();
        page.completeNewDocument();
        await running;
      }
    });
  }
  it("does not click or wait for a new document when the requested language is already active", async () => {
    const page = new FixturePage("en");
    await step("the settings screen shows language is English", page);
    expect(page.events).toEqual(["goto:/app/settings"]);
    await step("the language is set to English", page);
  });
  for (const test of [
    { current: "en", target: "id", thenStep: "the language is set to Indonesian" },
    { current: "id", target: "en", thenStep: "the language is set to English" },
  ] as const) {
    it(`retains the unchanged Then rejection for inactive language ${test.target}`, async () => {
      const page = new FixturePage(test.current);
      expect(await page.getByTestId(`lang-btn-${test.target}`).getAttribute("data-active")).toBe("false");
      await expect(step(test.thenStep, page)).rejects.toThrow(/false/);
    });
  }
});

describe("Actual registered progress fixture", () => {
  it("seeds an eligible Squat workout for the real30-day query while fixed home fixtures remain unchanged", async () => {
    const db = new PGlite();
    database = db;
    await runMigrations(db);
    vi.stubGlobal("__ol_db", db);
    const page = new FixturePage("en", db);
    // Executes the real registered Given, both actual seed helpers, and the
    // production progress query at its existing visibility assertion seam.
    await step("there is exercise progress data", page);
    const progress = await Effect.runPromise(
      getExerciseProgress(30).pipe(Effect.provideService(PgliteService, { db })),
    );
    expect(progress.Squat?.points).toHaveLength(1);
    const row = await db.query<{ eligible: boolean; not_future: boolean; payload: unknown }>(
      "SELECT started_at >= NOW() - INTERVAL '30 days' AS eligible, started_at <= NOW() AS not_future, payload FROM journal_entries WHERE id = 'e2e-progress-workout'",
    );
    expect(row.rows).toEqual([
      {
        eligible: true,
        not_future: true,
        payload: {
          routineName: "E2E Strength",
          durationSecs: 600,
          exercises: [{ name: "Squat", sets: [{ reps: 5, weight: "80 kg" }] }],
        },
      },
    ]);
    const home = await db.query<{ id: string; day: string }>(
      "SELECT id, started_at::date::text AS day FROM journal_entries WHERE id IN ('e2e-home-reading', 'e2e-home-workout') ORDER BY id",
    );
    expect(home.rows).toEqual([
      { id: "e2e-home-reading", day: "2026-09-04" },
      { id: "e2e-home-workout", day: "2026-09-05" },
    ]);
    // A meaningful countercontrol: the same seeded workout outside the real
    // query window must no longer produce any Squat progress.
    await db.query(
      "UPDATE journal_entries SET started_at = NOW() - INTERVAL '45 days' WHERE id = 'e2e-progress-workout'",
    );
    expect(await Effect.runPromise(getExerciseProgress(30).pipe(Effect.provideService(PgliteService, { db })))).toEqual(
      {},
    );
  });
});

function unknownError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Original callback failed", { cause: error });
}
