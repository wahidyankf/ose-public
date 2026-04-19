import { describe, it, expect } from "vitest";
import { filterItems } from "./search";

describe("filterItems", () => {
  const testItems = [
    { id: 1, name: "Apple", tags: ["fruit", "red"] },
    { id: 2, name: "Banana", tags: ["fruit", "yellow"] },
    { id: 3, name: "Carrot", tags: ["vegetable", "orange"] },
    { id: 4, name: "Date", tags: ["fruit", "brown"] },
  ];

  it("returns all items when search term is empty", () => {
    const result = filterItems(testItems, "", ["name", "tags"]);
    expect(result).toEqual(testItems);
  });

  it("filters items based on name", () => {
    const result = filterItems(testItems, "app", ["name", "tags"]);
    expect(result).toEqual([testItems[0]]);
  });

  it("filters items based on tags", () => {
    const result = filterItems(testItems, "yellow", ["name", "tags"]);
    expect(result).toEqual([testItems[1]]);
  });

  it("is case-insensitive", () => {
    const result = filterItems(testItems, "CARROT", ["name", "tags"]);
    expect(result).toEqual([testItems[2]]);
  });

  it("returns empty array when no matches found", () => {
    const result = filterItems(testItems, "grape", ["name", "tags"]);
    expect(result).toEqual([]);
  });

  it("handles partial matches", () => {
    const result = filterItems(testItems, "an", ["name", "tags"]);
    expect(result).toEqual([testItems[1], testItems[2]]);
  });

  it("handles multiple matches", () => {
    const result = filterItems(testItems, "fruit", ["name", "tags"]);
    expect(result).toEqual([testItems[0], testItems[1], testItems[3]]);
  });
});
