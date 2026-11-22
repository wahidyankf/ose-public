import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/[locale]/tools/ai-benchmark/page";

describe("ai-benchmark page metadata", () => {
  it("titles the page from translations", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
  });

  it("titles the Indonesian page", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "id" }) });
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
  });
});
