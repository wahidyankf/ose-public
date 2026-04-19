import { describe, it, expect } from "vitest";
import { cn } from "./style";

describe("cn", () => {
  it("merges class names correctly", () => {
    const result = cn("class1", "class2", { class3: true, class4: false });
    expect(result).toBe("class1 class2 class3");
  });

  it("handles conditional classes", () => {
    const condition = true;
    const result = cn("base-class", condition && "conditional-class");
    expect(result).toBe("base-class conditional-class");
  });

  it("removes falsy values", () => {
    const result = cn("class1", false, null, undefined, "class2");
    expect(result).toBe("class1 class2");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("p-4 m-2", "bg-red-500", "hover:bg-blue-500");
    expect(result).toBe("p-4 m-2 bg-red-500 hover:bg-blue-500");
  });
});
