import { expect, test, vi } from "vitest";
// => vi.mock with importOriginal: the surgical variant of Example 30.

import { apiUrl, endpoint, timeoutMs } from "./config";
// => Same specifiers as production: the swap stays transparent to readers.

vi.mock("./config", async (importOriginal) => {
  // => Async factory: importOriginal loads the real module for spreading.
  // => The factory stays hoisted: only importOriginal bridges the two worlds.
  const real = await importOriginal<typeof import("./config")>();
  // => Typed import of the real module: spreads keep their types here.
  const apiUrl = "http://localhost:9999";
  // => Fixture URL bound once: both the export and the joiner below use it.
  // => Localhost override: a fixture address, never a real dependency.
  return {
    ...real,
    // => Spread preserves timeoutMs: real code runs for the safe exports.
    // => Preservation is the point: only the dangerous export gets replaced.
    apiUrl,
    // => Replaced export reads back the fixture value, asserted below.
    endpoint: (path: string): string => `${apiUrl}/${path}`,
    // => Re-wired joiner: the real endpoint closes over the REAL apiUrl,
    // => so spreading alone cannot redirect it — the mock re-points it here.
    // => Same template, fixture base: logic preserved, destination replaced.
  };
});

test("keeps real helpers, replaces only the URL", async () => {
  // => Two claims in one file: preserved behavior plus replaced constant.
  expect(timeoutMs()).toBe(3000);
  // => Real function survived the mock: 3000 is the actual module value.
  expect(endpoint("users")).toBe("http://localhost:9999/users");
  // => Real joiner plus fixture URL: surgery left the logic intact.
  expect(apiUrl).toBe("http://localhost:9999");
  // => The replaced export reads back exactly the fixture value set above.
  // => Nothing here touches the network: addresses are strings until fetched.
});
