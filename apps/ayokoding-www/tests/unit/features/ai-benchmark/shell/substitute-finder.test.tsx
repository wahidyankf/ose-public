// SubstituteFinder — the harness choice and the copy that names it. Rendered over fixtures so the
// checks hold whatever the real roster lists for each harness.

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HARNESS_DISPLAY_NAMES, SUBSTITUTE_HARNESSES } from "@/features/ai-benchmark/core/data/benchmarks";
import type { HarnessId } from "@/features/ai-benchmark/core/data/types";
import { tf } from "@/features/ai-benchmark/shell/format";
import { SubstituteFinder } from "@/features/ai-benchmark/shell/substitute-finder";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { anchors, dataset, flat, harnessModel, price } from "../core/fixtures";

afterEach(cleanup);

const target = flat("target", 57, { vendor: "OpenAI", price: price(4, 20) });
const ultraTarget = flat("ultra-target", 70, { vendor: "Anthropic" });

const roster = dataset([
  ...anchors(),
  target,
  ultraTarget,
  harnessModel("command-code-pro", "pro-planning", 56),
  harnessModel("command-code-pro", "pro-ultra", 62),
  harnessModel("command-code", "cc-planning", 58),
  harnessModel("command-code", "cc-fast", 20),
  harnessModel("opencode-go", "go-planning", 57),
]);

/** `selectedId` is the chosen frontier model's id; `null` leaves the finder with no model chosen. */
function finder(
  harness: HarnessId,
  selectedId: string | null = target.id,
  locale: Locale = "en",
  onSelectHarness: (h: HarnessId) => void = () => undefined,
) {
  return render(
    <SubstituteFinder
      dataset={roster}
      selectedId={selectedId ?? undefined}
      harness={harness}
      locale={locale}
      onSelect={() => undefined}
      onSelectHarness={onSelectHarness}
    />,
  );
}

const harnessSelect = (locale: Locale = "en") =>
  screen.getByLabelText(t(locale, "aiBenchFinderHarnessLabel")) as HTMLSelectElement;
const listedIds = () => screen.queryAllByTestId("ai-bench-sub-item").map((el) => el.getAttribute("data-model-id"));
const name = (h: HarnessId) => HARNESS_DISPLAY_NAMES[h];

describe("SubstituteFinder harness choice", () => {
  it("offers Command Code Pro, Command Code, then OpenCode Go, with no empty option", () => {
    finder("command-code-pro");
    const options = Array.from(harnessSelect().options);
    expect(options.map((o) => o.value)).toEqual(["command-code-pro", "command-code", "opencode-go"]);
    expect(options.map((o) => o.textContent)).toEqual(["Command Code Pro", "Command Code", "OpenCode Go"]);
    expect(options.map((o) => o.value)).toEqual([...SUBSTITUTE_HARNESSES]);
  });

  it("shows the chosen harness as selected", () => {
    for (const h of SUBSTITUTE_HARNESSES) {
      finder(h);
      expect(harnessSelect().value).toBe(h);
      cleanup();
    }
  });

  it("reports the harness the reader picks", () => {
    const onSelectHarness = vi.fn();
    finder("command-code-pro", target.id, "en", onSelectHarness);
    fireEvent.change(harnessSelect(), { target: { value: "opencode-go" } });
    expect(onSelectHarness).toHaveBeenCalledTimes(1);
    expect(onSelectHarness).toHaveBeenCalledWith("opencode-go");
  });

  it("ignores a value that is not an offered harness", () => {
    const onSelectHarness = vi.fn();
    finder("command-code-pro", target.id, "en", onSelectHarness);
    // A value outside the offered options reads back as empty; the handler must not forward it.
    fireEvent.change(harnessSelect(), { target: { value: "cursor" } });
    expect(onSelectHarness).not.toHaveBeenCalled();
  });

  it("labels the harness choice apart from the page's harness filter", () => {
    finder("command-code-pro");
    expect(t("en", "aiBenchFinderHarnessLabel")).not.toBe(t("en", "aiBenchFilterHarness"));
    expect(screen.getByLabelText(t("en", "aiBenchFinderLabel"))).toBeTruthy();
    expect(harnessSelect().id).not.toBe(screen.getByLabelText(t("en", "aiBenchFinderLabel")).id);
  });
});

