// Where a price comes from — a rate a harness lists in place of the vendor's own is flagged beside
// the price, in both the finder's cards and the data table, in either language.

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { scoreModels } from "@/features/ai-benchmark/core/tiers";
import { PriceText } from "@/features/ai-benchmark/shell/model-bits";
import { ModelTable } from "@/features/ai-benchmark/shell/model-table";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { dataset, flat, price } from "../core/fixtures";

afterEach(cleanup);

const vendorPriced = flat("vendor-priced", 50, { price: price(1, 3) });
const opencodePriced = flat("opencode-priced", 50, { price: price(1, 3, "opencode") });
const commandCodePriced = flat("command-code-priced", 50, { price: price(1, 3, "commandcode") });
const unpriced = flat("unpriced", 50);

describe("PriceText", () => {
  it("shows a vendor rate without a source label", () => {
    render(<PriceText model={vendorPriced} locale="en" />);
    expect(screen.getByTestId("ai-bench-price").textContent).toBe("$1.00 / $3.00 per 1M tokens");
  });

  it.each<[Locale, string]>([
    ["en", "OpenCode rate"],
    ["id", "tarif OpenCode"],
  ])("flags an OpenCode rate in %s", (locale, label) => {
    render(<PriceText model={opencodePriced} locale={locale} />);
    expect(t(locale, "aiBenchOpencodeRate")).toBe(label);
    expect(screen.getByTestId("ai-bench-price").textContent).toMatch(new RegExp(`\\(${label}\\)$`));
  });

  it.each<[Locale, string]>([
    ["en", "Command Code rate"],
    ["id", "tarif Command Code"],
  ])("flags a Command Code rate in %s", (locale, label) => {
    render(<PriceText model={commandCodePriced} locale={locale} />);
    expect(t(locale, "aiBenchCommandCodeRate")).toBe(label);
    const text = screen.getByTestId("ai-bench-price").textContent!;
    expect(text).toMatch(new RegExp(`\\(${label}\\)$`));
    expect(text).not.toMatch(/OpenCode|opencode/);
  });

  it("says so when no price is published", () => {
    render(<PriceText model={unpriced} locale="en" />);
    expect(screen.getByTestId("ai-bench-price").textContent).toBe(t("en", "aiBenchNoPrice"));
  });
});

describe("ModelTable price source", () => {
  function rowFor(id: string, locale: Locale) {
    const ds = dataset([vendorPriced, opencodePriced, commandCodePriced]);
    render(<ModelTable rows={scoreModels(ds)} locale={locale} />);
    return screen.getAllByTestId("ai-bench-table-row").find((r) => r.dataset.modelId === id)!;
  }

  it.each<[Locale]>([["en"], ["id"]])("labels a Command Code rate on its row in %s", (locale) => {
    const row = rowFor("command-code-priced", locale);
    expect(within(row).getByText(t(locale, "aiBenchCommandCodeRate"))).toBeTruthy();
    expect(within(row).queryByText(t(locale, "aiBenchOpencodeRate"))).toBeNull();
  });

  it.each<[Locale]>([["en"], ["id"]])("labels an OpenCode rate on its row in %s", (locale) => {
    const row = rowFor("opencode-priced", locale);
    expect(within(row).getByText(t(locale, "aiBenchOpencodeRate"))).toBeTruthy();
    expect(within(row).queryByText(t(locale, "aiBenchCommandCodeRate"))).toBeNull();
  });

  it("leaves a vendor rate unlabelled", () => {
    const row = rowFor("vendor-priced", "en");
    expect(within(row).queryByText(t("en", "aiBenchOpencodeRate"))).toBeNull();
    expect(within(row).queryByText(t("en", "aiBenchCommandCodeRate"))).toBeNull();
  });
});
