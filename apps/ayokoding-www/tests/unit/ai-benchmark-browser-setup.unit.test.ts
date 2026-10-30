import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type Step = (fixtures: { page: FakePage }, ...args: string[]) => Promise<void>;
const capture = vi.hoisted(() => ({ steps: new Map<string, Step>() }));
vi.mock("playwright-bdd", () => ({
  createBdd: () => {
    const register = (name: string, callback: Step) => capture.steps.set(name, callback);
    return { Given: register, When: register, Then: register };
  },
}));
vi.mock("@playwright/test", () => ({
  expect: (value: unknown) => {
    if (value instanceof FakeLocator) {
      return {
        toBeVisible: async () => expect(value.name).toBe("ai-bench-page"),
        toHaveCount: async (count: number) => expect(value.name).toBe(`alert:${count}`),
      };
    }
    return expect(value);
  },
}));

class FakeLocator {
  constructor(readonly name: string) {}
  getByRole(role: string): FakeLocator {
    expect(role).toBe("alert");
    return new FakeLocator("alert:0");
  }
}
class FakePage {
  readonly events: string[] = [];
  private onError: ((error: Error) => void) | undefined;
  errorOnGoto: string | undefined;
  on(event: string, listener: (error: Error) => void): void {
    expect(event).toBe("pageerror");
    this.events.push("listen");
    this.onError = listener;
  }
  async goto(url: string): Promise<void> {
    this.events.push(`goto:${url}`);
    if (this.errorOnGoto !== undefined) this.emitError(this.errorOnGoto);
  }
  async waitForLoadState(state: string): Promise<void> {
    expect(state).toBe("networkidle");
  }
  getByTestId(name: string): FakeLocator {
    return new FakeLocator(name);
  }
  async setViewportSize(size: { width: number; height: number }): Promise<void> {
    this.events.push(`viewport:${size.width}x${size.height}`);
  }
  emitError(message: string): void {
    expect(this.onError).toBeDefined();
    this.onError?.(new Error(message));
  }
}
async function step(name: string, page: FakePage, ...args: string[]): Promise<void> {
  const callback = capture.steps.get(name);
  if (callback === undefined) throw new Error(`missing browser step: ${name}`);
  await callback({ page }, ...args);
}
const background = "the AI benchmark dataset is loaded";
const unknown = "the URL carries a harness parameter with an unknown value";
const noError = "no error is surfaced to the reader";

describe("AI benchmark browser initial setup", () => {
  beforeAll(async () => {
    await import("../../../ayokoding-www-fe-e2e/tests/e2e/steps/ai-benchmark.steps");
  });
  let page: FakePage;
  beforeEach(() => {
    page = new FakePage();
  });
  it("subscribes before one direct unknown URL load and preserves a clean error check", async () => {
    await step(background, page);
    expect(page.events).toEqual(["listen"]);
    await step(unknown, page);
    expect(page.events).toEqual(["listen", "goto:/en/tools/ai-benchmark?harness=not-a-harness"]);
    await step(noError, page);
  });
  it("still loads the ordinary page, chosen locale and viewport explicitly", async () => {
    await step(background, page);
    await step("the AI benchmark page is open", page);
    expect(page.events).toEqual(["listen", "goto:/en/tools/ai-benchmark"]);
    page = new FakePage();
    await step(background, page);
    await step("the locale is {string}", page, "id");
    await step("the AI benchmark page renders", page);
    expect(page.events).toEqual(["listen", "goto:/id/tools/ai-benchmark"]);
    page = new FakePage();
    await step(background, page);
    await step("the AI benchmark page is loaded at a {string} px viewport in the {string} locale", page, "390", "id");
    expect(page.events).toEqual(["listen", "viewport:390x900", "goto:/id/tools/ai-benchmark"]);
  });
  it("retains an error emitted during the initial load", async () => {
    await step(background, page);
    page.errorOnGoto = "initial sentinel";
    await step(unknown, page);
    await expect(step(noError, page)).rejects.toThrow("initial sentinel");
  });
  it("retains an error across a subsequent navigation", async () => {
    await step(background, page);
    await step(unknown, page);
    page.emitError("later sentinel");
    await step("the AI benchmark page is open", page);
    await expect(step(noError, page)).rejects.toThrow("later sentinel");
  });
});
