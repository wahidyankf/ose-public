import { describe, expect, it } from "vitest";
import { env } from "@/env";

// The schema declares no server or client variables, so the validated object is empty and reads no ambient environment.
describe("organiclever-www env schema", () => {
  it("validates to an empty object when no variables are declared", () => {
    expect(env).toEqual({});
  });
});
