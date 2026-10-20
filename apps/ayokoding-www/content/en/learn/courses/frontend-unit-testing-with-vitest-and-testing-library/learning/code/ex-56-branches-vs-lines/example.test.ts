import { expect, test } from "vitest";
// => Runner imports only: branch gaps need no special test API.

import { greet } from "./greet";
// => Subject import: three forks, and the suite below takes only some.

test("greets a named calm user", async () => {
  // => One path through three forks: default kept, name given, calm close.
  expect(greet("Sari")).toBe("Hello, Sari.");
  // => Every LINE executed: line coverage reads 100 after this single case.
  // => Branches taken: 3 of 6. The table below says so plainly.
});

test("greets an excited user loudly", async () => {
  // => Second path: excited fork taken, default and blank branches still open.
  expect(greet("Budi", true)).toBe("Hello, Budi!");
  // => Exclamation pinned: punctuation is behavior worth specifying.
  // => Remaining gaps: omitted flag with blank name; excited blank name.
});
