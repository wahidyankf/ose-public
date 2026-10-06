import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";
import { defaultMetadata } from "@/features/seo/shell/metadata";

// ose-www renders no canonical or Open Graph tags today, so `metadataBase` is not observable at the
// public boundary and no scenario can bind it. It is the base every future relative metadata URL
// resolves against, so it is pinned here on the canonical `www.` host the site is served from.
describe("site metadata base", () => {
  it("anchors the root layout's relative metadata URLs on the canonical www host", () => {
    expect(new URL(String(metadata.metadataBase)).origin).toBe("https://www.oseplatform.com");
  });

  it("keeps the shared default metadata on the same canonical www host", () => {
    expect(new URL(String(defaultMetadata.metadataBase)).origin).toBe("https://www.oseplatform.com");
  });
});
