import { describe, expect, it, vi } from "vitest";
import LocaleLayout, { generateStaticParams } from "@/app/[locale]/layout";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("locale layout", () => {
  it("generates one static params entry per supported locale", () => {
    expect(generateStaticParams()).toEqual([{ locale: "en" }, { locale: "id" }]);
  });

  it("rejects an unsupported locale", async () => {
    await expect(LocaleLayout({ children: null, params: Promise.resolve({ locale: "xx" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