describe("SubstituteFinder lists the chosen harness's models", () => {
  it.each([
    ["command-code-pro", ["pro-ultra", "pro-planning"]],
    ["command-code", ["cc-planning"]],
    ["opencode-go", ["go-planning"]],
  ] as const)("lists only %s models in the target's tier or higher", (harness, expected) => {
    finder(harness);
    expect(listedIds()).toEqual(expected);
  });

  it("changes the list when the harness prop changes", () => {
    const view = finder("command-code-pro");
    expect(listedIds()).toEqual(["pro-ultra", "pro-planning"]);
    view.rerender(
      <SubstituteFinder
        dataset={roster}
        selectedId={target.id}
        harness="command-code"
        locale="en"
        onSelect={() => undefined}
        onSelectHarness={() => undefined}
      />,
    );
    expect(listedIds()).toEqual(["cc-planning"]);
  });

  it("offers the nearest options of the chosen harness when none reaches the target's tier", () => {
    finder("command-code", ultraTarget.id);
    expect(screen.getByTestId("ai-bench-sub-list").getAttribute("data-kind")).toBe("nearest");
    expect(listedIds()).toEqual(["cc-planning", "cc-fast"]);
  });
});

describe("SubstituteFinder copy names the chosen harness", () => {
  it.each(SUBSTITUTE_HARNESSES)("names %s in the heading and the intro, in English", (harness) => {
    finder(harness, null);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(`Find a substitute in ${name(harness)}`);
    expect(screen.getByTestId("ai-bench-finder").textContent).toContain(
      tf("en", "aiBenchFinderIntro", { harness: name(harness) }),
    );
  });

  it.each(SUBSTITUTE_HARNESSES)("names %s in the heading and the intro, in Indonesian", (harness) => {
    finder(harness, null, "id");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(`Cari pengganti di ${name(harness)}`);
    expect(screen.getByTestId("ai-bench-finder").textContent).toContain(
      tf("id", "aiBenchFinderIntro", { harness: name(harness) }),
    );
  });

  it.each(["en", "id"] as const)("names the harness in the lead line of a match in %s", (locale) => {
    for (const harness of SUBSTITUTE_HARNESSES) {
      finder(harness, target.id, locale);
      expect(screen.getByTestId("ai-bench-finder-lead").textContent).toBe(
        tf(locale, "aiBenchFinderMatches", { harness: name(harness) }),
      );
      cleanup();
    }
  });

  it.each(["en", "id"] as const)("names the harness in the lead line of a nearest list in %s", (locale) => {
    finder("opencode-go", ultraTarget.id, locale);
    const lead = screen.getByTestId("ai-bench-finder-lead").textContent!;
    expect(lead).toContain(name("opencode-go"));
    expect(lead).not.toContain("{");
  });

  it("never names a harness other than the chosen one in the finder's own copy", () => {
    finder("command-code");
    const copy = [
      screen.getByRole("heading", { level: 2 }).textContent,
      screen.getByTestId("ai-bench-finder-lead").textContent,
    ].join(" ");
    expect(copy).toContain("Command Code");
    expect(copy).not.toContain("OpenCode Go");
    expect(copy).not.toContain("Command Code Pro");
  });

  it("keeps the harness select inside the finder landmark", () => {
    finder("command-code-pro");
    expect(within(screen.getByTestId("ai-bench-finder")).getByLabelText(t("en", "aiBenchFinderHarnessLabel"))).toBe(
      harnessSelect(),
    );
  });
});
