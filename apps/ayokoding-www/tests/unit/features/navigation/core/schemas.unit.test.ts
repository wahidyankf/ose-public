import { describe, expect, it } from "vitest";
import { localeSchema, treeNodeSchema } from "@/features/navigation/core/schemas";

describe("navigation schemas", () => {
  it("accepts the supported locales", () => {
    expect(localeSchema.parse("en")).toBe("en");
    expect(localeSchema.parse("id")).toBe("id");
    expect(localeSchema.safeParse("xx").success).toBe(false);
  });

  it("parses a section tree node with children", () => {
    const node = treeNodeSchema.parse({
      title: "Learn",
      slug: "learn",
      weight: 0,
      isSection: true,
      children: [{ title: "Page", slug: "learn/page", weight: 1, isSection: false, children: [] }],
    });
    expect(node.children).toHaveLength(1);
    expect(treeNodeSchema.safeParse({ title: "Nope" }).success).toBe(false);
  });
});
