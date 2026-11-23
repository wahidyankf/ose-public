import { describe, it, expect } from "vitest";

import { cn } from "../../../src/utils/cn";

describe("cn", () => {
  // @scenario specs/libs/web-ui/behaviours/utils/cn.feature: cn joins class names and lets the later Tailwind utility win a conflict
  it("joins class names and lets the later Tailwind utility win a conflict", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });
});
